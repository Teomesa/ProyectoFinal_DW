// backend/src/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// Ruta de login
router.post('/login', async (req, res) => {
    try {
        console.log('Intento de login:', req.body); // Para debugging
        const { email, password } = req.body;

        // Verificar que el usuario existe
        const [users] = await pool.query(
            'SELECT * FROM usuarios WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: 'El usuario no se encuentra en la base de datos'
            });
        }

        const user = users[0];

        // Verificar la contraseña
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({
                message: 'Contraseña incorrecta'
            });
        }

        // Crear token
        const token = jwt.sign(
            { 
                userId: user.id_usuario, 
                email: user.email,
                tipo_usuario: user.tipo_usuario 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Enviar respuesta exitosa
        res.json({ 
            token,
            user: {
                id: user.id_usuario,
                nombre: user.nombre,
                email: user.email,
                tipo_usuario: user.tipo_usuario
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Ruta de registro
router.post('/register', async (req, res) => {
    try {
        console.log('Datos recibidos para registro:', req.body);
        const { nombre, email, password, edad } = req.body;

        // Validación mejorada
        if (!nombre || !email || !password || !edad) {
            return res.status(400).json({
                message: 'Todos los campos son requeridos',
                received: { nombre, email, password: '***', edad }
            });
        }

        // Verificar si el usuario ya existe
        const [existingUsers] = await pool.query(
            'SELECT * FROM usuarios WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({
                message: 'El email ya está registrado'
            });
        }

        // Hashear la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insertar el nuevo usuario
        const [result] = await pool.query(
            `INSERT INTO usuarios (nombre, email, password, edad) 
             VALUES (?, ?, ?, ?)`,
            [nombre, email, hashedPassword, edad]
        );

        console.log('Usuario insertado:', result);

        // Verificar que el usuario se insertó correctamente
        if (result.affectedRows !== 1) {
            throw new Error('Error al insertar usuario');
        }

        // Verificar que el usuario existe en la base de datos
        const [newUser] = await pool.query(
            'SELECT id_usuario, nombre, email FROM usuarios WHERE id_usuario = ?',
            [result.insertId]
        );

        if (newUser.length === 0) {
            throw new Error('No se pudo verificar la creación del usuario');
        }

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            user: {
                id: newUser[0].id_usuario,
                nombre: newUser[0].nombre,
                email: newUser[0].email
            }
        });

    } catch (error) {
        console.error('Error detallado en registro:', error);
        res.status(500).json({
            message: 'Error al registrar usuario',
            error: error.message
        });
    }
});


module.exports = router;