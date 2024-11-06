// frontend/js/auth-modal.js
const AuthModalManager = {
    modalContent: {
        login: `
            <div class="modal-content">
                <a href="#" class="close-modal">&times;</a>
                <h2 style="text-align: center; margin-bottom: 1.5rem;">Iniciar Sesión</h2>
                
                <div id="login-error" class="error-message"></div>
                
                <form id="login-form">
                    <div class="input-group">
                        <label for="login-email">Correo electrónico</label>
                        <input type="email" id="login-email" required>
                    </div>

                    <div class="input-group">
                        <label for="login-password">Contraseña</label>
                        <input type="password" id="login-password" required>
                    </div>

                    <button type="submit" class="btn btn-primary" style="width: 100%; margin: 1rem 0;">Iniciar Sesión</button>
                </form>

                <p style="text-align: center; margin-top: 1rem;">
                    ¿No tienes cuenta? 
                    <button onclick="AuthModalManager.showModal('register')" class="modal-link" style="background: none; border: none; color: var(--primary); cursor: pointer; font-weight: 500;">
                        Regístrate
                    </button>
                </p>
            </div>
        `,
        register: `
            <div class="modal-content">
                <a href="#" class="close-modal">&times;</a>
                <h2 style="text-align: center; margin-bottom: 1.5rem;">Crear Cuenta</h2>
                
                <div id="register-error" class="error-message"></div>
                <div id="register-success" class="success-message"></div>
                
                <form id="register-form">
                    <div class="input-group">
                        <label for="register-name">Nombre completo</label>
                        <input type="text" id="register-name" required>
                    </div>

                    <div class="input-group">
                        <label for="register-email">Correo electrónico</label>
                        <input type="email" id="register-email" required>
                    </div>

                    <div class="input-group">
                        <label for="register-password">Contraseña</label>
                        <input type="password" id="register-password" required>
                    </div>

                    <div class="input-group">
                        <label for="register-age">Edad</label>
                        <input type="number" id="register-age" required min="18">
                    </div>

                    <button type="submit" class="btn btn-primary" style="width: 100%; margin: 1rem 0;">Crear Cuenta</button>
                </form>

                <p style="text-align: center; margin-top: 1rem;">
                    ¿Ya tienes cuenta? 
                    <button onclick="AuthModalManager.showModal('login')" class="modal-link" style="background: none; border: none; color: var(--primary); cursor: pointer; font-weight: 500;">
                        Inicia Sesión
                    </button>
                </p>
            </div>
        `
    },

    init() {
        // Hacer que AuthModalManager sea global para que onclick funcione
        window.AuthModalManager = this;

        // Crear contenedores de modales si no existen
        ['login', 'register'].forEach(type => {
            const modalId = `${type}-modal`;
            let modal = document.getElementById(modalId);
            if (!modal) {
                modal = document.createElement('div');
                modal.id = modalId;
                modal.className = 'modal';
                document.body.appendChild(modal);
            }
        });

        // Manejar clics en los enlaces de autenticación
        document.addEventListener('click', (e) => {
            // Manejar enlaces externos de modal
            if (e.target.matches('a[href="#login-modal"]')) {
                e.preventDefault();
                this.showModal('login');
            } else if (e.target.matches('a[href="#register-modal"]')) {
                e.preventDefault();
                this.showModal('register');
            }
            // Manejar cierre de modal
            else if (e.target.classList.contains('modal') || e.target.classList.contains('close-modal')) {
                e.preventDefault();
                this.closeModals();
            }
        });

        // Manejar cambios en el hash de la URL
        window.addEventListener('hashchange', () => this.handleHash());
        this.handleHash();
    },

    handleHash() {
        const hash = window.location.hash;
        if (hash === '#login-modal') {
            this.showModal('login');
        } else if (hash === '#register-modal') {
            this.showModal('register');
        }
    },

    showModal(type) {
        this.closeModals();
        const modal = document.getElementById(`${type}-modal`);
        if (modal) {
            modal.innerHTML = this.modalContent[type];
            modal.style.display = 'flex';
            window.location.hash = `${type}-modal`;
            
            if (type === 'login') {
                this.initLoginForm();
            } else {
                this.initRegisterForm();
            }
        }
    },

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
        if (window.location.hash.includes('modal')) {
            history.pushState('', document.title, window.location.pathname);
        }
    },

    initLoginForm() {
        const form = document.getElementById('login-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const errorElement = document.getElementById('login-error');
                
                try {
                    const credentials = {
                        email: document.getElementById('login-email').value,
                        password: document.getElementById('login-password').value
                    };

                    const response = await fetch('http://localhost:3000/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(credentials)
                    });

                    const data = await response.json();
                    
                    if (!response.ok) {
                        throw new Error(data.message || 'Error en el inicio de sesión');
                    }

                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    window.location.href = '/Mostrar.html';
                } catch (error) {
                    if (errorElement) {
                        errorElement.textContent = error.message;
                        errorElement.style.display = 'block';
                    }
                }
            });
        }
    },

    initRegisterForm() {
        const form = document.getElementById('register-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const errorElement = document.getElementById('register-error');
                const successElement = document.getElementById('register-success');
                
                try {
                    const userData = {
                        nombre: document.getElementById('register-name').value,
                        email: document.getElementById('register-email').value,
                        password: document.getElementById('register-password').value,
                        edad: parseInt(document.getElementById('register-age').value)
                    };

                    const response = await fetch('http://localhost:3000/api/auth/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(userData)
                    });

                    const data = await response.json();
                    
                    if (!response.ok) {
                        throw new Error(data.message || 'Error en el registro');
                    }

                    if (successElement) {
                        successElement.textContent = 'Registro exitoso. Por favor, inicia sesión.';
                        successElement.style.display = 'block';
                    }
                    
                    form.reset();
                    
                    // Cambiar al modal de login después de 2 segundos
                    setTimeout(() => {
                        this.showModal('login');
                    }, 2000);
                } catch (error) {
                    if (errorElement) {
                        errorElement.textContent = error.message;
                        errorElement.style.display = 'block';
                    }
                }
            });
        }
    }
};

export default AuthModalManager;