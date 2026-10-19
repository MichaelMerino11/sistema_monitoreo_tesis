// MAINTRONIC · Panel web. Cada página define window.VISTA antes de cargar este archivo:
//   'general'    → /             (todo junto, para la universidad)
//   'solar'      → /solar/       (solo sistema fotovoltaico)
//   'industrial' → /industrial/  (solo medidores industriales)
const VISTA = ["solar", "industrial"].includes(window.VISTA)
  ? window.VISTA
  : "general";
const TABS = {
  general: ["solar", "industrial", "alarmas", "historico"],
  solar: ["solar", "historico"],
  industrial: ["industrial", "alarmas", "historico"],
}[VISTA];

// ═════════ Utilidades ═════════
const $ = (id) => document.getElementById(id);
function esc(s) {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
function num(x) {
  if (x === null || x === undefined || x === "") return null;
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}
function fmt(v, d = 2) {
  return v === null || v === undefined ? "—" : Number(v).toFixed(d);
}
async function getJSON(url) {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(r.status);
  return r.json();
}
function hora() {
  return new Date().toLocaleTimeString("es-EC", { hour12: false });
}
setInterval(() => ($("reloj").textContent = hora()), 1000);
$("reloj").textContent = hora();

// ═════════ Estado ═════════
const SOLAR_ID = 2;
const SOLAR_GRUPOS = [
  {
    id: "voltajes",
    nombre: "Voltajes",
    items: [
      {
        tag: "VT-P",
        nom: "V Panel",
        campo: "voltaje_panel",
        u: "V DC",
        min: 0,
        max: 25,
      },
      {
        tag: "VT-B",
        nom: "V Batería",
        campo: "voltaje_bateria",
        u: "V DC",
        min: 0,
        max: 16,
      },
      {
        tag: "VT-I",
        nom: "V Inversor",
        campo: "voltaje_inversor",
        u: "V DC",
        min: 0,
        max: 16,
      },
    ],
  },
  {
    id: "corrientes",
    nombre: "Corrientes",
    items: [
      {
        tag: "IT-P",
        nom: "I Panel",
        campo: "corriente_panel",
        u: "A DC",
        min: 0,
        max: 13,
      },
      {
        tag: "IT-B",
        nom: "I Batería",
        campo: "corriente_bateria",
        u: "A DC",
        min: -22,
        max: 22,
      },
      {
        tag: "IT-I",
        nom: "I Inversor",
        campo: "corriente_inversor",
        u: "A DC",
        min: 0,
        max: 30,
      },
    ],
  },
  {
    id: "potencias",
    nombre: "Potencias y energía",
    items: [
      {
        tag: "PT-ENT",
        nom: "P Entrada",
        campo: "potencia_entrada",
        u: "W",
        min: 0,
        max: 220,
      },
      {
        tag: "PT-SAL",
        nom: "P Salida",
        campo: "potencia_salida",
        u: "W",
        min: 0,
        max: 1700,
      },
      {
        tag: "ET-DIA",
        nom: "Energía Hoy",
        campo: "energia_kwh",
        u: "kWh",
        min: 0,
        max: 10,
      },
    ],
  },
];
const SOLAR_VARS = SOLAR_GRUPOS.flatMap((g) => g.items);

const st = {
  tab: TABS[0],
  solGrupo: "todos",
  indMedidor: "todos",
  solar: null,
  solarFresco: false,
  solarUltReg: null,
  solarUltCambio: 0,
  lecturas: [],
  vars: [],
  slaves: {},
  alarmCfg: {},
  alarmas: [],
  gw: null,
  srvOk: null,
  histSel: null,
  histHoras: 1,
  chart: null,
};

// ═════════ Navegación por pestañas (con #enlace) ═════════
function irA(tab, sel) {
  if (!TABS.includes(tab)) tab = TABS[0];
  st.tab = tab;
  if (sel) st.histSel = sel;
  document.querySelectorAll(".tab").forEach((b) => {
    const a = b.dataset.tab === tab;
    b.classList.toggle("activa", a);
    b.setAttribute("aria-selected", a);
  });
  ["solar", "industrial", "alarmas", "historico"].forEach((t) =>
    $("p-" + t).classList.toggle("oculto", t !== tab),
  );
  const hash =
    tab === "historico" && st.histSel ? `#historico:${st.histSel}` : `#${tab}`;
  if (location.hash !== hash) history.replaceState(null, "", hash);
  pintar();
  if (tab === "historico") cargarHistorico();
}
document
  .querySelectorAll(".tab")
  .forEach((b) => b.addEventListener("click", () => irA(b.dataset.tab)));

// ═════════ Datos ═════════
async function cargarConfig() {
  try {
    const vars = await getJSON("/api/medidores/variables/activas");
    st.vars = Array.isArray(vars) ? vars : [];
    st.slaves = {};
    st.vars.forEach((v) => (st.slaves[v.id] = v.slave_id));
    const cfgs = await Promise.all(
      st.vars.map((v) =>
        getJSON(`/api/medidores/variables/${v.id}/alarma`).catch(() => null),
      ),
    );
    st.alarmCfg = {};
    st.vars.forEach((v, i) => (st.alarmCfg[v.id] = cfgs[i]));
  } catch {}
}

async function refrescar() {
  const [rS, rL, rA, rG] = await Promise.allSettled([
    getJSON(`/api/solar/ultimo?dispositivo_id=${SOLAR_ID}`),
    getJSON("/api/medidores/lecturas/ultimo"),
    getJSON("/api/medidores/alarmas/log/activas"),
    getJSON("/api/gateway/estado"),
  ]);
  st.srvOk = [rS, rL, rA, rG].some((r) => r.status === "fulfilled");
  if (rS.status === "fulfilled") {
    const d = rS.value;
    if (d?.registrado_en && d.registrado_en !== st.solarUltReg) {
      st.solarUltReg = d.registrado_en;
      st.solarUltCambio = Date.now();
    }
    st.solar = d;
    st.solarFresco = !!d && Date.now() - st.solarUltCambio < 15000;
  }
  if (rL.status === "fulfilled" && Array.isArray(rL.value))
    st.lecturas = rL.value;
  if (rA.status === "fulfilled" && Array.isArray(rA.value))
    st.alarmas = rA.value;
  st.gw = rG.status === "fulfilled" ? rG.value : null;
  pintar();
}

// ═════════ Industrial: calidad, rangos y etiquetas (misma lógica que la app) ═════════
function rangoBase(nombre, unidad) {
  const n = nombre.toLowerCase(),
    u = (unidad || "").toLowerCase();
  if (u === "v" || n.includes("voltaje")) return { min: 0, max: 150, u: "V" };
  if (u === "a" || n.includes("corriente") || n.includes("current"))
    return { min: 0, max: 50, u: "A" };
  if (u === "hz" || n.includes("frecuencia"))
    return { min: 55, max: 65, u: "Hz" };
  if (n.includes("factor") || n.includes("fp"))
    return { min: 0, max: 1, u: "cos φ" };
  if (["kw", "kvar", "kva"].includes(u) || n.includes("potencia"))
    return { min: 0, max: 100, u: unidad || "kW" };
  if (u === "kwh" || n.includes("energ"))
    return { min: 0, max: 1000, u: "kWh" };
  return { min: 0, max: 100, u: unidad || "" };
}
function prefijo(nombre, unidad) {
  const n = nombre.toLowerCase(),
    u = (unidad || "").toLowerCase();
  if (u === "hz" || n.includes("frecuencia")) return "FT";
  if (n.includes("factor") || n.includes("fp")) return "FP";
  if (u === "kwh" || n.includes("energ")) return "ET";
  if (["kw", "kvar", "kva"].includes(u) || n.includes("potencia")) return "PT";
  if (u === "a" || n.includes("corriente") || n.includes("current"))
    return "IT";
  if (u === "v" || n.includes("voltaje")) return "VT";
  return "XT";
}
function calidad(l) {
  const gw = st.gw;
  const e = gw?.bus?.medidores?.[String(st.slaves[l.id])];
  if (gw?.conectada && e && (e.detectando || !e.verificado))
    return "verificando";
  if ((gw?.fallidas || []).map(Number).includes(l.id)) return "sin_respuesta";
  const offset = gw?.ahora ? new Date(gw.ahora).getTime() - Date.now() : 0;
  const ts = l.registrado_en ? new Date(l.registrado_en).getTime() : NaN;
  const reciente =
    Number.isFinite(ts) && (Date.now() + offset - ts) / 1000 <= 30;
  if (!gw?.conectada || !reciente || num(l.valor) === null) return "sin_datos";
  return "ok";
}
function porMedidor() {
  const g = {};
  [...st.lecturas]
    .sort((a, b) => a.id - b.id)
    .forEach((l) =>
      (g[l.medidor_nombre || "Sin nombre"] =
        g[l.medidor_nombre || "Sin nombre"] || []).push(l),
    );
  return g;
}
function estadoMedidor(vars) {
  const gw = st.gw,
    e = gw?.bus?.medidores?.[String(st.slaves[vars[0]?.id])];
  const fall = new Set((gw?.fallidas || []).map(Number));
  const ok = vars.filter((v) => !fall.has(v.id)).length;
  if (!gw) return { c: "", t: "Consultando…" };
  if (!gw.conectada) return { c: "error", t: "Tinkerboard desconectada" };
  if (!e) return { c: "", t: "Esperando primera lectura…" };
  if (e.detectando)
    return {
      c: "aviso",
      t: `No responde a ${e.baud} bps · buscando velocidad`,
    };
  if (!e.verificado) return { c: "", t: `Verificando a ${e.baud} bps…` };
  return {
    c: ok === vars.length ? "" : ok ? "aviso" : "error",
    t: `Responde a ${e.baud} bps · ${ok}/${vars.length} variables`,
  };
}

// ═════════ Tarjeta común ═════════
function tarjeta({ tag, nom, valor, u, min, max, alarma, aviso, sel }) {
  const con = valor !== null;
  const v = con ? valor : 0;
  const pct =
    max > min ? Math.min(100, Math.max(0, ((v - min) / (max - min)) * 100)) : 0;
  const cls = !con ? "apagado" : alarma || "";
  const est = !con
    ? aviso || "SIN DATOS"
    : alarma === "p1"
      ? "ALARMA P1"
      : alarma === "p2"
        ? "ALARMA P2"
        : "";
  const colEst =
    alarma === "p1"
      ? "var(--p1)"
      : alarma === "p2"
        ? "var(--p2)"
        : "var(--texto2)";
  return `<button class="fp ${cls}" data-sel="${esc(sel)}" aria-label="${esc(nom)}: ${con ? v.toFixed(2) : "sin datos"} ${esc(u)}. Ver histórico">
    <div class="tag">${esc(tag)}</div>
    <div class="nom">${esc(nom)}</div>
    <div class="val">${con ? v.toFixed(2) : "0.00"}<small>${esc(u)}</small></div>
    <div class="barra"><i style="width:${con ? pct : 0}%"></i></div>
    <div class="esc"><span>${min}</span><span class="est" style="color:${colEst}">${est}</span><span>${max}</span></div>
  </button>`;
}
function enlazarTarjetas(cont) {
  cont.querySelectorAll(".fp").forEach((b) =>
    b.addEventListener("click", () => {
      irA("historico", b.dataset.sel);
      $("p-historico").scrollIntoView({ behavior: "smooth", block: "start" });
    }),
  );
}
function chipsHTML(lista, activo, attr) {
  return lista
    .map(
      (c) =>
        `<button class="chip ${c.id === activo ? "activo" : ""}" data-${attr}="${esc(c.id)}" aria-pressed="${c.id === activo}">${esc(c.nombre)}</button>`,
    )
    .join("");
}

// ═════════ Pintar ═════════
function pintar() {
  pintarCabecera();
  pintarResumen();
  if (st.tab === "solar") pintarSolar();
  if (st.tab === "industrial") pintarIndustrial();
  if (st.tab === "alarmas") pintarAlarmas();
  if (st.tab === "historico") pintarHistVars();
}

function pintarCabecera() {
  $("dotSrv").className =
    "dot " + (st.srvOk === null ? "" : st.srvOk ? "ok" : "mal");
  $("txtSrv").textContent =
    st.srvOk === false ? "Servidor sin conexión" : "Servidor en línea";
  const tk = st.gw?.conectada;
  $("dotTk").className = "dot " + (st.gw ? (tk ? "ok" : "mal") : "");
  $("txtTk").textContent = tk
    ? "Tinkerboard conectada"
    : "Tinkerboard desconectada";
}

// ═════════ Resumen (tarjetas de arriba) según la vista ═════════
const TILES = {
  general: [
    { id: "gSolar", ir: "solar", titulo: "SISTEMA FOTOVOLTAICO" },
    { id: "gInd", ir: "industrial", titulo: "PLANTA INDUSTRIAL" },
    { id: "gAlm", ir: "alarmas", titulo: "ALARMAS ACTIVAS" },
    { id: "gCon", ir: "industrial", titulo: "CONEXIÓN", chico: true },
  ],
  solar: [
    { id: "sPot", ir: "solar", titulo: "POTENCIA DEL PANEL" },
    { id: "sBat", ir: "solar", titulo: "BATERÍA" },
    { id: "sEne", ir: "solar", titulo: "ENERGÍA DE HOY" },
    { id: "sCon", ir: "solar", titulo: "ESTADO DEL SISTEMA", chico: true },
  ],
  industrial: [
    { id: "iVol", ir: "industrial", titulo: "VOLTAJE" },
    { id: "iFre", ir: "industrial", titulo: "FRECUENCIA" },
    { id: "iMed", ir: "industrial", titulo: "MEDIDORES", chico: true },
    { id: "iAlm", ir: "alarmas", titulo: "ALARMAS ACTIVAS" },
  ],
}[VISTA];

function armarResumen() {
  $("resumen").innerHTML = TILES.map(
    (t) => `
    <button class="tile" id="${t.id}" data-ir="${t.ir}">
    <div class="t">
      <span>${t.titulo}</span>
    </div>
      <div class="v" ${t.chico ? 'style="font-size:24px"' : ""}>--</div>
      <div class="d">—</div>
    </button>`,
  ).join("");
  $("resumen")
    .querySelectorAll(".tile")
    .forEach((b) =>
      b.addEventListener("click", () => {
        irA(b.dataset.ir);
        $("p-" + st.tab).scrollIntoView({ behavior: "smooth", block: "start" });
      }),
    );
}
function ponerTile(id, valor, detalle, cls) {
  const el = $(id);
  if (!el) return;
  el.querySelector(".v").innerHTML = valor;
  el.querySelector(".d").innerHTML = detalle;
  el.className = "tile " + (cls || "");
}
const conU = (v, u) => `${v}<small>${u}</small>`;

function pintarResumen() {
  const s = st.solar,
    fresco = st.solarFresco;

  const sv = (k) => (fresco ? num(s?.[k]) : null);

  const pe = sv("potencia_entrada"),
    vp = sv("voltaje_panel"),
    ip = sv("corriente_panel");

  const vb = sv("voltaje_bateria"),
    ib = sv("corriente_bateria"),
    en = sv("energia_kwh"),
    ps = sv("potencia_salida");

  const bat =
    ib === null
      ? ""
      : ib >= 0
        ? `cargando a ${fmt(ib, 2)} A`
        : `descargando a ${fmt(-ib, 2)} A`;

  const solarCls = fresco ? "ok" : "aviso";

  const ok = st.lecturas.filter((l) => calidad(l) === "ok");

  const volt = ok.find((l) => prefijo(l.nombre, l.unidad) === "VT");

  const frec = ok.find((l) => prefijo(l.nombre, l.unidad) === "FT");

  const fp = ok.find((l) => prefijo(l.nombre, l.unidad) === "FP");

  const grupos = porMedidor();
  const nMed = Object.keys(grupos).length;

  const medOk = Object.values(grupos).filter((v) =>
    v.some((l) => calidad(l) === "ok"),
  ).length;

  const p1 = st.alarmas.filter((a) => a.prioridad === "P1").length;

  const p2 = st.alarmas.length - p1;

  const almCls = p1 ? "alarma" : p2 ? "aviso" : "ok";

  const almD = st.alarmas.length
    ? `${p1} críticas (P1) · ${p2} altas (P2)`
    : "Todos los parámetros en rango normal";

  const tk = st.gw?.conectada;

  if (VISTA === "general") {
    ponerTile(
      "gSolar",
      fresco ? conU(fmt(pe, 1), "W") : conU("--", "W"),
      fresco
        ? `Batería ${fmt(vb, 2)} V · ${
            ib >= 0 ? "cargando" : "descargando"
          }<br>Energía de hoy ${fmt(en, 3)} kWh`
        : "Sin datos recientes del sistema solar",
      solarCls,
    );

    ponerTile(
      "gInd",
      volt
        ? conU(fmt(num(volt.valor), 1), esc(volt.unidad || "V"))
        : conU("--", "V"),
      `${volt ? esc(volt.nombre) + " · " : ""}${
        frec ? "Frecuencia " + fmt(num(frec.valor), 2) + " Hz<br>" : ""
      }${medOk} de ${nMed} medidores con lecturas`,
      nMed && medOk === nMed ? "ok" : "aviso",
    );

    ponerTile("gAlm", String(st.alarmas.length), almD, almCls);

    ponerTile(
      "gCon",
      st.srvOk === false ? "SIN SERVIDOR" : tk ? "EN LÍNEA" : "DESCONECTADA",
      `Servidor: ${
        st.srvOk === false ? "sin conexión" : "en línea"
      }<br>Tinkerboard: ${tk ? "conectada" : "desconectada"} · ${hora()}`,
      st.srvOk && tk ? "ok" : "alarma",
    );
  } else if (VISTA === "solar") {
    ponerTile(
      "sPot",
      conU(fresco ? fmt(pe, 1) : "--", "W"),
      fresco
        ? `Panel: ${fmt(vp, 2)} V · ${fmt(ip, 2)} A`
        : "Sin datos recientes",
      solarCls,
    );

    ponerTile(
      "sBat",
      conU(fresco ? fmt(vb, 2) : "--", "V DC"),
      fresco ? `Batería ${bat}` : "Sin datos recientes",
      solarCls,
    );

    ponerTile(
      "sEne",
      conU(fresco ? fmt(en, 3) : "--", "kWh"),
      fresco ? `Consumo de la carga: ${fmt(ps, 1)} W` : "Sin datos recientes",
      solarCls,
    );

    ponerTile(
      "sCon",
      fresco ? "EN LÍNEA" : "SIN DATOS",
      fresco
        ? `Última medición: ${hora()}<br>Actualización cada 3 s`
        : "No llegan mediciones del sistema solar",
      fresco ? "ok" : "alarma",
    );
  } else {
    ponerTile(
      "iVol",
      volt
        ? conU(fmt(num(volt.valor), 1), esc(volt.unidad || "V"))
        : conU("--", "V"),
      volt
        ? `${esc(volt.nombre)} · ${esc(volt.medidor_nombre)}`
        : "Sin lecturas de voltaje",
      volt ? "ok" : "aviso",
    );

    ponerTile(
      "iFre",
      frec ? conU(fmt(num(frec.valor), 2), "Hz") : conU("--", "Hz"),
      fp
        ? `Factor de potencia: ${fmt(num(fp.valor), 2)}`
        : "Red eléctrica de la planta",
      frec ? "ok" : "aviso",
    );

    ponerTile(
      "iMed",
      `${medOk} DE ${nMed}`,
      `Medidores con lecturas<br>Tinkerboard: ${
        tk ? "conectada" : "desconectada"
      }`,
      nMed && medOk === nMed && tk ? "ok" : "alarma",
    );

    ponerTile("iAlm", String(st.alarmas.length), almD, almCls);
  }
}

function pintarSolar() {
  const s = st.solar;
  const fresco = st.solarFresco;

  $("solEstado").textContent = !s
    ? "Sin datos del sistema solar"
    : fresco
      ? `● En línea · ${hora()}`
      : "● Sin datos recientes";

  $("solEstado").className = "estado " + (fresco ? "" : "aviso");

  $("solChips").innerHTML = chipsHTML(
    [{ id: "todos", nombre: "Todas" }, ...SOLAR_GRUPOS],
    st.solGrupo,
    "g",
  );

  $("solChips")
    .querySelectorAll(".chip")
    .forEach((b) =>
      b.addEventListener("click", () => {
        st.solGrupo = b.dataset.g;
        pintarSolar();
      }),
    );

  const grupos = SOLAR_GRUPOS.filter(
    (g) => st.solGrupo === "todos" || g.id === st.solGrupo,
  );

  $("solCards").innerHTML = grupos
    .map(
      (g) => `
        <div class="grupo">${esc(g.nombre).toUpperCase()}</div>

        <div class="grid">
          ${g.items
            .map((it) =>
              tarjeta({
                ...it,
                valor: fresco ? num(s?.[it.campo]) : null,
                sel: "s:" + it.campo,
              }),
            )
            .join("")}
        </div>
      `,
    )
    .join("");

  enlazarTarjetas($("solCards"));
}

function pintarIndustrial() {
  const grupos = porMedidor();
  const nombres = Object.keys(grupos);
  if (st.indMedidor !== "todos" && !grupos[st.indMedidor])
    st.indMedidor = "todos";
  $("indChips").innerHTML = chipsHTML(
    [
      { id: "todos", nombre: "Todos los medidores" },
      ...nombres.map((n) => ({ id: n, nombre: n })),
    ],
    st.indMedidor,
    "m",
  );
  $("indChips")
    .querySelectorAll(".chip")
    .forEach((b) =>
      b.addEventListener("click", () => {
        st.indMedidor = b.dataset.m;
        pintarIndustrial();
      }),
    );
  if (!nombres.length) {
    $("indCards").innerHTML =
      '<div class="vacio">Sin variables configuradas. Agrégalas en CONFIGURACIÓN.</div>';
    return;
  }
  const alarmaVar = {};
  st.alarmas.forEach(
    (a) => (alarmaVar[a.variable_id] = a.prioridad === "P1" ? "p1" : "p2"),
  );
  const AVISO = {
    sin_datos: "SIN DATOS",
    sin_respuesta: "SIN RESPUESTA",
    verificando: "VERIFICANDO…",
  };
  $("indCards").innerHTML = nombres
    .filter((n) => st.indMedidor === "todos" || n === st.indMedidor)
    .map((n) => {
      const vars = grupos[n],
        slave = st.slaves[vars[0].id],
        em = estadoMedidor(vars);
      return `<div class="grupo">${esc(n).toUpperCase()} · ID ${slave ?? "—"}</div>
      <div class="estado ${em.c}" style="margin-bottom:8px">${esc(em.t)}</div>
      <div class="grid">${vars
        .map((l, i) => {
          const c = calidad(l),
            base = rangoBase(l.nombre, l.unidad),
            cfg = st.alarmCfg[l.id] || {};
          let min = num(cfg.lolo) ?? num(cfg.lo) ?? base.min,
            max = num(cfg.hihi) ?? num(cfg.hi) ?? base.max;
          if (!(max > min)) {
            min = base.min;
            max = base.max;
          }
          return tarjeta({
            tag: `${prefijo(l.nombre, l.unidad)}-${slave ? slave * 100 + i + 1 : i + 1}`,
            nom: l.nombre,
            valor: c === "ok" ? (num(l.valor) ?? 0) : null,
            u: l.unidad || base.u,
            min,
            max,
            alarma: c === "ok" ? alarmaVar[l.id] || null : null,
            aviso: AVISO[c],
            sel: "m:" + l.id,
          });
        })
        .join("")}</div>`;
    })
    .join("");
  enlazarTarjetas($("indCards"));
}

function pintarAlarmas() {
  const TIPO = { HIHI: "MUY ALTO", HI: "ALTO", LO: "BAJO", LOLO: "MUY BAJO" };
  if (!st.alarmas.length) {
    $("almLista").innerHTML =
      '<div class="vacio"><b>✓</b>SIN ALARMAS ACTIVAS<br>Todos los parámetros dentro del rango normal</div>';
    return;
  }
  const orden = [...st.alarmas].sort((a, b) =>
    a.prioridad > b.prioridad ? 1 : -1,
  );
  $("almLista").innerHTML = orden
    .map((a) => {
      const c = a.prioridad === "P1" ? "p1" : "p2";
      const h = a.inicio_en
        ? new Date(a.inicio_en).toLocaleTimeString("es-EC", { hour12: false })
        : "";
      return `<div class="alm ${c}"><div class="a1">${esc(a.prioridad)} · ${esc(TIPO[a.tipo] || a.tipo)} · desde ${h}</div>
      <div class="a2">${esc(a.variable_nombre || a.nombre || "—")}</div>
      <div class="a3">${esc(a.medidor_nombre || "")} · Valor: ${fmt(num(a.valor))} ${esc(a.unidad || "")}</div></div>`;
    })
    .join("");
}

// ═════════ Histórico ═════════
const PERIODOS = [
  { id: "1", nombre: "1 hora" },
  { id: "6", nombre: "6 horas" },
  { id: "24", nombre: "24 horas" },
  { id: "168", nombre: "7 días" },
];
function infoSel(sel) {
  if (!sel) return null;
  if (sel.startsWith("s:")) {
    const v = SOLAR_VARS.find((x) => x.campo === sel.slice(2));
    return (
      v && {
        nombre: v.nom,
        unidad: v.u,
        origen: "Sistema fotovoltaico",
        solar: true,
      }
    );
  }
  const v = st.vars.find((x) => "m:" + x.id === sel);
  return (
    v && {
      nombre: v.nombre,
      unidad: v.unidad || "",
      origen: v.medidor_nombre,
      solar: false,
    }
  );
}
function pintarHistVars() {
  const valida = (s) =>
    s && (VISTA === "general" || (VISTA === "solar") === s.startsWith("s:"));
  if (!valida(st.histSel))
    st.histSel =
      VISTA !== "solar" && st.vars[0]
        ? "m:" + st.vars[0].id
        : "s:potencia_entrada";
  const g = {};
  if (VISTA !== "solar")
    st.vars.forEach((v) =>
      (g[v.medidor_nombre] = g[v.medidor_nombre] || []).push(v),
    );
  let html = Object.entries(g)
    .map(
      ([m, vs]) =>
        `<div class="grupo">${esc(m).toUpperCase()}</div><div class="chips">${vs.map((v) => `<button class="chip ${st.histSel === "m:" + v.id ? "activo" : ""}" data-sel="m:${v.id}">${esc(v.nombre)}</button>`).join("")}</div>`,
    )
    .join("");
  if (VISTA !== "industrial")
    html += `<div class="grupo">SISTEMA FOTOVOLTAICO</div><div class="chips">${SOLAR_VARS.map((v) => `<button class="chip ${st.histSel === "s:" + v.campo ? "activo" : ""}" data-sel="s:${v.campo}">${esc(v.nom)}</button>`).join("")}</div>`;
  $("histVars").innerHTML = html;
  $("histVars")
    .querySelectorAll(".chip")
    .forEach((b) =>
      b.addEventListener("click", () => irA("historico", b.dataset.sel)),
    );
  $("histPeriodos").innerHTML = chipsHTML(PERIODOS, String(st.histHoras), "h");
  $("histPeriodos")
    .querySelectorAll(".chip")
    .forEach((b) =>
      b.addEventListener("click", () => {
        st.histHoras = Number(b.dataset.h);
        pintarHistVars();
        cargarHistorico();
      }),
    );
}
function etiqueta(iso) {
  const d = new Date(iso),
    h = d.toLocaleTimeString("es-EC", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  return st.histHoras > 24
    ? d.toLocaleDateString("es-EC", { day: "2-digit", month: "2-digit" }) +
        " " +
        h
    : h;
}
async function cargarHistorico() {
  pintarHistVars();
  const sel = st.histSel,
    info = infoSel(sel);
  if (!info) return;
  $("histTitulo").textContent =
    `${info.nombre} — ${info.origen} (${info.unidad || "—"})`;
  const id = sel.slice(2);
  let puntos = [],
    cfg = null,
    eventos = [];
  try {
    const [rS, rC, rE] = await Promise.all([
      getJSON(
        info.solar
          ? `/api/solar/serie?dispositivo_id=${SOLAR_ID}&campo=${id}&horas=${st.histHoras}&puntos=150`
          : `/api/medidores/variables/${id}/serie?horas=${st.histHoras}&puntos=150`,
      ),
      info.solar
        ? null
        : getJSON(`/api/medidores/variables/${id}/alarma`).catch(() => null),
      info.solar
        ? []
        : getJSON(
            `/api/medidores/alarmas/log/historico?variable_id=${id}&horas=${st.histHoras}`,
          ).catch(() => []),
    ]);
    puntos = Array.isArray(rS?.puntos) ? rS.puntos : [];
    cfg = rC;
    eventos = Array.isArray(rE) ? rE : [];
  } catch {}
  if (sel !== st.histSel) return; // el usuario cambió de variable mientras cargaba

  const d = puntos
    .map((p) => ({
      t: p.t,
      avg: num(p.promedio),
      min: num(p.minimo),
      max: num(p.maximo),
      n: Number(p.n) || 0,
    }))
    .filter((p) => p.avg !== null);
  const total = d.reduce((s, p) => s + p.n, 0),
    suma = d.reduce((s, p) => s + p.avg * p.n, 0);
  $("stMin").textContent = d.length
    ? fmt(Math.min(...d.map((p) => p.min)))
    : "—";
  $("stMax").textContent = d.length
    ? fmt(Math.max(...d.map((p) => p.max)))
    : "—";
  $("stAvg").textContent = total ? fmt(suma / total) : "—";
  $("stN").textContent = total || "0";

  const lim = [
    ["hihi", "#CC0000"],
    ["hi", "#CC6600"],
    ["lo", "#CC6600"],
    ["lolo", "#CC0000"],
  ]
    .map(([k, c]) => ({ k, c, v: num(cfg?.[k]) }))
    .filter((l) => l.v !== null);
  $("leyLim").classList.toggle("oculto", !lim.length);
  if (st.chart) {
    st.chart.destroy();
    st.chart = null;
  }
  st.chart = new Chart($("histChart"), {
    type: "line",
    data: {
      labels: d.map((p) => etiqueta(p.t)),
      datasets: [
        {
          label: "Máximo",
          data: d.map((p) => p.max),
          borderWidth: 0,
          pointRadius: 0,
          fill: "+1",
          backgroundColor: "rgba(80,80,80,0.22)",
        },
        {
          label: "Mínimo",
          data: d.map((p) => p.min),
          borderWidth: 0,
          pointRadius: 0,
          fill: false,
        },
        {
          label: "Promedio",
          data: d.map((p) => p.avg),
          borderColor: "#1a1a2e",
          borderWidth: 2,
          pointRadius: d.length < 40 ? 3 : 0,
          pointBackgroundColor: "#1a1a2e",
          tension: 0.25,
          fill: false,
        },
        ...lim.map((l) => ({
          label: l.k.toUpperCase(),
          data: d.map(() => l.v),
          borderColor: l.c,
          borderWidth: 1.5,
          borderDash: [6, 4],
          pointRadius: 0,
          fill: false,
        })),
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          filter: (i) =>
            ["Promedio", "Mínimo", "Máximo"].includes(i.dataset.label),
          callbacks: {
            label: (c) =>
              `${c.dataset.label}: ${c.parsed.y?.toFixed(2)} ${info.unidad || ""}`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: "rgba(0,0,0,0.08)" },
          ticks: {
            color: "#333",
            font: { family: "IBM Plex Mono", size: 12 },
            maxTicksLimit: 8,
          },
        },
        y: {
          grid: { color: "rgba(0,0,0,0.12)" },
          ticks: { color: "#333", font: { family: "IBM Plex Mono", size: 12 } },
        },
      },
    },
  });
  if (!d.length)
    $("histTitulo").textContent += " · sin lecturas en este periodo";

  $("histAlmTit").classList.toggle("oculto", info.solar);
  const TIPO = { HIHI: "MUY ALTO", HI: "ALTO", LO: "BAJO", LOLO: "MUY BAJO" };
  $("histAlm").innerHTML = info.solar
    ? ""
    : !eventos.length
      ? '<div class="estado">Sin alarmas en este periodo</div>'
      : eventos
          .map((a) => {
            const c = a.prioridad === "P1" ? "p1" : "p2";
            const ini = new Date(a.inicio_en).toLocaleString("es-EC", {
              hour12: false,
            });
            const fin = a.activa
              ? "ACTIVA"
              : a.fin_en
                ? new Date(a.fin_en).toLocaleString("es-EC", { hour12: false })
                : "—";
            return `<div class="alm ${c}"><div class="a1">${esc(a.prioridad)} · ${esc(TIPO[a.tipo] || a.tipo)} · ${fmt(num(a.valor))} ${esc(a.unidad || info.unidad)}</div><div class="a3">${ini} → ${fin}</div></div>`;
          })
          .join("");
}

// ═════════ Inicio ═════════
(function () {
  // Pestañas visibles y nombres según la vista
  document
    .querySelectorAll(".tab")
    .forEach((b) =>
      b.classList.toggle("oculto", !TABS.includes(b.dataset.tab)),
    );
  if (VISTA !== "general")
    document.querySelector(`.tab[data-tab="${VISTA}"]`).textContent =
      "MEDICIONES";
  document
    .querySelectorAll(".vistas a")
    .forEach((a) => a.classList.toggle("activa", a.dataset.vista === VISTA));
  armarResumen();
  const h = location.hash.slice(1);
  const [tab, ...resto] = h.split(":");
  const sel = resto.length ? resto.join(":") : null;
  cargarConfig().then(() => {
    irA(tab, sel);
    refrescar();
  });
  setInterval(refrescar, 3000);
  setInterval(cargarConfig, 30000);
  setInterval(() => {
    if (st.tab === "historico") cargarHistorico();
  }, 30000);
})();
