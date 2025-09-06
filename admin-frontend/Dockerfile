FROM node:18-alpine

WORKDIR /app

# 1. Копируем только файлы зависимостей
COPY package.json package-lock.json ./

# 2. Устанавливаем зависимости (кешируется, если package.json не менялся)
RUN npm install --production --frozen-lockfile

# 3. Копируем остальные файлы (исключая node_modules через .dockerignore)
COPY . .

EXPOSE 3000

CMD ["npm", "start"]
