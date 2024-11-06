const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

exports.register = async (req, res) => {
    try {
        const { nombre, email, password, edad } = req.body;
        const usuario = new Usuario();
        await usuario.create({ nombre, email, password, edad });
        res.status(201).json({ message: 'Usuario registrado exitosamente' });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const usuario = new Usuario();
        const user = await usuario.findByEmail(email);
        
        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { userId: user.id_usuario, email: user.email, tipo_usuario: user.tipo_usuario },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, user: { id: user.id_usuario, nombre: user.nombre, email: user.email } });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: error.message });
    }
};
