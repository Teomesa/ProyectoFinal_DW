// frontend/js/auth.js
import AuthService from './services/authService.js';

document.addEventListener('DOMContentLoaded', function() {
    // Manejo del formulario de registro
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
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

                await AuthService.register(userData);
                
                if (successElement) {
                    successElement.textContent = 'Registro exitoso. Por favor, inicia sesión.';
                }
                
                // Limpiar el formulario
                registerForm.reset();
                
                // Redirigir al login después de 2 segundos
                setTimeout(() => {
                    window.location.hash = '#login-modal';
                }, 2000);
            } catch (error) {
                if (errorElement) {
                    errorElement.textContent = error.message;
                }
            }
        });
    }

    // Manejo del formulario de login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const errorElement = document.getElementById('login-error');
            
            try {
                const credentials = {
                    email: document.getElementById('login-email').value,
                    password: document.getElementById('login-password').value
                };

                await AuthService.login(credentials);
                
                // Redirigir a la página de charcos después del login exitoso
                window.location.href = '/Mostrar.html';
            } catch (error) {
                if (errorElement) {
                    errorElement.textContent = error.message;
                }
            }
        });
    }

    // Verificar autenticación en páginas protegidas
    const isProtectedPage = window.location.pathname === '/Mostrar.html';
    if (isProtectedPage && !AuthService.isAuthenticated()) {
        window.location.href = '/auth-form.html';
    }
});