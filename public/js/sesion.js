const CLAVE_SESION = "ricoAdminSession";

function obtenerSesion() {
    const sesionGuardada = sessionStorage.getItem(CLAVE_SESION);

    if (!sesionGuardada) {
        return null;
    }

    try {
        return JSON.parse(sesionGuardada);
    } catch (error) {
        sessionStorage.removeItem(CLAVE_SESION);
        return null;
    }
}

const sesionAdmin = obtenerSesion();

if (!sesionAdmin || !sesionAdmin.usuario) {
    window.location.replace("index.html");
} else {
    document.addEventListener("DOMContentLoaded", () => {
        const nombreAdmin = document.getElementById("nombreAdminSesion");

        if (nombreAdmin) {
            nombreAdmin.textContent = sesionAdmin.usuario;
        }
    });
}
