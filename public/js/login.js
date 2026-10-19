const CLAVE_SESION = "ricoAdminSession";

document.addEventListener("DOMContentLoaded", () => {
    const formulario = document.querySelector("#loginModal form");

    if (!formulario) {
        return;
    }

    const campos = formulario.querySelectorAll("input");
    const campoUsuario = campos[0];
    const campoClave = campos[1];
    const botonIngresar = formulario.querySelector("button");

    if (!campoUsuario || !campoClave || !botonIngresar) {
        return;
    }

    campoUsuario.type = "text";
    campoUsuario.name = "usuario";
    campoUsuario.placeholder = "Ingresa tu usuario";
    campoUsuario.autocomplete = "username";
    campoUsuario.required = true;
    campoUsuario.previousElementSibling.textContent = "Usuario";

    campoClave.name = "clave";
    campoClave.autocomplete = "current-password";
    campoClave.required = true;

    botonIngresar.type = "submit";

    const mensajeError = document.createElement("div");
    mensajeError.className = "alert alert-danger d-none mt-3";
    mensajeError.setAttribute("role", "alert");
    formulario.insertBefore(mensajeError, botonIngresar);

    function mostrarError(mensaje) {
        mensajeError.textContent = mensaje;
        mensajeError.classList.remove("d-none");
    }

    formulario.addEventListener("submit", async (evento) => {
        evento.preventDefault();
        mensajeError.textContent = "";
        mensajeError.classList.add("d-none");

        const usuario = campoUsuario.value.trim();
        const clave = campoClave.value;

        if (!usuario || !clave) {
            mostrarError("Ingresa tu usuario y contraseña.");
            return;
        }

        botonIngresar.disabled = true;
        botonIngresar.textContent = "Validando...";

        try {
            const respuesta = await fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ usuario, clave })
            });

            const resultado = await respuesta.json();

            if (!respuesta.ok || !resultado.exito) {
                mostrarError(resultado.mensaje || "El usuario o la contraseña son incorrectos.");
                return;
            }

            const administrador = resultado.admin || {};
            const sesion = {
                id_admin: administrador.id_admin || null,
                usuario: administrador.usuario || usuario
            };

            sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
            window.location.href = "admin.html";
        } catch (error) {
            mostrarError("No se pudo conectar con el servidor. Inténtalo nuevamente.");
        } finally {
            botonIngresar.disabled = false;
            botonIngresar.textContent = "Ingresar al Sistema";
        }
    });
});
