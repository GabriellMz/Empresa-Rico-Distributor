document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('videoRico');
    const btnVolumen = document.getElementById('btnVolumen');
    const iconoVolumen = document.getElementById('iconoVolumen');

    if (video && btnVolumen && iconoVolumen) {
        btnVolumen.addEventListener('click', () => {
            video.muted = !video.muted;
            if (video.muted) {
                iconoVolumen.className = 'bi bi-volume-mute-fill fs-5 text-white';
            } else {
                video.volume = 1;
                iconoVolumen.className = 'bi bi-volume-up-fill fs-5 text-white';
            }
        });
    }
});