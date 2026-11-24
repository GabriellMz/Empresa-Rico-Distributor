// ==========================================
// OFERTAS, CUPONES Y CARRITO DE COMPRAS - RICO
// ==========================================

// OFERTAS: id_producto => porcentaje de descuento (mínimo 5%)
const OFERTAS = {
    1: 15,   // Pollo Fresco
    2: 10,   // Cortes de Cerdo
    11: 20,  // Chorizo Parrillero
    13: 12,  // Tocino Ahumado
    15: 25,  // Nuggets de Pollo
    20: 18   // Combo Parrillero
};

// CUPONES: se aplican solos según el monto de la compra (se usa el mejor)
const CUPONES = [
    { codigo: 'RICO10', minimo: 100, porcentaje: 10 },
    { codigo: 'RICO15', minimo: 150, porcentaje: 15 }
];

const DESCUENTO_MINIMO = 5;
const CLAVE_CARRITO = 'ricoCarrito';

// Redondear a 2 decimales
function redondear(valor) {
    return Math.round(Number(valor) * 100) / 100;
}

function formatearPrecio(valor) {
    return `S/ ${redondear(valor).toFixed(2)}`;
}

// Devuelve el % de descuento del producto (0 si no tiene oferta)
function obtenerDescuento(idProducto) {
    const descuento = Number(OFERTAS[idProducto]) || 0;
    return descuento >= DESCUENTO_MINIMO ? descuento : 0;
}

// Precio final aplicando el descuento
function calcularPrecioFinal(precio, descuento) {
    return redondear(Number(precio) * (1 - descuento / 100));
}

// Mejor cupón para un monto (compras MAYORES al mínimo)
function obtenerCupon(monto) {
    return CUPONES
        .filter(cupon => monto > cupon.minimo)
        .sort((a, b) => b.porcentaje - a.porcentaje)[0] || null;
}

// Siguiente cupón que aún no se alcanza
function obtenerSiguienteCupon(monto) {
    return CUPONES
        .filter(cupon => monto <= cupon.minimo)
        .sort((a, b) => a.minimo - b.minimo)[0] || null;
}

function escaparHtml(texto) {
    const div = document.createElement('div');
    div.textContent = texto == null ? '' : String(texto);
    return div.innerHTML;
}

// ==========================================
// PANEL LATERAL DEL CARRITO (se crea en cada página)
// ==========================================
function crearPanelCarrito() {
    if (document.getElementById('offcanvasCarrito')) return;

    const panel = document.createElement('div');
    panel.className = 'offcanvas offcanvas-end';
    panel.tabIndex = -1;
    panel.id = 'offcanvasCarrito';
    panel.setAttribute('aria-labelledby', 'tituloCarrito');

    panel.innerHTML = `
        <div class="offcanvas-header bg-danger text-white">
            <h5 class="offcanvas-title fw-bold" id="tituloCarrito">
                <i class="bi bi-cart3 me-2"></i>
                Mi carrito
            </h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas"
                aria-label="Cerrar"></button>
        </div>

        <div class="offcanvas-body d-flex flex-column">

            <div id="carritoItems" class="flex-grow-1"></div>

            <div id="carritoResumen" class="border-top pt-3 mt-3 d-none">

                <div class="cupones-carrito mb-3">
                    <h6 class="fw-bold mb-2">
                        <i class="bi bi-ticket-perforated text-danger me-1"></i>
                        Tienes los siguientes cupones
                    </h6>
                    <ul id="carritoCupones" class="list-unstyled small mb-2"></ul>
                    <p id="carritoCuponMensaje" class="small text-muted mb-0"></p>
                </div>

                <div class="d-flex justify-content-between mb-1">
                    <span>Subtotal</span>
                    <span id="carritoSubtotal">S/ 0.00</span>
                </div>
                <div class="d-flex justify-content-between mb-1 text-success">
                    <span>Descuento ofertas</span>
                    <span id="carritoAhorro">- S/ 0.00</span>
                </div>
                <div id="filaCupon" class="d-flex justify-content-between mb-1 text-success d-none">
                    <span id="carritoCuponNombre">Cupón</span>
                    <span id="carritoCuponMonto">- S/ 0.00</span>
                </div>
                <div class="d-flex justify-content-between fw-bold fs-5 mt-2">
                    <span>Total</span>
                    <span id="carritoTotal" class="text-danger">S/ 0.00</span>
                </div>

                <button type="button" id="btnFinalizarCompra" class="btn btn-danger w-100 mt-3">
                    <i class="bi bi-bag-check me-1"></i>
                    Finalizar compra
                </button>
                <button type="button" id="btnVaciarCarrito" class="btn btn-outline-secondary w-100 mt-2">
                    <i class="bi bi-trash me-1"></i>
                    Vaciar carrito
                </button>
            </div>

        </div>`;

    document.body.appendChild(panel);
}

// ==========================================
// LÓGICA DEL CARRITO
// ==========================================
const Carrito = {
    items: [],

    // Cargar el carrito guardado en el navegador
    cargar() {
        try {
            const guardado = JSON.parse(localStorage.getItem(CLAVE_CARRITO));
            this.items = Array.isArray(guardado) ? guardado : [];
        } catch (error) {
            this.items = [];
        }

        // Actualizar descuentos por si cambiaron las ofertas
        this.items.forEach(item => {
            item.descuento = obtenerDescuento(item.id);
        });
    },

    guardar() {
        try {
            localStorage.setItem(CLAVE_CARRITO, JSON.stringify(this.items));
        } catch (error) {
            console.error('No se pudo guardar el carrito:', error);
        }
        this.mostrar();
    },

    buscar(id) {
        return this.items.find(item => item.id === Number(id));
    },

    // Agregar un producto (si ya existe, suma 1)
    agregar(producto) {
        const id = Number(producto.id_producto);
        const existente = this.buscar(id);

        if (existente) {
            existente.cantidad++;
        } else {
            this.items.push({
                id,
                nombre: producto.nombre || 'Producto',
                imagen: producto.imagen || '',
                precio: redondear(producto.precio || 0),
                descuento: obtenerDescuento(id),
                cantidad: 1
            });
        }

        this.guardar();
    },

    sumar(id) {
        const item = this.buscar(id);
        if (!item) return;
        item.cantidad++;
        this.guardar();
    },

    // Restar 1 (si llega a 0 se elimina)
    restar(id) {
        const item = this.buscar(id);
        if (!item) return;

        if (item.cantidad > 1) {
            item.cantidad--;
            this.guardar();
        } else {
            this.eliminar(id);
        }
    },

    eliminar(id) {
        this.items = this.items.filter(item => item.id !== Number(id));
        this.guardar();
    },

    vaciar() {
        this.items = [];
        this.guardar();
    },

    // Subtotal de un ítem con descuento aplicado
    subtotalItem(item) {
        return redondear(calcularPrecioFinal(item.precio, item.descuento) * item.cantidad);
    },

    // Totales del carrito (ofertas + cupón)
    calcularTotales() {
        let subtotal = 0;
        let conOfertas = 0;
        let cantidad = 0;

        this.items.forEach(item => {
            subtotal += item.precio * item.cantidad;
            conOfertas += this.subtotalItem(item);
            cantidad += item.cantidad;
        });

        subtotal = redondear(subtotal);
        conOfertas = redondear(conOfertas);

        const cupon = obtenerCupon(conOfertas);
        const descuentoCupon = cupon
            ? redondear(conOfertas * cupon.porcentaje / 100)
            : 0;

        return {
            subtotal,
            ahorro: redondear(subtotal - conOfertas),
            conOfertas,
            cupon,
            descuentoCupon,
            siguienteCupon: obtenerSiguienteCupon(conOfertas),
            total: redondear(conOfertas - descuentoCupon),
            cantidad
        };
    },

    // ==========================================
    // MOSTRAR EL CARRITO EN PANTALLA
    // ==========================================
    mostrarCupones(totales) {
        const lista = document.getElementById('carritoCupones');
        const mensaje = document.getElementById('carritoCuponMensaje');

        lista.innerHTML = CUPONES.map(cupon => {
            const aplicado = totales.cupon && totales.cupon.codigo === cupon.codigo;
            return `
                <li class="d-flex align-items-center gap-2 mb-1 ${aplicado ? 'text-success fw-semibold' : 'text-muted'}">
                    <i class="bi ${aplicado ? 'bi-check-circle-fill' : 'bi-tag'}"></i>
                    <span><strong>${cupon.codigo}</strong>: ${cupon.porcentaje}% en compras mayores a ${formatearPrecio(cupon.minimo)}</span>
                    ${aplicado ? '<span class="badge bg-success ms-auto">Aplicado</span>' : ''}
                </li>`;
        }).join('');

        if (totales.siguienteCupon) {
            const falta = redondear(totales.siguienteCupon.minimo - totales.conOfertas + 0.01);
            mensaje.textContent =
                `Te faltan ${formatearPrecio(falta)} para obtener ${totales.siguienteCupon.porcentaje}% de descuento.`;
        } else {
            mensaje.textContent = '¡Tienes el mejor cupón aplicado!';
        }

        document.getElementById('filaCupon').classList.toggle('d-none', !totales.cupon);
        if (totales.cupon) {
            document.getElementById('carritoCuponNombre').textContent =
                `Cupón ${totales.cupon.codigo} (-${totales.cupon.porcentaje}%)`;
            document.getElementById('carritoCuponMonto').textContent =
                `- ${formatearPrecio(totales.descuentoCupon)}`;
        }
    },

    mostrar() {
        const contenedor = document.getElementById('carritoItems');
        const contador = document.getElementById('contadorCarrito');
        const totales = this.calcularTotales();

        if (contador) {
            contador.textContent = totales.cantidad;
            contador.classList.toggle('d-none', totales.cantidad === 0);
        }

        if (!contenedor) return;

        document.getElementById('carritoSubtotal').textContent = formatearPrecio(totales.subtotal);
        document.getElementById('carritoAhorro').textContent = `- ${formatearPrecio(totales.ahorro)}`;
        document.getElementById('carritoTotal').textContent = formatearPrecio(totales.total);
        document.getElementById('carritoResumen').classList.toggle('d-none', this.items.length === 0);

        if (this.items.length === 0) {
            contenedor.innerHTML = `
                <div class="text-center text-muted py-5">
                    <i class="bi bi-cart-x fs-1 d-block mb-2"></i>
                    Tu carrito está vacío.
                </div>`;
            return;
        }

        this.mostrarCupones(totales);

        contenedor.innerHTML = this.items.map(item => {
            const precioFinal = calcularPrecioFinal(item.precio, item.descuento);
            const precioHtml = item.descuento > 0
                ? `<span class="precio-antes small">${formatearPrecio(item.precio)}</span>
                   <span class="fw-bold text-danger">${formatearPrecio(precioFinal)}</span>
                   <span class="badge bg-warning text-dark ms-1">-${item.descuento}%</span>`
                : `<span class="fw-bold text-danger">${formatearPrecio(item.precio)}</span>`;

            return `
                <div class="d-flex gap-3 align-items-center border-bottom py-3">
                    <img src="${escaparHtml(item.imagen)}" alt="${escaparHtml(item.nombre)}"
                        class="carrito-img rounded" onerror="this.style.visibility='hidden'">
                    <div class="flex-grow-1">
                        <h6 class="fw-bold mb-1">${escaparHtml(item.nombre)}</h6>
                        <div class="small mb-2">${precioHtml}</div>
                        <div class="d-flex align-items-center justify-content-between">
                            <div class="btn-group btn-group-sm" role="group" aria-label="Cantidad">
                                <button type="button" class="btn btn-outline-danger" data-accion="restar" data-id="${item.id}" aria-label="Restar">
                                    <i class="bi bi-dash"></i>
                                </button>
                                <span class="btn btn-outline-secondary disabled text-dark px-3">${item.cantidad}</span>
                                <button type="button" class="btn btn-outline-danger" data-accion="sumar" data-id="${item.id}" aria-label="Sumar">
                                    <i class="bi bi-plus"></i>
                                </button>
                            </div>
                            <button type="button" class="btn btn-sm btn-link text-danger" data-accion="eliminar" data-id="${item.id}" title="Eliminar">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                        <div class="text-end small mt-1">
                            Subtotal: <strong>${formatearPrecio(this.subtotalItem(item))}</strong>
                        </div>
                    </div>
                </div>`;
        }).join('');
    }
};

// Aviso al agregar un producto
function avisarProductoAgregado(nombre) {
    if (typeof Swal === 'undefined') return;

    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `${nombre} agregado al carrito`,
        showConfirmButton: false,
        timer: 1800,
        timerProgressBar: true
    });
}

// Función usada por productos.js
function agregarAlCarrito(producto) {
    Carrito.agregar(producto);
    avisarProductoAgregado(producto.nombre || 'Producto');
}

// ==========================================
// INICIO Y EVENTOS DEL PANEL
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    crearPanelCarrito();
    Carrito.cargar();
    Carrito.mostrar();

    document.getElementById('carritoItems').addEventListener('click', evento => {
        const boton = evento.target.closest('[data-accion]');
        if (!boton) return;

        const id = boton.dataset.id;
        const accion = boton.dataset.accion;

        if (accion === 'sumar') Carrito.sumar(id);
        if (accion === 'restar') Carrito.restar(id);
        if (accion === 'eliminar') Carrito.eliminar(id);
    });

    document.getElementById('btnVaciarCarrito').addEventListener('click', async () => {
        if (typeof confirmarAccion === 'function') {
            const confirmado = await confirmarAccion('Se quitarán todos los productos del carrito.', 'Vaciar carrito');
            if (!confirmado) return;
        }
        Carrito.vaciar();
    });

    async function solicitarDatosCheckout(datosIniciales = {}) {
        const documentoPrevio = String(datosIniciales.documento || '');
        const resultado = await Swal.fire({
            title: 'Datos para tu comprobante',
            html: `
                <form id="formCheckout" class="text-start" novalidate>
                    <label class="form-label" for="checkoutNombre">Nombre o razón social *</label>
                    <input id="checkoutNombre" class="form-control" maxlength="120" autocomplete="name" aria-describedby="checkoutNombreError" required>
                    <small id="checkoutNombreError" class="text-danger d-block mb-3" aria-live="polite"></small>

                    <fieldset class="mb-2">
                        <legend class="form-label mb-1">Tipo de documento *</legend>
                        <div class="d-flex gap-3">
                            <label class="form-check"><input class="form-check-input" type="radio" name="tipoDocumento" id="tipoDocumentoDni" value="DNI"> <span class="form-check-label">DNI</span></label>
                            <label class="form-check"><input class="form-check-input" type="radio" name="tipoDocumento" id="tipoDocumentoRuc" value="RUC"> <span class="form-check-label">RUC</span></label>
                        </div>
                    </fieldset>
                    <label class="form-label" for="checkoutDni">DNI *</label>
                    <input id="checkoutDni" class="form-control" maxlength="20" inputmode="numeric" autocomplete="off" aria-describedby="checkoutDocumentoError" required>
                    <label class="form-label mt-2" for="checkoutRuc">RUC *</label>
                    <input id="checkoutRuc" class="form-control" maxlength="20" inputmode="numeric" autocomplete="off" aria-describedby="checkoutDocumentoError" required>
                    <small id="checkoutDocumentoError" class="text-danger d-block mb-3" aria-live="polite"></small>

                    <label class="form-label" for="checkoutCorreo">Correo electrónico *</label>
                    <input id="checkoutCorreo" type="email" class="form-control" maxlength="160" autocomplete="email" aria-describedby="checkoutCorreoError" required>
                    <small id="checkoutCorreoError" class="text-danger d-block mb-3" aria-live="polite"></small>

                    <label class="form-label" for="checkoutTelefono">Teléfono *</label>
                    <input id="checkoutTelefono" type="tel" class="form-control" maxlength="20" inputmode="numeric" autocomplete="tel" aria-describedby="checkoutTelefonoError" required>
                    <small id="checkoutTelefonoError" class="text-danger d-block mb-3" aria-live="polite"></small>

                    <label class="form-label" for="checkoutDireccion">Dirección</label>
                    <input id="checkoutDireccion" class="form-control" maxlength="180" autocomplete="street-address">
                    <p class="small text-muted mt-3 mb-0">Revisarás estos datos antes de registrar el pedido.</p>
                </form>`,
            confirmButtonText: 'Revisar datos',
            confirmButtonColor: '#dc3545',
            showCancelButton: true,
            cancelButtonText: 'Volver al carrito',
            focusConfirm: false,
            didOpen: () => {
                const nombre = document.getElementById('checkoutNombre');
                const dni = document.getElementById('checkoutDni');
                const ruc = document.getElementById('checkoutRuc');
                const correo = document.getElementById('checkoutCorreo');
                const telefono = document.getElementById('checkoutTelefono');
                const tipoDni = document.getElementById('tipoDocumentoDni');
                const tipoRuc = document.getElementById('tipoDocumentoRuc');
                nombre.value = datosIniciales.razon_social || '';
                correo.value = datosIniciales.email || '';
                telefono.value = datosIniciales.telefono || '';
                document.getElementById('checkoutDireccion').value = datosIniciales.direccion || '';
                const tipoInicial = datosIniciales.tipo_documento || (documentoPrevio.length === 11 ? 'RUC' : 'DNI');
                tipoDni.checked = tipoInicial !== 'RUC';
                tipoRuc.checked = tipoInicial === 'RUC';
                if (tipoInicial === 'RUC') ruc.value = documentoPrevio;
                else dni.value = documentoPrevio;

                const tipoDocumento = () => tipoRuc.checked ? 'RUC' : 'DNI';
                const campoDocumentoActivo = () => tipoDocumento() === 'RUC' ? ruc : dni;
                let documentoTocado = Boolean(documentoPrevio);
                const actualizarCamposDocumento = () => {
                    dni.disabled = tipoRuc.checked;
                    ruc.disabled = tipoDni.checked;
                    dni.classList.toggle('bg-light', dni.disabled);
                    ruc.classList.toggle('bg-light', ruc.disabled);
                    validarDocumento(documentoTocado);
                };
                const mensajeDocumento = campo => {
                    if (!campo.value) return 'Ingresa el número del documento.';
                    const longitud = tipoDocumento() === 'RUC' ? 11 : 8;
                    return campo.value.length === longitud ? '' : `El ${tipoDocumento()} debe tener ${longitud} dígitos.`;
                };
                const mostrarError = (elemento, mensaje) => {
                    elemento.textContent = mensaje;
                    elemento.classList.toggle('mb-3', Boolean(mensaje));
                };
                const validarNombre = mostrar => {
                    const valor = nombre.value.trim();
                    const mensaje = !valor ? 'Ingresa el nombre o razón social.' : valor.length < 3 ? 'Escribe al menos 3 caracteres.' : '';
                    if (mostrar) mostrarError(document.getElementById('checkoutNombreError'), mensaje);
                    return !mensaje;
                };
                const validarDocumento = mostrar => {
                    const campo = campoDocumentoActivo();
                    const mensaje = mensajeDocumento(campo);
                    if (mostrar) mostrarError(document.getElementById('checkoutDocumentoError'), mensaje);
                    return !mensaje;
                };
                const validarCorreo = mostrar => {
                    const mensaje = !correo.value.trim() ? 'Ingresa tu correo electrónico.' : !correo.checkValidity() ? 'Ingresa un correo electrónico válido.' : '';
                    if (mostrar) mostrarError(document.getElementById('checkoutCorreoError'), mensaje);
                    return !mensaje;
                };
                const validarTelefono = mostrar => {
                    const mensaje = !telefono.value ? 'Ingresa tu teléfono.' : telefono.value.length === 9 ? '' : 'El teléfono debe tener 9 dígitos.';
                    if (mostrar) mostrarError(document.getElementById('checkoutTelefonoError'), mensaje);
                    return !mensaje;
                };
                const limitarADigitos = (campo, validador) => {
                    campo.addEventListener('input', () => {
                        campo.value = campo.value.replace(/\D/g, '');
                        validador(true);
                    });
                    campo.addEventListener('blur', () => validador(true));
                };
                [nombre, correo].forEach((campo, indice) => {
                    const validar = indice === 0 ? validarNombre : validarCorreo;
                    campo.addEventListener('input', () => validar(true));
                    campo.addEventListener('blur', () => validar(true));
                });
                limitarADigitos(dni, () => { documentoTocado = true; validarDocumento(true); });
                limitarADigitos(ruc, () => { documentoTocado = true; validarDocumento(true); });
                limitarADigitos(telefono, validarTelefono);
                tipoDni.addEventListener('change', actualizarCamposDocumento);
                tipoRuc.addEventListener('change', actualizarCamposDocumento);
                actualizarCamposDocumento();
                validarNombre(Boolean(nombre.value));
                validarCorreo(Boolean(correo.value));
                validarTelefono(Boolean(telefono.value));
                nombre.focus();

                window.checkoutValidarFormulario = () => ({
                    nombre: validarNombre(true), documento: validarDocumento(true),
                    correo: validarCorreo(true), telefono: validarTelefono(true)
                });
            },
            willClose: () => { delete window.checkoutValidarFormulario; },
            preConfirm: () => {
                const valido = window.checkoutValidarFormulario?.();
                if (!valido || Object.values(valido).some(correcto => !correcto)) return false;
                const tipo_documento = document.getElementById('tipoDocumentoRuc').checked ? 'RUC' : 'DNI';
                const documento = document.getElementById(tipo_documento === 'RUC' ? 'checkoutRuc' : 'checkoutDni').value;
                return {
                    razon_social: document.getElementById('checkoutNombre').value.trim(),
                    tipo_documento,
                    documento,
                    email: document.getElementById('checkoutCorreo').value.trim(),
                    telefono: document.getElementById('checkoutTelefono').value,
                    direccion: document.getElementById('checkoutDireccion').value.trim()
                };
            }
        });
        return resultado.isConfirmed ? resultado.value : null;
    }

    document.getElementById('btnFinalizarCompra').addEventListener('click', async evento => {
        if (!Carrito.items.length) return;
        const boton = evento.currentTarget;
        const panelCarrito = document.getElementById('offcanvasCarrito');
        const offcanvas = bootstrap.Offcanvas.getInstance(panelCarrito);
        if (panelCarrito.classList.contains('show') && offcanvas) {
            await new Promise(resolve => {
                panelCarrito.addEventListener('hidden.bs.offcanvas', resolve, { once: true });
                offcanvas.hide();
            });
        }

        let cliente = await solicitarDatosCheckout();
        while (cliente) {
            const revision = await Swal.fire({
                title: 'Revisa tus datos',
                html: `<div class="text-start">
                    <p><strong>Nombre:</strong> ${escaparHtml(cliente.razon_social)}</p>
                    <p><strong>${escaparHtml(cliente.tipo_documento || (String(cliente.documento).length === 11 ? 'RUC' : 'DNI'))}:</strong> ${escaparHtml(cliente.documento)}</p>
                    <p><strong>Correo:</strong> ${escaparHtml(cliente.email)}</p>
                    <p><strong>Teléfono:</strong> ${escaparHtml(cliente.telefono)}</p>
                    <p><strong>Dirección:</strong> ${escaparHtml(cliente.direccion || 'No indicada')}</p>
                </div>`,
                confirmButtonText: 'Confirmar datos',
                confirmButtonColor: '#dc3545',
                showDenyButton: true,
                denyButtonText: 'Editar datos',
                showCancelButton: true,
                cancelButtonText: 'Volver al carrito'
            });
            if (revision.isConfirmed) break;
            if (revision.isDenied) {
                cliente = await solicitarDatosCheckout(cliente);
                continue;
            }
            cliente = null;
        }

        if (!cliente) {
            bootstrap.Offcanvas.getOrCreateInstance(panelCarrito).show();
            return;
        }

        boton.disabled = true;
        try {
            const respuesta = await fetch('/api/pedidos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cliente,
                    items: Carrito.items.map(item => ({ id_producto: item.id, cantidad: item.cantidad }))
                })
            });
            const resultado = await respuesta.json();
            if (!respuesta.ok || !resultado.exito) {
                throw new Error(resultado.mensaje || 'No se pudo registrar el pedido.');
            }

            Carrito.vaciar();
            bootstrap.Offcanvas.getInstance(panelCarrito)?.hide();
            if (typeof Boleta !== 'undefined') Boleta.mostrar(resultado.boleta);
        } catch (error) {
            await Swal.fire({ icon: 'error', title: 'No se pudo finalizar la compra', text: error.message });
            bootstrap.Offcanvas.getOrCreateInstance(panelCarrito).show();
        } finally {
            boton.disabled = false;
        }
    });
});
