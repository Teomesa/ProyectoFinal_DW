// frontend/js/admin.js
class AdminPanel {
    constructor() {
        this.init();
    }

    async init() {
        await this.checkAdminAuth();
        this.setupEventListeners();
        await this.loadUsers();
        await this.loadCharcos();
        await this.loadOpinions();
    }

    async checkAdminAuth() {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.tipo_usuario) {
            window.location.href = '/Mostrar.html';
            return;
        }
        
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            userNameElement.textContent = user.nombre;
        }
    }

    setupEventListeners() {
        // Event listeners para las pestañas
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
                
                switch(tab) {
                    case 'users':
                        await this.loadUsers();
                        break;
                    case 'charcos':
                        await this.loadCharcos();
                        break;
                    case 'opinions':
                        // this.loadOpinions();
                        break;
                }
            });
        });

        // Event listeners para modales
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            // Cerrar al hacer clic en la X
            const closeButton = modal.querySelector('.close');
            if (closeButton) {
                closeButton.addEventListener('click', () => {
                    this.closeCharcoModal();
                });
            }

            // Cerrar al hacer clic fuera del modal
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeCharcoModal();
                }
            });
        });

        // Event listener para el botón de volver
        const backBtn = document.getElementById('back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.location.href = '/Mostrar.html';
            });
        }

        // Event listener para logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/';
            });
        }

        // Event listener para el formulario de charcos
        const charcoForm = document.getElementById('charco-form');
        if (charcoForm) {
            charcoForm.removeEventListener('submit', this.handleSubmit);
            charcoForm.addEventListener('submit', this.handleSubmit.bind(this));
        }
    }

    switchTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tab}-tab`).classList.add('active');
    }

    async loadUsers() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3000/api/admin/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al cargar usuarios');
            }

            const users = await response.json();
            this.renderUsers(users);
        } catch (error) {
            console.error('Error:', error);
        }
    }

    renderUsers(users) {
        const tbody = document.querySelector('#users-table tbody');
        if (!tbody) return;
    
        const currentUser = JSON.parse(localStorage.getItem('user'));
        const currentUserId = currentUser ? currentUser.id : null;
    
        tbody.innerHTML = users.map(user => {
            let fechaFormateada = 'Fecha no disponible';
            if (user.fecha_registro) {
                const fecha = new Date(user.fecha_registro + ' UTC-5');
                fechaFormateada = fecha.toLocaleString('es-CO', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                    timeZone: 'America/Bogota'
                }).replace(/\./g, ':').replace(/,/g, '');
            }

            const tipoUsuario = user.tipo_usuario ? 
                '<span class="badge admin">Administrador</span>' : 
                '<span class="badge user">Usuario</span>';
    
            const isMainAdmin = user.email === 'admin@charcos.com';
            const isCurrentUser = user.id_usuario === currentUserId;
            const showActions = !isMainAdmin && !isCurrentUser;
            
            const toggleButton = showActions ? `
                <button class="action-btn toggle-admin-btn" onclick="adminPanel.toggleAdminStatus(${user.id_usuario}, ${user.tipo_usuario})">
                    ${user.tipo_usuario ? 
                        '<i class="fas fa-user"></i> Quitar Admin' : 
                        '<i class="fas fa-user-shield"></i> Hacer Admin'}
                </button>
            ` : '';
    
            const deleteButton = showActions ? `
                <button class="action-btn delete-btn" onclick="adminPanel.deleteUser(${user.id_usuario})">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            ` : '';
    
            return `
                <tr>
                    <td>${user.id_usuario}</td>
                    <td>${user.nombre}</td>
                    <td>${user.email}</td>
                    <td>${user.edad}</td>
                    <td>${fechaFormateada}</td>
                    <td>${tipoUsuario}</td>
                    <td>
                        ${toggleButton}
                        ${deleteButton}
                        ${isCurrentUser ? '<span class="badge user">Usuario actual</span>' : ''}
                    </td>
                </tr>
            `;
        }).join('');
    }

    async loadCharcos() {
        try {
            console.log('Iniciando carga de charcos en panel admin');
            const token = localStorage.getItem('token');
            
            if (!token) {
                console.error('No se encontró token');
                return;
            }

            const response = await fetch('http://localhost:3000/api/admin/charcos', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Error al cargar charcos: ${response.status}`);
            }

            const charcos = await response.json();
            console.log('Datos de charcos recibidos:', charcos);
            this.renderCharcosTable(charcos);
        } catch (error) {
            console.error('Error cargando charcos:', error.message);
        }
    }

    renderCharcosTable(charcos) {
        console.log('Renderizando tabla de charcos:', charcos);
        const tbody = document.querySelector('#charcos-table tbody');
        if (!tbody) {
            console.error('No se encontró el tbody de la tabla de charcos');
            return;
        }

        if (!charcos || charcos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">No hay charcos registrados</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = charcos.map(charco => `
            <tr>
                <td>${charco.id_charco}</td>
                <td>${charco.nombre}</td>
                <td>${charco.municipio_nombre || 'No especificado'}</td>
                <td>${charco.clima || 'No especificado'}</td>
                <td>${charco.costo === 0 ? 'Gratis' : `$${charco.costo.toLocaleString()}`}</td>
                <td>${charco.calificacion || 'Sin calificación'}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="adminPanel.editCharco(${charco.id_charco})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="adminPanel.deleteCharco(${charco.id_charco})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    handleSubmit = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const submitButton = e.target.querySelector('button[type="submit"]');
        if (submitButton) submitButton.disabled = true;
        
        try {
            const formData = new FormData(e.target);
            const charcoId = e.target.dataset.charcoId;
            
            // Debug para ver qué se está enviando
            for (let pair of formData.entries()) {
                console.log(pair[0] + ': ' + pair[1]);
            }
            
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No se encontró el token de autenticación');
            }
    
            const url = charcoId ? 
                `http://localhost:3000/api/admin/charcos/${charcoId}` : 
                'http://localhost:3000/api/admin/charcos';
            
            console.log('Enviando solicitud a:', url);
    
            const response = await fetch(url, {
                method: charcoId ? 'PUT' : 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // No agregar Content-Type cuando se usa FormData
                },
                body: formData
            });
            
            if (!response.ok) {
                if (response.status === 413) {
                    throw new Error('La imagen es demasiado grande');
                }
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al guardar el charco');
            }
            
            await this.loadCharcos();
            this.closeCharcoModal();
            alert(charcoId ? 'Charco actualizado exitosamente' : 'Charco creado exitosamente');
        } catch (error) {
            console.error('Error completo:', error);
            alert(error.message || 'Error al procesar la solicitud');
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    };

    showAddCharcoModal() {
        const modal = document.getElementById('charco-modal');
        const form = document.getElementById('charco-form');
        form.reset();
        form.removeAttribute('data-charco-id');
        
        // Actualizar el formulario para manejar archivos
        form.setAttribute('enctype', 'multipart/form-data');
        
        document.getElementById('modal-title').textContent = 'Agregar Nuevo Charco';
        
        // Crear el HTML del formulario
        form.innerHTML = `
            <div class="form-grid">
                <div class="form-group">
                    <label for="charco-nombre">Nombre del Charco</label>
                    <input type="text" id="charco-nombre" name="nombre" required>
                </div>
                
                <div class="form-group">
                    <label for="charco-municipio">Municipio</label>
                    <input type="text" id="charco-municipio" name="municipio" required>
                </div>
                
                <div class="form-group">
                    <label for="charco-clima">Clima</label>
                    <select id="charco-clima" name="clima" required>
                        <option value="Cálido">Cálido</option>
                        <option value="Templado">Templado</option>
                        <option value="Frío">Frío</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="charco-profundidad">Profundidad (metros)</label>
                    <input type="number" id="charco-profundidad" name="profundidad" step="0.1" required>
                </div>
                
                <div class="form-group">
                    <label for="charco-costo">Costo de entrada</label>
                    <input type="number" id="charco-costo" name="costo" required>
                </div>
                
                <div class="form-group">
                    <label for="charco-imagen">Imagen de portada</label>
                    <input type="file" id="charco-imagen" name="imagen" accept="image/*">
                </div>
            </div>
            
            <div class="form-group full-width">
                <label for="charco-descripcion">Descripción</label>
                <textarea id="charco-descripcion" name="descripcion" required></textarea>
            </div>
            
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">Guardar</button>
                <button type="button" class="btn btn-secondary" onclick="adminPanel.closeCharcoModal()">Cancelar</button>
            </div>
        `;
        
        modal.style.display = 'block';
    }

    async editCharco(charcoId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3000/api/admin/charcos/${charcoId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
    
            if (!response.ok) {
                throw new Error('Error al cargar el charco');
            }
    
            const charco = await response.json();
            this.showEditCharcoModal(charco);
        } catch (error) {
            console.error('Error:', error);
            alert('Error al cargar el charco para editar');
        }
    }

    showEditCharcoModal(charco) {
        const modal = document.getElementById('charco-modal');
        const form = document.getElementById('charco-form');
        
        if (!form) {
            console.error('No se encontró el formulario');
            return;
        }
        
        form.setAttribute('enctype', 'multipart/form-data');
        document.getElementById('modal-title').textContent = 'Editar Charco';
        
        form.innerHTML = `
            <div class="form-grid">
                <div class="form-group">
                    <label for="charco-nombre">Nombre del Charco</label>
                    <input type="text" id="charco-nombre" name="nombre" required value="${charco.nombre || ''}">
                </div>
                
                <div class="form-group">
                    <label for="charco-municipio">Municipio</label>
                    <input type="text" id="charco-municipio" name="municipio" required value="${charco.municipio_nombre || ''}">
                </div>
                
                <div class="form-group">
                    <label for="charco-clima">Clima</label>
                    <select id="charco-clima" name="clima" required>
                        <option value="Cálido" ${charco.clima === 'Cálido' ? 'selected' : ''}>Cálido</option>
                        <option value="Templado" ${charco.clima === 'Templado' ? 'selected' : ''}>Templado</option>
                        <option value="Frío" ${charco.clima === 'Frío' ? 'selected' : ''}>Frío</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="charco-profundidad">Profundidad (metros)</label>
                    <input type="number" id="charco-profundidad" name="profundidad" step="0.1" required value="${charco.profundidad || ''}">
                </div>
                
                <div class="form-group">
                    <label for="charco-costo">Costo de entrada</label>
                    <input type="number" id="charco-costo" name="costo" required value="${charco.costo || ''}">
                </div>
                
                <div class="form-group">
                    <label for="charco-imagen">Imagen de portada</label>
                    <input type="file" id="charco-imagen" name="imagen" accept="image/*">
                    ${charco.imagen_principal ? `
                        <div class="image-preview">
                            <img src="${charco.imagen_principal}" alt="Imagen actual" style="max-width: 200px; margin-top: 10px;">
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="form-group full-width">
                <label for="charco-descripcion">Descripción</label>
                <textarea id="charco-descripcion" name="descripcion" required>${charco.descripcion || ''}</textarea>
            </div>
            
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">Guardar</button>
                <button type="button" class="btn btn-secondary" onclick="adminPanel.closeCharcoModal()">Cancelar</button>
            </div>
        `;
        
        form.dataset.charcoId = charco.id_charco;
        modal.style.display = 'block';
    }

    async deleteCharco(charcoId) {
        try {
            if (!confirm('¿Estás seguro de que quieres eliminar este charco?')) {
                return;
            }
    
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3000/api/admin/charcos/${charcoId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
    
            if (!response.ok) {
                throw new Error('Error al eliminar el charco');
            }
    
            await this.loadCharcos();
            alert('Charco eliminado exitosamente');
        } catch (error) {
            console.error('Error:', error);
            alert('Error al eliminar el charco');
        }
    }

    async toggleAdminStatus(userId, currentStatus) {
        try {
            if (!confirm('¿Estás seguro de que quieres cambiar el rol de este usuario?')) {
                return;
            }
    
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3000/api/admin/users/${userId}/toggle-admin`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
    
            const data = await response.json();
    
            if (!response.ok) {
                throw new Error(data.message || 'Error al cambiar el estado de administrador');
            }
    
            await this.loadUsers();
            alert(data.message);
        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'Error al cambiar el estado de administrador');
        }
    }
    
    async deleteUser(userId) {
        try {
            const currentUser = JSON.parse(localStorage.getItem('user'));
            if (userId === currentUser.id) {
                alert('No puedes eliminarte a ti mismo');
                return;
            }
    
            if (!confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.')) {
                return;
            }
    
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3000/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
    
            const data = await response.json();
    
            if (!response.ok) {
                throw new Error(data.message || 'Error al eliminar usuario');
            }
    
            await this.loadUsers();
            alert('Usuario eliminado exitosamente');
        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'Error al eliminar el usuario');
        }
    }

    closeCharcoModal() {
        const modal = document.getElementById('charco-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    async loadOpinions() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3000/api/admin/opinions', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al cargar las opiniones');
            }

            const opinions = await response.json();
            this.renderOpinionsTable(opinions);
        } catch (error) {
            console.error('Error al cargar opiniones:', error);
            const container = document.querySelector('#opinions-tab .table-container');
            if (container) {
                container.innerHTML = `
                    <div class="error-message">
                        Error al cargar las opiniones: ${error.message}
                    </div>
                `;
            }
        }
    }

    async deleteOpinion(opinionId) {
        try {
            if (!confirm('¿Estás seguro de que quieres eliminar esta opinión?')) {
                return;
            }
    
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No se encontró token de autenticación');
            }
    
            console.log('Iniciando eliminación de opinión:', opinionId);
    
            const response = await fetch(`http://localhost:3000/api/admin/opinions/${opinionId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }).catch(error => {
                console.error('Error en la petición fetch:', error);
                throw new Error('Error de conexión con el servidor');
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al eliminar la opinión');
            }
    
            const result = await response.json();
    
            if (result.success) {
                // Recargar los datos
                await Promise.all([
                    this.loadOpinions(),
                    this.loadCharcos()
                ]);
    
                alert('Opinión eliminada exitosamente');
            } else {
                throw new Error(result.message || 'Error al eliminar la opinión');
            }
    
        } catch (error) {
            console.error('Error completo al eliminar opinión:', error);
            alert(`Error: ${error.message}`);
        }
    }
    
    renderOpinionsTable(opinions) {
        const tbody = document.querySelector('#opinions-table tbody');
        if (!tbody) {
            console.error('No se encontró el tbody de la tabla de opiniones');
            return;
        }

        tbody.innerHTML = opinions.map(opinion => {
            const rating = Math.min(Math.max(Number(opinion.calificacion) || 0, 0), 10);
            const filledStars = '★'.repeat(rating);
            const emptyStars = '☆'.repeat(10 - rating);

            return `
                <tr>
                    <td>${opinion.id_opinion}</td>
                    <td>${opinion.charco_nombre || 'Sin nombre'}</td>
                    <td>${opinion.nombre_usuario || 'Usuario desconocido'}</td>
                    <td>${opinion.contenido || ''}</td>
                    <td>
                        <div class="rating-display">
                            <span class="stars-filled">${filledStars}</span>
                            <span class="stars-empty">${emptyStars}</span>
                            <span class="rating-number">${rating}/10</span>
                        </div>
                    </td>
                    <td>${new Date(opinion.fecha_opinion).toLocaleDateString()}</td>
                    <td>
                        ${opinion.imagen_url ? 
                            `<img src="${opinion.imagen_url}" alt="Imagen de opinión" class="opinion-thumbnail">` 
                            : 'Sin imagen'}
                    </td>
                    <td>
                        <button class="action-btn delete-btn" onclick="event.preventDefault(); adminPanel.deleteOpinion(${opinion.id_opinion});">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }
}

// Crear una instancia global para poder acceder a los métodos desde los botones
window.adminPanel = new AdminPanel();

// Inicializar cuando se carga el documento
document.addEventListener('DOMContentLoaded', () => {
    // La instancia ya está creada arriba
});