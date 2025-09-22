FROM node:18-alpine

WORKDIR /app

# 1. Копируем только файлы зависимостей
COPY package.json package-lock.json ./

# 2. Устанавливаем ВСЕ зависимости и явно устанавливаем react-scripts
RUN npm install && npm install -g react-scripts

# 3. Копируем остальные файлы
COPY . .

EXPOSE 3000

CMD ["react-scripts", "start", "--host", "0.0.0.0"]