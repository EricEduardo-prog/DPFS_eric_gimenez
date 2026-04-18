(function () {
    'use strict';

    // Toggle de visibilidad de contraseña
    function initPasswordToggle() {
        const toggleButtons = document.querySelectorAll('.boton-visibilidad');

        toggleButtons.forEach(btn => {
            btn.addEventListener('click', function () {
                const targetId = this.dataset.target;
                const passwordInput = document.getElementById(targetId);

                if (passwordInput) {
                    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                    passwordInput.setAttribute('type', type);

                    // Cambiar ícono
                    const svg = this.querySelector('svg');
                    if (svg) {
                        if (type === 'text') {
                            svg.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
                        } else {
                            svg.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
                        }
                    }
                }
            });
        });
    }

    // Validación en tiempo real de requisitos
    function initPasswordStrength() {
        const passwordInput = document.getElementById('passwordNuevo');
        if (!passwordInput) return;

        const requisitos = {
            longitud: document.getElementById('requisito-longitud'),
            mayuscula: document.getElementById('requisito-mayuscula'),
            minuscula: document.getElementById('requisito-minuscula'),
            numero: document.getElementById('requisito-numero')
        };

        function actualizarRequisito(elemento, cumple) {
            if (!elemento) return;
            if (cumple) {
                elemento.classList.add('requisito-item--cumplido');
                const svg = elemento.querySelector('svg');
                if (svg) {
                    svg.innerHTML = '<polyline points="20 6 9 17 4 12" />';
                }
            } else {
                elemento.classList.remove('requisito-item--cumplido');
                const svg = elemento.querySelector('svg');
                if (svg) {
                    svg.innerHTML = '<circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />';
                }
            }
        }

        function verificarRequisitos() {
            const password = passwordInput.value;

            actualizarRequisito(requisitos.longitud, password.length >= 6);
            actualizarRequisito(requisitos.mayuscula, /[A-Z]/.test(password));
            actualizarRequisito(requisitos.minuscula, /[a-z]/.test(password));
            actualizarRequisito(requisitos.numero, /[0-9]/.test(password));
        }

        passwordInput.addEventListener('input', verificarRequisitos);
        verificarRequisitos();
    }

    // Validación del formulario
    function initFormValidation() {
        const form = document.getElementById('formCambiarPassword');
        if (!form) return;

        form.addEventListener('submit', function (e) {
            let valid = true;

            // Limpiar errores anteriores
            document.querySelectorAll('.mensaje-error').forEach(el => el.textContent = '');
            document.querySelectorAll('.entrada').forEach(el => el.classList.remove('entrada-error'));

            function showError(id, msg) {
                const errorSpan = document.getElementById(id);
                if (errorSpan) errorSpan.textContent = msg;
                const input = document.getElementById(id.replace('error-', ''));
                if (input) input.classList.add('entrada-error');
                valid = false;
            }

            // Validar contraseña actual
            const passwordActual = document.getElementById('passwordActual');
            if (!passwordActual.value.trim()) {
                showError('error-passwordActual', 'La contraseña actual es obligatoria.');
            }

            // Validar nueva contraseña
            const passwordNuevo = document.getElementById('passwordNuevo');
            if (!passwordNuevo.value.trim()) {
                showError('error-passwordNuevo', 'La nueva contraseña es obligatoria.');
            } else if (passwordNuevo.value.trim().length < 6) {
                showError('error-passwordNuevo', 'La nueva contraseña debe tener al menos 6 caracteres.');
            }

            // Validar confirmación
            const passwordConfirmar = document.getElementById('passwordConfirmar');
            if (passwordNuevo.value.trim() !== passwordConfirmar.value.trim()) {
                showError('error-passwordConfirmar', 'Las contraseñas no coinciden.');
            }

            if (!valid) {
                e.preventDefault();
            }
        });
    }

    // Inicializar
    document.addEventListener('DOMContentLoaded', () => {
        initPasswordToggle();
        initPasswordStrength();
        initFormValidation();
    });
})();