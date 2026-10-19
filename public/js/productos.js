document.addEventListener('DOMContentLoaded', () => {
    const listaProductos = document.getElementById('listaProductos');
    const buscador = document.getElementById('buscadorProductos');
    const contador = document.getElementById('contadorProductos');
    const estado = document.getElementById('estadoProductos');
    const limpiar = document.getElementById('limpiarBusqueda');

    let productos = [];

    function escaparHTML(valor) {
        return String(valor ?? '').replace(/[&<>"']/g, caracter => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[caracter]);
    }


    function obtenerPrecio(precio) {
        if (precio === null || precio === undefined || precio === '') {
            return null;
        }

        const numero = Number(precio);
        return Number.isFinite(numero) && numero >= 0 ? numero : null;
    }

    function formatearPrecio(precio) {
        const numero = obtenerPrecio(precio);

        if (numero === null) {
            return 'Consultar';
        }

        return numero.toLocaleString('es-PE', {
            style: 'currency',
            currency: 'PEN'
        });
    }
    function mostrarNotificacionCarrito(nombreProducto) {
    let notificacion = document.getElementById('notificacionCarrito');

    
    if (!notificacion) {
        notificacion = document.createElement('div');
        notificacion.id = 'notificacionCarrito';
        notificacion.className = 'notificacion-carrito';
        notificacion.setAttribute('role', 'status');
        notificacion.setAttribute('aria-live', 'polite');

        document.body.appendChild(notificacion);
    }

    
    const icono = document.createElement('div');
    icono.className = 'notificacion-carrito-icono';
    icono.innerHTML = '<i class="bi bi-cart-check-fill"></i>';

    const contenido = document.createElement('div');
    contenido.className = 'notificacion-carrito-contenido';

    const titulo = document.createElement('strong');
    titulo.textContent = '¡Agregado al carrito!';

    const detalle = document.createElement('span');
    detalle.textContent = nombreProducto;

    const mensaje = document.createElement('small');
    mensaje.textContent = 'Se agregó correctamente a tu carrito.';

    contenido.append(titulo, detalle, mensaje);

    const cerrar = document.createElement('button');
    cerrar.type = 'button';
    cerrar.className = 'notificacion-carrito-cerrar';
    cerrar.setAttribute('aria-label', 'Cerrar notificación');
    cerrar.innerHTML = '<i class="bi bi-x-lg"></i>';

    cerrar.addEventListener('click', () => {
        ocultarNotificacion();
    });

    notificacion.replaceChildren(icono, contenido, cerrar);

    
    clearTimeout(notificacion._temporizador);

    notificacion.classList.remove('mostrar');

    requestAnimationFrame(() => {
        notificacion.classList.add('mostrar');
    });

    notificacion._temporizador = setTimeout(() => {
        ocultarNotificacion();
    }, 3500);

    function ocultarNotificacion() {
        clearTimeout(notificacion._temporizador);
        notificacion.classList.remove('mostrar');
    }
}

    function obtenerCarrito() {
        try {
            const datos = JSON.parse(
                localStorage.getItem('ricoCarrito') || '[]'
            );

            return Array.isArray(datos) ? datos : [];
        } catch (error) {
            console.error('Error al leer el carrito:', error);
            return [];
        }
    }

    function guardarCarrito(carrito) {
        try {
            localStorage.setItem('ricoCarrito', JSON.stringify(carrito));
            return true;
        } catch (error) {
            console.error('Error al guardar el carrito:', error);
            alert('No se pudo guardar el carrito en este navegador.');
            return false;
        }
    }

    function agregarAlCarrito(id) {
        const producto = productos.find(
            item => String(item.id_producto ?? '') === String(id)
        );

        if (!producto) {
            alert('No se encontró el producto seleccionado.');
            return;
        }

        const carrito = obtenerCarrito();

        const existente = carrito.find(
            item => String(item.id_producto) === String(id)
        );

        if (existente) {
            existente.cantidad = (Number(existente.cantidad) || 0) + 1;
        } else {
            carrito.push({
                id_producto: producto.id_producto,
                nombre: producto.nombre || 'Producto sin nombre',
                precio: obtenerPrecio(producto.precio),
                imagen: producto.imagen || '',
                cantidad: 1
            });
        }
        if (guardarCarrito(carrito)) {
            actualizarContadorCarrito();
            actualizarBotonCarritoModal(id);

            mostrarNotificacionCarrito(
             producto.nombre || 'Producto sin nombre'
            );
        }
    }

    function actualizarContadorCarrito() {
        const contadorCarrito = document.getElementById('contadorCarrito');

        if (!contadorCarrito) return;

        const carrito = obtenerCarrito();

        const cantidad = carrito.reduce((total, item) => {
            return total + Math.max(0, Number(item.cantidad) || 0);
        }, 0);

        contadorCarrito.textContent = cantidad;
        contadorCarrito.classList.toggle('d-none', cantidad === 0);
    }

    function actualizarBotonCarritoModal(id) {
        const contenido = document.getElementById(
            'detalleProductoContenido'
        );

        if (!contenido) return;

        const boton = contenido.querySelector(
            'button[data-accion="carrito"]'
        );

        if (!boton || boton.dataset.producto !== String(id)) return;

        boton.innerHTML = '<i class="bi bi-cart-plus me-1"></i> Agregar al carrito';
    }


    function obtenerRutaImagen(producto) {
        const ruta = String(producto.imagen || '').trim();

        const valida =
            /^https?:\/\//i.test(ruta) ||
            /^\.?\/?assets\/img\//i.test(ruta);

        return valida
            ? escaparHTML(ruta)
            : 'assets/img/Productos/Embutidos.png';
    }


    function verDetalleProducto(id) {
        const producto = productos.find(
            item => String(item.id_producto ?? '') === String(id)
        );

        if (!producto) return;

        const modal = document.getElementById('detalleProductoModal');
        const contenido = document.getElementById(
            'detalleProductoContenido'
        );

        if (!modal || !contenido) {
            console.error(
                'No se encontró #detalleProductoModal o ' +
                '#detalleProductoContenido en productos.html.'
            );

            alert('Falta agregar la ventana de detalle en productos.html.');
            return;
        }

        const nombre = escaparHTML(
            producto.nombre || 'Producto sin nombre'
        );

        const marca = escaparHTML(
            producto.marca || 'Marca no especificada'
        );

        const descripcion = escaparHTML(
            producto.descripcion ||
            'Consulta más información sobre este producto.'
        );

        const precio = escaparHTML(formatearPrecio(producto.precio));
        const imagen = obtenerRutaImagen(producto);

        contenido.innerHTML = `
            <div class="row g-4 align-items-center">
                <div class="col-md-5">
                    <img
                        src="${imagen}"
                        alt="${nombre}"
                        class="img-fluid rounded producto-modal-imagen"
                        id="imagenDetalleProducto"
                    >
                </div>

                <div class="col-md-7">
                    <span class="badge text-bg-danger mb-2">
                        ${marca}
                    </span>

                    <h3 class="h4">${nombre}</h3>

                    <p>${descripcion}</p>

                    <p class="fs-4 fw-bold text-danger">
                        ${precio}
                    </p>

                    <button
                        type="button"
                        class="btn btn-danger"
                        data-accion="carrito"
                        data-producto="${escaparHTML(id)}"
                    >
                        <i class="bi bi-cart-plus me-1"></i>
                        Agregar al carrito
                    </button>
                </div>
            </div>
        `;

        const imagenDetalle = document.getElementById(
            'imagenDetalleProducto'
        );

        imagenDetalle.addEventListener('error', () => {
            imagenDetalle.onerror = null;
            imagenDetalle.src = 'assets/img/Productos/Embutidos.png';
        });

        if (typeof bootstrap === 'undefined') {
            console.error('Bootstrap JavaScript no está cargado.');
            return;
        }

        bootstrap.Modal.getOrCreateInstance(modal).show();
    }


    function mostrarProductos(datos) {
        listaProductos.replaceChildren();

        contador.textContent =
            `${datos.length} producto${datos.length !== 1 ? 's' : ''}`;

        if (datos.length === 0) {
            estado.innerHTML = `
                <div class="catalog-empty">
                    <i class="bi bi-search"></i>
                    <h3>No encontramos productos</h3>
                    <p>Prueba con otro nombre, marca o descripción.</p>
                </div>
            `;
            return;
        }

        estado.textContent = '';

        const fragmento = document.createDocumentFragment();

        datos.forEach(producto => {
            const columna = document.createElement('div');

            columna.className = 'col-12 col-sm-6 col-lg-4 col-xl-3';

            const id = String(producto.id_producto ?? '');

            const nombre = escaparHTML(
                producto.nombre || 'Producto sin nombre'
            );

            const marca = escaparHTML(
                producto.marca || 'Marca no especificada'
            );

            const descripcion = escaparHTML(
                producto.descripcion ||
                'Consulta más información sobre este producto.'
            );

            const precio = formatearPrecio(producto.precio);
            const imagen = obtenerRutaImagen(producto);

            columna.innerHTML = `
                <article class="catalog-product">
                    <div class="catalog-product-image">
                        <img
                            src="${imagen}"
                            alt="${nombre}"
                            loading="lazy"
                        >
                    </div>

                    <div class="catalog-product-body">
                        <div class="catalog-product-info">
                            <span class="catalog-brand">${marca}</span>

                            <h2 class="catalog-product-title">
                                ${nombre}
                            </h2>

                            <p class="catalog-product-description">
                                ${descripcion}
                            </p>
                        </div>

                        <div class="catalog-product-price">
                            ${escaparHTML(precio)}
                        </div>

                        <div class="d-flex gap-2 mt-3">
                            <button
                                type="button"
                                class="btn btn-danger flex-grow-1"
                                data-accion="ver"
                                data-producto="${escaparHTML(id)}"
                            >
                                <i class="bi bi-eye me-1"></i>
                                Ver producto
                            </button>

                            <button
                                type="button"
                                class="btn btn-outline-danger boton-carrito"
                                data-accion="carrito"
                                data-producto="${escaparHTML(id)}"
                                aria-label="Agregar al carrito"
                                title="Agregar al carrito"
                            >
                                <i class="bi bi-cart-plus"></i>
                            </button>
                        </div>
                    </div>
                </article>
            `;

            const img = columna.querySelector('img');

            img.addEventListener('error', () => {
                img.onerror = null;
                img.src = 'assets/img/Productos/Embutidos.png';
            });

            fragmento.appendChild(columna);
        });

        listaProductos.appendChild(fragmento);
    }


    function filtrarProductos() {
        const termino = buscador.value
            .trim()
            .toLocaleLowerCase('es');

        const resultados = productos.filter(producto => {
            const texto = [
                producto.nombre,
                producto.marca,
                producto.descripcion
            ]
                .join(' ')
                .toLocaleLowerCase('es');

            return texto.includes(termino);
        });

        mostrarProductos(resultados);
    }


    async function cargarProductos() {
        estado.textContent = 'Cargando catálogo...';
        contador.textContent = 'Consultando Supabase...';

        try {
            const respuesta = await fetch('/api/productos');

            if (!respuesta.ok) {
                throw new Error(`Error HTTP ${respuesta.status}`);
            }

            const datos = await respuesta.json();

            if (!Array.isArray(datos)) {
                throw new Error(
                    'La API no devolvió una lista de productos.'
                );
            }

            productos = datos;
            filtrarProductos();

        } catch (error) {
            console.error('Error al cargar productos:', error);

            listaProductos.replaceChildren();
            contador.textContent = 'No se pudo cargar el catálogo.';

            estado.innerHTML = `
                <div class="catalog-empty">
                    <i class="bi bi-exclamation-triangle"></i>
                    <h3>No pudimos cargar los productos</h3>
                    <p>
                        Verifica que el servidor Node.js esté activo
                        e inténtalo nuevamente.
                    </p>
                    <button
                        type="button"
                        class="btn btn-danger mt-3"
                        id="reintentarProductos"
                    >
                        Reintentar
                    </button>
                </div>
            `;

            document.getElementById('reintentarProductos')
                .addEventListener('click', cargarProductos);
        }
    }

 
    document.addEventListener('click', evento => {
        const boton = evento.target.closest('button[data-accion]');

        if (!boton) return;

        const id = boton.dataset.producto;
        const accion = boton.dataset.accion;

        if (accion === 'ver') {
            verDetalleProducto(id);
        } else if (accion === 'carrito') {
            agregarAlCarrito(id);
        }
    });


    buscador.addEventListener('input', filtrarProductos);

    limpiar.addEventListener('click', () => {
        buscador.value = '';
        filtrarProductos();
        buscador.focus();
    });


    actualizarContadorCarrito();
    cargarProductos();
});