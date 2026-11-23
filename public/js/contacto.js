document.addEventListener('DOMContentLoaded', () => {
    inicializarFormularioContacto();
    cargarOpinionesClientes();
});

// ------------------------------------------------------------
// FORMULARIO DE CONTACTO
// ------------------------------------------------------------
function inicializarFormularioContacto() {
    const formulario = document.getElementById('formContacto');
    if (!formulario) return;

    formulario.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        const nombre = document.getElementById('contactoNombre').value.trim();
        const correo = document.getElementById('contactoCorreo').value.trim();
        const telefono = document.getElementById('contactoTelefono').value.trim();
        const asunto = document.getElementById('contactoAsunto').value;
        const mensaje = document.getElementById('contactoMensaje').value.trim();

        // VALIDACIÓN BÁSICA EN EL CLIENTE
        if (!nombre || !correo || !mensaje) {
            if (typeof mostrarAlertaError === 'function') {
                mostrarAlertaError('Completa tu nombre, correo y mensaje antes de enviar.');
            } else {
                alert('Completa tu nombre, correo y mensaje antes de enviar.');
            }
            return;
        }

        const btnEnviar = document.getElementById('btnEnviarContacto');
        const textoOriginalBoton = btnEnviar.innerHTML;
        btnEnviar.disabled = true;
        btnEnviar.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Enviando...';

        try {
            const respuesta = await fetch('/api/contacto', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, correo, telefono, asunto, mensaje })
            });

            if (!respuesta.ok) {
                throw new Error('El servidor respondió con un error al guardar el mensaje.');
            }

            if (typeof mostrarAlertaExito === 'function') {
                mostrarAlertaExito('Gracias por escribirnos, te responderemos pronto.', 'Mensaje enviado');
            } else {
                alert('Gracias por escribirnos, te responderemos pronto.');
            }

            formulario.reset();
        } catch (error) {
            console.error('Error al enviar el formulario de contacto:', error);

            // Si el endpoint /api/contacto todavía no existe (404), se avisa
            // con un mensaje distinto para no confundirlo con un error real.
            const mensajeError = error.message.includes('404')
                ? 'El formulario aún no está conectado al servidor. Inténtalo más tarde.'
                : 'No se pudo enviar tu mensaje. Inténtalo nuevamente en unos minutos.';

            if (typeof mostrarAlertaError === 'function') {
                mostrarAlertaError(mensajeError);
            } else {
                alert(mensajeError);
            }
        } finally {
            btnEnviar.disabled = false;
            btnEnviar.innerHTML = textoOriginalBoton;
        }
    });
}

// ------------------------------------------------------------
// OPINIONES DE CLIENTES (dinámicas desde Supabase vía Express)
// ------------------------------------------------------------
async function cargarOpinionesClientes() {
    const contenedor = document.getElementById('listaOpiniones');
    const mensajeEstado = document.getElementById('mensajeOpiniones');
    if (!contenedor) return;

    try {
        const respuesta = await fetch('/api/opiniones');

        if (!respuesta.ok) {
            throw new Error('No se pudo obtener la lista de opiniones.');
        }

        const opiniones = await respuesta.json();

        if (!Array.isArray(opiniones) || opiniones.length === 0) {
            mensajeEstado.innerHTML = '<i class="bi bi-chat-square-text me-2"></i>Aún no hay opiniones registradas.';
            return;
        }

        contenedor.innerHTML = '';
        opiniones.forEach((opinion) => {
            contenedor.appendChild(crearTarjetaOpinion(opinion));
        });
    } catch (error) {
        console.error('Error al cargar las opiniones de clientes:', error);
        mensajeEstado.innerHTML =
            '<i class="bi bi-exclamation-triangle me-2"></i>No se pudieron cargar las opiniones por ahora.';
    }
}

// Construye la tarjeta de una opinión individual.
// Se espera que cada opinión tenga: nombre_cliente, comentario y calificacion (1 a 5).
function crearTarjetaOpinion(opinion) {
    const columna = document.createElement('div');
    columna.className = 'col-md-6 col-lg-4';

    const calificacion = Number(opinion.calificacion) || 5;
    const estrellas = '★'.repeat(calificacion) + '☆'.repeat(5 - calificacion);

    // Se usa textContent para el nombre y el comentario (nunca innerHTML con
    // datos externos), evitando así cualquier inyección de HTML/XSS.
    const tarjeta = document.createElement('div');
    tarjeta.className = 'review-card';

    const divEstrellas = document.createElement('div');
    divEstrellas.className = 'review-stars';
    divEstrellas.textContent = estrellas;

    const parrafoComentario = document.createElement('p');
    parrafoComentario.className = 'review-text';
    parrafoComentario.textContent = `“${opinion.comentario || ''}”`;

    const divAutor = document.createElement('div');
    divAutor.className = 'review-author';
    divAutor.textContent = opinion.nombre_cliente || 'Cliente de RICO';

    tarjeta.appendChild(divEstrellas);
    tarjeta.appendChild(parrafoComentario);
    tarjeta.appendChild(divAutor);
    columna.appendChild(tarjeta);

    return columna;
}