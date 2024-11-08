// frontend/js/charcos.js
import { fetchAPI, checkAuth } from './utils.js';

class CharcosService {
    constructor() {
        this.charcos = [];
    }

    async initialize() {
        try {
            if (!checkAuth()) return;
            await this.loadCharcos();
            this.initializeEventListeners();
        } catch (error) {
            console.error('Error inicializando CharcoService:', error);
        }
    }

    async loadCharcos() {
        try {
            const charcos = await fetchAPI('/charcos');
            this.charcos = charcos;
            this.renderCharcos();
        } catch (error) {
            console.error('Error cargando charcos:', error);
            document.getElementById('charcos-container').innerHTML = `
                <div class="error-message" style="padding: 20px; text-align: center;">
                    <p>Error cargando los charcos. Por favor intenta de nuevo.</p>
                    <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 10px;">
                        Reintentar
                    </button>
                </div>
            `;
        }
        console.log('Respuesta de charcos:', this.charcos);
    }

    renderCharcos() {
        const container = document.getElementById('charcos-container');
        if (!container) return;

        if (this.charcos.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <p>No se encontraron charcos disponibles.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.charcos.map(charco => `
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
                            ${charco.calificacion}
                        </div>
                    </div>
                </div>
                <div class="card-hover-info">
                    <p>Profundidad: ${charco.profundidad || 'No especificada'} metros</p>
                    <p>Costo: ${charco.costo === 0 ? 'Gratis' : `$${charco.costo.toLocaleString()}`}</p>
                    <button class="btn btn-outline favorite-btn" data-id="${charco.id_charco}">
                        <i class="fas fa-heart"></i> 
                        ${charco.is_favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                    </button>
                </div>
            </div>
        `).join('');

        this.initializeFavoriteButtons();
    }

    initializeEventListeners() {
        // Inicializar filtros y búsqueda aquí si es necesario
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterCharcos(e.target.value);
            });
        }

        // Agregar listener para el botón de logout si existe
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                logout();
            });
        }
    }

    filterCharcos(searchTerm) {
        if (!searchTerm) {
            this.renderCharcos();
            return;
        }

        const filteredCharcos = this.charcos.filter(charco => 
            charco.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            charco.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
            charco.municipio_nombre.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const container = document.getElementById('charcos-container');
        if (filteredCharcos.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <p>No se encontraron charcos que coincidan con "${searchTerm}"</p>
                </div>
            `;
            return;
        }

        this.renderFilteredCharcos(filteredCharcos);
    }

    renderFilteredCharcos(charcos) {
        // Similar a renderCharcos pero con la lista filtrada
        // Implementar si es necesario
    }

    initializeFavoriteButtons() {
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const charcoId = e.target.dataset.id;
                try {
                    await this.toggleFavorite(charcoId);
                    await this.loadCharcos(); // Recargar para actualizar el estado
                } catch (error) {
                    console.error('Error al modificar favorito:', error);
                }
            });
        });
    }

    async toggleFavorite(charcoId) {
        try {
            await fetchAPI(`/charcos/${charcoId}/favorite`, {
                method: 'POST'
            });
        } catch (error) {
            console.error('Error al modificar favorito:', error);
            throw error;
        }
    }
}

// Inicializar el servicio cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    const charcosService = new CharcosService();
    charcosService.initialize();
});

export default CharcosService;