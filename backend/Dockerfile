FROM node:18

WORKDIR /usr/src/app

# Crear directorio para el backend y frontend
RUN mkdir -p backend frontend/uploads/charcos

WORKDIR /usr/src/app/backend

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código del backend
COPY . .

# Establecer permisos para el directorio de uploads
RUN chmod -R 755 /usr/src/app/frontend/uploads

EXPOSE 3000

CMD ["sh", "-c", "npm install wait-port && npx wait-port db:3306 && npm start"]