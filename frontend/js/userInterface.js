// frontend/js/userInterface.js
class UserInterface {
    constructor() {
        this.init();
    }

    init() {
        this.updateUserInterface();
        this.setupEventListeners();
    }

    updateUserInterface() {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            window.location.href = '/';
            return;
        }

        // Actualizar nombre de usuario
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            userNameElement.textContent = user.nombre;
        }

        // Mostrar/ocultar botón de admin
        const adminButton = document.getElementById('admin-panel-btn');
        if (adminButton) {
            console.log('Tipo de usuario:', user.tipo_usuario);
            adminButton.style.display = user.tipo_usuario ? 'inline-flex' : 'none';
        }
        console.log('Usuario actual:', user);
    }

    setupEventListeners() {
        // Event listener para el botón de admin
        const adminButton = document.getElementById('admin-panel-btn');
        if (adminButton) {
            adminButton.addEventListener('click', () => {
                window.location.href = '/admin.html';
            });
        }

        // Event listener para el botón de logout
        const logoutButton = document.getElementById('logout-btn');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/';
            });
        }
    }
}

// Inicializar cuando se carga el documento
document.addEventListener('DOMContentLoaded', () => {
    new UserInterface();
});

export default UserInterface;