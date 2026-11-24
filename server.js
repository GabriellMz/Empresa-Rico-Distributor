const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = 3000;

const supabaseUrl = 'https://lhhtcdayfqtybczaloso.supabase.co';
const supabaseKey = 'sb_publishable_yvAsHM24Bt2c7-dcaqyBLg_cS_GwtAC';
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ========================================================
// 1. AUTENTICACIÓN (LOGIN)
// ========================================================
app.post('/api/login', async (req, res) => {
    try {
        const { usuario, clave } = req.body;

        const { data, error } = await supabase
            .from('administrador')
            .select('*')
            .eq('usuario', usuario)
            .eq('clave', clave);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        if (data.length > 0) {
            return res.json({
                exito: true,
                mensaje: 'Login correcto',
                admin: data[0]
            });
        }

        res.status(401).json({
            exito: false,
            mensaje: 'Usuario o clave incorrectos'
        });

    } catch (error) {
        console.error('Error en el login:', error);
        res.status(500).json({
            error: 'Error interno al iniciar sesión.'
        });
    }
});

// ========================================================
// STANDBY / ACTIVAR PRODUCTO (CRUD ADMIN)
// ========================================================
app.patch('/api/productos/:id/estado', async (req, res) => {
    try {
        const idProducto = parseInt(req.params.id, 10);
        const { activo } = req.body;

        const { data, error } = await supabase
            .from('producto')
            .update({ activo: Boolean(activo) })
            .eq('id_producto', idProducto)
            .select()
            .single();

        if (error) return res.status(500).json({ exito: false, error: error.message });
        res.json({
            exito: true,
            mensaje: activo ? 'Producto activado en catálogo' : 'Producto puesto en Standby',
            data
        });
    } catch (error) {
        res.status(500).json({ exito: false, error: error.message });
    }
});

// ========================================================
// GESTIÓN DE PEDIDOS (PANEL ADMIN - pedidos.html)
// ========================================================
app.get('/api/pedidos', async (req, res) => {
    try {
        const [resPed, resCli, resDet, resProd] = await Promise.all([
            supabase.from('pedido').select('*').order('fecha_pedido', { ascending: false }),
            supabase.from('cliente').select('*'),
            supabase.from('detalle_pedido').select('*'),
            supabase.from('producto').select('id_producto, nombre, precio')
        ]);

        if (resPed.error) return res.status(500).json({ error: resPed.error.message });

        const mapaClientes = {};
        (resCli.data || []).forEach(c => { mapaClientes[c.id_cliente] = c; });

        const mapaProductos = {};
        (resProd.data || []).forEach(p => { mapaProductos[p.id_producto] = p; });

        const pedidosCompletos = (resPed.data || []).map(p => {
            const cliente = mapaClientes[p.id_cliente] || {};
            const items = (resDet.data || [])
                .filter(d => d.id_pedido === p.id_pedido)
                .map(d => ({
                    ...d,
                    nombre_producto: mapaProductos[d.id_producto]?.nombre || `Producto #${d.id_producto}`
                }));

            return {
                ...p,
                cliente_nombre: [cliente.nombre, cliente.razon_social].filter(Boolean).join(' · ') || `Cliente #${p.id_cliente}`,
                cliente_ruc: cliente.ruc || '-',
                cliente_telefono: cliente.telefono || '-',
                cliente_email: cliente.email || '-',
                cliente_direccion: cliente.direccion || '-',
                items
            };
        });

        res.json(pedidosCompletos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/pedidos/:id/estado', async (req, res) => {
    try {
        const idPedido = parseInt(req.params.id, 10);
        const { estado } = req.body;
        const estadosValidos = ['Pendiente', 'Realizado', 'Cancelado'];

        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({ exito: false, mensaje: 'Estado no válido.' });
        }

        const { data, error } = await supabase
            .from('pedido')
            .update({ estado })
            .eq('id_pedido', idPedido)
            .select()
            .single();

        if (error) return res.status(500).json({ exito: false, error: error.message });
        res.json({ exito: true, mensaje: `Pedido #${idPedido} actualizado a ${estado}`, data });
    } catch (err) {
        res.status(500).json({ exito: false, error: err.message });
    }
});

app.delete('/api/pedidos/:id', async (req, res) => {
    try {
        const idPedido = parseInt(req.params.id, 10);

        if (isNaN(idPedido)) {
            return res.status(400).json({ exito: false, mensaje: 'ID de pedido inválido.' });
        }

        // 1. Eliminar primero los productos asociados en detalle_pedido
        const { error: errDetalle } = await supabase
            .from('detalle_pedido')
            .delete()
            .eq('id_pedido', idPedido);

        if (errDetalle) return res.status(500).json({ exito: false, error: errDetalle.message });

        // 2. Eliminar la cabecera del pedido
        const { data, error: errPedido } = await supabase
            .from('pedido')
            .delete()
            .eq('id_pedido', idPedido)
            .select();

        if (errPedido) return res.status(500).json({ exito: false, error: errPedido.message });

        if (!data || data.length === 0) {
            return res.status(404).json({ exito: false, mensaje: 'No se encontró el pedido.' });
        }

        res.json({ exito: true, mensaje: `Pedido #${idPedido} eliminado correctamente.` });
    } catch (err) {
        res.status(500).json({ exito: false, error: err.message });
    }
});

// ========================================================
// 2. PRODUCTOS, BÚSQUEDA, OFERTAS Y UPLOAD DE IMÁGENES
// ========================================================
app.get('/api/productos', async (req, res) => {
    try {
        const buscar = (req.query.buscar || '').trim();
        const categoria = req.query.categoria;

        let consulta = supabase
            .from('producto')
            .select('*')
            .order('id_producto', { ascending: true });

        // Si la petición viene del sitio público (no de admin.html), oculta los productos en Standby
        const esAdmin = (req.headers.referer || '').includes('admin.html') || req.query.todos === 'true';
        if (!esAdmin) {
            consulta = consulta.neq('activo', false);
        }

        if (buscar) {
            const texto = buscar.replace(/[,%()]/g, ' ').trim();
            if (texto) {
                consulta = consulta.or(
                    `nombre.ilike.%${texto}%,descripcion.ilike.%${texto}%,marca.ilike.%${texto}%`
                );
            }
        }

        if (categoria && categoria !== 'todos') {
            const idCategoria = Number(categoria);

            if (!Number.isInteger(idCategoria) || idCategoria <= 0) {
                return res.status(400).json({
                    error: 'La categoría indicada no es válida.'
                });
            }

            consulta = consulta.eq('id_categoria', idCategoria);
        }

        const { data, error } = await consulta;

        if (error) {
            console.error('Error al consultar productos:', error.message);
            return res.status(500).json({
                error: 'No se pudieron consultar los productos.'
            });
        }

        res.json(data);

    } catch (error) {
        console.error('Error inesperado al consultar productos:', error);
        res.status(500).json({
            error: 'Ocurrió un error al consultar los productos.'
        });
    }
});

app.get('/api/ofertas', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('producto')
            .select('*')
            .gte('descuento', 5)
            .order('descuento', { ascending: false });

        if (error) return res.status(500).json({ error: error.message });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/productos', async (req, res) => {
    try {
        const {
            nombre,
            descripcion,
            marca,
            precio,
            imagen,
            vencimiento_duracion,
            id_admin,
            id_categoria,
            descuento
        } = req.body;

        const nuevoProducto = {
            nombre,
            descripcion,
            marca,
            precio,
            imagen,
            vencimiento_duracion,
            id_admin
        };

        if (id_categoria !== undefined) {
            nuevoProducto.id_categoria = id_categoria;
        }

        if (descuento !== undefined) {
            nuevoProducto.descuento = parseInt(descuento, 10) || 0;
        }

        const { data, error } = await supabase
            .from('producto')
            .insert([nuevoProducto])
            .select();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.status(201).json({
            exito: true,
            mensaje: 'Producto creado exitosamente',
            data
        });

    } catch (error) {
        console.error('Error al registrar producto:', error);
        res.status(500).json({
            error: 'Ocurrió un error al registrar el producto.'
        });
    }
});

app.put('/api/productos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nombre,
            descripcion,
            marca,
            precio,
            imagen,
            vencimiento_duracion,
            id_categoria,
            descuento
        } = req.body;

        const actualizacion = {
            nombre,
            descripcion,
            marca,
            precio,
            imagen,
            vencimiento_duracion
        };

        if (id_categoria !== undefined) {
            actualizacion.id_categoria = id_categoria;
        }

        if (descuento !== undefined) {
            actualizacion.descuento = parseInt(descuento, 10) || 0;
        }

        const { data, error } = await supabase
            .from('producto')
            .update(actualizacion)
            .eq('id_producto', id);

        if (error) return res.status(500).json({ error: error.message });
        res.json({ exito: true, mensaje: 'Producto actualizado exitosamente', data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/productos/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data: producto } = await supabase
            .from('producto')
            .select('imagen')
            .eq('id_producto', id)
            .single();

        const { error } = await supabase
            .from('producto')
            .delete()
            .eq('id_producto', id);

        if (error) return res.status(500).json({ error: error.message });

        if (producto && producto.imagen) {
            const imagenesBase = ['Pollo.png', 'Cerdo.png', 'Embutidos.png', 'Huevos.png', 'Aceite.png', 'Preparados.png', 'Licores.png'];
            const nombreArchivo = path.basename(producto.imagen);

            if (!imagenesBase.includes(nombreArchivo)) {
                const rutaFisica = path.join(__dirname, 'public', 'assets', 'img', 'Productos', nombreArchivo);
                if (fs.existsSync(rutaFisica)) {
                    fs.unlink(rutaFisica, () => {});
                }
            }
        }

        res.json({ exito: true, mensaje: 'Producto eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'public', 'assets', 'img', 'Productos'));
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage });

app.post('/api/upload', upload.single('imagen'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ exito: false, mensaje: 'No se subió ningún archivo' });
    }
    const ruta = `./assets/img/Productos/${req.file.filename}`;
    res.json({ exito: true, ruta });
});

// ========================================================
// 3. CAPACITACIONES DE DESARROLLADORES (SUPABASE)
// ========================================================
app.get('/api/capacitaciones/:id_desarrollador', async (req, res) => {
    const idDesarrollador = parseInt(req.params.id_desarrollador, 10);

    const { data, error } = await supabase
        .from('capacitacion')
        .select('*')
        .eq('id_desarrollador', idDesarrollador)
        .order('id_capacitacion', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.post('/api/capacitaciones', async (req, res) => {
    const { id_desarrollador, titulo, institucion, anio, id_admin } = req.body;

    if (!id_desarrollador || !titulo || !titulo.trim()) {
        return res.status(400).json({ exito: false, mensaje: 'Faltan datos obligatorios (desarrollador y título).' });
    }

    const { data, error } = await supabase
        .from('capacitacion')
        .insert([
            {
                id_desarrollador: parseInt(id_desarrollador, 10),
                titulo: titulo.trim(),
                institucion: institucion ? institucion.trim() : null,
                anio: anio ? anio.trim() : null,
                id_admin: id_admin ? parseInt(id_admin, 10) : 1
            }
        ])
        .select()
        .single();

    if (error) return res.status(500).json({ exito: false, error: error.message });
    res.json({ exito: true, mensaje: 'Capacitación agregada correctamente', data });
});

app.delete('/api/capacitaciones/:id', async (req, res) => {
    const idCapacitacion = parseInt(req.params.id, 10);

    if (isNaN(idCapacitacion)) {
        return res.status(400).json({ exito: false, mensaje: 'ID de capacitación inválido' });
    }

    const { data, error } = await supabase
        .from('capacitacion')
        .delete()
        .eq('id_capacitacion', idCapacitacion)
        .select();

    if (error) return res.status(500).json({ exito: false, error: error.message });

    if (!data || data.length === 0) {
        return res.status(404).json({ exito: false, mensaje: 'No se eliminó ningún registro.' });
    }

    res.json({ exito: true, mensaje: 'Capacitación eliminada', data });
});

// ========================================================
// 4. PEDIDOS / CARRITO Y BOLETA
// ========================================================
const DESCUENTOS_OFERTA_CHECKOUT = {
    1: 15,
    2: 10,
    11: 20,
    13: 12,
    15: 25,
    20: 18
};
const RICO_RUC = process.env.RICO_RUC || '20506421781';
const TASA_IGV = 0.18;
const redondearDinero = valor => Math.round((Number(valor) + Number.EPSILON) * 100);
const solesDesdeCentimos = centimos => centimos / 100;

app.post('/api/pedidos', async (req, res) => {
    const cliente = req.body?.cliente || {};
    const carrito = req.body?.items;
    const nombreCliente = String(cliente.razon_social || cliente.nombre || '').trim();
    const correo = String(cliente.email || '').trim();
    const documento = String(cliente.documento || cliente.ruc || '').trim();
    const tipoDocumento = String(cliente.tipo_documento || (documento.length === 11 ? 'RUC' : 'DNI')).toUpperCase();
    const telefono = String(cliente.telefono || '').replace(/\D/g, '');
    const direccion = String(cliente.direccion || '').trim();

    if (!nombreCliente || !Array.isArray(carrito) || carrito.length === 0 || carrito.length > 100) {
        return res.status(400).json({ exito: false, mensaje: 'Ingresa tus datos y agrega productos al carrito.' });
    }
    const documentoValido = tipoDocumento === 'DNI'
        ? /^\d{8}$/.test(documento)
        : tipoDocumento === 'RUC' && /^\d{11}$/.test(documento);
    if (!documentoValido) {
        return res.status(400).json({ exito: false, mensaje: 'El documento no coincide con el tipo seleccionado.' });
    }
    if (!/^9\d{8}$/.test(telefono)) {
        return res.status(400).json({ exito: false, mensaje: 'El teléfono debe tener 9 dígitos.' });
    }
    if (!correo || !/^\S+@\S+\.\S+$/.test(correo)) {
        return res.status(400).json({ exito: false, mensaje: 'Ingresa un correo electrónico válido.' });
    }

    const cantidades = new Map();
    for (const item of carrito) {
        const id = Number(item.id_producto ?? item.id);
        const cantidad = Number(item.cantidad);
        if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(cantidad) || cantidad <= 0 || cantidad > 1000) {
            return res.status(400).json({ exito: false, mensaje: 'Hay un producto o una cantidad no válida en el carrito.' });
        }
        cantidades.set(id, (cantidades.get(id) || 0) + cantidad);
    }

    let clienteCreado = null;
    let pedidoCreado = null;
    try {
        const ids = [...cantidades.keys()];
        const { data: productos, error: errorProductos } = await supabase
            .from('producto')
            .select('id_producto, nombre, precio, descuento')
            .in('id_producto', ids);
        if (errorProductos) throw errorProductos;
        if (!productos || productos.length !== ids.length) {
            return res.status(400).json({ exito: false, mensaje: 'Uno o más productos ya no están disponibles.' });
        }

        let subtotalCentimos = 0;
        let subtotalConOfertasCentimos = 0;
        const itemsBoleta = productos.map(producto => {
            const id = Number(producto.id_producto);
            const cantidad = cantidades.get(id);
            const precioCentimos = redondearDinero(producto.precio);
            if (!Number.isSafeInteger(precioCentimos) || precioCentimos <= 0) {
                throw new Error(`El precio del producto ${id} no es válido.`);
            }
            const descuentoSugerido = Number(DESCUENTOS_OFERTA_CHECKOUT[id]) ||
                (Number(producto.descuento) >= 5 ? Number(producto.descuento) : 0);
            const descuento = Math.min(100, Math.max(0, descuentoSugerido));
            const precioOfertaCentimos = Math.round(precioCentimos * (1 - descuento / 100));
            const subtotalItemCentimos = precioCentimos * cantidad;
            const subtotalOfertaCentimos = precioOfertaCentimos * cantidad;
            subtotalCentimos += subtotalItemCentimos;
            subtotalConOfertasCentimos += subtotalOfertaCentimos;
            return {
                id_producto: id,
                nombre: producto.nombre,
                cantidad,
                precio_unitario: solesDesdeCentimos(precioCentimos),
                descuento_porcentaje: descuento,
                precio_con_descuento: solesDesdeCentimos(precioOfertaCentimos),
                subtotal: solesDesdeCentimos(subtotalOfertaCentimos)
            };
        });

        const cupon = subtotalConOfertasCentimos > 15000
            ? { codigo: 'RICO15', porcentaje: 15 }
            : subtotalConOfertasCentimos > 10000
                ? { codigo: 'RICO10', porcentaje: 10 }
                : null;
        const descuentoOfertasCentimos = subtotalCentimos - subtotalConOfertasCentimos;
        const descuentoCuponCentimos = cupon
            ? Math.round(subtotalConOfertasCentimos * cupon.porcentaje / 100)
            : 0;
        const totalCentimos = subtotalConOfertasCentimos - descuentoCuponCentimos;
        const baseImponibleCentimos = Math.round(totalCentimos / (1 + TASA_IGV));
        const igvCentimos = totalCentimos - baseImponibleCentimos;

        const esPersona = tipoDocumento === 'DNI';
        const nombreFinal = cliente._campos_separados
            ? (String(cliente.nombre || '').trim() || null)
            : (esPersona ? nombreCliente : null);
        const razonSocialFinal = cliente._campos_separados
            ? (String(cliente.razon_social || '').trim() || null)
            : (esPersona ? null : nombreCliente);

        const { data: nuevoCliente, error: errorCliente } = await supabase
            .from('cliente')
            .insert([{
                nombre: nombreFinal,
                razon_social: razonSocialFinal,
                ruc: documento,
                telefono: telefono || null,
                direccion: direccion || null,
                email: correo
            }])
            .select('id_cliente')
            .single();
        if (errorCliente) throw errorCliente;
        clienteCreado = nuevoCliente;

        const { data: pedido, error: errorPedido } = await supabase
            .from('pedido')
            .insert([{
                estado: 'Pendiente',
                total: solesDesdeCentimos(totalCentimos),
                id_cliente: nuevoCliente.id_cliente,
                id_admin: 1
            }])
            .select('id_pedido, fecha_pedido, total')
            .single();
        if (errorPedido) throw errorPedido;
        pedidoCreado = pedido;

        const detalles = itemsBoleta.map(item => ({
            id_pedido: pedido.id_pedido,
            id_producto: item.id_producto,
            cantidad: item.cantidad,
            precio_unitario: item.precio_con_descuento
        }));
        const { error: errorDetalle } = await supabase
            .from('detalle_pedido')
            .insert(detalles);
        if (errorDetalle) throw errorDetalle;

        return res.status(201).json({
            exito: true,
            mensaje: 'Compra registrada correctamente',
            boleta: {
                numero: `B001-${String(pedido.id_pedido).padStart(6, '0')}`,
                fecha: pedido.fecha_pedido || new Date().toISOString(),
                empresa: { nombre: 'Corporación Rico S.A.C. · Rico Alimentos', ruc: RICO_RUC },
                cliente: {
                    razon_social: nombreCliente,
                    documento,
                    tipo_documento: tipoDocumento,
                    telefono,
                    direccion,
                    email: correo
                },
                items: itemsBoleta,
                subtotal: solesDesdeCentimos(subtotalCentimos),
                descuento_ofertas: solesDesdeCentimos(descuentoOfertasCentimos),
                descuento_cupon: solesDesdeCentimos(descuentoCuponCentimos),
                cupon,
                base_imponible: solesDesdeCentimos(baseImponibleCentimos),
                igv_porcentaje: TASA_IGV * 100,
                igv: solesDesdeCentimos(igvCentimos),
                total: pedido.total
            }
        });
    } catch (err) {
        console.error('Error al registrar el pedido:', err.message || err);
        if (pedidoCreado?.id_pedido) {
            await supabase.from('detalle_pedido').delete().eq('id_pedido', pedidoCreado.id_pedido);
            await supabase.from('pedido').delete().eq('id_pedido', pedidoCreado.id_pedido);
        }
        if (clienteCreado?.id_cliente) {
            await supabase.from('cliente').delete().eq('id_cliente', clienteCreado.id_cliente);
        }
        return res.status(500).json({ exito: false, mensaje: 'No se pudo guardar el pedido. Inténtalo nuevamente.' });
    }
});

// ========================================================
// 5. OPINIONES Y CONTACTO (contacto.html)
// ========================================================
app.get('/api/opiniones', async (req, res) => {
    const { data, error } = await supabase
        .from('opinion')
        .select('*')
        .order('id_opinion', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.post('/api/opiniones', async (req, res) => {
    const { nombre_cliente, calificacion, comentario } = req.body;

    if (!nombre_cliente || !comentario) {
        return res.status(400).json({ exito: false, mensaje: 'Completa tu nombre y comentario.' });
    }

    const { data, error } = await supabase
        .from('opinion')
        .insert([{
            nombre_cliente: nombre_cliente.trim(),
            calificacion: parseInt(calificacion, 10) || 5,
            comentario: comentario.trim()
        }])
        .select()
        .single();

    if (error) return res.status(500).json({ exito: false, error: error.message });
    res.json({ exito: true, mensaje: 'Opinión publicada', data });
});

app.post('/api/contacto', async (req, res) => {
    const { nombre, correo, telefono, asunto, mensaje } = req.body;

    if (!nombre || !correo || !mensaje) {
        return res.status(400).json({ exito: false, mensaje: 'Nombre, correo y mensaje son obligatorios.' });
    }

    const { data, error } = await supabase
        .from('contacto')
        .insert([{ nombre, correo, telefono, asunto, mensaje }])
        .select()
        .single();

    if (error) return res.status(500).json({ exito: false, error: error.message });
    res.json({ exito: true, mensaje: 'Mensaje enviado correctamente', data });
});

// ========================================================
// 6. REPORTES ESTADÍSTICOS (reportes.html)
// ========================================================
app.get('/api/reportes', async (req, res) => {
    try {
        const [resProd, resCat, resPed, resDet, resCli] = await Promise.all([
            supabase.from('producto').select('*'),
            supabase.from('categoria').select('*'),
            supabase.from('pedido').select('*'),
            supabase.from('detalle_pedido').select('*'),
            supabase.from('cliente').select('*')
        ]);

        const productos = resProd.data || [];
        const categorias = resCat.data || [];
        const pedidos = resPed.data || [];
        const detalles = resDet.data || [];
        const clientes = resCli.data || [];

        const mapaCategorias = {};
        categorias.forEach(c => { mapaCategorias[c.id_categoria] = c.nombre_categoria; });

        const mapaProductos = {};
        productos.forEach(p => { mapaProductos[p.id_producto] = p; });

        const mapaClientes = {};
        clientes.forEach(c => {
            mapaClientes[c.id_cliente] = c.razon_social || c.nombre || `Cliente #${c.id_cliente}`;
        });

        const mapaPedidos = {};
        pedidos.forEach(p => { mapaPedidos[p.id_pedido] = p; });

        // 1. Ventas por Categoría (S/)
        const ventasCat = {};
        detalles.forEach(d => {
            const prod = mapaProductos[d.id_producto];
            if (!prod) return;
            const nombreCat = mapaCategorias[prod.id_categoria] || 'Otros';
            const subtotal = (Number(d.cantidad) || 0) * (Number(d.precio_unitario) || 0);
            ventasCat[nombreCat] = (ventasCat[nombreCat] || 0) + subtotal;
        });

        // 2. Productos más Vendidos (Unidades)
        const prodVendidos = {};
        detalles.forEach(d => {
            const prod = mapaProductos[d.id_producto];
            const nombreProd = prod ? prod.nombre : `Producto #${d.id_producto}`;
            prodVendidos[nombreProd] = (prodVendidos[nombreProd] || 0) + (Number(d.cantidad) || 0);
        });
        const topProductos = Object.entries(prodVendidos)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6);

        // 3. Precio Promedio por Categoría (S/)
        const preciosCat = {};
        productos.forEach(p => {
            const nombreCat = mapaCategorias[p.id_categoria] || 'Otros';
            if (!preciosCat[nombreCat]) preciosCat[nombreCat] = { suma: 0, cuenta: 0 };
            preciosCat[nombreCat].suma += Number(p.precio) || 0;
            preciosCat[nombreCat].cuenta += 1;
        });
        const labelsPrecios = Object.keys(preciosCat);
        const valoresPrecios = labelsPrecios.map(c =>
            Number((preciosCat[c].suma / preciosCat[c].cuenta).toFixed(2))
        );

        // 4. Pedidos por Estado
        const estadosPed = {};
        pedidos.forEach(p => {
            const est = p.estado || 'Pendiente';
            estadosPed[est] = (estadosPed[est] || 0) + 1;
        });

        // 5. Clientes Frecuentes (N° de Pedidos)
        const clientesFreq = {};
        pedidos.forEach(p => {
            const nombreCli = mapaClientes[p.id_cliente] || `Cliente #${p.id_cliente}`;
            clientesFreq[nombreCli] = (clientesFreq[nombreCli] || 0) + 1;
        });
        const topClientes = Object.entries(clientesFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6);

        // 6. Descuentos Aplicados por Mes (S/)
        const nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const descuentosMes = {};
        detalles.forEach(d => {
            const prod = mapaProductos[d.id_producto];
            const ped = mapaPedidos[d.id_pedido];
            if (!prod || !ped) return;
            const pct = Number(DESCUENTOS_OFERTA_CHECKOUT[prod.id_producto]) || Number(prod.descuento) || 0;
            if (pct <= 0) return;
            const fecha = ped.fecha_pedido ? new Date(ped.fecha_pedido) : new Date();
            const claveOrden = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
            const label = `${nombresMeses[fecha.getMonth()]} ${fecha.getFullYear()}`;
            const montoDesc = (Number(d.precio_unitario) || 0) * (Number(d.cantidad) || 0) * (pct / 100);
            if (!descuentosMes[claveOrden]) descuentosMes[claveOrden] = { label, monto: 0 };
            descuentosMes[claveOrden].monto += montoDesc;
        });

        const descuentosOrdenados = Object.entries(descuentosMes)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([, v]) => v);

        res.json({
            ventasPorCategoria: {
                labels: Object.keys(ventasCat),
                valores: Object.values(ventasCat).map(v => Number(v.toFixed(2)))
            },
            productosMasVendidos: {
                labels: topProductos.map(([k]) => k),
                valores: topProductos.map(([, v]) => v)
            },
            preciosPorCategoria: {
                labels: labelsPrecios,
                valores: valoresPrecios
            },
            pedidosPorEstado: {
                labels: Object.keys(estadosPed),
                valores: Object.values(estadosPed)
            },
            clientesFrecuentes: {
                labels: topClientes.map(([k]) => k),
                valores: topClientes.map(([, v]) => v)
            },
            descuentosAplicados: {
                labels: descuentosOrdenados.map(d => d.label),
                valores: descuentosOrdenados.map(d => Number(d.monto.toFixed(2)))
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========================================================
// POBLACIÓN BASE Y ARRANQUE DEL SERVIDOR
// ========================================================
async function poblarProductosBase() {
    try {
        const { data: productosExistentes, error: errorCheck } =
            await supabase
                .from('producto')
                .select('id_producto')
                .limit(1);

        if (errorCheck) {
            console.error(
                'Error al verificar productos en Supabase:',
                errorCheck.message
            );
            return;
        }

        if (productosExistentes.length === 0) {
            console.log(
                'La tabla está vacía. Insertando productos base...'
            );

            const productosBase = [
                {
                    nombre: 'Pollo Fresco',
                    descripcion:
                        'Variedad de cortes y pollo entero de la más alta calidad y frescura.',
                    marca: 'Rico Pollo',
                    precio: 18.50,
                    imagen: './assets/img/Productos/Pollo.png',
                    id_admin: 1,
                    id_categoria: 1,
                    descuento: 10
                },
                {
                    nombre: 'Cortes de Cerdo',
                    descripcion:
                        'Chuletas, lomo y costillas seleccionadas, tiernas y llenas de sabor.',
                    marca: 'Rico Pollo',
                    precio: 25.00,
                    imagen: './assets/img/Productos/Cerdo.png',
                    id_admin: 1,
                    id_categoria: 2,
                    descuento: 0
                },
                {
                    nombre: 'Embutidos Selectos',
                    descripcion:
                        'Jamonadas, salchichas y chorizos ideales para tus desayunos y parrillas.',
                    marca: 'Rico Pollo',
                    precio: 12.90,
                    imagen: './assets/img/Productos/Embutidos.png',
                    id_admin: 1,
                    id_categoria: 3,
                    descuento: 15
                },
                {
                    nombre: 'Huevos de Corral',
                    descripcion:
                        'Frescos, nutritivos y seleccionados bajo rigurosos controles de calidad.',
                    marca: 'Rico Pollo',
                    precio: 8.50,
                    imagen: './assets/img/Productos/Huevos.png',
                    id_admin: 1,
                    id_categoria: 4,
                    descuento: 0
                },
                {
                    nombre: 'Productos Preparados',
                    descripcion:
                        'Milanesas, nuggets y apanados listos para cocinar de forma rápida y deliciosa.',
                    marca: 'Rico Pollo',
                    precio: 22.00,
                    imagen: './assets/img/Productos/Preparados.png',
                    id_admin: 1,
                    id_categoria: 5,
                    descuento: 5
                },
                {
                    nombre: 'Aceite Vegetal',
                    descripcion:
                        'Aceite 100% puro y saludable, ideal para realzar el sabor de todas tus comidas.',
                    marca: 'Rico Pollo',
                    precio: 9.90,
                    imagen: './assets/img/Productos/Aceite.png',
                    id_admin: 1,
                    id_categoria: 6,
                    descuento: 0
                }
            ];

            const { error: insertError } = await supabase
                .from('producto')
                .insert(productosBase);

            if (insertError) {
                console.error(
                    'Error al insertar productos base:',
                    insertError.message
                );
            } else {
                console.log(
                    'Productos base insertados correctamente.'
                );
            }
        } else {
            console.log(
                'Los productos ya están cargados en Supabase.'
            );
        }

    } catch (error) {
        console.error('Error al cargar productos base:', error);
    }
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Servidor de RICO corriendo en http://localhost:${port}`);
    poblarProductosBase();
});