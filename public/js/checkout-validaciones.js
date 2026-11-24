(() => {
    const ultimoCheckout = {
        activo: false,
        nombre: '',
        razonSocial: ''
    };

    // Enviar nombre y razon_social por separado al registrar el pedido
    const fetchOriginal = window.fetch;
    window.fetch = async function (input, init) {
        try {
            const url = typeof input === 'string' ? input : (input?.url || '');
            const method = (init?.method || 'GET').toUpperCase();

            if (url.includes('/api/pedidos') && method === 'POST' && init?.body && typeof init.body === 'string') {
                const payload = JSON.parse(init.body);
                if (payload && payload.cliente && ultimoCheckout.activo) {
                    payload.cliente.nombre = ultimoCheckout.nombre;
                    payload.cliente.razon_social = ultimoCheckout.razonSocial;
                    payload.cliente._campos_separados = true;
                    init = { ...init, body: JSON.stringify(payload) };
                }
            }
        } catch (err) {
            console.warn('Error al adjuntar datos separados:', err);
        }
        return fetchOriginal.call(this, input, init);
    };

    function obtenerLabelDeInput(popup, input) {
        if (!input) return null;
        if (input.id) {
            const byFor = popup.querySelector(`label[for="${CSS.escape(input.id)}"]`);
            if (byFor && !byFor.querySelector('input[type="radio"]')) return byFor;
        }
        const prev = input.previousElementSibling;
        if (prev && prev.tagName === 'LABEL' && !prev.querySelector('input[type="radio"]')) {
            return prev;
        }
        return null;
    }

    function obtenerContenedorSeguro(input) {
        if (!input || !input.parentElement) return null;
        const padre = input.parentElement;
        const totalInputs = padre.querySelectorAll('input').length;
        const tieneRadios = padre.querySelectorAll('input[type="radio"]').length > 0;
        // Solo ocultamos el padre si envuelve únicamente a este input y ningún radio
        return (totalInputs === 1 && !tieneRadios) ? padre : null;
    }

    function toggleCampo(popup, input, visible) {
        if (!input) return;
        const display = visible ? '' : 'none';
        const contenedor = obtenerContenedorSeguro(input);

        if (contenedor) {
            contenedor.style.setProperty('display', display, 'important');
        } else {
            const label = obtenerLabelDeInput(popup, input);
            if (label) label.style.setProperty('display', display, 'important');
            input.style.setProperty('display', display, 'important');

            const siguiente = input.nextElementSibling;
            if (siguiente && !['LABEL', 'INPUT'].includes(siguiente.tagName) && !siguiente.querySelector('input')) {
                siguiente.style.setProperty('display', display, 'important');
            }
        }

        // Nunca bloquear el campo que está visible
        if (visible) {
            input.disabled = false;
            input.readOnly = false;
            input.removeAttribute('disabled');
            input.removeAttribute('readonly');
        }
    }

    function configurarModalComprobante(popup) {
        if (!popup || popup.dataset.validacionLista === '1') return;

        const titulo = popup.querySelector('.swal2-title')?.textContent || '';
        if (!titulo.toLowerCase().includes('comprobante')) return;

        popup.dataset.validacionLista = '1';

        const inputsTexto = Array.from(
            popup.querySelectorAll('input:not([type="radio"]):not([type="checkbox"]):not([type="hidden"])')
        );

        const buscarInput = (regex) => inputsTexto.find(inp => {
            const label = obtenerLabelDeInput(popup, inp);
            const texto = `${inp.id} ${inp.name} ${inp.placeholder} ${label ? label.textContent : ''}`;
            return regex.test(texto);
        });

        const inputNombre = buscarInput(/nombre|raz[oó]n/i) || inputsTexto[0];
        const inputDni = buscarInput(/\bdni\b/i);
        const inputRuc = buscarInput(/\bruc\b/i);
        const inputCorreo = buscarInput(/correo|email/i);
        const inputTelefono = buscarInput(/tel[eé]fono|cel/i);

        // 1. Separar Nombre completo y Razón social con margen limpio
        let inputRazonSocial = popup.querySelector('#checkoutRazonSocialExtra');
        let labelRazonSocial = popup.querySelector('label[for="checkoutRazonSocialExtra"]');

        if (inputNombre && !inputRazonSocial) {
            const labelNombre = obtenerLabelDeInput(popup, inputNombre);
            if (labelNombre) labelNombre.textContent = 'Nombre completo *';
            inputNombre.placeholder = 'Ej. Carlos Mendoza';

            const wrapperRazon = document.createElement('div');
            wrapperRazon.style.marginTop = '16px';
            wrapperRazon.style.marginBottom = '16px';
            wrapperRazon.innerHTML = `
                <label for="checkoutRazonSocialExtra" class="form-label">Razón social (opcional)</label>
                <input type="text" id="checkoutRazonSocialExtra" class="${inputNombre.className || 'form-control'}"
                    placeholder="Ej. Evento Fiestero / Bodega S.A.C.">
            `;

            const ref = obtenerContenedorSeguro(inputNombre) || inputNombre;
            ref.insertAdjacentElement('afterend', wrapperRazon);

            inputRazonSocial = wrapperRazon.querySelector('#checkoutRazonSocialExtra');
            labelRazonSocial = wrapperRazon.querySelector('label');
        }

        const sincronizarExtras = () => {
            ultimoCheckout.activo = true;
            ultimoCheckout.nombre = (inputNombre?.value || '').trim();
            ultimoCheckout.razonSocial = (inputRazonSocial?.value || '').trim();
        };

        inputNombre?.addEventListener('input', sincronizarExtras);
        inputRazonSocial?.addEventListener('input', sincronizarExtras);

        // 2. Solo números en DNI (8), RUC (11) y Teléfono (9)
        if (inputDni) {
            inputDni.maxLength = 8;
            inputDni.addEventListener('input', () => {
                inputDni.value = inputDni.value.replace(/\D/g, '').slice(0, 8);
            });
        }
        if (inputRuc) {
            inputRuc.maxLength = 11;
            inputRuc.addEventListener('input', () => {
                inputRuc.value = inputRuc.value.replace(/\D/g, '').slice(0, 11);
            });
        }
        if (inputTelefono) {
            inputTelefono.maxLength = 9;
            inputTelefono.addEventListener('input', () => {
                inputTelefono.value = inputTelefono.value.replace(/\D/g, '').slice(0, 9);
            });
        }

        // 3. Control simple de visibilidad: si marcas DNI se oculta RUC, si marcas RUC se oculta DNI
        const radios = Array.from(popup.querySelectorAll('input[type="radio"]'));
        const radioRuc = radios.find(r => {
            const texto = `${r.value} ${r.id} ${r.closest('label')?.textContent || ''} ${r.nextElementSibling?.textContent || ''}`.toLowerCase();
            return texto.includes('ruc');
        }) || radios[1];

        function actualizarDocumento() {
            const esRuc = Boolean(radioRuc && radioRuc.checked);

            toggleCampo(popup, inputDni, !esRuc);
            toggleCampo(popup, inputRuc, esRuc);

            if (labelRazonSocial) {
                labelRazonSocial.textContent = esRuc ? 'Razón social *' : 'Razón social (opcional)';
            }
        }

        radios.forEach(r => {
            r.addEventListener('change', () => setTimeout(actualizarDocumento, 10));
            r.addEventListener('click', () => setTimeout(actualizarDocumento, 10));
        });

        actualizarDocumento();
        setTimeout(actualizarDocumento, 60);

        // 4. Validaciones al confirmar
        const btnConfirm = popup.querySelector('.swal2-confirm');
        if (btnConfirm) {
            btnConfirm.addEventListener('click', (e) => {
                sincronizarExtras();
                const errores = [];
                const esRuc = Boolean(radioRuc && radioRuc.checked);

                if (ultimoCheckout.nombre.length < 3) {
                    errores.push('El nombre completo debe tener al menos 3 caracteres.');
                }

                if (esRuc && ultimoCheckout.razonSocial.length < 3) {
                    errores.push('Para comprobante con RUC debes ingresar la razón social.');
                }

                if (esRuc) {
                    if (!/^\d{11}$/.test((inputRuc?.value || '').trim())) {
                        errores.push('El RUC debe tener exactamente 11 dígitos numéricos.');
                    }
                } else {
                    if (!/^\d{8}$/.test((inputDni?.value || '').trim())) {
                        errores.push('El DNI debe tener exactamente 8 dígitos numéricos.');
                    }
                }

                if (inputCorreo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputCorreo.value.trim())) {
                    errores.push('Ingresa un correo electrónico válido.');
                }

                if (inputTelefono && !/^9\d{8}$/.test(inputTelefono.value.trim())) {
                    errores.push('El teléfono debe tener 9 dígitos y empezar con 9.');
                }

                if (errores.length > 0) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    if (typeof Swal !== 'undefined' && typeof Swal.showValidationMessage === 'function') {
                        Swal.showValidationMessage(errores[0]);
                    }
                }
            }, true);
        }
    }

    const observer = new MutationObserver(() => {
        const popup = document.querySelector('.swal2-popup');
        if (popup) configurarModalComprobante(popup);
    });

    document.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, { childList: true, subtree: true });
    });
})();