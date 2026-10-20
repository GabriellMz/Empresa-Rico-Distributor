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
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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

app.get('/api/productos', async (req, res) => {
    try {
        const buscar = (req.query.buscar || '').trim();
        const categoria = req.query.categoria;

        let consulta = supabase
            .from('producto')
            .select('*')
            .order('id_producto', { ascending: true });

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
            id_categoria
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
            id_categoria
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
                    id_categoria: 1
                },
                {
                    nombre: 'Cortes de Cerdo',
                    descripcion:
                        'Chuletas, lomo y costillas seleccionadas, tiernas y llenas de sabor.',
                    marca: 'Rico Pollo',
                    precio: 25.00,
                    imagen: './assets/img/Productos/Cerdo.png',
                    id_admin: 1,
                    id_categoria: 2
                },
                {
                    nombre: 'Embutidos Selectos',
                    descripcion:
                        'Jamonadas, salchichas y chorizos ideales para tus desayunos y parrillas.',
                    marca: 'Rico Pollo',
                    precio: 12.90,
                    imagen: './assets/img/Productos/Embutidos.png',
                    id_admin: 1,
                    id_categoria: 3
                },
                {
                    nombre: 'Huevos de Corral',
                    descripcion:
                        'Frescos, nutritivos y seleccionados bajo rigurosos controles de calidad.',
                    marca: 'Rico Pollo',
                    precio: 8.50,
                    imagen: './assets/img/Productos/Huevos.png',
                    id_admin: 1,
                    id_categoria: 4
                },
                {
                    nombre: 'Productos Preparados',
                    descripcion:
                        'Milanesas, nuggets y apanados listos para cocinar de forma rápida y deliciosa.',
                    marca: 'Rico Pollo',
                    precio: 22.00,
                    imagen: './assets/img/Productos/Preparados.png',
                    id_admin: 1,
                    id_categoria: 5
                },
                {
                    nombre: 'Aceite Vegetal',
                    descripcion:
                        'Aceite 100% puro y saludable, ideal para realzar el sabor de todas tus comidas.',
                    marca: 'Rico Pollo',
                    precio: 9.90,
                    imagen: './assets/img/Productos/Aceite.png',
                    id_admin: 1,
                    id_categoria: 6
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
