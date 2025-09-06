#!/bin/bash

set -e

BASE_DIR="admin-backend"
SRC_DIR="$BASE_DIR/src"

echo "Создаём структуру папок..."

mkdir -p $SRC_DIR/config
mkdir -p $SRC_DIR/controllers
mkdir -p $SRC_DIR/middleware
mkdir -p $SRC_DIR/models
mkdir -p $SRC_DIR/routes
mkdir -p $SRC_DIR/utils

echo "Создаём package.json..."

cat > $BASE_DIR/package.json << 'EOF'
{
  "name": "admin-backend",
  "version": "1.0.0",
  "description": "Backend service for admin panel",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.0",
    "pg": "^8.10.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  }
}
EOF

echo "Создаём .env..."

cat > $BASE_DIR/.env << 'EOF'
PORT=4000
DATABASE_URL=postgresql://user:password@localhost:5432/auth
JWT_SECRET=your_jwt_secret_here
EOF

echo "Создаём src/config/db.js..."

cat > $SRC_DIR/config/db.js << 'EOF'
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
EOF

echo "Создаём src/middleware/authMiddleware.js..."

cat > $SRC_DIR/middleware/authMiddleware.js << 'EOF'
const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = decoded;
    next();
  });
}

module.exports = authMiddleware;
EOF

echo "Создаём src/middleware/errorMiddleware.js..."

cat > $SRC_DIR/middleware/errorMiddleware.js << 'EOF'
function errorMiddleware(err, req, res, next) {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
}

module.exports = errorMiddleware;
EOF

echo "Создаём src/models/User.js..."

cat > $SRC_DIR/models/User.js << 'EOF'
const db = require('../config/db');

async function getUserById(id) {
  const res = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  return res.rows[0];
}

async function getUserByEmail(email) {
  const res = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  return res.rows[0];
}

// Добавьте другие функции: createUser, updateUser и т.д.

module.exports = {
  getUserById,
  getUserByEmail,
};
EOF

echo "Создаём src/controllers/userController.js..."

cat > $SRC_DIR/controllers/userController.js << 'EOF'
const User = require('../models/User');

async function getUsers(req, res, next) {
  try {
    // Реализуйте получение списка пользователей с пагинацией
    const users = await User.getAllUsers();
    res.json(users);
  } catch (err) {
    next(err);
  }
}

async function updateUserGroup(req, res, next) {
  try {
    const { userId, groupId } = req.body;
    // Проверьте права текущего пользователя (req.user.groupLevel)
    // Обновите группу пользователя в БД
    await User.updateGroup(userId, groupId);
    res.json({ message: 'User group updated' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getUsers,
  updateUserGroup,
};
EOF

echo "Создаём src/routes/userRoutes.js..."

cat > $SRC_DIR/routes/userRoutes.js << 'EOF'
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', userController.getUsers);
router.put('/group', userController.updateUserGroup);

module.exports = router;
EOF

echo "Создаём src/app.js..."

cat > $SRC_DIR/app.js << 'EOF'
const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
// Здесь добавьте groupRoutes и resourceRoutes по аналогии
const errorMiddleware = require('./middleware/errorMiddleware');

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

app.use('/api/users', userRoutes);
// app.use('/api/groups', groupRoutes);
// app.use('/api/resources', resourceRoutes);

app.use(errorMiddleware);

module.exports = app;
EOF

echo "Создаём src/server.js..."

cat > $SRC_DIR/server.js << 'EOF'
require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Admin backend running on port ${PORT}`);
});
EOF

echo "Готово! Перейдите в папку admin-backend, выполните 'npm install' и запустите сервер командой 'npm run dev'."
