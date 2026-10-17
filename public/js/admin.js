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

  // Nuevo / Editar
  const modalProducto = document.getElementById("modalProducto");
  const modalProductoLabel = document.getElementById("modalProductoLabel");
  const formProducto = document.getElementById("formProducto");
  const btnNuevoProducto = document.getElementById("btnNuevoProducto");

  if (modalProducto) {
    modalProducto.addEventListener("show.bs.modal", (evento) => {
      const botonOrigen = evento.relatedTarget;
      const esEdicion =
        botonOrigen && botonOrigen.classList.contains("btn-editar-producto");

      if (esEdicion) {
        modalProductoLabel.innerHTML =
          '<i class="bi bi-pencil-square me-2"></i>Editar Producto';
        // Fernando: aquí (o en tu propio script escuchando este mismo evento)
        // debes tomar botonOrigen.dataset.id, buscar el producto y llenar
        // los campos del formulario (#inputNombreProducto, #inputPrecioProducto, etc.)
      } else {
        modalProductoLabel.innerHTML =
          '<i class="bi bi-box-seam me-2"></i>Nuevo Producto';
        if (formProducto) {
          formProducto.reset();
          document.getElementById("inputIdProducto").value = "";
        }
      }
    });
  }

  /* 
       Fernando: en tu módulo CRUD puedes reutilizar confirmarAccion()
       (definida en alertas.js) antes de hacer el DELETE real, por ejemplo:
       
       tabla.addEventListener('click', async (e) => {
           const boton = e.target.closest('.btn-eliminar-producto');
           if (!boton) return;
           const confirmado = await confirmarAccion(`¿Eliminar "${boton.dataset.nombre}"?`);
           if (confirmado) {
               // fetch DELETE a /api/productos/:id aquí
               mostrarAlertaExito('Producto eliminado correctamente');
           }
       });

       Dejamos esta misma lógica ya conectada a las filas de ejemplo para que
       puedas ver y probar la alerta visual sin depender de la API todavía.
    */
  const tablaProductos = document.getElementById("tablaProductosBody");

  if (tablaProductos) {
    tablaProductos.addEventListener("click", async (evento) => {
      const botonEliminar = evento.target.closest(".btn-eliminar-producto");
      if (!botonEliminar) return;

      const nombreProducto = botonEliminar.dataset.nombre || "este producto";
      const confirmado = await confirmarAccion(
        `¿Eliminar "${nombreProducto}"? Esta acción no se puede deshacer.`,
      );

      if (confirmado) {
        // TODO (Fernando): reemplazar esta línea por el fetch DELETE real.
        mostrarAlertaExito(`"${nombreProducto}" se eliminó correctamente.`);
      }
    });
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
