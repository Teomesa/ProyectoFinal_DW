// frontend/js/admin.js
class AdminPanel {
    constructor() {
        this.init();
    }

    init() {
        this.checkAdminAuth();
        this.setupEventListeners();
        this.loadUsers(); // Cargar usuarios inmediatamente
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
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
                
                // Cargar el contenido correspondiente
                switch(tab) {
                    case 'users':
                        this.loadUsers();
                        break;
                    case 'charcos':
                        // this.loadCharcos();
                        break;
                    case 'opinions':
                        // this.loadOpinions();
                        break;
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
}

// Crear una instancia global para poder acceder a los métodos desde los botones
window.adminPanel = new AdminPanel();

document.addEventListener('DOMContentLoaded', () => {
    // La instancia ya está creada arriba
});