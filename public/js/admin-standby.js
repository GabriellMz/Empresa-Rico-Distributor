document.addEventListener('DOMContentLoaded', () => {
    const tbody = document.getElementById('tablaProductosBody');
    if (!tbody) return;

    let estadosProductos = {};

    async function cargarEstados() {
        try {
            const res = await fetch('/api/productos?todos=true');
            if (!res.ok) return;
            const productos = await res.json();
            estadosProductos = {};
            productos.forEach(p => {
                estadosProductos[Number(p.id_producto)] = p.activo !== false;
            });
            inyectarBotonesStandby();
        } catch (err) {
            console.error('Error cargando estados de productos:', err);
        }
    }

    function inyectarBotonesStandby() {
        const filas = tbody.querySelectorAll('tr');
        filas.forEach(tr => {
            const celdas = tr.querySelectorAll('td');
            if (celdas.length < 7) return;

            const id = Number(celdas[0].textContent.trim());
            if (!id || tr.querySelector('.btn-toggle-standby')) return;

            const activo = estadosProductos[id] !== false;
            const celdaNombre = celdas[2];
            const celdaAcciones = celdas[celdas.length - 1];

            if (!activo) {
                tr.classList.add('table-secondary', 'opacity-75');
                if (!celdaNombre.querySelector('.badge-standby')) {
                    celdaNombre.insertAdjacentHTML('beforeend', ' <span class="badge bg-warning text-dark badge-standby ms-1">Standby</span>');
                }
            }

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `btn btn-sm ${activo ? 'btn-outline-warning' : 'btn-success'} ms-1 btn-toggle-standby`;
            btn.dataset.id = id;
            btn.dataset.activo = activo ? '1' : '0';
            btn.title = activo ? 'Poner en Standby (ocultar al público)' : 'Activar producto';
            btn.innerHTML = activo ? '<i class="bi bi-pause-circle"></i>' : '<i class="bi bi-play-circle"></i>';

            const grupo = celdaAcciones.querySelector('.d-flex, .btn-group') || celdaAcciones;
            grupo.appendChild(btn);
        });
    }

    tbody.addEventListener('click', async (e) => {
        const btn = e.target.closest('.btn-toggle-standby');
        if (!btn) return;

        const id = Number(btn.dataset.id);
        const estaActivo = btn.dataset.activo === '1';
        const nuevoEstado = !estaActivo;

        try {
            const res = await fetch(`/api/productos/${id}/estado`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activo: nuevoEstado })
            });
            const data = await res.json();

            if (res.ok && data.exito) {
                estadosProductos[id] = nuevoEstado;
                const tr = btn.closest('tr');
                const celdaNombre = tr.querySelectorAll('td')[2];

                tr.classList.toggle('table-secondary', !nuevoEstado);
                tr.classList.toggle('opacity-75', !nuevoEstado);

                const badge = celdaNombre.querySelector('.badge-standby');
                if (!nuevoEstado && !badge) {
                    celdaNombre.insertAdjacentHTML('beforeend', ' <span class="badge bg-warning text-dark badge-standby ms-1">Standby</span>');
                } else if (nuevoEstado && badge) {
                    badge.remove();
                }

                btn.dataset.activo = nuevoEstado ? '1' : '0';
                btn.className = `btn btn-sm ${nuevoEstado ? 'btn-outline-warning' : 'btn-success'} ms-1 btn-toggle-standby`;
                btn.title = nuevoEstado ? 'Poner en Standby (ocultar al público)' : 'Activar producto';
                btn.innerHTML = nuevoEstado ? '<i class="bi bi-pause-circle"></i>' : '<i class="bi bi-play-circle"></i>';

                if (typeof mostrarAlertaExito === 'function') {
                    mostrarAlertaExito(data.mensaje);
                }
            }
        } catch (err) {
            if (typeof mostrarAlertaError === 'function') {
                mostrarAlertaError('No se pudo cambiar el estado del producto.');
            }
        }
    });

    const observer = new MutationObserver(() => inyectarBotonesStandby());
    observer.observe(tbody, { childList: true });

    cargarEstados();
});