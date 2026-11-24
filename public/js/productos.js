document.addEventListener('DOMContentLoaded', () => {
    const listaProductos = document.getElementById('listaProductos');
    const listaOfertas = document.getElementById('listaOfertas');
    const seccionOfertas = document.getElementById('ofertas');
    const mensaje = document.getElementById('mensaje');
    const formBuscar = document.getElementById('formBuscar');
    const inputBuscar = document.getElementById('buscarProducto');
    const listaCategorias = document.getElementById('listaCategorias');
    const btnAgregarDetalle = document.getElementById('btnAgregarDetalle');

    const NOMBRES_CATEGORIAS = {
        1: 'Pollo',
        2: 'Cerdo',
        3: 'Embutidos',
        4: 'Huevos',
        5: 'Preparados',
        6: 'Aceites'
    };

    let todosLosProductos = [];
    let categoriaActual = 'todos';
    let productoSeleccionado = null;

    function getDescuento(producto) {
        if (typeof obtenerDescuento === 'function') {
            const descCarrito = obtenerDescuento(producto.id_producto);
            if (descCarrito >= 5) return descCarrito;
        }
        const descBD = Number(producto.descuento) || 0;
        return descBD >= 5 ? descBD : 0;
    }

    function getPrecioFinal(precio, descuento) {
        if (typeof calcularPrecioFinal === 'function') {
            return calcularPrecioFinal(precio, descuento);
        }
        return Math.round(Number(precio) * (1 - descuento / 100) * 100) / 100;
    }

    function crearTarjetaHTML(producto, colClass = 'col-12 col-sm-6 col-md-4') {
        const precioBase = Number(producto.precio) || 0;
        const descuento = getDescuento(producto);
        const precioFinal = getPrecioFinal(precioBase, descuento);

        const badgeDescuento = descuento > 0
            ? `<span class="badge bg-warning text-dark position-absolute top-0 end-0 m-2 fs-6 shadow-sm">-${descuento}%</span>`
            : '';

        const bloquePrecio = descuento > 0
            ? `<div class="mb-2">
                   <span class="text-muted text-decoration-line-through small me-2">S/ ${precioBase.toFixed(2)}</span>
                   <span class="fs-5 fw-bold text-danger">S/ ${precioFinal.toFixed(2)}</span>
               </div>`
            : `<p class="fs-5 fw-bold text-danger mb-2">S/ ${precioBase.toFixed(2)}</p>`;

        return `
            <div class="${colClass}">
                <div class="card h-100 shadow-sm border-0 product-card text-center position-relative">
                    ${badgeDescuento}
                    <img src="${producto.imagen || './assets/img/Productos/Pollo.png'}"
                        class="card-img-top product-img"
                        alt="${producto.nombre}">
                    <div class="card-body d-flex flex-column justify-content-between p-3">
                        <div>
                            <h5 class="card-title fw-bold mb-1">${producto.nombre}</h5>
                            <p class="text-muted small mb-2">${producto.marca || 'RICO Alimentos'}</p>
                            ${bloquePrecio}
                        </div>
                        <div class="d-flex flex-column gap-2 mt-2">
                            <button type="button"
                                class="btn btn-danger btn-sm fw-bold btn-agregar-carrito"
                                data-id="${producto.id_producto}">
                                <i class="bi bi-cart-plus me-1"></i>Agregar al carrito
                            </button>
                            <button type="button"
                                class="btn btn-outline-danger btn-sm btn-ver-detalle"
                                data-id="${producto.id_producto}">
                                Ver Detalles
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function renderizarOfertas(productos) {
        if (!listaOfertas) return;

        const enOferta = productos.filter(p => getDescuento(p) >= 5);

        if (enOferta.length === 0) {
            if (seccionOfertas) seccionOfertas.classList.add('d-none');
            return;
        }

        if (seccionOfertas) seccionOfertas.classList.remove('d-none');
        listaOfertas.innerHTML = enOferta
            .map(p => crearTarjetaHTML(p, 'col-12 col-sm-6 col-lg-4'))
            .join('');
    }

    function renderizarProductos(productos) {
        if (!listaProductos) return;

        if (productos.length === 0) {
            listaProductos.innerHTML = `
                <div class="col-12 text-center py-5 text-muted">
                    <i class="bi bi-search fs-1 d-block mb-2"></i>
                    No se encontraron productos con ese criterio.
                </div>`;
            if (mensaje) mensaje.textContent = 'Mostrando 0 productos.';
            return;
        }

        listaProductos.innerHTML = productos
            .map(p => crearTarjetaHTML(p, 'col-12 col-sm-6 col-md-4'))
            .join('');

        if (mensaje) {
            mensaje.textContent = `Mostrando ${productos.length} producto${productos.length === 1 ? '' : 's'}.`;
        }
    }

    function abrirDetalleProducto(producto) {
        productoSeleccionado = producto;

        const precioBase = Number(producto.precio) || 0;
        const descuento = getDescuento(producto);
        const precioFinal = getPrecioFinal(precioBase, descuento);

        document.getElementById('detalleTitulo').textContent = producto.nombre;
        document.getElementById('detalleImagen').src = producto.imagen || '';
        document.getElementById('detalleImagen').alt = producto.nombre;
        document.getElementById('detalleDescripcion').textContent = producto.descripcion || 'Sin descripción.';
        document.getElementById('detalleMarca').innerHTML = `<strong>Marca:</strong> ${producto.marca || 'RICO'}`;

        document.getElementById('detallePrecio').innerHTML = descuento > 0
            ? `<span class="text-muted text-decoration-line-through fs-6 me-2">S/ ${precioBase.toFixed(2)}</span>
               <span>S/ ${precioFinal.toFixed(2)}</span>
               <span class="badge bg-warning text-dark ms-2">-${descuento}%</span>`
            : `S/ ${precioBase.toFixed(2)}`;

        document.getElementById('detalleDuracion').innerHTML = producto.vencimiento_duracion
            ? `<strong>Conservación:</strong> ${producto.vencimiento_duracion}`
            : '';

        const nombreCat = NOMBRES_CATEGORIAS[producto.id_categoria] || 'General';
        document.getElementById('detalleCategoria').textContent = `Categoría: ${nombreCat}`;

        const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalDetalleProducto'));
        modal.show();
    }

    async function cargarProductos(buscar = '', categoria = 'todos') {
        try {
            const params = new URLSearchParams();
            if (buscar) params.append('buscar', buscar);
            if (categoria && categoria !== 'todos') params.append('categoria', categoria);

            const url = params.toString() ? `/api/productos?${params.toString()}` : '/api/productos';
            const res = await fetch(url);
            if (!res.ok) throw new Error('Error al consultar productos');

            const data = await res.json();

            if (!buscar && categoria === 'todos') {
                todosLosProductos = data;
                renderizarOfertas(todosLosProductos);
            }

            renderizarProductos(data);
        } catch (error) {
            console.error(error);
            if (mensaje) mensaje.textContent = 'No se pudieron cargar los productos.';
        }
    }

    function manejarClickContenedor(e) {
        const btnAgregar = e.target.closest('.btn-agregar-carrito');
        if (btnAgregar) {
            const id = Number(btnAgregar.dataset.id);
            const producto = todosLosProductos.find(p => Number(p.id_producto) === id);
            if (producto && typeof agregarAlCarrito === 'function') {
                agregarAlCarrito(producto);
            }
            return;
        }

        const btnDetalle = e.target.closest('.btn-ver-detalle');
        if (btnDetalle) {
            const id = Number(btnDetalle.dataset.id);
            const producto = todosLosProductos.find(p => Number(p.id_producto) === id);
            if (producto) abrirDetalleProducto(producto);
        }
    }

    if (listaProductos) listaProductos.addEventListener('click', manejarClickContenedor);
    if (listaOfertas) listaOfertas.addEventListener('click', manejarClickContenedor);

    if (btnAgregarDetalle) {
        btnAgregarDetalle.addEventListener('click', () => {
            if (productoSeleccionado && typeof agregarAlCarrito === 'function') {
                agregarAlCarrito(productoSeleccionado);
            }
        });
    }

    if (formBuscar) {
        formBuscar.addEventListener('submit', (e) => {
            e.preventDefault();
            cargarProductos(inputBuscar.value.trim(), categoriaActual);
        });
    }

    if (inputBuscar) {
        inputBuscar.addEventListener('input', () => {
            cargarProductos(inputBuscar.value.trim(), categoriaActual);
        });
    }

    if (listaCategorias) {
        listaCategorias.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-categoria]');
            if (!btn) return;

            listaCategorias.querySelectorAll('.list-group-item').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            categoriaActual = btn.dataset.categoria;
            cargarProductos(inputBuscar ? inputBuscar.value.trim() : '', categoriaActual);
        });
    }

    cargarProductos();
});