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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/charcos', charcosRoutes);
app.use('/api/admin', adminRoutes);

// Configuración para servir archivos estáticos
const frontendPath = path.join(__dirname, '../../frontend');
console.log('Ruta del frontend:', frontendPath);

// Servir archivos estáticos desde el directorio frontend
app.use(express.static(frontendPath));

// Ruta para todas las peticiones que no sean API
app.get('*', (req, res) => {
    console.log('Ruta solicitada:', req.path);
    
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ message: 'API endpoint not found' });
    }

    const indexPath = path.join(frontendPath, 'index.html');
    console.log('Sirviendo index.html desde:', indexPath);
    
    // Verificar si el archivo existe
    if (!require('fs').existsSync(indexPath)) {
        console.error('El archivo index.html no existe en:', indexPath);
        return res.status(404).send('Archivo no encontrado');
    }
    
    res.sendFile(indexPath);
});

// En app.js
app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/admin.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
    console.log('Directorio de trabajo actual:', process.cwd());
    console.log('Contenido del directorio frontend:', require('fs').readdirSync(frontendPath));
});
