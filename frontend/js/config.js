// frontend/js/config.js
const API_URL = 'http://localhost:3000/api';

class ApiService {
    constructor() {
        this.baseUrl = API_URL;
    }

    getHeaders() {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json'
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    async fetchAPI(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers: {
                    ...this.getHeaders(),
                    ...options.headers
                }
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    // Token inválido o expirado
                    localStorage.removeItem('token');
                    window.location.href = '/auth-form.html';
                }
                throw new Error(data.message || 'Error en la petición');
            }

            return data;
        } catch (error) {
            console.error('Error en fetchAPI:', error);
            throw error;
        }
    }

    checkAuth() {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/auth-form.html';
            return false;
        }
        return true;
    }
}

export default new ApiService();