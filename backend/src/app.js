// backend/src/app.js
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Importar rutas - asegúrate de que cada ruta se importe solo una vez
const authRoutes = require('./routes/auth');
const charcosRoutes = require('./routes/charcos');
const adminRoutes = require('./routes/admin');
const opinionsRoutes = require('./routes/opinions');

const app = express();
const frontendPath = path.join(__dirname, '../../frontend');
console.log('Frontend path:', frontendPath);

// Asegurar que el directorio de uploads exista
const uploadsDir = path.join(frontendPath, 'uploads/charcos');
try {
    require('fs').mkdirSync(uploadsDir, { recursive: true });
    console.log('Directorio de uploads creado:', uploadsDir);
} catch (error) {
    console.error('Error creando directorio de uploads:', error);
}

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware para depuración
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// API Routes - asegúrate de que cada ruta se use solo una vez
app.use('/api/auth', authRoutes);
app.use('/api/charcos', charcosRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', opinionsRoutes); 

// Servir archivos estáticos
app.use(express.static(frontendPath));
app.use('/uploads/charcos', express.static(uploadsDir));

// Manejador de errores global
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        message: 'Error interno del servidor',
        error: err.message
    });
});

// Ruta admin.html específica
app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(frontendPath, 'admin.html'));
});

// Ruta catch-all para el frontend
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