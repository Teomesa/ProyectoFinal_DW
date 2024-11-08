// backend/src/routes/admin.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const pool = require('../config/database');

// Middleware para verificar si es administrador
const isAdmin = async (req, res, next) => {
    try {
        if (!req.user || !req.user.tipo_usuario) {
            return res.status(403).json({ 
                message: 'Acceso denegado. Se requieren privilegios de administrador.' 
            });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: 'Error en la verificación de administrador' });
    }
};

// Aplicar middleware de autenticación y verificación de admin a todas las rutas
router.use(auth);
router.use(isAdmin);

// Ruta para obtener todos los usuarios
router.get('/users', async (req, res) => {
    try {
        const [users] = await pool.query(`
            SELECT 
                id_usuario,
                nombre,
                email,
                edad,
                tipo_usuario,
                DATE_FORMAT(
                    fecha_registro,
                    '%Y-%m-%d %T'
                ) as fecha_registro
            FROM usuarios
            ORDER BY fecha_registro DESC
        `);

        res.json(users);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ message: 'Error al obtener la lista de usuarios' });
    }
});

// Ruta para cambiar el estado de administrador
router.put('/users/:id/toggle-admin', async (req, res) => {
    try {
        const userId = req.params.id;
        
        // Verificar si el usuario existe
        const [users] = await pool.query(
            'SELECT * FROM usuarios WHERE id_usuario = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const user = users[0];

        // No permitir modificar el admin principal
        if (user.email === 'admin@charcos.com') {
            return res.status(403).json({ 
                message: 'No se puede modificar el administrador principal' 
            });
        }

        // Cambiar el estado
        const newStatus = !user.tipo_usuario;
        
        await pool.query(
            'UPDATE usuarios SET tipo_usuario = ? WHERE id_usuario = ?',
            [newStatus, userId]
        );

        res.json({ 
            success: true,
            message: newStatus ? 'Usuario actualizado a administrador' : 'Usuario ya no es administrador'
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error al actualizar el estado del usuario' });
    }
});

// Función para reordenar IDs
async function reorderUserIds(pool) {
    try {
        // Obtener el ID máximo actual
        const [maxResult] = await pool.query('SELECT MAX(id_usuario) as max_id FROM usuarios');
        const maxId = maxResult[0].max_id;

        // Reiniciar el auto_increment al valor máximo actual
        await pool.query('ALTER TABLE usuarios AUTO_INCREMENT = 1');

        console.log('Auto-increment restablecido exitosamente');
    } catch (error) {
        console.error('Error al reordenar IDs:', error);
        throw error;
    }
}

// Modifica la ruta de eliminación
router.delete('/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        // Verificar si el usuario existe
        const [user] = await pool.query(
            'SELECT email FROM usuarios WHERE id_usuario = ?',
            [userId]
        );

        if (!user[0]) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // No permitir eliminar al admin principal
        if (user[0].email === 'admin@charcos.com') {
            return res.status(403).json({ 
                message: 'No se puede eliminar el administrador principal' 
            });
        }

        // Primero eliminar registros relacionados (si existen)
        await pool.query('DELETE FROM favorito WHERE id_usuario = ?', [userId]);
        await pool.query('DELETE FROM opinion WHERE id_usuario = ?', [userId]);

        // Eliminar el usuario
        const [result] = await pool.query(
            'DELETE FROM usuarios WHERE id_usuario = ?',
            [userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Reordenar IDs después de eliminar
        await reorderUserIds(pool);

        res.json({ message: 'Usuario eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ 
            message: 'Error al eliminar el usuario',
            error: error.message 
        });
    }
});

// Ruta para cambiar el estado de administrador de un usuario
router.put('/users/:id/toggle-admin', async (req, res) => {
    try {
        const userId = req.params.id;
        
        // Verificar si el usuario existe
        const [users] = await pool.query(
            'SELECT * FROM usuarios WHERE id_usuario = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const user = users[0];

        // Verificar si es el admin principal
        if (user.email === 'admin@charcos.com') {
            return res.status(403).json({ 
                message: 'No se puede modificar el estado del administrador principal' 
            });
        }

        // Cambiar el estado del usuario
        const newAdminStatus = !user.tipo_usuario;
        
        const [result] = await pool.query(
            'UPDATE usuarios SET tipo_usuario = ? WHERE id_usuario = ?',
            [newAdminStatus, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Error al actualizar el usuario' });
        }

        res.json({ 
            message: newAdminStatus ? 
                'Usuario actualizado a administrador' : 
                'Usuario ya no es administrador',
            tipo_usuario: newAdminStatus
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error al actualizar el estado del usuario' });
    }
});



module.exports = router;