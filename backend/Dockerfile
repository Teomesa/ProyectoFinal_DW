FROM node:18-alpine

WORKDIR /usr/src/app/backend

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto de los archivos del backend
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
