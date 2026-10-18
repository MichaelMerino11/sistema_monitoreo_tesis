/* MAINTRONIC · Legibilidad común para todos los dashboards web.
   Se carga en cada página con <script src="/legible.js" defer></script>.
   Revisa los textos grises y, si no tienen suficiente contraste con su fondo
   (WCAG AA, 4.5:1), los aclara u oscurece. No toca colores de estado
   (verde, naranja, rojo), solo grises. Se vuelve a aplicar cuando la página
   actualiza sus datos. */
(function () {
  const OBJETIVO = 4.5;

  // Encabezados de panel un poco más oscuros para que el texto claro resalte
  const estilo = document.createElement('style');
  estilo.textContent = '.panel-header{background:#4A4A4A !important;border-bottom-color:#333 !important;}' +
    '.panel-status.online{color:#66CC66 !important;border-color:#66CC66 !important;}';
  document.head.appendChild(estilo);

  function rgb(c) {
    const m = c && c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const a = m[1].split(',').map(Number);
    if (a.length < 4) a.push(1);
    return a;
  }
  function lum(c) {
    const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
  }
  function contraste(a, b) {
    const x = lum(a), y = lum(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }
  function esGris(c) { return Math.max(c[0], c[1], c[2]) - Math.min(c[0], c[1], c[2]) < 24; }
  function fondo(el) {
    while (el && el.nodeType === 1) {
      const c = rgb(getComputedStyle(el).backgroundColor);
      if (c && c[3] > 0.5) return c;
      el = el.parentElement;
    }
    return [255, 255, 255, 1];
  }
  function tieneTexto(el) {
    for (const n of el.childNodes) if (n.nodeType === 3 && n.textContent.trim()) return true;
    return false;
  }
  // Busca el gris más cercano al original que cumpla el contraste
  function ajustar(fg, bg) {
    const v0 = Math.round((fg[0] + fg[1] + fg[2]) / 3);
    const primero = lum(bg) < 0.2 ? 1 : -1;
    for (const dir of [primero, -primero]) {
      for (let v = v0; v >= 0 && v <= 255; v += dir * 6) {
        if (contraste([v, v, v], bg) >= OBJETIVO) return `rgb(${v}, ${v}, ${v})`;
      }
    }
    return contraste([255, 255, 255], bg) > contraste([0, 0, 0], bg) ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)';
  }

  const marcados = new Set();
  function pasar() {
    // 1) Quitar lo que pusimos antes (si la página no lo cambió), para medir el color real actual
    for (const el of marcados) {
      if (el.isConnected && el.style.color === el.__lgPuesto) el.style.color = el.__lgPrevio || '';
      delete el.__lgPuesto;
    }
    marcados.clear();
    // 2) Medir
    const cambios = [];
    for (const el of document.body.querySelectorAll('*')) {
      if (el.closest('svg, canvas, script, style, noscript')) continue;
      if (!tieneTexto(el)) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const fg = rgb(cs.color);
      if (!fg || !esGris(fg)) continue;
      const bg = fondo(el);
      if (contraste(fg, bg) >= OBJETIVO) continue;
      cambios.push([el, ajustar(fg, bg)]);
    }
    // 3) Aplicar
    for (const [el, color] of cambios) {
      el.__lgPrevio = el.style.color;
      el.style.color = color;
      el.__lgPuesto = el.style.color;
      marcados.add(el);
    }
  }

  // Se ejecuta antes del siguiente repintado, así no se ve el gris original ni un instante
  const obs = new MutationObserver(() => ejecutar());
  const opciones = { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class', 'style'] };
  function ejecutar() {
    obs.disconnect();
    try { pasar(); } finally { obs.observe(document.body, opciones); }
  }

  // Gráficas Chart.js: ejes y leyendas legibles sobre fondo oscuro
  function ajustarCharts() {
    if (!window.Chart) return;
    Chart.defaults.color = '#C8C8C8';
    Chart.defaults.font.size = Math.max(Chart.defaults.font.size || 12, 12);
  }

  function iniciar() { ajustarCharts(); ejecutar(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
