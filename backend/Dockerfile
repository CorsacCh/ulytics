# Use the official Node.js image as the base image
FROM node:20

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY backend/package*.json ./

# Instalar netcat (nc) para el wait-for-db.sh y limpiar el caché de apt.
RUN apt-get update \
    && apt-get install -y --no-install-recommends netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Instalar exactamente las versiones registradas en package-lock.json.
RUN npm ci

# Copy the rest of the application code to the working directory
COPY backend ./

# Impedir que se publique una imagen si fallan las pruebas unitarias.
RUN npm test

# Copiar el script para esperar la base de datos
COPY backend/wait-for-db.sh /wait-for-db.sh
RUN chmod +x /wait-for-db.sh

# Puerto interno (debe coincidir con PORT del .env)
EXPOSE 4004

# Usar el script como punto de entrada
CMD ["/wait-for-db.sh", "npm", "start"]
