// frontend/js/services/authService.js

class AuthService {
    constructor() {
        this.API_URL = 'http://localhost:3000/api';
    }

    async register(userData) {
        try {
            const response = await fetch(`${this.API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Error en el registro');
            }

            return data;
        } catch (error) {
            throw error;
        }
    }

    async login(credentials) {
        try {
            const response = await fetch(`${this.API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentials)
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Error en el login');
            }

            // Guardar el token en localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            return data;
        } catch (error) {
            throw error;
        }
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    }

    isAuthenticated() {
        return localStorage.getItem('token') !== null;
    }

    getToken() {
        return localStorage.getItem('token');
    }

    getCurrentUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }
}

export default new AuthService();