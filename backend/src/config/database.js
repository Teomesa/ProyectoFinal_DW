// backend/src/config/database.js
const mysql = require('mysql2');

const connectWithRetry = async (retries = 5, delay = 5000) => {
    while (retries > 0) {
        try {
            const pool = mysql.createPool({
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0,
                enableKeepAlive: true,
                keepAliveInitialDelay: 0
            });

            // Convertir el pool a promesas
            const promisePool = pool.promise();

            // Verificar la conexión
            await promisePool.query('SELECT 1');
            console.log('Conexión a la base de datos establecida correctamente');
            return promisePool;
        } catch (err) {
            console.error(`Error conectando a la base de datos. Intentos restantes: ${retries-1}`);
            console.error(err);
            retries -= 1;
            if (retries === 0) throw err;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

let pool = null;

const initializeDatabase = async () => {
    try {
        pool = await connectWithRetry();
        return pool;
    } catch (error) {
        console.error('Error fatal inicializando la base de datos:', error);
        process.exit(1);
    }
};

// Inicializar la conexión
const dbPromise = initializeDatabase();

module.exports = {
    getConnection: async () => {
        await dbPromise;
        return pool;
    },
    query: async (...args) => {
        const connection = await dbPromise;
        return connection.query(...args);
    }
};