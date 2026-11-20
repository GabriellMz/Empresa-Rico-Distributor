document.addEventListener('DOMContentLoaded', () => {
    const contenedorAuth = document.getElementById('navAuthContainer');
    if (!contenedorAuth) return;

    const sesionGuardada = localStorage.getItem('ricoAdminSession');

    if (sesionGuardada) {
        let admin = { usuario: 'Admin' };
        try {
            admin = JSON.parse(sesionGuardada);
        } catch (e) {
            localStorage.removeItem('ricoAdminSession');
        }

        const nombreUsuario = admin.usuario
            ? admin.usuario.charAt(0).toUpperCase() + admin.usuario.slice(1)
            : 'Admin';

        contenedorAuth.innerHTML = `
            <span class="text-white fw-semibold d-flex align-items-center gap-1 me-1">
                <i class="bi bi-person-check-fill text-warning fs-5"></i>
                Hola, ${nombreUsuario}
            </span>
            <a href="admin.html" class="btn btn-warning btn-sm fw-bold text-dark d-flex align-items-center gap-1 px-3">
                <i class="bi bi-speedometer2"></i>
                <span>Panel Admin</span>
            </a>
            <button type="button" id="btnLogoutNavbar" class="btn btn-outline-light btn-sm" title="Cerrar Sesión">
                <i class="bi bi-box-arrow-right"></i>
            </button>
        `;

        const btnLogout = document.getElementById('btnLogoutNavbar');
        if (btnLogout) {
            btnLogout.addEventListener('click', async () => {
                if (typeof confirmarAccion === 'function') {
                    const confirmar = await confirmarAccion('¿Deseas cerrar tu sesión de administrador?', 'Cerrar Sesión');
                    if (!confirmar) return;
                }
                localStorage.removeItem('ricoAdminSession');
                sessionStorage.removeItem('ricoAdminSession');
                window.location.href = 'index.html';
            });
        }
    } else {
        contenedorAuth.innerHTML = `
            <a href="login.html"
                class="btn btn-outline-light rounded-circle d-flex align-items-center justify-content-center p-0"
                style="width: 40px; height: 40px;"
                title="Acceso Administrador / Registro"
                aria-label="Iniciar Sesión">
                <i class="bi bi-person-fill-gear fs-5"></i>
            </a>
        `;
    }
});