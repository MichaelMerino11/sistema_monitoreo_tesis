// server/dashboard/gateway-status.js
// Indicador fijo (no clicable) del estado de la Tinkerboard, junto a la hora.
// Se incluye en cada dashboard con: <script src="/gateway-status.js"></script>
(function () {
    const POLL_MS = 3000;

    const style = document.createElement('style');
    style.textContent = `
    .gw-wrap{display:flex;align-items:center;gap:12px;}
    .gw-badge{font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;letter-spacing:0.5px;
      padding:3px 10px;border:1px solid #555;background:#2A2A2A;color:#A0A0A0;
      display:inline-flex;align-items:center;gap:6px;cursor:default;user-select:none;white-space:nowrap;}
    .gw-badge::before{content:'';width:7px;height:7px;border-radius:50%;background:#707070;}
    .gw-badge.gw-on{color:#C8C8C8;border-color:#555;}
    .gw-badge.gw-on::before{background:#44AA44;}
    .gw-badge.gw-off{background:#CC0000;border-color:#880000;color:#FFFFFF;}
    .gw-badge.gw-off::before{background:#FFFFFF;}
    .gw-badge.gw-flotante{position:fixed;top:6px;right:120px;z-index:300;}
    @media(max-width:600px){.gw-badge{font-size:9px;padding:2px 6px;}}
  `;
    document.head.appendChild(style);

    // Estado compartido para que el dashboard sepa si debe poner los valores en cero
    window.MAINTRONIC_GW = { cargado: false, conectada: false, fallidas: [], bus: null, offsetMs: 0 };
    window.MAINTRONIC_GW_AHORA = () => Date.now() + (window.MAINTRONIC_GW.offsetMs || 0);

    function montar() {
        const badge = document.createElement('span');
        badge.id = 'gw-badge';
        badge.className = 'gw-badge';
        badge.textContent = 'TINKER: CONSULTANDO';
        badge.setAttribute('role', 'status');

        const clock = document.querySelector('.sys-clock') || document.getElementById('clock');
        if (clock && clock.parentNode) {
            const wrap = document.createElement('span');
            wrap.className = 'gw-wrap';
            clock.parentNode.insertBefore(wrap, clock);
            wrap.appendChild(badge);
            wrap.appendChild(clock);
        } else {
            badge.classList.add('gw-flotante');
            document.body.appendChild(badge);
        }
        return badge;
    }

    async function actualizar(badge) {
        try {
            const r = await fetch('/api/gateway/estado', { cache: 'no-store' });
            const d = await r.json();
            window.MAINTRONIC_GW = {
                cargado: true,
                conectada: !!d.conectada,
                fallidas: Array.isArray(d.fallidas) ? d.fallidas : [],
                bus: d.bus || null,
                offsetMs: new Date(d.ahora).getTime() - Date.now()
            };
            badge.className = 'gw-badge ' + (d.conectada ? 'gw-on' : 'gw-off');
            badge.textContent = d.conectada ? 'TINKER CONECTADA' : 'TINKER DESCONECTADA';
        } catch (e) {
            window.MAINTRONIC_GW = { ...window.MAINTRONIC_GW, cargado: true, conectada: false, fallidas: [] };
            badge.className = 'gw-badge gw-off';
            badge.textContent = 'SERVIDOR SIN RESPUESTA';
        }
    }

    function iniciar() {
        const badge = montar();
        actualizar(badge);
        setInterval(() => actualizar(badge), POLL_MS);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
    else iniciar();
})();