const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Ruta principal

const supabaseUrl = 'https://lhhtcdayfqtybczaloso.supabase.co';
const supabaseKey = 'sb_publishable_yvAsHM24Bt2c7-dcaqyBLg_cS_GwtAC';
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); 

app.post('/api/login', async (req, res) => {
    const { usuario, clave } = req.body;

    const { data, error } = await supabase
        .from('administrador')
        .select('*')
        .eq('usuario', usuario)
        .eq('clave', clave);

    if (error) return res.status(500).json({ error: error.message });
    
    if (data.length > 0) {
        res.json({ exito: true, mensaje: 'Login correcto', admin: data[0] });
    } else {
        res.status(401).json({ exito: false, mensaje: 'Usuario o clave incorrectos' });
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

        // Buscar por nombre, descripción o marca
        if (buscar) {
            // Evitar caracteres que interfieran con la sintaxis de filtros
            const texto = buscar.replace(/[,%()]/g, ' ').trim();

            if (texto) {
                consulta = consulta.or(
                    `nombre.ilike.%${texto}%,descripcion.ilike.%${texto}%,marca.ilike.%${texto}%`
                );
            }
        }

        // Filtrar por categoría, excepto cuando se solicitan todos
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
        console.error('Error inesperado:', error);
        res.status(500).json({
            error: 'Ocurrió un error al consultar los productos.'
        });
    }
});


app.post('/api/productos', async (req, res) => {
    const { nombre, descripcion, marca, precio, imagen, vencimiento_duracion, id_admin } = req.body;

    const { data, error } = await supabase
        .from('producto')
        .insert([
            { 
                nombre, 
                descripcion, 
                marca, 
                precio, 
                imagen, 
                vencimiento_duracion, 
                id_admin 
            }
        ]);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ exito: true, mensaje: 'Producto creado exitosamente', data });
});

async function poblarProductosBase() {

    const { data: productosExistentes, error: errorCheck } = await supabase
        .from('producto')
        .select('id_producto')
        .limit(1);

    if (errorCheck) {
        console.log('⚠️ Error al verificar productos en Supabase. ¿Ya creaste las tablas con el SQL Editor?');
        return;
    }

    if (productosExistentes.length === 0) {
        console.log('⏳ La tabla productos está vacía. Insertando productos base automáticamente...');

        const productosBase = [
            {
                nombre: 'Pollo Fresco',
                descripcion: 'Variedad de cortes y pollo entero de la más alta calidad y frescura.',
                marca: 'Rico Pollo',
                precio: 18.50,
                imagen: './assets/img/Productos/Pollo.png',
                id_admin: 1
            },
            {
                nombre: 'Cortes de Cerdo',
                descripcion: 'Chuletas, lomo y costillas seleccionadas, tiernas y llenas de sabor.',
                marca: 'Rico Pollo',
                precio: 25.00,
                imagen: './assets/img/Productos/Cerdo.png',
                id_admin: 1
            },
            {
                nombre: 'Embutidos Selectos',
                descripcion: 'Jamonadas, salchichas y chorizos ideales para tus desayunos y parrillas.',
                marca: 'Rico Pollo',
                precio: 12.90,
                imagen: './assets/img/Productos/Embutidos.png',
                id_admin: 1
            },
            {
                nombre: 'Huevos de Corral',
                descripcion: 'Frescos, nutritivos y seleccionados bajo rigurosos controles de calidad.',
                marca: 'Rico Pollo',
                precio: 8.50,
                imagen: './assets/img/Productos/Huevos.png',
                id_admin: 1
            },
            {
                nombre: 'Productos Preparados',
                descripcion: 'Milanesas, nuggets y apanados listos para cocinar de forma rápida y deliciosa.',
                marca: 'Rico Pollo',
                precio: 22.00,
                imagen: './assets/img/Productos/Preparados.png',
                id_admin: 1
            },
            {
                nombre: 'Aceite Vegetal',
                descripcion: 'Aceite 100% puro y saludable, ideal para realzar el sabor de todas tus comidas.',
                marca: 'Rico Pollo',
                precio: 9.90,
                imagen: './assets/img/Productos/Aceite.png',
                id_admin: 1
            }
        ];

        const { error: insertError } = await supabase
            .from('producto')
            .insert(productosBase);

        if (insertError) {
            console.log('❌ Error al insertar productos base:', insertError.message);
        } else {
            console.log('✅ 6 Productos base insertados correctamente en Supabase.');
        }
    } else {
        console.log('📦 Los productos ya están cargados en Supabase. Listo para el CRUD.');
    }
}


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`🚀 Servidor de RICO corriendo en http://localhost:${port}`);
});