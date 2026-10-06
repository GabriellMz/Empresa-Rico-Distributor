const express = require('express');
const path = require('path');
const cors = require('cors');
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
    const { data, error } = await supabase
        .from('producto')
        .select('*')
        .order('id_producto', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
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
  console.log(`🔌 Conectado a la API de Supabase de Gabriel Apac`);
  poblarProductosBase();
});