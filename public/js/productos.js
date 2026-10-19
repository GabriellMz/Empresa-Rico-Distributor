
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

            const nombre = escaparHTML(producto.nombre || 'Producto sin nombre');
            const marca = escaparHTML(producto.marca || 'Marca no especificada');
            const descripcion = escaparHTML(
                producto.descripcion || 'Consulta más información sobre este producto.'
            );

            const precio = formatearPrecio(producto.precio);

            
            const rutaImagen = String(producto.imagen || '').trim();
            const imagenSegura = /^https?:\/\//i.test(rutaImagen) ||
                /^\.?\/?assets\/img\//i.test(rutaImagen);

            const imagen = imagenSegura
                ? escaparHTML(rutaImagen)
                : '';

            columna.innerHTML = `
                <article class="catalog-product">
                    <div class="catalog-product-image">
                        <img
                            src="${imagen || 'assets/img/Productos/Embutidos.png'}"
                            alt="${nombre}"
                            loading="lazy"
                        >
                    </div>

                    <div class="catalog-product-body">
                        <div class="catalog-product-info">
                            <span class="catalog-brand">${marca}</span>
                            <h2 class="catalog-product-title">${nombre}</h2>
                            <p class="catalog-product-description">${descripcion}</p>
                        </div>

                        <div class="catalog-product-price">
                            ${escaparHTML(precio)}
                        </div>

                        <button
                            type="button"
                            class="btn btn-danger w-100"
                            data-producto="${escaparHTML(producto.id_producto ?? '')}"
                        >
                            <i class="bi bi-eye me-1"></i>
                            Ver producto
                        </button>
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
                producto.descripcion,
                producto.marca
            ].join(' ').toLocaleLowerCase('es');

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
                throw new Error('La API no devolvió una lista de productos.');
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
                    <p>Verifica que el servidor Node.js esté activo e inténtalo nuevamente.</p>
                    <button type="button" class="btn btn-danger mt-3" id="reintentarProductos">
                        Reintentar
                    </button>
                </div>
            `;

            document.getElementById('reintentarProductos')
                .addEventListener('click', cargarProductos);
        }
    }

    buscador.addEventListener('input', filtrarProductos);

    limpiar.addEventListener('click', () => {
        buscador.value = '';
        filtrarProductos();
        buscador.focus();
    });

    
    listaProductos.addEventListener('click', evento => {
        const boton = evento.target.closest('[data-producto]');

        if (!boton) return;

        const id = boton.dataset.producto;

        const producto = productos.find(
            item => String(item.id_producto ?? '') === id
        );

        if (producto) {
            alert(
                `${producto.nombre}\n` +
                `Marca: ${producto.marca || 'No especificada'}\n` +
                `Precio: ${formatearPrecio(producto.precio)}\n\n` +
                `${producto.descripcion || ''}`
            );
        }
    });

    cargarProductos();
});
