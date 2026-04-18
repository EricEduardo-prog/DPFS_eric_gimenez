(function() {
  'use strict';

  // ============================================================
  // 1. CONFIRMACIÓN PARA TOGGLE DE ESTADO
  // ============================================================
  function initToggleEstado() {
    const btns = document.querySelectorAll('.btn-toggle-estado');
    
    btns.forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        
        const id = this.dataset.id;
        const nombre = this.dataset.nombre;
        const activo = this.dataset.activo === 'true';
        
        let mensaje = '';
        if (activo) {
          mensaje = `¿Desactivar el producto "${nombre}"? Dejará de mostrarse en el sitio.`;
        } else {
          mensaje = `¿Reactivar el producto "${nombre}"? Volverá a mostrarse en el sitio.`;
        }
        
        if (confirm(mensaje)) {
          const form = this.closest('.form-toggle-estado');
          if (form) {
            form.submit();
          }
        }
      });
    });
  }

  // ============================================================
  // 2. ORDENAMIENTO DE TABLA (sortable)
  // ============================================================
  function initSortableTable() {
    const table = document.getElementById('productosTabla');
    if (!table) return;
    
    const headers = table.querySelectorAll('th.sortable');
    let currentSort = { column: null, direction: 'asc' };
    
    headers.forEach(header => {
      header.addEventListener('click', () => {
        const sortKey = header.dataset.sort;
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        
        // Determinar dirección
        if (currentSort.column === sortKey) {
          currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
          currentSort.direction = 'asc';
        }
        currentSort.column = sortKey;
        
        // Actualizar iconos
        headers.forEach(h => {
          const icon = h.querySelector('.sort-icon');
          if (icon) icon.textContent = '↕️';
        });
        const currentIcon = header.querySelector('.sort-icon');
        if (currentIcon) {
          currentIcon.textContent = currentSort.direction === 'asc' ? '↑' : '↓';
        }
        
        // Ordenar filas
        rows.sort((a, b) => {
          let aVal, bVal;
          
          switch(sortKey) {
            case 'nombre':
              aVal = a.dataset.nombre || a.querySelector('.admin-tabla__nombre')?.textContent.toLowerCase() || '';
              bVal = b.dataset.nombre || b.querySelector('.admin-tabla__nombre')?.textContent.toLowerCase() || '';
              break;
            case 'sku':
              aVal = a.dataset.sku || a.querySelector('.admin-tabla__codigo')?.textContent.toLowerCase() || '';
              bVal = b.dataset.sku || b.querySelector('.admin-tabla__codigo')?.textContent.toLowerCase() || '';
              break;
            case 'precio':
              aVal = parseFloat(a.dataset.precio) || 0;
              bVal = parseFloat(b.dataset.precio) || 0;
              break;
            default:
              return 0;
          }
          
          if (typeof aVal === 'number') {
            return currentSort.direction === 'asc' ? aVal - bVal : bVal - aVal;
          }
          return currentSort.direction === 'asc' 
            ? aVal.localeCompare(bVal) 
            : bVal.localeCompare(aVal);
        });
        
        // Reordenar DOM
        rows.forEach(row => tbody.appendChild(row));
      });
    });
  }

  // ============================================================
  // 3. MANEJO DE ERRORES DE IMÁGENES
  // ============================================================
  function initImageErrorHandling() {
    const images = document.querySelectorAll('.admin-tabla__img');
    images.forEach(img => {
      img.addEventListener('error', function() {
        this.style.display = 'none';
        const placeholder = this.parentElement?.querySelector('.admin-tabla__img-placeholder');
        if (placeholder) placeholder.style.display = 'flex';
      });
    });
  }

  // ============================================================
  // 4. PERSISTENCIA DE FILTROS (opcional - guardar en localStorage)
  // ============================================================
  function initFilterPersistence() {
    const filtrosForm = document.getElementById('filtrosForm');
    if (!filtrosForm) return;
    
    // Cargar filtros guardados
    const savedCategoria = localStorage.getItem('productos_filtro_categoria');
    const savedSoloActivos = localStorage.getItem('productos_filtro_soloActivos');
    
    if (savedCategoria) {
      const select = filtrosForm.querySelector('select[name="categoriaId"]');
      if (select && select.querySelector(`option[value="${savedCategoria}"]`)) {
        select.value = savedCategoria;
      }
    }
    
    if (savedSoloActivos === 'true') {
      const checkbox = filtrosForm.querySelector('input[name="soloActivos"]');
      if (checkbox) checkbox.checked = true;
    }
    
    // Guardar filtros al enviar
    filtrosForm.addEventListener('submit', () => {
      const select = filtrosForm.querySelector('select[name="categoriaId"]');
      const checkbox = filtrosForm.querySelector('input[name="soloActivos"]');
      
      if (select && select.value) {
        localStorage.setItem('productos_filtro_categoria', select.value);
      } else {
        localStorage.removeItem('productos_filtro_categoria');
      }
      
      localStorage.setItem('productos_filtro_soloActivos', checkbox?.checked || false);
    });
  }

  // ============================================================
  // 5. INICIALIZACIÓN
  // ============================================================
  document.addEventListener('DOMContentLoaded', () => {
    initToggleEstado();
    initSortableTable();
    initImageErrorHandling();
    initFilterPersistence();
  });
})();