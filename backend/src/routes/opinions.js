// backend/src/routes/opinions.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const pool = require('../config/database');

// Configuración de multer para las imágenes
const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../../frontend/uploads/opinions');
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error, null);
        }
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'opinion-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB máximo
    }
});

// Obtener opiniones de un charco específico
router.get('/charcos/:charcoId/opinions', auth, async (req, res) => {
    try {
        const [opinions] = await pool.query(`
            SELECT 
                o.*,
                u.nombre as nombre_usuario
            FROM opinion o
            JOIN usuarios u ON o.id_usuario = u.id_usuario
            WHERE o.id_charco = ?
            ORDER BY o.fecha_opinion DESC
        `, [req.params.charcoId]);

        res.json(opinions);
    } catch (error) {
        console.error('Error al obtener opiniones:', error);
        res.status(500).json({ message: 'Error al obtener las opiniones' });
    }
});

// Crear una nueva opinión
router.post('/charcos/:charcoId/opinions', auth, upload.single('imagen'), async (req, res) => {
    try {
        const { charcoId } = req.params;
        const { contenido, calificacion } = req.body;
        const userId = req.user.id_usuario;

        // Validar calificación
        const rating = parseInt(calificacion);
        if (isNaN(rating) || rating < 1 || rating > 10) {
            return res.status(400).json({ 
                message: 'La calificación debe ser un número entre 1 y 10' 
            });
        }

        let imageUrl = null;
        if (req.file) {
            imageUrl = `/uploads/opinions/${req.file.filename}`;
        }

        // Insertar la opinión
        await pool.query(
            'INSERT INTO opinion (id_usuario, id_charco, contenido, calificacion, imagen_url) VALUES (?, ?, ?, ?, ?)',
            [userId, charcoId, contenido, calificacion, imageUrl]
        );

        // Actualizar calificación promedio del charco
        const [avgResult] = await pool.query(
            'SELECT AVG(calificacion) as promedio FROM opinion WHERE id_charco = ?',
            [charcoId]
        );

        const promedio = avgResult[0].promedio || 0;

        await pool.query(
            'UPDATE charco SET calificacion = ? WHERE id_charco = ?',
            [Math.round(promedio), charcoId]
        );

        res.status(201).json({ message: 'Opinión creada exitosamente' });
    } catch (error) {
        console.error('Error al crear opinión:', error);
        if (req.file) {
            await fs.unlink(req.file.path).catch(console.error);
        }
        res.status(500).json({ message: 'Error al crear la opinión' });
    }
});

// Eliminar una opinión
router.delete('/:opinionId', auth, async (req, res) => {
    try {
        const [opinion] = await pool.query(
            'SELECT * FROM opinion WHERE id_opinion = ?',
            [req.params.opinionId]
        );

        if (opinion.length === 0) {
            return res.status(404).json({ message: 'Opinión no encontrada' });
        }

        // Solo permitir eliminar al dueño o admin
        if (opinion[0].id_usuario !== req.user.id_usuario && !req.user.tipo_usuario) {
            return res.status(403).json({ message: 'No autorizado' });
        }

        // Eliminar imagen si existe
        if (opinion[0].imagen_url) {
            const imagePath = path.join(__dirname, '../../../frontend', opinion[0].imagen_url);
            await fs.unlink(imagePath).catch(console.error);
        }

        await pool.query('DELETE FROM opinion WHERE id_opinion = ?', [req.params.opinionId]);

        // Actualizar calificación promedio del charco
        const [avgResult] = await pool.query(
            'SELECT AVG(calificacion) as promedio FROM opinion WHERE id_charco = ?',
            [opinion[0].id_charco]
        );

        await pool.query(
            'UPDATE charco SET calificacion = ? WHERE id_charco = ?',
            [Math.round(avgResult[0].promedio || 0), opinion[0].id_charco]
        );

        res.json({ message: 'Opinión eliminada exitosamente' });
    } catch (error) {
        console.error('Error al eliminar opinión:', error);
        res.status(500).json({ message: 'Error al eliminar la opinión' });
    }
});

module.exports = router;