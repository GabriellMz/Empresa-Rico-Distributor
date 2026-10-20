
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

        // Precio
        const precio = document.createElement('p');
        precio.className = 'fs-5 fw-bold text-danger mb-3';

        precio.textContent = producto.precio != null
            ? `S/ ${Number(producto.precio).toFixed(2)}`
            : 'Precio no disponible';

        // Botón de detalles
        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'btn btn-outline-danger mt-auto';
        boton.textContent = 'Ver detalles';

        boton.addEventListener('click', () => {
            mostrarDetalleProducto(producto);
        });

        cuerpo.append(titulo, descripcion, precio, boton);
        tarjeta.append(imagen, cuerpo);
        columna.appendChild(tarjeta);
        listaProductos.appendChild(columna);
    });
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

    document.getElementById('detallePrecio').textContent =
        producto.precio != null
            ? `Precio: S/ ${Number(producto.precio).toFixed(2)}`
            : 'Precio no disponible';

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

// INICIAR: MOSTRAR TODOS LOS PRODUCTOS
filtrarProductos();
