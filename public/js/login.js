document.addEventListener('DOMContentLoaded', () => {
    // Si ya está logueado y entra a login.html, lo manda directo al panel
    if (localStorage.getItem('ricoAdminSession') && document.getElementById('loginClave')) {
        window.location.href = 'admin.html';
        return;
    }

    // Mostrar / ocultar contraseña
    const btnVerClave = document.getElementById('btnVerClave');
    const inputClave = document.getElementById('loginClave');
    if (btnVerClave && inputClave) {
        btnVerClave.addEventListener('click', () => {
            const esPassword = inputClave.type === 'password';
            inputClave.type = esPassword ? 'text' : 'password';
            btnVerClave.innerHTML = esPassword
                ? '<i class="bi bi-eye-slash"></i>'
                : '<i class="bi bi-eye"></i>';
        });
    }

    // Envío de Login a /api/login
    const formLogin = document.getElementById('formLogin');
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const usuario = formLogin.usuario.value.trim();
            const clave = formLogin.clave.value.trim();

            try {
                const respuesta = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ usuario, clave })
                });

                const data = await respuesta.json();

                if (respuesta.ok && data.exito) {
                    localStorage.setItem('ricoAdminSession', JSON.stringify(data.admin));

                    if (typeof mostrarAlertaExito === 'function') {
                        await mostrarAlertaExito(`Bienvenido, ${data.admin.usuario}`, 'Acceso concedido');
                    }
                    window.location.href = 'admin.html';
                } else {
                    if (typeof mostrarAlertaError === 'function') {
                        mostrarAlertaError(data.mensaje || 'Usuario o contraseña incorrectos');
                    } else {
                        alert(data.mensaje || 'Credenciales incorrectas');
                    }
                }
            } catch (error) {
                if (typeof mostrarAlertaError === 'function') {
                    mostrarAlertaError('No se pudo conectar con el servidor.');
                }
            }
        });
    }

    // Aviso limpio para el formulario de Registro
    const formRegistro = document.getElementById('formRegistro');
    if (formRegistro) {
        formRegistro.addEventListener('submit', (e) => {
            e.preventDefault();
            if (typeof mostrarAlertaInfo === 'function') {
                mostrarAlertaInfo(
                    'El registro público está deshabilitado. El acceso administrativo es gestionado por el coordinador de RICO Alimentos.',
                    'Acceso Restringido'
                );
            }
            formRegistro.reset();
        });
    }
});