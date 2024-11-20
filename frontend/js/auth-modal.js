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
    
                    <button type="submit" class="btn btn-primary" style="width: 100%; margin: 1rem 0;">
                        Iniciar Sesión
                    </button>
                </form>
    
                <p style="text-align: center; margin-top: 0.5rem;">
                    <button onclick="AuthModalManager.showModal('forgot')" class="modal-link" 
                        style="background: none; border: none; color: var(--primary); cursor: pointer; font-weight: 500;">
                        ¿Olvidaste tu contraseña?
                    </button>
                </p>
    
                <p style="text-align: center; margin-top: 1rem;">
                    ¿No tienes cuenta? 
                    <button onclick="AuthModalManager.showModal('register')" class="modal-link" 
                        style="background: none; border: none; color: var(--primary); cursor: pointer; font-weight: 500;">
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
        `,
        forgot: `
            <div class="modal-content">
                <a href="#" class="close-modal">&times;</a>
                <h2 style="text-align: center; margin-bottom: 1.5rem;">Recuperar Contraseña</h2>
                
                <div id="forgot-error" class="error-message"></div>
                <div id="forgot-success" class="success-message"></div>
                
                <form id="forgot-form">
                    <div class="input-group">
                        <label for="forgot-email">Correo electrónico</label>
                        <input type="email" id="forgot-email" required>
                    </div>

                    <button type="submit" class="btn btn-primary" style="width: 100%; margin: 1rem 0;">
                        Enviar Código de Recuperación
                    </button>
                </form>

                <p style="text-align: center; margin-top: 1rem;">
                    ¿Recordaste tu contraseña? 
                    <button onclick="AuthModalManager.showModal('login')" class="modal-link" style="background: none; border: none; color: var(--primary); cursor: pointer; font-weight: 500;">
                        Iniciar Sesión
                    </button>
                </p>
            </div>
        `,

        reset: `
            <div class="modal-content">
                <a href="#" class="close-modal">&times;</a>
                <h2 style="text-align: center; margin-bottom: 1.5rem;">Restablecer Contraseña</h2>
                
                <div id="reset-error" class="error-message"></div>
                <div id="reset-success" class="success-message"></div>
                
                <form id="reset-form">
                    <div class="input-group">
                        <label for="reset-code">Código de Verificación</label>
                        <input type="text" id="reset-code" required minlength="6" maxlength="6">
                    </div>

                    <div class="input-group">
                        <label for="reset-password">Nueva Contraseña</label>
                        <input type="password" id="reset-password" required>
                    </div>

                    <div class="input-group">
                        <label for="reset-confirm">Confirmar Contraseña</label>
                        <input type="password" id="reset-confirm" required>
                    </div>

                    <button type="submit" class="btn btn-primary" style="width: 100%; margin: 1rem 0;">
                        Cambiar Contraseña
                    </button>
                </form>
            </div>
        `
    },


    init() {
        window.AuthModalManager = this;

        // Crear contenedores de modales
        ['login', 'register', 'forgot', 'reset'].forEach(type => {
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
        window.addEventListener('hashchange', () => {
            if (this.debounceTimeout) {
                clearTimeout(this.debounceTimeout);
            }

            this.debounceTimeout = setTimeout(() => {
                this.handleHash();
            }, 100);
        });

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
            requestAnimationFrame(() => {
                if (window.location.hash !== `#${type}-modal`) {
                    history.replaceState(null, '', `#${type}-modal`);
                }
            });
            
            switch(type) {
                case 'login':
                    this.initLoginForm();
                    break;
                case 'register':
                    this.initRegisterForm();
                    break;
                case 'forgot':
                    this.initForgotForm();
                    break;
                case 'reset':
                    this.initResetForm();
                    break;
            }
        }
    },

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
        if (window.location.hash.includes('modal')) {
            requestAnimationFrame(() => {
                history.replaceState(null, '', window.location.pathname);
            });
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
    },

    initForgotForm() {
        const form = document.getElementById('forgot-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const errorElement = document.getElementById('forgot-error');
                const successElement = document.getElementById('forgot-success');
                
                try {
                    const email = document.getElementById('forgot-email').value;
                    const response = await fetch('http://localhost:3000/api/auth/forgot-password', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email })
                    });

                    const data = await response.json();
                    
                    if (!response.ok) {
                        throw new Error(data.message);
                    }

                    // Guardar email para el siguiente paso
                    localStorage.setItem('resetEmail', email);
                    
                    successElement.textContent = data.message;
                    successElement.style.display = 'block';
                    errorElement.style.display = 'none';

                    // Cambiar al modal de reset después de 2 segundos
                    setTimeout(() => {
                        this.showModal('reset');
                    }, 2000);
                } catch (error) {
                    errorElement.textContent = error.message;
                    errorElement.style.display = 'block';
                    successElement.style.display = 'none';
                }
            });
        }
    },

    initResetForm() {
        const form = document.getElementById('reset-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const errorElement = document.getElementById('reset-error');
                const successElement = document.getElementById('reset-success');
                
                try {
                    const email = localStorage.getItem('resetEmail');
                    if (!email) {
                        throw new Error('Por favor, solicita un nuevo código de recuperación');
                    }

                    const code = document.getElementById('reset-code').value;
                    const password = document.getElementById('reset-password').value;
                    const confirmPassword = document.getElementById('reset-confirm').value;

                    if (password !== confirmPassword) {
                        throw new Error('Las contraseñas no coinciden');
                    }

                    const response = await fetch('http://localhost:3000/api/auth/reset-password', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, code, password })
                    });

                    const data = await response.json();
                    
                    if (!response.ok) {
                        throw new Error(data.message);
                    }

                    localStorage.removeItem('resetEmail');
                    
                    successElement.textContent = 'Contraseña actualizada exitosamente';
                    successElement.style.display = 'block';
                    errorElement.style.display = 'none';

                    setTimeout(() => {
                        this.showModal('login');
                    }, 2000);
                } catch (error) {
                    errorElement.textContent = error.message;
                    errorElement.style.display = 'block';
                    successElement.style.display = 'none';
                }
            });
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    AuthModalManager.init();
});

export default AuthModalManager;