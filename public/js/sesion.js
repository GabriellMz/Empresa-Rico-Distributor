(() => {
    const sesion = localStorage.getItem('ricoAdminSession');

    if (!sesion) {
        window.location.href = 'login.html';
        return;
    }

    document.addEventListener('DOMContentLoaded', () => {
        try {
            const admin = JSON.parse(sesion);
            const spanNombre = document.getElementById('nombreAdminSesion');
            if (spanNombre && admin.usuario) {
                const nombreFormateado = admin.usuario.charAt(0).toUpperCase() + admin.usuario.slice(1);
                spanNombre.textContent = `Hola, ${nombreFormateado}`;
            }
        } catch (error) {
            localStorage.removeItem('ricoAdminSession');
            window.location.href = 'login.html';
        }
    });
})();