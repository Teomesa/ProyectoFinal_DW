// backend/src/services/imageService.js
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configurar el almacenamiento
const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../../frontend/uploads/charcos');
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error, null);
        }
    },
    filename: function (req, file, cb) {
        // Generar nombre único para el archivo
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'charco-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Filtrar tipos de archivos permitidos
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de archivo no soportado. Solo se permiten JPG y PNG'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max
    }
});

const deleteImage = async (filename) => {
    if (!filename) return;
    
    try {
        const filepath = path.join(__dirname, '../../../frontend/uploads/charcos', filename);
        await fs.unlink(filepath);
    } catch (error) {
        console.error('Error eliminando imagen:', error);
    }
};

module.exports = {
    upload,
    deleteImage
};