#!/bin/bash

set -e

echo "Создаём структуру admin-frontend с React-admin и JWT авторизацией..."

# Создаём директорию
mkdir -p admin-frontend/src/components

# package.json
cat > admin-frontend/package.json <<'EOF'
{
  "name": "admin-frontend",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "react-admin": "^4.2.0",
    "ra-data-simple-rest": "^4.2.0",
    "prop-types": "^15.8.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  }
}
EOF

# Dockerfile
cat > admin-frontend/Dockerfile <<'EOF'
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
EOF

# src/index.js
mkdir -p admin-frontend/src
cat > admin-frontend/src/index.js <<'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
EOF

# src/App.js с react-admin и authProvider
cat > admin-frontend/src/App.js <<'EOF'
import * as React from "react";
import { Admin, Resource, ListGuesser } from 'react-admin';
import dataProvider from './dataProvider';
import authProvider from './authProvider';

const App = () => (
  <Admin dataProvider={dataProvider} authProvider={authProvider}>
    <Resource name="users" list={ListGuesser} />
    {/* Добавьте другие ресурсы по API */}
  </Admin>
);

export default App;
EOF

# src/dataProvider.js
cat > admin-frontend/src/dataProvider.js <<'EOF'
import simpleRestProvider from 'ra-data-simple-rest';

const apiUrl = '/api/admin-backend'; // прокси nginx

const dataProvider = simpleRestProvider(apiUrl);

export default dataProvider;
EOF

# src/authProvider.js с JWT авторизацией и refresh token через cookie
cat > admin-frontend/src/authProvider.js <<'EOF'
const API_URL = '/api/auth-service';

const authProvider = {
  login: ({ username, password }) => {
    return fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include', // для httpOnly cookie с refresh token
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Ошибка авторизации');
      }
      return response.json();
    })
    .then(({ accessToken }) => {
      localStorage.setItem('accessToken', accessToken);
    });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    return Promise.resolve();
  },

  checkAuth: () => {
    return localStorage.getItem('accessToken')
      ? Promise.resolve()
      : Promise.reject();
  },

  checkError: (error) => {
    const status = error.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem('accessToken');
      return Promise.reject();
    }
    return Promise.resolve();
  },

  getIdentity: () => {
    // Можно декодировать JWT или запросить /me у auth-service
    return Promise.resolve({ id: 'user-id', fullName: 'User Name' });
  },

  getPermissions: () => Promise.resolve(),
};

export default authProvider;
EOF

# src/components/UserList.js пример компонента (можно расширить)
cat > admin-frontend/src/components/UserList.js <<'EOF'
import React from 'react';
import { List, Datagrid, TextField, EmailField } from 'react-admin';

export const UserList = props => (
  <List {...props}>
    <Datagrid rowClick="edit">
      <TextField source="id" label="ID" />
      <TextField source="name" />
      <TextField source="username" />
      <EmailField source="email" />
    </Datagrid>
  </List>
);
EOF

echo "Обновляем docker-compose.yml..."

# Резервная копия docker-compose.yml
cp docker-compose.yml docker-compose.yml.bak

# Перезаписываем docker-compose.yml с добавлением admin-frontend и обновлением nginx
cat > docker-compose.yml <<'EOF'
version: '3.8'
services:
  admin-backend:
    build: ./admin-backend
    depends_on:
      - db
    environment:
      - DB_HOST=db
      - DB_USER=user
      - DB_PASSWORD=pass
      - DB_NAME=auth
      - DB_PORT=5432
      - PORT=4001
      - JWT_SECRET=your_jwt_secret_here
    ports:
      - "4001:4001"
    volumes:
      - ./admin-backend:/app
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4001/ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  auth-service:
    build: ./auth-service
    depends_on:
      - db
    environment:
      - DB_HOST=db
      - DB_USER=user
      - DB_PASSWORD=pass
      - DB_NAME=auth
      - DB_PORT=5432
      - PORT=5000
      - JWT_SECRET=your_jwt_secret_here
      - JWT_EXPIRES_IN=1h
    ports:
      - "5000:5000"
    volumes:
      - ./auth-service:/app
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:13
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./wrapper.sh:/wrapper.sh
    entrypoint: ["/wrapper.sh"]
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: saki
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d saki"]
      interval: 10s
      timeout: 5s
      retries: 5

  saki-service:
    build: ./saki-service
    depends_on:
      db:
        condition: service_healthy
    environment:
      - DB_HOST=db
      - DB_USER=user
      - DB_PASSWORD=pass
      - DB_NAME=saki
      - DB_PORT=5432
      - PORT=4000
    ports:
      - "4000:4000"
    volumes:
      - ./saki-service:/app
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/health"]
      interval: 10s
      timeout: 10s
      retries: 3
      start_period: 60s

  admin-frontend:
    build: ./admin-frontend
    volumes:
      - ./admin-frontend:/app
      - /app/node_modules
    environment:
      - CHOKIDAR_USEPOLLING=true
    depends_on:
      - admin-backend
      - auth-service

  nginx:
    image: nginx:latest
    ports:
      - "8090:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - admin-frontend
      - admin-backend
      - auth-service
      - saki-service

volumes:
  pgdata:
EOF

echo "Обновляем nginx/nginx.conf..."

mkdir -p nginx

cat > nginx/nginx.conf <<'EOF'
worker_processes 1;

events { worker_connections 1024; }

http {
  server {
    listen 80;

    # React-admin frontend (dev сервер)
    location / {
      proxy_pass http://admin-frontend:3000;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection 'upgrade';
      proxy_set_header Host $host;
      proxy_cache_bypass $http_upgrade;
      try_files $uri /index.html;
    }

    # Проксирование API admin-backend
    location /api/admin-backend/ {
      proxy_pass http://admin-backend:4001/;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Проксирование API auth-service
    location /api/auth-service/ {
      proxy_pass http://auth-service:5000/;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Проксирование saki-service
    location /saki/ {
      proxy_pass http://saki-service:4000/;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
    }
  }
}
EOF

echo "Структура admin-frontend создана, docker-compose.yml и nginx/nginx.conf обновлены."
echo "Далее запустите: docker-compose up --build"
