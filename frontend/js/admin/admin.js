// frontend/js/admin.js
class AdminPanel {
    constructor() {
        this.init();
    }

    async init() {  // Agregamos async aquí
        await this.checkAdminAuth();
        this.setupEventListeners();
        await this.loadUsers();
        await this.loadCharcos(); // Ahora podemos usar await aquí
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
                
                // Cargar el contenido correspondiente
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
        // Event listener para el formulario de charcos
            const charcoForm = document.getElementById('charco-form');
            if (charcoForm) {
                charcoForm.removeEventListener('submit', this.handleSubmit);
                this.handleSubmit = async (e) => {
                    e.preventDefault();
                    e.stopPropagation(); // Prevenir propagación del evento               
                    const submitButton = charcoForm.querySelector('button[type="submit"]');
                    if (submitButton) submitButton.disabled = true;
                    
                    try {
                        const formData = new FormData(charcoForm);
                        const charcoData = Object.fromEntries(formData);
                        
                        const charcoId = charcoForm.dataset.charcoId;
                        if (charcoId) {
                            await this.updateCharco(charcoId, charcoData);
                        } else {
                            await this.createCharco(charcoData);
                        }
                    } catch (error) {
                        console.error('Error al procesar el formulario:', error);
                    } finally {
                        // Re-habilitar el botón
                        if (submitButton) submitButton.disabled = false;
                    }
                };
                charcoForm.addEventListener('submit', this.handleSubmit);
            }
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
    }

    switchTab(tab) {
        // Remover clase active de todas las pestañas
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        // Agregar clase active a la pestaña seleccionada
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        // Ocultar todos los contenidos
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        // Mostrar el contenido seleccionado
        document.getElementById(`${tab}-tab`).classList.add('active');
    }

    async loadUsers() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/admin/users', {
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
    
        // Obtener el ID del usuario actual
        const currentUser = JSON.parse(localStorage.getItem('user'));
        const currentUserId = currentUser ? currentUser.id : null;
    
        tbody.innerHTML = users.map(user => {
            // Formatear la fecha
            let fechaFormateada = 'Fecha no disponible';
            if (user.fecha_registro) {
                const fecha = new Date(user.fecha_registro + ' UTC-5'); // Ajustar a hora Colombia
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
            // Determinar el tipo de usuario
            const tipoUsuario = user.tipo_usuario ? 
                '<span class="badge admin">Administrador</span>' : 
                '<span class="badge user">Usuario</span>';
    
            // No mostrar botones de acción para:
            // 1. El admin principal (admin@charcos.com)
            // 2. El usuario actual que está logueado
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
    
    // Agregar método para cambiar el estado de administrador
    async toggleAdminStatus(userId, currentStatus) {
        try {
            if (!confirm('¿Estás seguro de que quieres cambiar el rol de este usuario?')) {
                return;
            }
    
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/admin/users/${userId}/toggle-admin`, {
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
    
            await this.loadUsers(); // Recargar la lista de usuarios
            alert(data.message);
        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'Error al cambiar el estado de administrador');
        }
    }
    
    async deleteUser(userId) {
        try {
            // Verificar que no sea el usuario actual
            const currentUser = JSON.parse(localStorage.getItem('user'));
            if (userId === currentUser.id) {
                alert('No puedes eliminarte a ti mismo');
                return;
            }
    
            if (!confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.')) {
                return;
            }
    
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
    
            const data = await response.json();
    
            if (!response.ok) {
                throw new Error(data.message || 'Error al eliminar usuario');
            }
    
            await this.loadUsers(); // Recargar la lista de usuarios
            alert('Usuario eliminado exitosamente');
        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'Error al eliminar el usuario');
        }
    }
    
    async getUserById(userId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/admin/users/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
    
            if (!response.ok) {
                throw new Error('Error al obtener usuario');
            }
    
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }
    // Métodos para gestión de charcos
    async loadCharcos() {
        try {
            console.log('Iniciando carga de charcos en panel admin');
            const token = localStorage.getItem('token');
            
            if (!token) {
                console.error('No se encontró token');
                return;
            }

            console.log('Token encontrado:', token);
            
            const response = await fetch('http://localhost:3000/api/admin/charcos', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Respuesta recibida:', response.status);

            if (!response.ok) {
                const errorData = await response.text();
                console.error('Error response:', errorData);
                throw new Error(`Error al cargar charcos: ${response.status}`);
            }

            const charcos = await response.json();
            console.log('Datos de charcos recibidos:', charcos);

            this.renderCharcosTable(charcos);
        } catch (error) {
            console.error('Error completo:', error);
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

    async createCharco(charcoData) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/admin/charcos', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nombre: charcoData.nombre,
                    descripcion: charcoData.descripcion,
                    municipio: charcoData.municipio,
                    clima: charcoData.clima,
                    profundidad: parseFloat(charcoData.profundidad),
                    costo: parseFloat(charcoData.costo)
                })
            });
    
            const data = await response.json();
    
            if (!response.ok) {
                throw new Error(data.message || 'Error al crear el charco');
            }
    
            await this.loadCharcos();
            this.closeCharcoModal();
            alert('Charco creado exitosamente');
            
            // Limpiar el formulario
            const form = document.getElementById('charco-form');
            if (form) {
                form.reset();
                form.removeAttribute('data-charco-id');
            }
        } catch (error) {
            console.error('Error al crear charco:', error);
            alert(error.message || 'Error al crear el charco');
        }
    }

    showAddCharcoModal() {
        const modal = document.getElementById('charco-modal');
        const form = document.getElementById('charco-form');
        const title = document.getElementById('modal-title');
        
        // Limpiar el formulario
        form.reset();
        form.removeAttribute('data-charco-id');
        title.textContent = 'Agregar Nuevo Charco';
        
        modal.style.display = 'block';
    }

    async editCharco(charcoId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/admin/charcos/${charcoId}`, {
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
        
        document.getElementById('modal-title').textContent = 'Editar Charco';
        
        // Llenar el formulario con los datos del charco
        const fields = {
            'charco-nombre': charco.nombre,
            'charco-municipio': charco.municipio_nombre,
            'charco-descripcion': charco.descripcion,
            'charco-clima': charco.clima,
            'charco-profundidad': charco.profundidad,
            'charco-costo': charco.costo
        };
    
        // Llenar cada campo verificando que existe
        for (const [id, value] of Object.entries(fields)) {
            const element = document.getElementById(id);
            if (element) {
                element.value = value;
            }
        }
        
        form.dataset.charcoId = charco.id_charco;
        modal.style.display = 'block';
    }

    async saveCharco(formData) {
        try {
            const token = localStorage.getItem('token');
            const charcoId = formData.get('charcoId');
            const method = charcoId ? 'PUT' : 'POST';
            const url = charcoId ? 
                `/api/admin/charcos/${charcoId}` : 
                '/api/admin/charcos';

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(Object.fromEntries(formData))
            });

            if (!response.ok) throw new Error('Error al guardar el charco');

            this.closeCharcoModal();
            this.loadCharcos();
            alert(charcoId ? 'Charco actualizado exitosamente' : 'Charco agregado exitosamente');
        } catch (error) {
            console.error('Error:', error);
            alert('Error al guardar el charco');
        }
    }

    async updateCharco(charcoId, charcoData) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/admin/charcos/${charcoId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nombre: charcoData.nombre,
                    descripcion: charcoData.descripcion,
                    municipio: charcoData.municipio,
                    clima: charcoData.clima,
                    profundidad: parseFloat(charcoData.profundidad),
                    costo: parseFloat(charcoData.costo)
                })
            });
    
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Error al actualizar el charco');
            }
    
            await this.loadCharcos();
            this.closeCharcoModal();
            alert('Charco actualizado exitosamente');
        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'Error al actualizar el charco');
        }
    }

    async deleteCharco(charcoId) {
        try {
            if (!confirm('¿Estás seguro de que quieres eliminar este charco?')) {
                return;
            }
    
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/admin/charcos/${charcoId}`, {
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

    closeCharcoModal() {
        const modal = document.getElementById('charco-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
}

// Crear una instancia global para poder acceder a los métodos desde los botones
window.adminPanel = new AdminPanel();

document.addEventListener('DOMContentLoaded', () => {
    // La instancia ya está creada arriba
});