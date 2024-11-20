// frontend/js/filters.js
import { fetchAPI } from './utils.js';

class FiltersService {
    constructor() {
        this.currentFilters = {
            clima: 'todos',
            municipio: 'todos',
            calificacion: 'todos',
            searchTerm: ''
        };

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Búsqueda
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentFilters.searchTerm = e.target.value;
                this.applyFilters();
            });
        }

        // Filtros
        document.querySelectorAll('.filter-options').forEach(filterGroup => {
            filterGroup.addEventListener('click', (e) => {
                if (e.target.classList.contains('filter-option')) {
                    // Remover active de otros filtros en el mismo grupo
                    const siblings = e.target.parentElement.children;
                    Array.from(siblings).forEach(sibling => 
                        sibling.classList.remove('active'));
                    
                    // Activar el filtro seleccionado
                    e.target.classList.add('active');

                    // Actualizar filtros
                    const filterType = e.target.parentElement.previousElementSibling.textContent.toLowerCase();
                    this.currentFilters[filterType] = e.target.textContent.toLowerCase();
                    this.applyFilters();
                }
            });
        });
    }

    async applyFilters() {
        try {
            // Obtener todos los charcos
            let charcos = await fetchAPI('/');

            // Aplicar filtros
            charcos = charcos.filter(charco => {
                // Filtro de búsqueda
                if (this.currentFilters.searchTerm) {
                    const searchTerm = this.currentFilters.searchTerm.toLowerCase();
                    if (!charco.nombre.toLowerCase().includes(searchTerm) &&
                        !charco.descripcion.toLowerCase().includes(searchTerm)) {
                        return false;
                    }
                }

                // Filtro de clima
                if (this.currentFilters.clima !== 'todos' && 
                    charco.clima.toLowerCase() !== this.currentFilters.clima) {
                    return false;
                }

                // Filtro de municipio
                if (this.currentFilters.municipio !== 'todos' && 
                    charco.municipio_nombre.toLowerCase() !== this.currentFilters.municipio) {
                    return false;
                }

                // Filtro de calificación
                if (this.currentFilters.calificacion !== 'todos') {
                    const rating = parseFloat(charco.calificacion);
                    switch(this.currentFilters.calificacion) {
                        case '9 y arriba':
                            if (rating < 9) return false;
                            break;
                        case '7 a 9':
                            if (rating < 7 || rating >= 9) return false;
                            break;
                        case 'menos de 7':
                            if (rating >= 7) return false;
                            break;
                    }
                }

                return true;
            });

            // Renderizar resultados
            this.renderResults(charcos);
        } catch (error) {
            console.error('Error aplicando filtros:', error);
            alert('Error al filtrar los charcos. Por favor intenta de nuevo.');
        }
    }

    renderResults(charcos) {
        const container = document.getElementById('charcos-container');
        if (!container) return;

        if (charcos.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h3>No se encontraron resultados</h3>
                    <p>Intenta con otros filtros o términos de búsqueda</p>
                </div>
            `;
            return;
        }

        container.innerHTML = charcos.map(charco => `
            <div class="card">
                <img src="${charco.imagen_principal || '/placeholder.jpg'}" alt="${charco.nombre}">
                <div class="card-content">
                    <h2>${charco.nombre}</h2>
                    <div class="location">
                        <i class="fas fa-map-marker-alt"></i>
                        ${charco.municipio_nombre}
                    </div>
                    <div class="card-description">
                        ${charco.descripcion}
                    </div>
                    <div class="rating">
                        <div class="rating-score">${charco.calificacion}</div>
                        <div class="rating-text">
                            ${charco.calificacion >= 9 ? 'Excelente' : 'Muy bueno'}
                        </div>
                    </div>
                </div>
                <div class="card-hover-info">
                    <p>Profundidad: ${charco.profundidad} metros</p>
                    <p>Costo: ${charco.costo === 0 ? 'Gratis' : `$${charco.costo.toLocaleString()}`}</p>
                    <button class="btn btn-outline favorite-btn" data-id="${charco.id_charco}">
                        <i class="fas fa-heart"></i> Agregar a favoritos
                    </button>
                </div>
            </div>
        `).join('');

        // Agregar event listeners para los botones de favoritos
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const charcoId = e.target.dataset.id;
                this.toggleFavorite(charcoId);
            });
        });
    }

    async toggleFavorite(charcoId) {
        // Esta funcionalidad la implementaremos en el siguiente paso
        console.log('Toggle favorite:', charcoId);
    }
}

// Inicializar el servicio de filtros cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('charcos-container')) {
        new FiltersService();
    }
});

export default FiltersService;