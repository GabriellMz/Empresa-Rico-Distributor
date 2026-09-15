function cambiarModal(modalActual, modalNuevo) {

    const actual = document.getElementById(modalActual);
    const nuevo = document.getElementById(modalNuevo);

    if (!actual || !nuevo) {
        return;
    }

    // Obtener la instancia de Bootstrap del modal actual
    const modalActualInstance = bootstrap.Modal.getInstance(actual);

    if (modalActualInstance) {

        
        actual.addEventListener("hidden.bs.modal", function abrirNuevo() {

            // Evitar que el evento se ejecute nuevamente
            actual.removeEventListener("hidden.bs.modal", abrirNuevo);

            // Crear y mostrar el nuevo modal
            const modalNuevoInstance = new bootstrap.Modal(nuevo);
            modalNuevoInstance.show();

        });

        // Cerrar correctamente el modal actual
        modalActualInstance.hide();

    } else {

        // Si no existe una instancia, crearla y mostrar el nuevo
        const modalNuevoInstance = new bootstrap.Modal(nuevo);
        modalNuevoInstance.show();
    }
}


document.addEventListener("DOMContentLoaded", function () {

    const registroForm = document.getElementById("registroForm");

    if (!registroForm) {
        return;
    }

    registroForm.addEventListener("submit", function (event) {

        event.preventDefault();

        // Mostrar mensaje
        mostrarMensaje(
            "¡Registro exitoso!",
            "Tu cuenta ha sido creada correctamente."
        );

        
        this.reset();

    });

});

function mostrarMensaje(titulo, texto) {

    // Eliminar mensaje anterior
    const mensajeAnterior = document.getElementById("mensajeEmergente");

    if (mensajeAnterior) {
        mensajeAnterior.remove();
    }

    // Crear mensaje
    const mensaje = document.createElement("div");

    mensaje.id = "mensajeEmergente";

    mensaje.innerHTML = `
        <div class="mensaje-icono">
            <i class="bi bi-check-circle-fill"></i>
        </div>

        <div class="mensaje-contenido">
            <strong>${titulo}</strong>
            <span>${texto}</span>
        </div>
    `;

    
    document.body.appendChild(mensaje);

    
    requestAnimationFrame(() => {
        mensaje.classList.add("mostrar");
    });

    // Ocultar después de 3 segundos
    setTimeout(() => {

        mensaje.classList.remove("mostrar");

        // Eliminar después de la animación
        setTimeout(() => {

            if (mensaje) {
                mensaje.remove();
            }

        }, 400);

    }, 3000);
}
