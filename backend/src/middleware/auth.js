// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const auth = async (req, res, next) => {
    try {
        // Obtener el token del header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            throw new Error('No token provided');
        }

        // Verificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verificar que el usuario existe en la base de datos
        const [users] = await pool.query(
            'SELECT id_usuario, nombre, email, tipo_usuario FROM usuarios WHERE id_usuario = ?',
            [decoded.userId]
        );

        if (users.length === 0) {
            throw new Error('Usuario no encontrado');
        }

        // Agregar el usuario a la request
        req.user = users[0];
        next();
    } catch (error) {
        res.status(401).json({ 
            message: 'Por favor autentícate',
            error: error.message 
        });
    }
};

module.exports = auth;