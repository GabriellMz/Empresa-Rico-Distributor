document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("adminSidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const btnToggleSidebar = document.getElementById("btnToggleSidebar");

  function abrirSidebar() {
    sidebar.classList.add("show");
    overlay.classList.add("show");
  }

  function cerrarSidebar() {
    sidebar.classList.remove("show");
    overlay.classList.remove("show");
  }

  if (btnToggleSidebar && sidebar && overlay) {
    btnToggleSidebar.addEventListener("click", abrirSidebar);
    overlay.addEventListener("click", cerrarSidebar);
  }





  // Cerrar Sesion
  const btnCerrarSesion = document.getElementById("btnCerrarSesion");

  if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener("click", () => {
      // Manuel: ajusta esto a tu mecanismo real de sesión
      // (localStorage, sessionStorage, cookie, etc.) y a la protección
      // de rutas que estás armando para admin.html.
      sessionStorage.removeItem("ricoAdminSession");
      localStorage.removeItem("ricoAdminSession");
      window.location.href = "index.html";
    });
  }
});
