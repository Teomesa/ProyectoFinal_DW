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

        container.innerHTML = charcosToRender.map(charco => {
            // Crear las estrellas para la calificación promedio
            const rating = Math.round(charco.calificacion) || 0;
            const filledStars = Array(rating).fill('★').join('');
            const emptyStars = Array(10 - rating).fill('☆').join('');

            return`
            <div class="card" data-charco-id="${charco.id_charco}">
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
                    <p><i class="fas fa-water"></i> Profundidad: ${charco.profundidad} metros</p>
                    <p><i class="fas fa-dollar-sign"></i> Costo: ${charco.costo === 0 ? 'Gratis' : `$${charco.costo.toLocaleString()}`}</p>
                </div>
            </div>
        `}).join('');

        // Agregar event listeners para los clicks en las tarjetas
        container.querySelectorAll('.card').forEach(card => {
            card.addEventListener('click', () => {
                const charcoId = card.dataset.charcoId;
                const charcoName = card.querySelector('h2').textContent;
                this.openOpinionModal(charcoId, charcoName);
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
}

// Inicializar el servicio cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    new CharcosService();
});

export default CharcosService;