const pool = require('../config/database');

class Charco {
    async findAll() {
        const [rows] = await pool.query(`
            SELECT c.*, m.nombre as municipio_nombre, mm.url as imagen_principal
            FROM charco c
            LEFT JOIN municipio m ON c.id_municipio = m.id_municipio
            LEFT JOIN multimedia mm ON c.id_charco = mm.id_charco AND mm.principal = TRUE
        `);
        return rows;
    }

    async findById(id) {
        const [charcos] = await pool.query(`
            SELECT 
                c.*,
                m.nombre as municipio_nombre,
                m.descripcion as municipio_descripcion,
                m.ubicacion as municipio_ubicacion,
                m.temperatura,
                m.clima
            FROM charco c
            LEFT JOIN municipio m ON c.id_municipio = m.id_municipio
            WHERE c.id_charco = ?
        `, [id]);

        if (charcos.length === 0) return null;

        const [multimedia] = await pool.query(
            'SELECT * FROM multimedia WHERE id_charco = ?',
            [id]
        );

        const charco = charcos[0];
        charco.multimedia = multimedia;

        return charco;
    }
}

module.exports = Charco;
