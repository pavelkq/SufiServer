FROM node:18-alpine
RUN apk add --no-cache curl
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
COPY database.json ./database.json
RUN npm install -g db-migrate db-migrate-pg
EXPOSE 4000
CMD ["sh", "-c", "db-migrate up && node src/index.js"]
