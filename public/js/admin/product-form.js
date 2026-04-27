(function () {
    'use strict';

    // Inicializar preview de imagen
    function initImagePreview(inputId, imgId, placeholderId) {
        const input = document.getElementById(inputId);
        const img = document.getElementById(imgId);
        const placeholder = document.getElementById(placeholderId);
        if (!input || !img) return;

        function updatePreview() {
            const url = input.value.trim();
            if (url) {
                img.src = url;
                img.onload = () => {
                    img.classList.remove('oculto');
                    if (placeholder) placeholder.classList.add('oculto');
                };
                img.onerror = () => {
                    img.classList.add('oculto');
                    if (placeholder) placeholder.classList.remove('oculto');
                };
            } else {
                img.classList.add('oculto');
                if (placeholder) placeholder.classList.remove('oculto');
            }
        }
        input.addEventListener('input', updatePreview);
        updatePreview();
    }

    // Inicializar sistema de chips
    function initChips(contenedorId, inputId, hiddenId) {
        const contenedor = document.getElementById(contenedorId);
        const input = document.getElementById(inputId);
        const hidden = document.getElementById(hiddenId);

        // Si no se encuentran los elementos necesarios, salir sin hacer nada
        if (!contenedor || !input || !hidden) return;

        function getValues() {
            return Array.from(contenedor.querySelectorAll('.chip')).map(chip => chip.dataset.valor);
        }
        function updateHidden() {
            hidden.value = getValues().join(',');
        }

        function addChip(val) {
            val = val.trim();
            if (!val) return;
            if (getValues().includes(val)) return;
            const chip = document.createElement('span');
            chip.className = 'chip';
            chip.dataset.valor = val;
            chip.innerHTML = `${val}<button type="button" class="chip__eliminar" aria-label="Eliminar ${val}">×</button>`;
            chip.querySelector('.chip__eliminar').addEventListener('click', () => {
                chip.remove();
                updateHidden();
            });
            contenedor.insertBefore(chip, input);
            updateHidden();
        }

        // Permitir eliminar chips existentes (en caso de edición)
        contenedor.querySelectorAll('.chip__eliminar').forEach(btn => {
            btn.addEventListener('click', function () {
                this.closest('.chip').remove();
                updateHidden();
            });
        });
        // Manejar entrada de nuevas chips
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                addChip(input.value.replace(',', ''));
                input.value = '';
            } else if (e.key === 'Backspace' && input.value === '') {
                const chips = contenedor.querySelectorAll('.chip');
                if (chips.length) chips[chips.length - 1].remove();
                updateHidden();
            }
        });
        // Manejar pérdida de foco para agregar chip si hay texto
        input.addEventListener('blur', () => {
            if (input.value.trim()) {
                addChip(input.value);
                input.value = '';
            }
        });
    }

    // Inicializar toggle de instalación
    function initInstalacionToggle() {
        const toggleInstalacion = document.getElementById('instalacionDisponible');
        const selectServicio = document.getElementById('instalacionServicioId');
        const panelInstalacion = document.getElementById('instalacionPanel');

        if (!toggleInstalacion) return;

        function actualizarEstado() {
            const estaActivado = toggleInstalacion.checked;

            if (panelInstalacion) {
                if (estaActivado) {
                    panelInstalacion.classList.remove('oculto');
                } else {
                    panelInstalacion.classList.add('oculto');
                }
            }

            if (selectServicio) {
                selectServicio.disabled = !estaActivado;
                if (!estaActivado) {
                    selectServicio.value = '';
                }
            }
        }

        toggleInstalacion.addEventListener('change', actualizarEstado);
        actualizarEstado(); // Estado inicial
    }

    // Calcular descuento
    function initDescuentoPreview() {
        const precio = document.getElementById('precioInstalacion');
        const original = document.getElementById('precioOriginal');
        const preview = document.getElementById('descuentoPreview');
        const badge = document.getElementById('descuentoBadge');
        if (!precio || !original || !preview || !badge) return;

        function update() {
            const p = parseFloat(precio.value) || 0;
            const o = parseFloat(original.value) || 0;
            if (p > 0 && o > p) {
                const pct = Math.round(((o - p) / o) * 100);
                badge.textContent = `${pct}% de descuento`;
                preview.style.display = '';
            } else {
                preview.style.display = 'none';
            }
        }
        precio.addEventListener('input', update);
        original.addEventListener('input', update);
        update();
    }

    // Estado activo
    function initEstadoToggle() {
        const toggle = document.getElementById('activo');
        const dot = document.querySelector('.estado-indicator__dot');
        const text = document.getElementById('estadoTexto');
        if (!toggle || !dot || !text) return;
        toggle.addEventListener('change', () => {
            if (toggle.checked) {
                dot.className = 'estado-indicator__dot estado-indicator__dot--activo';
                text.textContent = 'Visible en el sitio';
            } else {
                dot.className = 'estado-indicator__dot estado-indicator__dot--inactivo';
                text.textContent = 'Oculto del sitio';
            }
        });
    }

    // Validación del formulario
    function initFormValidation() {
        const form = document.getElementById('formProducto');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            let valid = true;

            const fields = [
                { id: 'nombre', errorId: 'error-nombre', msg: 'El nombre es obligatorio.' },
                { id: 'sku', errorId: 'error-sku', msg: 'El SKU es obligatorio.' },
                { id: 'categoriaId', errorId: 'error-categoriaId', msg: 'Seleccioná una categoría.' },
                { id: 'descripcion', errorId: 'error-descripcion', msg: 'La descripción es obligatoria.' },
                { id: 'imagen', errorId: 'error-imagen', msg: 'La URL de imagen es obligatoria.' },
                { id: 'precio', errorId: 'error-precio', msg: 'Ingresá un precio válido.' }
            ];

            fields.forEach(f => {
                const input = document.getElementById(f.id);
                const errorSpan = document.getElementById(f.errorId);
                if (errorSpan) errorSpan.textContent = '';
                if (input) input.classList.remove('entrada-error');

                if (!input || !input.value.trim()) {
                    if (errorSpan) errorSpan.textContent = f.msg;
                    if (input) input.classList.add('entrada-error');
                    valid = false;
                } else if (f.id === 'precio' && parseFloat(input.value) <= 0) {
                    if (errorSpan) errorSpan.textContent = 'El precio debe ser mayor a 0.';
                    input.classList.add('entrada-error');
                    valid = false;
                }
            });

            if (!valid) e.preventDefault();
        });
    }

    // Inicializar todo cuando el DOM esté listo
    document.addEventListener('DOMContentLoaded', () => {
        initImagePreview('imagen', 'previewImg_imagen', 'previewPlaceholder_imagen');
        initChips('contenedorColores', 'inputColor', 'coloresHidden');
        initChips('contenedorTalles', 'inputTalle', 'tallesHidden');
        initInstalacionToggle();
        initDescuentoPreview();
        initEstadoToggle();
        initFormValidation();
    });
})();