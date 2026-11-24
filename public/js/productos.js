
const listaProductos = document.getElementById('listaProductos');
const formularioBuscar = document.getElementById('formBuscar');
const inputBuscar = document.getElementById('buscarProducto');
const mensaje = document.getElementById('mensaje');
const listaCategorias = document.getElementById('listaCategorias');

let categoriaSeleccionada = 'todos';
let solicitudActual = 0;

// Nombres de las categorías de la base de datos
const nombresCategorias = {
    1: 'Pollo',
    2: 'Cerdo',
    3: 'Embutidos',
    4: 'Huevos',
    5: 'Preparados',
    6: 'Aceites'
};

// BUSCAR PRODUCTOS EN EL BACKEND
async function filtrarProductos() {
    const numeroSolicitud = ++solicitudActual;

    try {
        const parametros = new URLSearchParams();
        const texto = inputBuscar.value.trim();

        // Agregar el texto de búsqueda
        if (texto) {
            parametros.set('buscar', texto);
        }

        // Agregar la categoría seleccionada
        if (categoriaSeleccionada !== 'todos') {
            parametros.set('categoria', categoriaSeleccionada);
        }

        mensaje.textContent = 'Buscando productos...';

        // Consultar la API inmediatamente
        const respuesta = await fetch(
            `/api/productos?${parametros.toString()}`
        );

        if (!respuesta.ok) {
            throw new Error('Error al consultar la API');
        }

        const productos = await respuesta.json();

        // Evitar mostrar resultados de búsquedas anteriores
        if (numeroSolicitud !== solicitudActual) {
            return;
        }

        if (!Array.isArray(productos)) {
            throw new Error('La respuesta de la API no es válida');
        }

        mostrarProductos(productos);

    } catch (error) {
        if (numeroSolicitud !== solicitudActual) {
            return;
        }

        console.error('Error al buscar productos:', error);
        listaProductos.innerHTML = '';
        mensaje.textContent = 'Error al buscar los productos.';
    }
}

// MOSTRAR TARJETAS DE PRODUCTOS
function mostrarProductos(productos) {
    listaProductos.innerHTML = '';

    if (productos.length === 0) {
        mensaje.textContent = 'No se encontraron productos.';
        return;
    }

    mensaje.textContent = `Se encontraron ${productos.length} productos.`;

    productos.forEach(producto => {
        listaProductos.appendChild(crearTarjetaProducto(producto));
    });
}

// PRECIO CON DESCUENTO (antes / ahora)
function crearPrecioHtml(producto, claseAhora) {
    const contenedor = document.createElement('p');
    contenedor.className = 'mb-3';

    if (producto.precio == null) {
        contenedor.className = 'fs-5 fw-bold text-danger mb-3';
        contenedor.textContent = 'Precio no disponible';
        return contenedor;
    }

    const descuento = obtenerDescuento(producto.id_producto);
    const ahora = document.createElement('span');
    ahora.className = claseAhora;

    if (descuento > 0) {
        const antes = document.createElement('span');
        antes.className = 'precio-antes me-2';
        antes.textContent = formatearPrecio(producto.precio);

        ahora.textContent = formatearPrecio(
            calcularPrecioFinal(producto.precio, descuento)
        );

        contenedor.append(antes, ahora);
    } else {
        ahora.textContent = formatearPrecio(producto.precio);
        contenedor.appendChild(ahora);
    }

    return contenedor;
}

// CREAR TARJETA DE PRODUCTO
function crearTarjetaProducto(producto) {
        const columna = document.createElement('div');
        columna.className = 'col-12 col-sm-6 col-xl-4';

        const tarjeta = document.createElement('div');
        tarjeta.className =
            'card h-100 shadow-sm border-0 product-card text-center';

        // Imagen
        const imagen = document.createElement('img');
        imagen.src = producto.imagen || '';
        imagen.alt = producto.nombre || 'Producto';
        imagen.className = 'card-img-top product-img';

        imagen.onerror = function () {
            this.style.display = 'none';
        };

        // Cuerpo de la tarjeta
        const cuerpo = document.createElement('div');
        cuerpo.className = 'card-body d-flex flex-column';

        // Nombre
        const titulo = document.createElement('h5');
        titulo.className = 'card-title fw-bold';
        titulo.textContent = producto.nombre || 'Producto sin nombre';

        // Descripción
        const descripcion = document.createElement('p');
        descripcion.className = 'card-text text-muted small';
        descripcion.textContent =
            producto.descripcion || 'Sin descripción disponible.';

        // Precio (con descuento si tiene oferta)
        const precio = crearPrecioHtml(producto, 'fs-5 fw-bold text-danger');

        // Etiqueta de descuento
        const descuento = obtenerDescuento(producto.id_producto);
        if (descuento > 0) {
            const etiqueta = document.createElement('span');
            etiqueta.className = 'badge bg-warning text-dark badge-descuento';
            etiqueta.textContent = `-${descuento}%`;
            tarjeta.classList.add('position-relative');
            tarjeta.appendChild(etiqueta);
        }

        // Botones
        const botones = document.createElement('div');
        botones.className = 'd-grid gap-2 mt-auto';

        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'btn btn-outline-danger';
        boton.textContent = 'Ver detalles';

        boton.addEventListener('click', () => {
            mostrarDetalleProducto(producto);
        });

        const botonCarrito = document.createElement('button');
        botonCarrito.type = 'button';
        botonCarrito.className = 'btn btn-danger';
        botonCarrito.innerHTML = '<i class="bi bi-cart-plus me-1"></i>Agregar al carrito';
        botonCarrito.disabled = producto.precio == null;

        botonCarrito.addEventListener('click', () => {
            agregarAlCarrito(producto);
        });

        botones.append(boton, botonCarrito);
        cuerpo.append(titulo, descripcion, precio, botones);
        tarjeta.append(imagen, cuerpo);
        columna.appendChild(tarjeta);
        return columna;
}

// MOSTRAR SECCIÓN DE OFERTAS
async function cargarOfertas() {
    const listaOfertas = document.getElementById('listaOfertas');
    if (!listaOfertas) return;

    try {
        const respuesta = await fetch('/api/productos');
        if (!respuesta.ok) throw new Error('Error al consultar la API');

        const productos = await respuesta.json();
        const ofertas = Array.isArray(productos)
            ? productos.filter(p => obtenerDescuento(p.id_producto) > 0 && p.precio != null)
            : [];

        listaOfertas.innerHTML = '';

        if (ofertas.length === 0) {
            listaOfertas.innerHTML =
                '<p class="text-muted text-center">No hay ofertas disponibles por ahora.</p>';
            return;
        }

        ofertas.forEach(producto => {
            listaOfertas.appendChild(crearTarjetaProducto(producto));
        });

    } catch (error) {
        console.error('Error al cargar ofertas:', error);
        listaOfertas.innerHTML =
            '<p class="text-muted text-center">No se pudieron cargar las ofertas.</p>';
    }
}

// SELECCIONAR CATEGORÍA
listaCategorias.addEventListener('click', evento => {
    const boton = evento.target.closest('[data-categoria]');

    if (!boton) return;

    categoriaSeleccionada = boton.dataset.categoria;

    // Actualizar el botón activo
    listaCategorias.querySelectorAll('[data-categoria]').forEach(item => {
        item.classList.remove('active');
    });

    boton.classList.add('active');

    // Buscar inmediatamente con la categoría elegida
    filtrarProductos();
});

// BUSCADOR: EVITAR QUE SE RECARGUE LA PÁGINA
formularioBuscar.addEventListener('submit', evento => {
    evento.preventDefault();
    filtrarProductos();
});

// BÚSQUEDA DINÁMICA AL ESCRIBIR CADA LETRA
inputBuscar.addEventListener('input', () => {
    filtrarProductos();
});

// MOSTRAR MODAL CON LOS DETALLES DEL PRODUCTO
function mostrarDetalleProducto(producto) {
    const modal = document.getElementById('modalDetalleProducto');

    document.getElementById('detalleTitulo').textContent =
        producto.nombre || 'Producto sin nombre';

    document.getElementById('detalleDescripcion').textContent =
        producto.descripcion || 'Sin descripción disponible.';

    document.getElementById('detalleMarca').textContent =
        `Marca: ${producto.marca || 'No especificada'}`;

    const detallePrecio = document.getElementById('detallePrecio');
    const precioDetalle = crearPrecioHtml(producto, 'fs-5 fw-bold text-danger');
    detallePrecio.replaceChildren(...precioDetalle.childNodes);

    const descuentoDetalle = obtenerDescuento(producto.id_producto);
    if (descuentoDetalle > 0) {
        const etiqueta = document.createElement('span');
        etiqueta.className = 'badge bg-warning text-dark ms-2 fs-6';
        etiqueta.textContent = `-${descuentoDetalle}%`;
        detallePrecio.appendChild(etiqueta);
    }

    const btnAgregarDetalle = document.getElementById('btnAgregarDetalle');
    btnAgregarDetalle.disabled = producto.precio == null;
    btnAgregarDetalle.onclick = () => agregarAlCarrito(producto);

    document.getElementById('detalleDuracion').textContent =
        `Duración: ${producto.vencimiento_duracion || 'No especificada'}`;

    document.getElementById('detalleCategoria').textContent =
        `Categoría: ${
            nombresCategorias[producto.id_categoria] ||
            'Sin categoría asignada'
        }`;

    const imagenDetalle = document.getElementById('detalleImagen');

    imagenDetalle.src = producto.imagen || '';
    imagenDetalle.alt = producto.nombre || 'Imagen del producto';
    imagenDetalle.style.display = producto.imagen
        ? 'inline-block'
        : 'none';

    bootstrap.Modal.getOrCreateInstance(modal).show();
}

// INICIAR: MOSTRAR OFERTAS Y TODOS LOS PRODUCTOS
cargarOfertas();
filtrarProductos();
