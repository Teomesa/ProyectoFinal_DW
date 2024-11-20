// backend/src/routes/charcos.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const pool = require('../config/database');

// Todas las rutas requieren autenticación
router.use(auth);

// Obtener todos los charcos
router.get('/', async (req, res) => {
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
        
        console.log('Charcos encontrados:', charcos);
        res.json(charcos);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error al obtener los charcos' });
    }
});

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

// Agregar a favoritos
router.post('/favorites/:charcoId', auth, async (req, res) => {
    try {
        const userId = req.user.id_usuario;
        const charcoId = req.params.charcoId;

        // Verificar si ya existe en favoritos
        const [existing] = await pool.query(
            'SELECT * FROM favorito WHERE id_usuario = ? AND id_charco = ?',
            [userId, charcoId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'El charco ya está en favoritos' });
        }

        // Agregar a favoritos
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

// Eliminar de favoritos
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

// Verificar si un charco está en favoritos
router.get('/favorites/check/:charcoId', auth, async (req, res) => {
    try {
        const userId = req.user.id_usuario;
        const charcoId = req.params.charcoId;

        const [favorite] = await pool.query(
            'SELECT * FROM favorito WHERE id_usuario = ? AND id_charco = ?',
            [userId, charcoId]
        );

        res.json({ isFavorite: favorite.length > 0 });
    } catch (error) {
        console.error('Error al verificar favorito:', error);
        res.status(500).json({ message: 'Error al verificar favorito' });
    }
});

module.exports = router;