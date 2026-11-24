// Vista del comprobante de venta y opción de impresión / guardado en PDF.
const Boleta = {
    escapar(valor) {
        return String(valor ?? '').replace(/[&<>"']/g, caracter => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[caracter]));
    },

    dinero(valor) {
        return `S/ ${Number(valor || 0).toFixed(2)}`;
    },

    mostrar(boleta) {
        let modal = document.getElementById('modalBoleta');
        if (!modal) {
            document.body.insertAdjacentHTML('beforeend', `
                <div class="modal fade" id="modalBoleta" tabindex="-1" aria-labelledby="tituloBoleta" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
                        <div class="modal-content">
                            <div class="modal-header bg-danger text-white">
                                <h5 class="modal-title fw-bold" id="tituloBoleta">Comprobante de venta</h5>
                                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                            </div>
                            <div class="modal-body p-4" id="contenidoBoleta"></div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cerrar</button>
                                <button type="button" class="btn btn-danger" id="btnImprimirBoleta"><i class="bi bi-file-earmark-pdf me-1"></i>Imprimir / Guardar PDF</button>
                            </div>
                        </div>
                    </div>
                </div>`);
            modal = document.getElementById('modalBoleta');
        }

        const fecha = new Date(boleta.fecha);
        const fechaTexto = Number.isNaN(fecha.getTime()) ? '' : fecha.toLocaleString('es-PE');
        const cliente = boleta.cliente || {};
        const contenido = document.getElementById('contenidoBoleta');
        contenido.innerHTML = `
            <article class="comprobante-venta">
                <header class="d-flex justify-content-between gap-3 border-bottom pb-3 mb-3">
                    <div><h4 class="fw-bold text-danger mb-1">${this.escapar(boleta.empresa?.nombre || 'Rico Alimentos')}</h4><div>RUC: ${this.escapar(boleta.empresa?.ruc || '')}</div></div>
                    <div class="text-end"><strong>COMPROBANTE DE VENTA</strong><div>N.º ${this.escapar(boleta.numero)}</div><div>${this.escapar(fechaTexto)}</div></div>
                </header>
                <section class="mb-4"><h6 class="fw-bold">Cliente</h6><div>${this.escapar(cliente.razon_social)}</div>${cliente.documento ? `<div>DNI / RUC: ${this.escapar(cliente.documento)}</div>` : ''}${cliente.email ? `<div>${this.escapar(cliente.email)}</div>` : ''}${cliente.telefono ? `<div>Tel.: ${this.escapar(cliente.telefono)}</div>` : ''}${cliente.direccion ? `<div>${this.escapar(cliente.direccion)}</div>` : ''}</section>
                <div class="table-responsive"><table class="table table-sm align-middle"><thead><tr><th>Producto</th><th class="text-center">Cant.</th><th class="text-end">P. unit.</th><th class="text-end">Desc.</th><th class="text-end">Importe</th></tr></thead>
                    <tbody>${(boleta.items || []).map(item => `<tr><td>${this.escapar(item.nombre)}</td><td class="text-center">${Number(item.cantidad)}</td><td class="text-end">${this.dinero(item.precio_unitario)}</td><td class="text-end">${Number(item.descuento_porcentaje || 0)}%</td><td class="text-end">${this.dinero(item.subtotal)}</td></tr>`).join('')}</tbody></table></div>
                <section class="ms-auto" style="max-width: 330px">
                    <div class="d-flex justify-content-between"><span>Subtotal</span><span>${this.dinero(boleta.subtotal)}</span></div>
                    <div class="d-flex justify-content-between text-success"><span>Descuento en ofertas</span><span>- ${this.dinero(boleta.descuento_ofertas)}</span></div>
                    ${boleta.descuento_cupon ? `<div class="d-flex justify-content-between text-success"><span>Cupón ${this.escapar(boleta.cupon?.codigo || '')}</span><span>- ${this.dinero(boleta.descuento_cupon)}</span></div>` : ''}
                    <div class="d-flex justify-content-between border-top mt-2 pt-2"><span>Base imponible</span><span>${this.dinero(boleta.base_imponible)}</span></div>
                    <div class="d-flex justify-content-between"><span>IGV (${Number(boleta.igv_porcentaje)}%)</span><span>${this.dinero(boleta.igv)}</span></div>
                    <div class="d-flex justify-content-between fw-bold fs-5 border-top mt-2 pt-2"><span>Total</span><span>${this.dinero(boleta.total)}</span></div>
                </section>
                <p class="small text-muted border-top mt-4 pt-3 mb-0">Representación informativa del pedido generado en esta tienda. No sustituye un comprobante de pago electrónico autorizado por SUNAT.</p>
            </article>`;
        document.getElementById('btnImprimirBoleta').onclick = () => this.imprimir(boleta, contenido.innerHTML);
        bootstrap.Modal.getOrCreateInstance(modal).show();
    },

    imprimir(boleta, contenido) {
        const ventana = window.open('', '_blank', 'width=900,height=700');
        if (!ventana) {
            Swal.fire({ icon: 'info', title: 'Permite la ventana de impresión', text: 'El navegador bloqueó la ventana emergente. Habilítala y vuelve a pulsar el botón.' });
            return;
        }
        ventana.document.open();
        ventana.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Comprobante ${this.escapar(boleta.numero)}</title><style>
            @page{size:A4;margin:18mm}*{box-sizing:border-box}body{font:14px Arial,sans-serif;color:#222;margin:0}.comprobante-venta{max-width:780px;margin:auto}.text-danger{color:#b4232c}.text-success{color:#18864b}.text-muted{color:#666;font-size:12px}.fw-bold{font-weight:700}.fs-5{font-size:18px}.d-flex{display:flex}.justify-content-between{justify-content:space-between}.gap-3{gap:16px}.text-end{text-align:right}.text-center{text-align:center}.border-bottom{border-bottom:1px solid #ccc}.border-top{border-top:1px solid #ccc}.pb-3{padding-bottom:12px}.pt-2{padding-top:8px}.pt-3{padding-top:12px}.mb-1{margin-bottom:4px}.mb-3{margin-bottom:12px}.mb-4{margin-bottom:16px}.mt-2{margin-top:8px}.mt-4{margin-top:16px}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{padding:9px 6px;border-bottom:1px solid #ddd}th{background:#f6f6f6;text-align:left}section{line-height:1.6}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
        </style></head><body>${contenido}<script>window.addEventListener('load',()=>window.print());<\/script></body></html>`);
        ventana.document.close();
    }
};
