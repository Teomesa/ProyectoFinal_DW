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

// Rutas para gestión de charcos
router.get('/charcos', async (req, res) => {
    try {
        console.log('Accediendo a la ruta GET /charcos en admin');
        const [charcos] = await pool.query(`
            SELECT 
                c.*,
                m.nombre as municipio_nombre
            FROM charco c
            LEFT JOIN municipio m ON c.id_municipio = m.id_municipio
            ORDER BY c.id_charco DESC
        `);
        
        console.log('Charcos encontrados:', { count: charcos.length });
        res.json(charcos);
    } catch (error) {
        console.error('Error en la consulta:', error);
        res.status(500).json({ message: 'Error al obtener los charcos' });
    }
});

// Ruta para obtener un charco específico
router.get('/charcos/:id', async (req, res) => {
    try {
        const [charcos] = await pool.query(
            `SELECT 
                c.*,
                m.nombre as municipio_nombre
            FROM charco c
            LEFT JOIN municipio m ON c.id_municipio = m.id_municipio
            WHERE c.id_charco = ?`,
            [req.params.id]
        );

        if (charcos.length === 0) {
            return res.status(404).json({ message: 'Charco no encontrado' });
        }

        res.json(charcos[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el charco' });
    }
});

router.post('/charcos', async (req, res) => {
    try {
        const { nombre, descripcion, municipio, clima, profundidad, costo } = req.body;
        
        // Validar datos requeridos
        if (!nombre || !descripcion || !municipio || !clima) {
            return res.status(400).json({ 
                message: 'Todos los campos son requeridos' 
            });
        }

        // Buscar o crear el municipio
        let [municipioResult] = await pool.query(
            'SELECT id_municipio FROM municipio WHERE nombre = ?',
            [municipio]
        );
        
        let municipioId;
        
        if (municipioResult.length === 0) {
            // Si el municipio no existe, crearlo
            const [insertResult] = await pool.query(
                'INSERT INTO municipio (nombre) VALUES (?)',
                [municipio]
            );
            municipioId = insertResult.insertId;
        } else {
            municipioId = municipioResult[0].id_municipio;
        }

        // Crear el charco
        const [result] = await pool.query(
            'INSERT INTO charco (nombre, descripcion, id_municipio, clima, profundidad, costo) VALUES (?, ?, ?, ?, ?, ?)',
            [nombre, descripcion, municipioId, clima, profundidad, costo]
        );

        res.status(201).json({ 
            id: result.insertId, 
            message: 'Charco creado exitosamente' 
        });
    } catch (error) {
        console.error('Error al crear charco:', error);
        res.status(500).json({ 
            message: error.message || 'Error al crear el charco' 
        });
    }
});

// Ruta para actualizar un charco
router.put('/charcos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, municipio, clima, profundidad, costo } = req.body;

        // Primero, buscar o crear el municipio
        let [municipioResult] = await pool.query(
            'SELECT id_municipio FROM municipio WHERE nombre = ?',
            [municipio]
        );
        
        let municipioId;
        
        if (municipioResult.length === 0) {
            // Si el municipio no existe, crearlo
            const [insertResult] = await pool.query(
                'INSERT INTO municipio (nombre) VALUES (?)',
                [municipio]
            );
            municipioId = insertResult.insertId;
        } else {
            municipioId = municipioResult[0].id_municipio;
        }

        // Actualizar el charco
        await pool.query(
            'UPDATE charco SET nombre = ?, descripcion = ?, id_municipio = ?, clima = ?, profundidad = ?, costo = ? WHERE id_charco = ?',
            [nombre, descripcion, municipioId, clima, profundidad, costo, id]
        );

        res.json({ message: 'Charco actualizado exitosamente' });
    } catch (error) {
        console.error('Error al actualizar charco:', error);
        res.status(500).json({ message: error.message });
    }
});

router.delete('/charcos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM charco WHERE id_charco = ?', [id]);
        res.json({ message: 'Charco eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;