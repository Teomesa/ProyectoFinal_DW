// frontend/js/charcos.js
class CharcosService {
    constructor() {
        this.charcos = [];
        this.filtros = {
            clima: 'todos',
            municipio: 'todos'
        };
        this.init();
    }

    async init() {
        await this.loadCharcos();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Configurar búsqueda
        const searchInput = document.querySelector('.search-bar input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterCharcos(e.target.value);
            });
        }

        document.querySelectorAll('.filter-options').forEach(filterGroup => {
            filterGroup.addEventListener('click', (e) => {
                if (e.target.classList.contains('filter-option')) {
                    const filterType = e.target.parentElement.closest('.filter-group').querySelector('h3').textContent.toLowerCase();
                    const filterValue = e.target.textContent.toLowerCase();
                    
                    // Actualizar botones activos
                    const siblings = e.target.parentElement.children;
                    Array.from(siblings).forEach(sibling => sibling.classList.remove('active'));
                    e.target.classList.add('active');

                    // Actualizar filtros
                    this.filtros[filterType] = filterValue;
                    this.applyFilters();
                }
            });
        });
    }

    applyFilters() {
        let filteredCharcos = [...this.charcos];

        // Filtrar por clima
        if (this.filtros.clima !== 'todos') {
            filteredCharcos = filteredCharcos.filter(charco => 
                charco.clima?.toLowerCase() === this.filtros.clima
            );
        }

        // Filtrar por municipio
        if (this.filtros.municipio !== 'todos') {
            filteredCharcos = filteredCharcos.filter(charco => 
                charco.municipio_nombre?.toLowerCase() === this.filtros.municipio
            );
        }

        this.renderCharcos(filteredCharcos);
    }

    filterCharcos(searchTerm) {
        if (!this.charcos) return;

        let filtered = [...this.charcos];

        // Aplicar búsqueda por texto si existe
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(charco => 
                charco.nombre.toLowerCase().includes(searchLower) ||
                charco.municipio_nombre.toLowerCase().includes(searchLower)
            );
        }

        // Aplicar filtros actuales
        if (this.filtros.clima !== 'todos') {
            filtered = filtered.filter(charco => 
                charco.clima?.toLowerCase() === this.filtros.clima
            );
        }

        if (this.filtros.municipio !== 'todos') {
            filtered = filtered.filter(charco => 
                charco.municipio_nombre.toLowerCase() === this.filtros.municipio
            );
        }

        this.renderCharcos(filtered);
    }

    async loadCharcos() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/';
                return;
            }

            const response = await fetch('http://localhost:3000/api/charcos', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al cargar los charcos');
            }

            this.charcos = await response.json();
            this.renderCharcos(this.charcos);
        } catch (error) {
            console.error('Error cargando charcos:', error);
            const container = document.getElementById('charcos-container');
            if (container) {
                container.innerHTML = `
                    <div class="error-message">
                        <p>Error al cargar los charcos. Por favor, intenta de nuevo.</p>
                        <button onclick="location.reload()" class="btn btn-primary">
                            Reintentar
                        </button>
                    </div>
                `;
            }
        }
    }

    filterCharcos(searchTerm) {
        if (!this.charcos || !searchTerm) {
            this.renderCharcos(this.charcos);
            return;
        }

        const searchLower = searchTerm.toLowerCase().trim();
        const filtered = this.charcos.filter(charco => {
            return charco.nombre.toLowerCase().includes(searchLower) ||
                   charco.municipio_nombre.toLowerCase().includes(searchLower);
        });

        this.renderCharcos(filtered);
    }

    renderCharcos(charcosToRender) {
        const container = document.getElementById('charcos-container');
        if (!container) return;

        if (!charcosToRender || charcosToRender.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h3>No se encontraron charcos</h3>
                    <p>Intenta con otros términos de búsqueda</p>
                </div>
            `;
            return;
        }

        container.innerHTML = charcosToRender.map(charco => `
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
                    <p><i class="fas fa-thermometer-half"></i> Clima: ${charco.clima || 'No especificado'}</p>
                    <p><i class="fas fa-water"></i> Profundidad: ${charco.profundidad} metros</p>
                    <p><i class="fas fa-dollar-sign"></i> Costo: ${charco.costo === 0 ? 'Gratis' : `$${charco.costo.toLocaleString()}`}</p>
                </div>
            </div>
        `).join('');
    }
}

// Inicializar el servicio cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    new CharcosService();
});

export default CharcosService;