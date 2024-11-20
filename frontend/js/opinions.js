// frontend/js/opinions.js
class OpinionManager {
    constructor() {
        this.currentCharco = null;
        this.currentRating = 0;
        this.init();
    }

    init() {
        // Inicializar eventos
        this.setupEventListeners();
        
        // Hacer las tarjetas de charcos clickeables
        document.querySelectorAll('.card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.action-btn')) {  // No activar si se hace clic en botones de admin
                    const charcoId = card.dataset.charcoId;
                    this.openOpinionModal(charcoId);
                }
            });
        });
    }

    setupEventListeners() {
        // Manejar estrellas de calificación
        document.querySelectorAll('.stars i').forEach(star => {
            star.addEventListener('click', (e) => {
                this.handleRating(e.target.dataset.rating);
            });

            star.addEventListener('mouseover', (e) => {
                this.showRatingPreview(e.target.dataset.rating);
            });

            star.addEventListener('mouseout', () => {
                this.resetRatingPreview();
            });
        });

        // Manejar envío del formulario
        const form = document.getElementById('opinion-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Manejar cierre del modal
        const closeBtn = document.querySelector('#opinion-modal .close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }
    }

    async openOpinionModal(charcoId) {
        this.currentCharco = charcoId;
        const modal = document.getElementById('opinion-modal');
        
        try {
            // Cargar datos del charco
            const charcoResponse = await fetch(`http://localhost:3000/api/charcos/${charcoId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const charcoData = await charcoResponse.json();

            // Actualizar título del modal
            document.getElementById('charco-title').textContent = `Opiniones de ${charcoData.nombre}`;
            document.getElementById('charco-id').value = charcoId;

            // Cargar opiniones existentes
            await this.loadOpinions(charcoId);

            // Mostrar modal
            modal.style.display = 'block';
        } catch (error) {
            console.error('Error al abrir el modal:', error);
            alert('Error al cargar los datos del charco');
        }
    }

    async loadOpinions(charcoId) {
        try {
            const response = await fetch(`http://localhost:3000/api/charcos/${charcoId}/opinions`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const opinions = await response.json();

            const container = document.getElementById('opinions-container');
            container.innerHTML = opinions.map(opinion => this.createOpinionCard(opinion)).join('');
        } catch (error) {
            console.error('Error al cargar opiniones:', error);
        }
    }

    createOpinionCard(opinion) {
        return `
            <div class="opinion-card">
                <div class="opinion-header">
                    <span class="opinion-user">${opinion.nombre_usuario}</span>
                    <div class="opinion-rating">
                        ${'★'.repeat(opinion.calificacion)}${'☆'.repeat(5 - opinion.calificacion)}
                    </div>
                </div>
                <div class="opinion-content">${opinion.contenido}</div>
                ${opinion.imagen_url ? `
                    <img src="${opinion.imagen_url}" alt="Imagen de la opinión" class="opinion-image">
                ` : ''}
                <div class="opinion-date">
                    ${new Date(opinion.fecha_opinion).toLocaleDateString()}
                </div>
            </div>
        `;
    }

    handleRating(rating) {
        this.currentRating = rating;
        document.getElementById('rating-value').value = rating;
        this.updateStars(rating);
    }

    showRatingPreview(rating) {
        this.updateStars(rating);
    }

    resetRatingPreview() {
        this.updateStars(this.currentRating);
    }

    updateStars(rating) {
        document.querySelectorAll('.stars i').forEach((star, index) => {
            star.classList.toggle('fas', index < rating);
            star.classList.toggle('far', index >= rating);
        });
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        if (!this.currentRating) {
            alert('Por favor, selecciona una calificación');
            return;
        }

        const formData = new FormData(e.target);
        formData.append('calificacion', this.currentRating);

        try {
            const response = await fetch(`http://localhost:3000/api/charcos/${this.currentCharco}/opinions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            if (!response.ok) throw new Error('Error al enviar la opinión');

            // Recargar opiniones
            await this.loadOpinions(this.currentCharco);
            
            // Limpiar formulario
            e.target.reset();
            this.currentRating = 0;
            this.updateStars(0);
            
            alert('¡Opinión enviada exitosamente!');
        } catch (error) {
            console.error('Error:', error);
            alert('Error al enviar la opinión');
        }
    }

    closeModal() {
        const modal = document.getElementById('opinion-modal');
        modal.style.display = 'none';
        this.currentCharco = null;
        this.currentRating = 0;
        document.getElementById('opinion-form').reset();
        this.updateStars(0);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new OpinionManager();
});

export default OpinionManager;