// backend/src/app.js
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const charcosRoutes = require('./routes/charcos');
const adminRoutes = require('./routes/admin');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware para depuración
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// API Routes - Primero procesar las rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/charcos', charcosRoutes);
app.use('/api/admin', adminRoutes);

// Configuración para servir archivos estáticos
const frontendPath = path.join(__dirname, '../../frontend');
app.use(express.static(frontendPath));

// Ruta admin.html específica
app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(frontendPath, 'admin.html'));
});

// MOVER ESTA RUTA AL FINAL - para que no intercepte las rutas de la API
app.get('*', (req, res) => {
    console.log('Ruta no encontrada:', req.path);
    
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ message: 'API endpoint not found' });
    }

    const indexPath = path.join(frontendPath, 'index.html');
    
    if (!require('fs').existsSync(indexPath)) {
        console.error('El archivo index.html no existe en:', indexPath);
        return res.status(404).send('Archivo no encontrado');
    }
    
    res.sendFile(indexPath);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});