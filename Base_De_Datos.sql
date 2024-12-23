-- Eliminar la base de datos si existe
DROP DATABASE IF EXISTS charcos_db;

-- Crear la base de datos
CREATE DATABASE charcos_db;

-- Usar la base de datos
USE charcos_db;

-- Crear tabla municipio
CREATE TABLE municipio (
    id_municipio INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    ubicacion VARCHAR(255),
    temperatura INT,
    clima FLOAT
);

-- Crear tabla usuarios con la corrección
CREATE TABLE usuarios (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    contraseña VARCHAR(255) NOT NULL,
    tipo_usuario BOOLEAN DEFAULT FALSE,
    fecha_registro DATE DEFAULT (CURRENT_DATE()),
    edad INT,
    foto_perfil VARCHAR(255)
);

-- Crear tabla charco
CREATE TABLE charco (
    id_charco INT PRIMARY KEY AUTO_INCREMENT,
    descripcion TEXT,
    nombre VARCHAR(100) NOT NULL,
    profundidad INT,
    es_publico BOOLEAN DEFAULT TRUE,
    costo FLOAT,
    id_municipio INT,
    latitud FLOAT,
    longitud FLOAT,
    calificacion INT,
    FOREIGN KEY (id_municipio) REFERENCES municipio(id_municipio)
);

-- Crear tabla multimedia
CREATE TABLE multimedia (
    id_multimedia INT PRIMARY KEY AUTO_INCREMENT,
    id_charco INT,
    url VARCHAR(255) NOT NULL,
    descripcion TEXT,
    principal BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (id_charco) REFERENCES charco(id_charco)
);

-- Crear tabla opinion
CREATE TABLE opinion (
    id_opinion INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT,
    id_charco INT,
    contenido TEXT,
    fecha_opinion DATE DEFAULT (CURRENT_DATE()),
    imagen_url VARCHAR(255),
    calificacion INT,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_charco) REFERENCES charco(id_charco)
);

-- Crear tabla favorito
CREATE TABLE favorito (
    id_lugar INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT,
    id_charco INT,
    fecha_marcado DATE DEFAULT (CURRENT_DATE()),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_charco) REFERENCES charco(id_charco),
    UNIQUE KEY unique_favorito (id_usuario, id_charco)
);

-- Insertar datos de ejemplo en municipio
INSERT INTO municipio (nombre, descripcion, ubicacion, temperatura, clima) VALUES
('San Luis', 'Municipio con abundantes fuentes hídricas', 'Oriente antioqueño', 25, 25.5),
('San Rafael', 'Conocido por sus hermosos charcos', 'Oriente antioqueño', 23, 23.5),
('Cisneros', 'Destino turístico popular', 'Nordeste antioqueño', 27, 27.5);

-- Insertar datos de ejemplo en usuarios
INSERT INTO usuarios (nombre, email, contraseña, tipo_usuario, edad) VALUES
('Admin User', 'admin@charcos.com', 'hashedpassword123', TRUE, 30),
('Normal User', 'user@email.com', 'hashedpassword456', FALSE, 25);

-- Insertar datos de ejemplo en charco
INSERT INTO charco (nombre, descripcion, profundidad, es_publico, costo, id_municipio, latitud, longitud, calificacion) VALUES
('Charco la planta', 'Aguas cristalinas rodeadas de naturaleza', 22, TRUE, 0, 1, 6.0444, -75.0244, 9),
('Charco Verde', 'Impresionante caída de agua en entorno natural', 15, TRUE, 5000, 1, 6.0445, -75.0245, 9),
('Charco el taurete', 'Remanso tranquilo de aguas verde esmeralda', 18, TRUE, 0, 2, 6.3018, -75.0244, 10),
('Charco la represa', 'Lugar idóneo para terminar una larga caminata', 12, FALSE, 10000, 3, 6.5392, -75.0904, 9);

-- Insertar datos de ejemplo en multimedia
INSERT INTO multimedia (id_charco, url, descripcion, principal) VALUES
(1, 'https://orienteantioqueno.com/wp-content/uploads/2020/11/charco-cascada-la-planta-san-luis-oriente-antioque%C3%B1o-1200x480.jpg', 'Vista principal del charco', TRUE),
(2, 'https://i.ytimg.com/vi/0cYxzyDTdKQ/maxresdefault.jpg', 'Vista de la cascada', TRUE),
(3, 'https://hospedajesanrafaelantioquia.com/wp-content/uploads/2024/06/IMG_4021_compressed_2022_08_09_182009.jpg', 'Vista panorámica', TRUE),
(4, 'https://s0.wklcdn.com/image_29/873223/90720914/59260542Master.jpg', 'Vista del charco', TRUE);

SHOW TABLES;
SELECT * FROM charco;
