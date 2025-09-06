FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY certs ./certs

COPY . .

EXPOSE 4001

CMD ["npm", "start"]