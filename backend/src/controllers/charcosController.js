const Charco = require('../models/Charco');

exports.getAllCharcos = async (req, res) => {
    try {
        const charco = new Charco();
        const charcos = await charco.findAll();
        res.json(charcos);
    } catch (error) {
        console.error('Error al obtener charcos:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getCharcoById = async (req, res) => {
    try {
        const { id } = req.params;
        const charco = new Charco();
        const charcoData = await charco.findById(id);
        
        if (!charcoData) {
            return res.status(404).json({ message: 'Charco no encontrado' });
        }
        
        res.json(charcoData);
    } catch (error) {
        console.error('Error al obtener charco:', error);
        res.status(500).json({ error: error.message });
    }
};
