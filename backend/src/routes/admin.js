// backend/src/routes/admin.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const imageService = require('../services/imageService');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
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
        const [charcos] = await pool.query(`
            SELECT 
                c.*,
                m.nombre as municipio_nombre,
                m.ubicacion as municipio_ubicacion,
                mm.url as imagen_principal
            FROM charco c
            LEFT JOIN municipio m ON c.id_municipio = m.id_municipio
            LEFT JOIN multimedia mm ON c.id_charco = mm.id_charco AND mm.principal = TRUE
        `);
        
        res.json(charcos);
    } catch (error) {
        console.error('Error:', error);
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

// Configuración de multer
const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../../frontend/uploads/charcos');
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            console.error('Error creando directorio:', error);
            cb(error, null);
        }
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'charco-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de archivo no soportado. Solo se permiten JPG y PNG'), false);
    }
};

// Rutas de favoritos
router.get('/favorites', auth, async (req, res) => {
    try {
        const userId = req.user.id_usuario;
        const [favorites] = await pool.query(`
            SELECT 
                c.*,
                m.nombre as municipio_nombre,
                mm.url as imagen_principal,
                f.fecha_marcado
            FROM favorito f
            JOIN charco c ON f.id_charco = c.id_charco
            LEFT JOIN municipio m ON c.id_municipio = m.id_municipio
            LEFT JOIN multimedia mm ON c.id_charco = mm.id_charco AND mm.principal = TRUE
            WHERE f.id_usuario = ?
            ORDER BY f.fecha_marcado DESC
        `, [userId]);
        
        res.json(favorites);
    } catch (error) {
        console.error('Error al obtener favoritos:', error);
        res.status(500).json({ message: 'Error al obtener los favoritos' });
    }
});

router.post('/favorites/:charcoId', auth, async (req, res) => {
    try {
        const userId = req.user.id_usuario;
        const charcoId = req.params.charcoId;

        const [existing] = await pool.query(
            'SELECT * FROM favorito WHERE id_usuario = ? AND id_charco = ?',
            [userId, charcoId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'El charco ya está en favoritos' });
        }

        await pool.query(
            'INSERT INTO favorito (id_usuario, id_charco) VALUES (?, ?)',
            [userId, charcoId]
        );

        res.json({ message: 'Charco agregado a favoritos' });
    } catch (error) {
        console.error('Error al agregar a favoritos:', error);
        res.status(500).json({ message: 'Error al agregar a favoritos' });
    }
});

router.delete('/favorites/:charcoId', auth, async (req, res) => {
    try {
        const userId = req.user.id_usuario;
        const charcoId = req.params.charcoId;

        await pool.query(
            'DELETE FROM favorito WHERE id_usuario = ? AND id_charco = ?',
            [userId, charcoId]
        );

        res.json({ message: 'Charco eliminado de favoritos' });
    } catch (error) {
        console.error('Error al eliminar de favoritos:', error);
        res.status(500).json({ message: 'Error al eliminar de favoritos' });
    }
});

// Ruta POST para crear charcos
router.post('/charcos', upload.single('imagen'), async (req, res) => {
    try {
        console.log('Recibida solicitud POST para crear charco');
        console.log('Datos del formulario:', req.body);
        console.log('Archivo:', req.file);

        const { nombre, descripcion, municipio, clima, profundidad, costo } = req.body;
        
        // Validar datos requeridos
        if (!nombre || !descripcion || !municipio || !clima) {
            if (req.file) {
                await fs.unlink(req.file.path).catch(console.error);
            }
            return res.status(400).json({ 
                message: 'Todos los campos son requeridos' 
            });
        }

        const [municipioResult] = await (await pool.getConnection()).query(
            'SELECT id_municipio FROM municipio WHERE nombre = ?',
            [municipio]
        );
        
        let municipioId;
        if (!municipioResult || municipioResult.length === 0) {
            const [insertResult] = await (await pool.getConnection()).query(
                'INSERT INTO municipio (nombre) VALUES (?)',
                [municipio]
            );
            municipioId = insertResult.insertId;
        } else {
            municipioId = municipioResult[0].id_municipio;
        }

        // Crear el charco
        const [charcoResult] = await (await pool.getConnection()).query(
            'INSERT INTO charco (nombre, descripcion, id_municipio, clima, profundidad, costo) VALUES (?, ?, ?, ?, ?, ?)',
            [nombre, descripcion, municipioId, clima, parseFloat(profundidad), parseFloat(costo)]
        );

        // Si hay imagen, guardar en multimedia
        if (req.file) {
            const imageUrl = `/uploads/charcos/${req.file.filename}`;
            await (await pool.getConnection()).query(
                'INSERT INTO multimedia (id_charco, url, descripcion, principal) VALUES (?, ?, ?, TRUE)',
                [charcoResult.insertId, imageUrl, 'Imagen principal del charco']
            );
        }

        res.status(201).json({ 
            id: charcoResult.insertId, 
            message: 'Charco creado exitosamente' 
        });

    } catch (error) {
        console.error('Error al crear charco:', error);
        if (req.file) {
            await fs.unlink(req.file.path).catch(console.error);
        }
        res.status(500).json({ 
            message: error.message || 'Error al crear el charco' 
        });
    }
});

// Ruta PUT para actualizar charcos
router.put('/charcos/:id', upload.single('imagen'), async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, municipio, clima, profundidad, costo } = req.body;

        // Buscar o crear el municipio
        const [municipioResult] = await (await pool.getConnection()).query(
            'SELECT id_municipio FROM municipio WHERE nombre = ?',
            [municipio]
        );
        
        let municipioId;
        if (!municipioResult || municipioResult.length === 0) {
            const [insertResult] = await (await pool.getConnection()).query(
                'INSERT INTO municipio (nombre) VALUES (?)',
                [municipio]
            );
            municipioId = insertResult.insertId;
        } else {
            municipioId = municipioResult[0].id_municipio;
        }

        // Si hay una nueva imagen
        if (req.file) {
            const [oldImage] = await (await pool.getConnection()).query(
                'SELECT url FROM multimedia WHERE id_charco = ? AND principal = TRUE',
                [id]
            );

            if (oldImage.length > 0) {
                // Eliminar el archivo anterior
                const oldFilename = oldImage[0].url.split('/').pop();
                await fs.unlink(path.join(__dirname, '../../../frontend/uploads/charcos', oldFilename))
                    .catch(console.error);
                
                // Actualizar el registro en la base de datos
                const imageUrl = `/uploads/charcos/${req.file.filename}`;
                await (await pool.getConnection()).query(
                    'UPDATE multimedia SET url = ? WHERE id_charco = ? AND principal = TRUE',
                    [imageUrl, id]
                );
            } else {
                // Crear nuevo registro de imagen
                const imageUrl = `/uploads/charcos/${req.file.filename}`;
                await (await pool.getConnection()).query(
                    'INSERT INTO multimedia (id_charco, url, descripcion, principal) VALUES (?, ?, ?, TRUE)',
                    [id, imageUrl, 'Imagen principal del charco']
                );
            }
        }

        // Actualizar el charco
        await (await pool.getConnection()).query(
            'UPDATE charco SET nombre = ?, descripcion = ?, id_municipio = ?, clima = ?, profundidad = ?, costo = ? WHERE id_charco = ?',
            [nombre, descripcion, municipioId, clima, profundidad, costo, id]
        );

        res.json({ message: 'Charco actualizado exitosamente' });
    } catch (error) {
        console.error('Error al actualizar charco:', error);
        if (req.file) {
            await fs.unlink(req.file.path).catch(console.error);
        }
        res.status(500).json({ message: error.message });
    }
});

// Actualizar la ruta DELETE para eliminar charcos
router.delete('/charcos/:id', auth, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params;
        
        await connection.beginTransaction();

        // Obtener y eliminar las imágenes asociadas
        const [images] = await connection.query(
            'SELECT url FROM multimedia WHERE id_charco = ?',
            [id]
        );

        // Eliminar archivos físicos
        for (const image of images) {
            const filename = image.url.split('/').pop();
            await imageService.deleteImage(filename);
        }

        // Eliminar registros de multimedia
        await connection.query('DELETE FROM multimedia WHERE id_charco = ?', [id]);

        // Eliminar el charco
        await connection.query('DELETE FROM charco WHERE id_charco = ?', [id]);

        await connection.commit();
        res.json({ message: 'Charco eliminado exitosamente' });
    } catch (error) {
        await connection.rollback();
        console.error('Error:', error);
        res.status(500).json({ message: error.message });
    } finally {
        connection.release();
    }
});

router.get('/opinions', auth, async (req, res) => {
    try {
        const [opinions] = await pool.query(`
            SELECT 
                o.id_opinion,
                o.contenido,
                o.calificacion,
                o.fecha_opinion,
                o.imagen_url,
                u.nombre as nombre_usuario,
                c.nombre as charco_nombre,
                o.id_charco
            FROM opinion o
            JOIN usuarios u ON o.id_usuario = u.id_usuario
            JOIN charco c ON o.id_charco = c.id_charco
            ORDER BY o.fecha_opinion DESC
        `);

        res.json(opinions);
    } catch (error) {
        console.error('Error al obtener opiniones:', error);
        res.status(500).json({ message: 'Error al obtener las opiniones' });
    }
});

// Ruta para eliminar una opinión
router.delete('/opinions/:id', auth, async (req, res) => {
    try {
        const opinionId = req.params.id;
        console.log('Iniciando eliminación de opinión:', opinionId);

        // 1. Verificar si la opinión existe y obtener sus datos
        const [opinions] = await pool.query(`
            SELECT o.*, c.nombre as charco_nombre 
            FROM opinion o 
            JOIN charco c ON o.id_charco = c.id_charco 
            WHERE o.id_opinion = ?
        `, [opinionId]);

        if (opinions.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Opinión no encontrada'
            });
        }

        const opinion = opinions[0];
        const charcoId = opinion.id_charco;

        // 2. Si hay una imagen, intentar eliminarla
        if (opinion.imagen_url) {
            try {
                const imagePath = path.join(__dirname, '../../../frontend', opinion.imagen_url);
                await fs.unlink(imagePath);
                console.log('Imagen eliminada:', imagePath);
            } catch (err) {
                console.error('Error al eliminar imagen:', err);
                // Continuamos incluso si hay error al eliminar la imagen
            }
        }

        // 3. Eliminar la opinión
        await pool.query('DELETE FROM opinion WHERE id_opinion = ?', [opinionId]);

        // 4. Recalcular la calificación promedio del charco
        const [avgResult] = await pool.query(`
            SELECT COALESCE(ROUND(AVG(calificacion)), 0) as promedio 
            FROM opinion 
            WHERE id_charco = ?
        `, [charcoId]);

        // 5. Actualizar la calificación del charco
        await pool.query(
            'UPDATE charco SET calificacion = ? WHERE id_charco = ?',
            [avgResult[0].promedio, charcoId]
        );

        // 6. Enviar respuesta exitosa
        res.json({
            success: true,
            message: 'Opinión eliminada exitosamente',
            data: {
                charcoId: charcoId,
                nuevaCalificacion: avgResult[0].promedio
            }
        });

    } catch (error) {
        console.error('Error al eliminar opinión:', error);
        // Asegurarnos de que el servidor no se caiga y envíe una respuesta
        res.status(500).json({
            success: false,
            message: 'Error al eliminar la opinión',
            error: error.message
        });
    }
});

module.exports = router;