// frontend/js/charcos.js
class CharcosService {
    constructor() {
        this.charcos = [];
        this.filtros = {
            clima: 'todos',
            municipio: 'todos'
        };
        // Vincular los métodos que usan 'this'
        this.toggleFavorite = this.toggleFavorite.bind(this);
        this.updateFavoriteButton = this.updateFavoriteButton.bind(this);
        this.updateFavoriteButtons = this.updateFavoriteButtons.bind(this);
        this.renderCharcos = this.renderCharcos.bind(this);
        this.isFavoritesView = false; 
        // Iniciar la carga de datos
        this.initialize();
    }

    async initialize() {
        try {
            // Primero cargar favoritos
            await this.loadFavorites();
            // Luego cargar charcos
            await this.loadCharcos();
            // Finalmente configurar los event listeners y filtros
            this.setupEventListeners();
            this.setupFilters();
        } catch (error) {
            console.error('Error en la inicialización:', error);
        }
    }

    setupEventListeners() {
        // Configurar búsqueda
        const searchInput = document.querySelector('.search-bar input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterCharcos(e.target.value);
            });
        }

        // Event listener para cerrar el modal
        const closeBtn = document.querySelector('.modal .close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                document.getElementById('opinion-modal').style.display = 'none';
            });
        }

        // Event listeners para las estrellas
        const stars = document.querySelectorAll('.stars i');
        if (stars) {
            stars.forEach((star, index) => {
                star.addEventListener('click', () => {
                    this.currentRating = index + 1;
                    this.updateStars(this.currentRating);
                });
            });
        }

        // Event listener para el formulario de opiniones
        const opinionForm = document.getElementById('opinion-form');
        if (opinionForm) {
            opinionForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleOpinionSubmit(e);
            });
        }

        // Agregar listeners para las tarjetas de charcos
        document.querySelectorAll('.card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.action-btn')) {
                    const charcoId = card.dataset.charcoId;
                    const charcoName = card.querySelector('h2').textContent;
                    this.openOpinionModal(charcoId, charcoName);
                }
            });
        });

        // Event listener para clicks fuera del modal
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('opinion-modal');
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });

        // Agregar listener para el botón de favoritos en el header
        const favoritosBtn = document.querySelector('[data-action="favoritos"]');
    
        if (favoritosBtn) {
            console.log('Botón de favoritos encontrado');
            favoritosBtn.addEventListener('click', () => {
                console.log('Clic en favoritos');
                this.toggleFavoritesView();
            });
        } else {
            console.error('No se encontró el botón de favoritos');
        }
    }
    
    async handleOpinionSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const modal = document.getElementById('opinion-modal');
        const charcoId = modal.dataset.charcoId;

        if (!this.currentRating) {
            alert('Por favor, selecciona una calificación');
            return;
        }

        const formData = new FormData(form);
        formData.append('calificacion', this.currentRating);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3000/api/charcos/${charcoId}/opinions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Error al enviar la opinión');
            }

            await this.loadOpinions(charcoId);
            await this.loadCharcos();
            form.reset();
            this.currentRating = 0;
            this.updateStars(0);
            alert('Opinión enviada exitosamente');

        } catch (error) {
            console.error('Error:', error);
            alert(error.message);
        }
    }

    async loadOpinions(charcoId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3000/api/charcos/${charcoId}/opinions`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al cargar las opiniones');
            }

            const opinions = await response.json();
            const container = document.getElementById('opinions-container');
            
            if (!container) {
                console.error('Contenedor de opiniones no encontrado');
                return;
            }

            if (opinions.length === 0) {
                container.innerHTML = '<p>No hay opiniones aún. ¡Sé el primero en opinar!</p>';
                return;
            }

            container.innerHTML = opinions.map(opinion => {
                // Asegurar que la calificación sea un número y convertirlo a entero
                const rating = Math.round(Number(opinion.calificacion)) || 0;
                
                // Crear las estrellas manualmente en lugar de usar repeat
                const filledStars = Array(rating).fill('★').join('');
                const emptyStars = Array(10 - rating).fill('☆').join('');

                return `
                    <div class="opinion-card">
                        <div class="opinion-header">
                            <span class="opinion-user">${opinion.nombre_usuario}</span>
                            <div class="opinion-rating">
                                <span class="stars-filled">${filledStars}</span>
                                <span class="stars-empty">${emptyStars}</span>
                                <span class="rating-number">${rating}/10</span>
                            </div>
                        </div>
                        <div class="opinion-content">
                            ${opinion.contenido}
                        </div>
                        ${opinion.imagen_url ? 
                            `<img src="${opinion.imagen_url}" alt="Imagen de opinión" class="opinion-image">` 
                            : ''}
                        <div class="opinion-date">
                            ${new Date(opinion.fecha_opinion).toLocaleDateString('es-CO', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Error cargando opiniones:', error);
            const container = document.getElementById('opinions-container');
            if (container) {
                container.innerHTML = `
                    <div class="error-message">
                        Error al cargar las opiniones. Por favor, intenta de nuevo.
                    </div>
                `;
            }
        }
    }

    // También actualicemos el método para renderizar las estrellas en tiempo real
    updateStars(rating) {
        const starsContainer = document.querySelector('.stars');
        if (!starsContainer) return;

        const stars = starsContainer.querySelectorAll('i');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.remove('far');
                star.classList.add('fas');
            } else {
                star.classList.remove('fas');
                star.classList.add('far');
            }
        });
    }

    setupFilters() {
        // Configurar todos los grupos de filtros
        const filterGroups = document.querySelectorAll('.filter-group');
        filterGroups.forEach(group => {
            const filterOptions = group.querySelector('.filter-options');
            if (filterOptions) {
                const filterType = filterOptions.dataset.filterType;
                filterOptions.addEventListener('click', (e) => {
                    if (e.target.classList.contains('filter-option')) {
                        this.handleFilterClick(e.target, filterType);
                    }
                });
            }
        });

        // Actualizar los filtros dinámicos
        this.updateMunicipiosFilter();
    }


    async updateMunicipiosFilter() {
        try {
            if (!this.charcos || !this.charcos.length) return;

            // Obtener municipios únicos y ordenarlos
            const municipios = [...new Set(this.charcos
                .map(c => c.municipio_nombre)
                .filter(Boolean)
                .sort())];

            const municipioOptions = document.querySelector('.filter-options[data-filter-type="municipio"]');
            if (municipioOptions) {
                municipioOptions.innerHTML = `
                    <button class="filter-option active" data-value="todos">Todos</button>
                    ${municipios.map(m => `
                        <button class="filter-option" data-value="${m}">${m}</button>
                    `).join('')}
                `;
            }
        } catch (error) {
            console.error('Error actualizando filtros de municipios:', error);
        }
    }

    handleFilterClick(buttonElement, filterType) {
        // Encontrar el contenedor de filtros correcto
        const filterGroup = buttonElement.closest('.filter-options');
        
        // Remover clase active de todos los botones en este grupo
        filterGroup.querySelectorAll('.filter-option').forEach(btn => {
            btn.classList.remove('active');
        });

        // Activar el botón seleccionado
        buttonElement.classList.add('active');
        
        // Actualizar el valor del filtro
        const filterValue = buttonElement.dataset.value;
        this.filtros[filterType] = filterValue;
        
        console.log(`Filtro ${filterType} actualizado a:`, filterValue);
        this.applyFilters();
    }


    applyFilters() {
        console.log('Aplicando filtros:', this.filtros);
        let filteredCharcos = [...this.charcos];

        // Filtrar por clima
        if (this.filtros.clima !== 'todos') {
            filteredCharcos = filteredCharcos.filter(charco => 
                charco.clima?.toLowerCase() === this.filtros.clima.toLowerCase()
            );
        }

        // Filtrar por municipio
        if (this.filtros.municipio !== 'todos') {
            filteredCharcos = filteredCharcos.filter(charco => 
                charco.municipio_nombre?.toLowerCase() === this.filtros.municipio.toLowerCase()
            );
        }

        // Filtrar por calificación
        if (this.filtros.calificacion !== 'todos') {
            filteredCharcos = filteredCharcos.filter(charco => {
                const rating = Number(charco.calificacion);
                switch(this.filtros.calificacion) {
                    case '9+':
                        return rating >= 9;
                    case '7-9':
                        return rating >= 7 && rating < 9;
                    case '-7':
                        return rating < 7;
                    default:
                        return true;
                }
            });
        }

        console.log('Charcos filtrados:', filteredCharcos.length);
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
    
            // Si estamos en vista de favoritos, cargar solo favoritos
            if (this.isFavoritesView) {
                const response = await fetch('http://localhost:3000/api/charcos/favorites', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
    
                if (!response.ok) {
                    throw new Error('Error al cargar favoritos');
                }
    
                const favorites = await response.json();
                this.renderCharcos(favorites);
                return;
            }
    
            // Si no, cargar todos los charcos (comportamiento normal)
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
            container.innerHTML = this.isFavoritesView ? `
                <div class="no-favorites">
                    <i class="fas fa-heart"></i>
                    <h3>No tienes charcos favoritos</h3>
                    <p>Guarda tus charcos favoritos para acceder rápidamente a ellos cuando quieras</p>
                </div>
            ` : `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h3>No se encontraron charcos</h3>
                    <p>Intenta con otros términos de búsqueda</p>
                </div>
            `;
            return;
        }
    
        container.innerHTML = charcosToRender.map(charco => {
            const rating = Math.round(charco.calificacion) || 0;
            const filledStars = '★'.repeat(rating);
            const emptyStars = '☆'.repeat(10 - rating);
            const isFavorite = this.favorites && this.favorites.has(Number(charco.id_charco));
    
            return `
                <div class="card" data-charco-id="${charco.id_charco}">
                    <img src="${charco.imagen_principal || '/placeholder.jpg'}" alt="${charco.nombre}">
                    <button class="favorite-btn ${isFavorite ? 'is-favorite' : ''}" 
                            data-charco-id="${charco.id_charco}">
                        <i class="fas fa-heart${isFavorite ? '' : '-o'}"></i>
                        ${isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                    </button>
                    <div class="card-content">
                        <h2>${charco.nombre}</h2>
                        <div class="location">
                            <i class="fas fa-map-marker-alt"></i>
                            ${charco.municipio_nombre || 'Sin ubicación'}
                        </div>
                        <div class="card-description">
                            ${charco.descripcion || 'Sin descripción'}
                        </div>
                        <div class="rating">
                            <div class="stars-display">
                                <span class="stars-filled">${filledStars}</span>
                                <span class="stars-empty">${emptyStars}</span>
                            </div>
                            <div class="rating-text">
                                ${rating ? `${rating}/10` : 'Sin calificaciones'}
                            </div>
                        </div>
                    </div>
                    <div class="card-hover-info">
                        <p><i class="fas fa-thermometer-half"></i> Clima: ${charco.clima || 'No especificado'}</p>
                        <p><i class="fas fa-water"></i> Profundidad: ${charco.profundidad || 0} metros</p>
                        <p><i class="fas fa-dollar-sign"></i> Costo: ${charco.costo === 0 ? 'Gratis' : `$${charco.costo.toLocaleString()}`}</p>
                    </div>
                </div>
            `;
        }).join('');
    
        // Agregar event listeners para los botones de favoritos
        container.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const charcoId = btn.dataset.charcoId;
                this.toggleFavorite(charcoId, e);
            });
        });
    
        // Agregar event listeners para las tarjetas
        container.querySelectorAll('.card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Solo abrir el modal si NO se hizo clic en el botón de favoritos
                if (!e.target.closest('.favorite-btn')) {
                    const charcoId = card.dataset.charcoId;
                    const charcoName = card.querySelector('h2').textContent;
                    this.openOpinionModal(charcoId, charcoName);
                }
            });
        });
    }

    async openOpinionModal(charcoId, charcoName) {
        const modal = document.getElementById('opinion-modal');
        const titleElement = document.getElementById('charco-title');
        
        // Actualizar el título del modal
        titleElement.textContent = `Opiniones de ${charcoName}`;
        
        // Guardar el ID del charco para uso posterior
        modal.dataset.charcoId = charcoId;
        
        // Mostrar el modal
        modal.style.display = 'block';

        // Cargar opiniones existentes
        await this.loadOpinions(charcoId);
    }

    async loadFavorites() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.log('No hay token para cargar favoritos');
                return;
            }

            const response = await fetch('http://localhost:3000/api/charcos/favorites', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al cargar favoritos');
            }
            
            const favorites = await response.json();
            this.favorites = new Set(favorites.map(f => f.id_charco));
            this.updateFavoriteButtons();
        } catch (error) {
            console.error('Error cargando favoritos:', error);
        }
    }

    async toggleFavoritesView() {
        try {
            const favoritosBtn = document.querySelector('[data-action="favoritos"]');
            // Seleccionar todos los elementos de filtro y búsqueda
            const filterSection = document.querySelector('.filter-section');
            const searchSection = document.querySelector('.search-section');
            this.isFavoritesView = !this.isFavoritesView;
    
            if (this.isFavoritesView) {
                // Activar botón
                favoritosBtn?.classList.add('active');
                
                // Ocultar sección de filtros y búsqueda
                if (filterSection) {
                    filterSection.style.animation = 'slideOutLeft 0.3s ease forwards';
                    setTimeout(() => {
                        filterSection.style.display = 'none';
                    }, 300);
                }
                
                if (searchSection) {
                    searchSection.style.animation = 'fadeOut 0.3s ease forwards';
                    setTimeout(() => {
                        searchSection.style.display = 'none';
                    }, 300);
                }
    
                // Ajustar el contenedor principal para ocupar todo el ancho
                const mainContainer = document.querySelector('.main-container');
                if (mainContainer) {
                    mainContainer.style.display = 'block';
                }
    
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:3000/api/charcos/favorites', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
    
                if (!response.ok) {
                    throw new Error('Error al cargar favoritos');
                }
    
                const favoritedCharcos = await response.json();
                
                // Remover header anterior si existe
                document.querySelector('.favorites-header')?.remove();
                
                // Agregar nuevo header
                const mainContent = document.querySelector('.main-container');
                if (mainContent) {
                    mainContent.insertAdjacentHTML('beforebegin', `
                        <div class="favorites-header">
                            <div class="favorites-content">
                                <i class="fas fa-heart"></i>
                                <h2>Mis Charcos Favoritos</h2>
                                <p class="favorites-count">
                                    ${favoritedCharcos.length} 
                                    ${favoritedCharcos.length === 1 ? 'charco guardado' : 'charcos guardados'}
                                </p>
                            </div>
                        </div>
                    `);
                }
    
                this.renderCharcos(favoritedCharcos);
            } else {
                // Desactivar botón
                favoritosBtn?.classList.remove('active');
                
                // Mostrar sección de filtros y búsqueda
                if (filterSection) {
                    filterSection.style.display = '';
                    filterSection.style.animation = 'slideInLeft 0.3s ease forwards';
                }
                
                if (searchSection) {
                    searchSection.style.display = '';
                    searchSection.style.animation = 'fadeIn 0.3s ease forwards';
                }
    
                // Restaurar layout del contenedor principal
                const mainContainer = document.querySelector('.main-container');
                if (mainContainer) {
                    mainContainer.style.display = 'flex';
                }
    
                // Remover header de favoritos
                const favoritesHeader = document.querySelector('.favorites-header');
                if (favoritesHeader) {
                    favoritesHeader.style.animation = 'slideOutUp 0.3s ease forwards';
                    setTimeout(() => {
                        favoritesHeader.remove();
                    }, 300);
                }
    
                await this.loadCharcos();
            }
        } catch (error) {
            console.error('Error al cambiar la vista de favoritos:', error);
            alert('Error al cargar los favoritos');
        }
    }

    async toggleFavorite(charcoId, event) {
        try {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
    
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Debes iniciar sesión para guardar favoritos');
                return;
            }
    
            const isFavorite = this.favorites.has(Number(charcoId));
            const method = isFavorite ? 'DELETE' : 'POST';
            
            const response = await fetch(`http://localhost:3000/api/charcos/favorites/${charcoId}`, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
    
            if (!response.ok) {
                throw new Error('Error al actualizar favorito');
            }
    
            if (isFavorite) {
                this.favorites.delete(Number(charcoId));
            } else {
                this.favorites.add(Number(charcoId));
            }
    
            this.updateFavoriteButton(charcoId);
            
        } catch (error) {
            console.error('Error al modificar favorito:', error);
            alert('Error al actualizar favoritos');
        }
    }

    updateFavoriteButtons() {
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            const charcoId = Number(btn.dataset.charcoId);
            this.updateFavoriteButton(charcoId);
        });
    }

    updateFavoriteButton(charcoId) {
        const btn = document.querySelector(`.favorite-btn[data-charco-id="${charcoId}"]`);
        if (btn) {
            const isFavorite = this.favorites.has(Number(charcoId));
            btn.innerHTML = `
                <i class="fas fa-heart${isFavorite ? '' : '-o'}"></i>
                ${isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            `;
            btn.classList.toggle('is-favorite', isFavorite);
        }
    }
}

// Inicializar el servicio cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    new CharcosService();
});

export default CharcosService;