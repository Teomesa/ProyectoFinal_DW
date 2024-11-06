// frontend/js/utils.js
const API_URL = 'http://localhost:3000/api';

export async function fetchAPI(endpoint, options = {}) {
    try {
        const token = localStorage.getItem('token');
        
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers
        };

        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                // Token inválido o expirado
                localStorage.removeItem('token');
                localStorage.removeItem('user');
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

export function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/auth-form.html';
        return false;
    }
    return true;
}

export function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/?logout=true';
}