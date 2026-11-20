(() => {
    let rolActualId = 1;

    function escaparHTML(texto) {
        const div = document.createElement('div');
        div.textContent = texto || '';
        return div.innerHTML;
    }

    function formatearTextoCapacitacion(cap) {
        const partes = [cap.titulo];
        if (cap.institucion) partes.push(cap.institucion);
        if (cap.anio) partes.push(`(${cap.anio})`);
        return partes.join(' - ');
    }

    function obtenerIdAdminActual() {
        try {
            const sesion = localStorage.getItem('ricoAdminSession');
            if (sesion) {
                const admin = JSON.parse(sesion);
                if (admin && admin.id_admin) return admin.id_admin;
            }
        } catch (e) {
            // Usar administrador base por defecto si falla la lectura
        }
        return 1;
    }

    async function obtenerCapacitacionesDB(idDesarrollador) {
        try {
            const respuesta = await fetch(`/api/capacitaciones/${idDesarrollador}`);
            if (!respuesta.ok) return [];
            return await respuesta.json();
        } catch (error) {
            console.error('Error al obtener capacitaciones de Supabase:', error);
            return [];
        }
    }

    function renderizarEnLista(ulElement, capacitaciones, permitirEliminar = false) {
        if (!ulElement) return;

        // Limpiar solo los elementos previos de BD para no duplicar ni borrar los base de cvs-data.js
        ulElement.querySelectorAll('.cap-db-item').forEach((item) => item.remove());

        capacitaciones.forEach((cap) => {
            const li = document.createElement('li');
            li.className = 'cap-db-item d-flex justify-content-between align-items-center gap-2 py-1';

            const texto = escaparHTML(formatearTextoCapacitacion(cap));

            li.innerHTML = `
                <span>
                    <i class="bi bi-patch-check-fill text-danger me-2"></i>
                    ${texto}
                    <span class="badge bg-danger-subtle text-danger ms-1">Nuevo</span>
                </span>
                ${permitirEliminar ? `
                    <button type="button"
                        class="btn btn-sm btn-link text-danger p-0 btn-eliminar-cap-db"
                        data-id="${cap.id_capacitacion}"
                        title="Eliminar capacitación">
                        <i class="bi bi-trash3"></i>
                    </button>
                ` : ''}
            `;

            ulElement.appendChild(li);
        });
    }

    async function sincronizarCapacitacionesUI(idDesarrollador) {
        const capacitaciones = await obtenerCapacitacionesDB(idDesarrollador);

        // 1. Actualizar lista principal del perfil en nosotros.html
        const listaPrincipal = document.getElementById('capacitaciones');
        renderizarEnLista(listaPrincipal, capacitaciones, false);

        // 2. Actualizar lista dentro del modal de Vista Previa CV
        const listaModal = document.getElementById('modalCapacitaciones');
        renderizarEnLista(listaModal, capacitaciones, true);

        // 3. Actualizar contador de capacitaciones en el modal
        const contador = document.getElementById('modalCapacitacionesCount');
        if (contador && listaModal) {
            contador.textContent = listaModal.querySelectorAll('li').length;
        }
    }

    // Envolver mostrarRol(id) de cvs-data.js para detectar qué integrante está activo
    if (typeof window.mostrarRol === 'function') {
        const mostrarRolOriginal = window.mostrarRol;
        window.mostrarRol = function (id) {
            rolActualId = Number(id) || 1;
            const resultado = mostrarRolOriginal.apply(this, arguments);
            sincronizarCapacitacionesUI(rolActualId);
            return resultado;
        };
    }

    // Envolver abrirModalCV() de cvs-data.js para asegurar que cargue los registros de Supabase
    if (typeof window.abrirModalCV === 'function') {
        const abrirModalOriginal = window.abrirModalCV;
        window.abrirModalCV = function () {
            const resultado = abrirModalOriginal.apply(this, arguments);
            sincronizarCapacitacionesUI(rolActualId);
            return resultado;
        };
    }

    // Función conectada al botón "Agregar capacitación" en nosotros.html
    window.agregarNuevaCapacitacion = async function () {
        const { value: formValues } = await Swal.fire({
            title: 'Agregar Capacitación / Certificado',
            html: `
                <div class="text-start">
                    <label class="form-label fw-bold small mb-1" for="swalCapTitulo">Nombre del curso o certificado *</label>
                    <input id="swalCapTitulo" class="form-control mb-3" placeholder="Ej. Curso de Node.js y Supabase">

                    <label class="form-label fw-bold small mb-1" for="swalCapInstitucion">Institución</label>
                    <input id="swalCapInstitucion" class="form-control mb-3" placeholder="Ej. UTP / Cisco / Coursera">

                    <label class="form-label fw-bold small mb-1" for="swalCapAnio">Año</label>
                    <input id="swalCapAnio" class="form-control" placeholder="Ej. 2026" maxlength="20">
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Guardar en BD',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc3545',
            preConfirm: () => {
                const titulo = document.getElementById('swalCapTitulo').value.trim();
                const institucion = document.getElementById('swalCapInstitucion').value.trim();
                const anio = document.getElementById('swalCapAnio').value.trim();

                if (!titulo) {
                    Swal.showValidationMessage('Por favor ingresa el nombre de la capacitación o certificado.');
                    return false;
                }
                return { titulo, institucion, anio };
            }
        });

        if (!formValues) return;

        try {
            const respuesta = await fetch('/api/capacitaciones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_desarrollador: rolActualId,
                    titulo: formValues.titulo,
                    institucion: formValues.institucion,
                    anio: formValues.anio,
                    id_admin: obtenerIdAdminActual()
                })
            });

            const data = await respuesta.json();

            if (respuesta.ok && data.exito) {
                await sincronizarCapacitacionesUI(rolActualId);
                if (typeof mostrarAlertaExito === 'function') {
                    mostrarAlertaExito('La capacitación se guardó en Supabase correctamente.');
                }
            } else {
                if (typeof mostrarAlertaError === 'function') {
                    mostrarAlertaError(data.error || data.mensaje || 'No se pudo guardar la capacitación.');
                }
            }
        } catch (error) {
            if (typeof mostrarAlertaError === 'function') {
                mostrarAlertaError('Error de conexión con el servidor.');
            }
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        // Cargar las capacitaciones del primer integrante apenas termine de pintar cvs-data.js
        setTimeout(() => sincronizarCapacitacionesUI(rolActualId), 80);

        // Respaldo al abrir el modal de CV
        const modalCV = document.getElementById('modalVistaPreviaCV');
        if (modalCV) {
            modalCV.addEventListener('shown.bs.modal', () => {
                sincronizarCapacitacionesUI(rolActualId);
            });
        }

        // Evento delegado para eliminar capacitaciones guardadas en BD desde el modal
        const listaModal = document.getElementById('modalCapacitaciones');
        if (listaModal) {
            listaModal.addEventListener('click', async (e) => {
                const btnEliminar = e.target.closest('.btn-eliminar-cap-db');
                if (!btnEliminar) return;

                const idCap = btnEliminar.dataset.id;
                const confirmado = typeof confirmarAccion === 'function'
                    ? await confirmarAccion('¿Deseas eliminar esta capacitación de la base de datos?')
                    : confirm('¿Deseas eliminar esta capacitación?');

                if (!confirmado) return;

                try {
                    const resp = await fetch(`/api/capacitaciones/${idCap}`, { method: 'DELETE' });
                    if (resp.ok) {
                        await sincronizarCapacitacionesUI(rolActualId);
                        if (typeof mostrarAlertaExito === 'function') {
                            mostrarAlertaExito('Capacitación eliminada de la base de datos.');
                        }
                    }
                } catch (error) {
                    if (typeof mostrarAlertaError === 'function') {
                        mostrarAlertaError('No se pudo eliminar la capacitación.');
                    }
                }
            });
        }
    });
})();