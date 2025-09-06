FROM node:18-bullseye

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY ./src ./src

EXPOSE 5000

CMD ["node", "src/index.js"]