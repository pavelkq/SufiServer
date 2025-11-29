FROM node:18-alpine

WORKDIR /app

# 1. Копируем ТОЛЬКО package.json (без package-lock.json)
COPY package.json ./

# 2. Удаляем старый package-lock.json если он есть
RUN rm -f package-lock.json

# 3. Устанавливаем зависимости (создаст новый package-lock.json)
RUN npm install

# 4. Устанавливаем react-scripts глобально
RUN npm install -g react-scripts

# 5. Копируем остальные файлы
COPY . .

RUN npm run build

EXPOSE 3000

CMD ["react-scripts", "start", "--host", "0.0.0.0"]

