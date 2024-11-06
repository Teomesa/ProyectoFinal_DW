// src/waitForDb.js
const mysql = require('mysql2/promise');

const waitForDb = async () => {
    let retries = 20;
    while (retries) {
        try {
            const connection = await mysql.createConnection({
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME
            });
            await connection.end();
            console.log('Base de datos conectada exitosamente');
            return true;
        } catch (err) {
            console.log(`Intentando conectar a la base de datos... intentos restantes: ${retries}`);
            retries -= 1;
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
    throw new Error('No se pudo conectar a la base de datos');
};

module.exports = waitForDb;
