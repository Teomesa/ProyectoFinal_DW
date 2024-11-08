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

module.exports = router;