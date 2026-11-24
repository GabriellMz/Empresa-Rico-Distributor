document.addEventListener('DOMContentLoaded', () => {
    const tbody = document.getElementById('tablaPedidosBody');
    const filtroEstado = document.getElementById('filtroEstadoPedido');
    let pedidosCache = [];

    function badgeEstado(estado) {
        if (estado === 'Realizado') return '<span class="badge bg-success">Realizado</span>';
        if (estado === 'Cancelado') return '<span class="badge bg-danger">Cancelado</span>';
        return '<span class="badge bg-warning text-dark">Pendiente</span>';
    }

    function formatearFecha(iso) {
        if (!iso) return '-';
        // Normalizar sin sufijo Z para respetar la hora de Perú guardada en la BD
        const limpia = String(iso).replace(' ', 'T').replace(/(\.\d+)?(Z|[+-]\d{2}:?\d{2})$/i, '');
        const fecha = new Date(limpia);
        if (isNaN(fecha.getTime())) return iso;

        return fecha.toLocaleString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

    function renderizarTabla() {
        const filtro = filtroEstado.value;
        const filtrados = filtro === 'todos'
            ? pedidosCache
            : pedidosCache.filter(p => (p.estado || 'Pendiente') === filtro);

        if (filtrados.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">No hay pedidos para mostrar.</td></tr>';
            return;
        }

        tbody.innerHTML = filtrados.map(p => `
            <tr>
                <td class="fw-bold">#${p.id_pedido}</td>
                <td class="small">${formatearFecha(p.fecha_pedido)}</td>
                <td>
                    <div class="fw-semibold">${p.cliente_nombre}</div>
                    <small class="text-muted">${p.cliente_telefono} · ${p.cliente_email}</small>
                </td>
                <td class="fw-bold text-danger">S/ ${Number(p.total || 0).toFixed(2)}</td>
                <td>${badgeEstado(p.estado)}</td>
                <td class="text-center">
                    <div class="d-inline-flex align-items-center gap-2">
                        <select class="form-select form-select-sm select-estado-pedido" data-id="${p.id_pedido}" style="width: 130px;">
                            <option value="Pendiente" ${p.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                            <option value="Realizado" ${p.estado === 'Realizado' ? 'selected' : ''}>Realizado</option>
                            <option value="Cancelado" ${p.estado === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
                        </select>
                        <button type="button" class="btn btn-sm btn-outline-secondary btn-ver-pedido" data-id="${p.id_pedido}" title="Ver detalle">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-danger btn-eliminar-pedido" data-id="${p.id_pedido}" title="Eliminar pedido">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async function cargarPedidos() {
        try {
            const res = await fetch('/api/pedidos');
            if (!res.ok) throw new Error('Error al cargar pedidos');
            pedidosCache = await res.json();
            renderizarTabla();
        } catch (error) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-danger">Error al consultar pedidos.</td></tr>';
        }
    }

    tbody.addEventListener('change', async (e) => {
        const select = e.target.closest('.select-estado-pedido');
        if (!select) return;

        const id = Number(select.dataset.id);
        const nuevoEstado = select.value;

        try {
            const res = await fetch(`/api/pedidos/${id}/estado`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: nuevoEstado })
            });
            const data = await res.json();

            if (res.ok && data.exito) {
                const ped = pedidosCache.find(p => p.id_pedido === id);
                if (ped) ped.estado = nuevoEstado;
                renderizarTabla();
                if (typeof mostrarAlertaExito === 'function') {
                    mostrarAlertaExito(`Pedido #${id} marcado como ${nuevoEstado}`);
                }
            }
        } catch (err) {
            if (typeof mostrarAlertaError === 'function') {
                mostrarAlertaError('No se pudo actualizar el estado del pedido.');
            }
        }
    });

    tbody.addEventListener('click', async (e) => {
        // 1. Ver detalle del pedido
        const btnVer = e.target.closest('.btn-ver-pedido');
        if (btnVer) {
            const id = Number(btnVer.dataset.id);
            const p = pedidosCache.find(item => item.id_pedido === id);
            if (!p) return;

            document.getElementById('modalDetallePedidoTitulo').textContent = `Pedido #${p.id_pedido} — ${p.estado}`;
            const listaItems = (p.items || []).map(i => `
                <tr>
                    <td>${i.nombre_producto}</td>
                    <td class="text-center">${i.cantidad}</td>
                    <td class="text-end">S/ ${Number(i.precio_unitario).toFixed(2)}</td>
                    <td class="text-end fw-bold">S/ ${(Number(i.cantidad) * Number(i.precio_unitario)).toFixed(2)}</td>
                </tr>
            `).join('');

            document.getElementById('modalDetallePedidoBody').innerHTML = `
                <div class="mb-3 small">
                    <p class="mb-1"><strong>Cliente:</strong> ${p.cliente_nombre} (Doc/RUC: ${p.cliente_ruc})</p>
                    <p class="mb-1"><strong>Contacto:</strong> ${p.cliente_telefono} · ${p.cliente_email}</p>
                    <p class="mb-0"><strong>Dirección:</strong> ${p.cliente_direccion}</p>
                </div>
                <table class="table table-sm table-bordered mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Producto</th>
                            <th class="text-center">Cant.</th>
                            <th class="text-end">P. Unit.</th>
                            <th class="text-end">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>${listaItems || '<tr><td colspan="4" class="text-center text-muted">Sin detalle</td></tr>'}</tbody>
                    <tfoot>
                        <tr>
                            <th colspan="3" class="text-end">TOTAL</th>
                            <th class="text-end text-danger">S/ ${Number(p.total || 0).toFixed(2)}</th>
                        </tr>
                    </tfoot>
                </table>
            `;

            bootstrap.Modal.getOrCreateInstance(document.getElementById('modalDetallePedido')).show();
            return;
        }

        // 2. Eliminar pedido
        const btnEliminar = e.target.closest('.btn-eliminar-pedido');
        if (btnEliminar) {
            const id = Number(btnEliminar.dataset.id);

            let confirmado = true;
            if (typeof Swal !== 'undefined') {
                const resp = await Swal.fire({
                    title: `¿Eliminar pedido #${id}?`,
                    text: 'Esta acción eliminará el pedido y su detalle de la base de datos.',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#dc3545',
                    cancelButtonColor: '#6c757d',
                    confirmButtonText: 'Sí, eliminar',
                    cancelButtonText: 'Cancelar'
                });
                confirmado = resp.isConfirmed;
            } else {
                confirmado = confirm(`¿Seguro que deseas eliminar el pedido #${id}?`);
            }

            if (!confirmado) return;

            try {
                const res = await fetch(`/api/pedidos/${id}`, { method: 'DELETE' });
                const data = await res.json();

                if (res.ok && data.exito) {
                    pedidosCache = pedidosCache.filter(p => p.id_pedido !== id);
                    renderizarTabla();
                    if (typeof mostrarAlertaExito === 'function') {
                        mostrarAlertaExito(`Pedido #${id} eliminado correctamente.`);
                    }
                } else {
                    throw new Error(data.mensaje || data.error || 'No se pudo eliminar');
                }
            } catch (err) {
                if (typeof mostrarAlertaError === 'function') {
                    mostrarAlertaError('Error al eliminar el pedido.');
                }
            }
        }
    });

    filtroEstado.addEventListener('change', renderizarTabla);
    cargarPedidos();
});