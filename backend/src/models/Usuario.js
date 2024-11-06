const bcrypt = require('bcryptjs');
const pool = require('../config/database');

class Usuario {
    async create({ nombre, email, password, edad }) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            'INSERT INTO usuarios (nombre, email, password, edad) VALUES (?, ?, ?, ?)',
            [nombre, email, hashedPassword, edad]
        );
        return result.insertId;
    }

    async findByEmail(email) {
        const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
        return rows[0];
    }

    async findById(id) {
        const [rows] = await pool.query('SELECT * FROM usuarios WHERE id_usuario = ?', [id]);
        return rows[0];
    }
}

module.exports = Usuario;
