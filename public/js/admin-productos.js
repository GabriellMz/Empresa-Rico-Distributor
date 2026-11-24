
const urlApi = '/api/productos';
const tbody = document.getElementById('tablaProductosBody');
let listarPrductos = []; 

const formProducto = document.getElementById('formProducto');
const modalElement = document.getElementById('modalProducto');
const inputArchivoImagen = document.getElementById('inputArchivoImagen');

const getProductos = async () => {
    try {
        const resp = await fetch(urlApi);
        if (!resp.ok) {
            throw new Error(`Error en el servidor: ${resp.status}`);
        }

        return await resp.json();
    } catch (error) {
        console.error('Error al obtener productos: ',error);
        mostrarAlertaError('No se pudo conectar con el servidor para cargar los productos.');
        return [];
    }
}

const crearProducto = async (producto) => {
    try {
        const resp = await fetch(urlApi, {
            method: 'POST',
            body: JSON.stringify(producto),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!resp.ok) {
            throw new Error(`Error en el servidor: ${resp.status}`);
        }
        return await resp.json();
    } catch (error) {
        console.error('Error al crear producto:', error);
        mostrarAlertaError('No se pudo guardar el producto.');
        return null;
    }
};

const borrarProducto = async (id) => {
    try {
        const resp = await fetch(`${urlApi}/${id}`, {
            method: 'DELETE'
        });
        return resp.ok;
    } catch (error) {
        return false;
    }
};

const actualizarProducto = async (id, producto) => {
    try {
        const resp = await fetch(`${urlApi}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(producto),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!resp.ok) {
            throw new Error(`Error en el servidor: ${resp.status}`);
        }
        return await resp.json();
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        mostrarAlertaError('No se pudo actualizar el producto.');
        return null;
    }
};

const crearFilaProducto = (producto, correlativo) => {
    const tr = document.createElement('tr');
    tr.dataset.id = producto.id_producto;

    tr.innerHTML = `
        <td>${correlativo}</td>
        <td>
            <img src="${producto.imagen || './assets/img/Productos/Pollo.png'}" 
                 onerror="this.src='./assets/img/Productos/Pollo.png'"
                 alt="${producto.nombre}" 
                 class="admin-table-img">
        </td>
        <td class="fw-semibold">${producto.nombre}</td>
        <td>${producto.marca}</td>
        <td>S/ ${Number(producto.precio).toFixed(2)}</td>
        <td class="admin-desc-cell">${producto.descripcion || 'Sin descripción'}</td>
        <td class="text-center text-nowrap">
            <button type="button" 
                    class="btn btn-sm btn-outline-secondary btn-editar-producto" 
                    data-id="${producto.id_producto}" 
                    title="Editar">
                <i class="bi bi-pencil-square"></i>
            </button>
            <button type="button" 
                    class="btn btn-sm btn-outline-danger btn-eliminar-producto" 
                    data-id="${producto.id_producto}" 
                    data-nombre="${producto.nombre}" 
                    title="Eliminar">
                <i class="bi bi-trash3"></i>
            </button>
        </td>
    `;
    tbody.appendChild(tr);
};


const renderizarProductos = (productos) => {
    tbody.innerHTML = '';
    if (!productos || productos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-muted">
                    <i class="bi bi-inbox fs-4 d-block mb-1"></i>
                    No se encontraron productos.
                </td>
            </tr>`;
        return;
    }
    productos.forEach((producto, index) => {
        crearFilaProducto(producto, index + 1);
    });
};

const init = async () => {
    listarPrductos = await getProductos();
    renderizarProductos(listarPrductos);
};

document.addEventListener('DOMContentLoaded',init);


const subirImagen = async (archivo) => {
    try {
        const formData = new FormData();
        formData.append('imagen', archivo);

        const resp = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        if (!resp.ok) return null;
        const data = await resp.json();
        return data.ruta;
    } catch (error) {
        return null;
    }
};

const btnNuevoProducto = document.getElementById('btnNuevoProducto');
if (btnNuevoProducto) {
    btnNuevoProducto.addEventListener('click', () => {
        formProducto.reset();
        document.getElementById('inputIdProducto').value = '';
        document.getElementById('inputImagenProducto').value = '';
        const modalTitle = document.getElementById('modalProductoLabel');
        if (modalTitle) {
            modalTitle.innerHTML = '<i class="bi bi-box-seam me-2"></i>Nuevo Producto';
        }
    });
}

formProducto.addEventListener('submit', async(e)=>{
    e.preventDefault();

    let rutaImagen = document.getElementById('inputImagenProducto').value.trim() || './assets/img/Productos/Pollo.png';

    if (inputArchivoImagen && inputArchivoImagen.files.length > 0) {
        const rutaSubida = await subirImagen(inputArchivoImagen.files[0]);
        if (rutaSubida) {
            rutaImagen = rutaSubida;
        }
    }

    const idProducto = document.getElementById('inputIdProducto').value;

    const productoData = {
        nombre: document.getElementById('inputNombreProducto').value.trim(),
        marca: document.getElementById('inputMarcaProducto').value.trim(),
        precio: document.getElementById('inputPrecioProducto').value,
        vencimiento_duracion : document.getElementById('inputVencimientoProducto').value.trim(),
        imagen: rutaImagen,
        descripcion: document.getElementById('inputDescripcionProducto').value.trim(),
        id_admin: (typeof sesionAdmin !== 'undefined' && sesionAdmin?.id_admin) ? sesionAdmin.id_admin : 1,
        id_categoria: document.getElementById('selectCategoriaProducto') ? Number(document.getElementById('selectCategoriaProducto').value) : 1
    };

    let resultado = null;

    if (idProducto) {
        resultado = await actualizarProducto(idProducto, productoData);
        if (resultado) {
            mostrarAlertaExito('¡Producto Actualizado Correctamente!');
        }
    } else {
        resultado = await crearProducto(productoData);
        if (resultado) {
            mostrarAlertaExito('¡Producto Registrado Correctamente!');
        }
    }

    if (resultado) {
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) {
            modalInstance.hide();
        }

        formProducto.reset();
        document.getElementById('inputIdProducto').value = '';
        document.getElementById('inputImagenProducto').value = '';
        await init();
    }
});

tbody.addEventListener('click', async (e) => {
    const btnEditar = e.target.closest('.btn-editar-producto');
    if (btnEditar) {
        const id = btnEditar.dataset.id;
        const producto = listarPrductos.find(p => p.id_producto == id);
        if (producto) {
            document.getElementById('inputIdProducto').value = producto.id_producto;
            document.getElementById('inputNombreProducto').value = producto.nombre || '';
            document.getElementById('inputMarcaProducto').value = producto.marca || '';
            document.getElementById('inputPrecioProducto').value = producto.precio ? Number(producto.precio).toFixed(2) : '';
            document.getElementById('inputVencimientoProducto').value = producto.vencimiento_duracion || '';
            document.getElementById('inputImagenProducto').value = producto.imagen || '';
            document.getElementById('inputDescripcionProducto').value = producto.descripcion || '';
            if (document.getElementById('selectCategoriaProducto')) {
                document.getElementById('selectCategoriaProducto').value = producto.id_categoria || '1';
            }

            const modalTitle = document.getElementById('modalProductoLabel');
            if (modalTitle) {
                modalTitle.innerHTML = '<i class="bi bi-pencil-square me-2"></i>Editar Producto';
            }

            const modalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);
            modalInstance.show();
        }
        return;
    }

    const btnEliminar = e.target.closest('.btn-eliminar-producto');
    if (btnEliminar) {
        const id = btnEliminar.dataset.id;
        const nombre = btnEliminar.dataset.nombre || 'este producto';

        const confirmado = await confirmarAccion(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`);
        if (!confirmado) return;

        const eliminado = await borrarProducto(id);

        if (eliminado) {
            mostrarAlertaExito(`"${nombre}" se eliminó correctamente.`);
            await init();
        } else {
            mostrarAlertaError('No se pudo eliminar el producto.');
        }
    }
});

const inputBusquedaProductos = document.getElementById('inputBusquedaProductos');

if (inputBusquedaProductos) {
    inputBusquedaProductos.addEventListener('input', (e) => {
        const termino = e.target.value.toLowerCase().trim();
        const filtrados = listarPrductos.filter(producto => 
            producto.nombre.toLowerCase().includes(termino)
        );
        renderizarProductos(filtrados);
    });
}
