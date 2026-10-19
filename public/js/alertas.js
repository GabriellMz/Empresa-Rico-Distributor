const RICO_COLOR_PRIMARY = '#dc3545';
const RICO_COLOR_SECONDARY = '#6c757d';

function mostrarAlertaExito(mensaje, titulo = '¡Listo!') {
    return Swal.fire({
        icon: 'success',
        title: titulo,
        text: mensaje,
        confirmButtonColor: RICO_COLOR_PRIMARY,
        timer: 2500,
        timerProgressBar: true
    });
}

function mostrarAlertaError(mensaje, titulo = 'Ocurrió un error') {
    return Swal.fire({
        icon: 'error',
        title: titulo,
        text: mensaje,
        confirmButtonColor: RICO_COLOR_PRIMARY
    });
}

function mostrarAlertaInfo(mensaje, titulo = 'Aviso') {
    return Swal.fire({
        icon: 'info',
        title: titulo,
        text: mensaje,
        confirmButtonColor: RICO_COLOR_PRIMARY
    });
}

/**
 * Diálogo de confirmación (por ejemplo, antes de eliminar un producto).
 * Devuelve una Promise<boolean>: true si el usuario confirmó, false si canceló.
 *
 * Ejemplo de uso:
 *   const confirmado = await confirmarAccion('¿Eliminar "Pollo Fresco"?');
 *   if (confirmado) { ...hacer el fetch DELETE... }
 */
function confirmarAccion(mensaje, titulo = '¿Estás seguro?') {
    return Swal.fire({
        icon: 'warning',
        title: titulo,
        text: mensaje,
        showCancelButton: true,
        confirmButtonColor: RICO_COLOR_PRIMARY,
        cancelButtonColor: RICO_COLOR_SECONDARY,
        confirmButtonText: 'Sí, continuar',
        cancelButtonText: 'Cancelar'
    }).then((resultado) => resultado.isConfirmed);
}