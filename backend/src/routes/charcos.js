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
                mm.url as imagen_principal,
                CASE WHEN f.id_lugar IS NOT NULL THEN TRUE ELSE FALSE END as is_favorite
            FROM charco c
            LEFT JOIN municipio m ON c.id_municipio = m.id_municipio
            LEFT JOIN multimedia mm ON c.id_charco = mm.id_charco AND mm.principal = TRUE
            LEFT JOIN favorito f ON f.id_charco = c.id_charco AND f.id_usuario = ?
        `, [req.user.id_usuario]);

        res.json(charcos);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Resto de las rutas...

module.exports = router;