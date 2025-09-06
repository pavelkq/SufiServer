#!/bin/bash

set -euo pipefail

BASE_DIR="$(dirname "$0")/admin-backend"
SRC_DIR="$BASE_DIR/src"

echo "Обновляем authMiddleware.js..."

cat > "$SRC_DIR/middleware/authMiddleware.js" <<'EOF'
const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: 'Нет токена авторизации' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Токен не найден' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Неверный токен' });
    req.user = user;
    next();
  });
};
EOF

echo "Создаём модель Group..."

cat > "$SRC_DIR/models/Group.js" <<'EOF'
const db = require('../config/db');

class Group {
  static async getAllGroups() {
    const result = await db.query('SELECT * FROM groups ORDER BY id');
    return result.rows;
  }

  static async getGroupById(id) {
    const result = await db.query('SELECT * FROM groups WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async createGroup(name, description) {
    const result = await db.query(
      'INSERT INTO groups (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );
    return result.rows[0];
  }

  static async updateGroup(id, name, description) {
    const result = await db.query(
      'UPDATE groups SET name = $1, description = $2 WHERE id = $3 RETURNING *',
      [name, description, id]
    );
    return result.rows[0];
  }

  static async deleteGroup(id) {
    await db.query('DELETE FROM groups WHERE id = $1', [id]);
  }
}

module.exports = Group;
EOF

echo "Создаём модель Resource..."

cat > "$SRC_DIR/models/Resource.js" <<'EOF'
const db = require('../config/db');

class Resource {
  static async getAllResources() {
    const result = await db.query('SELECT * FROM resources ORDER BY id');
    return result.rows;
  }

  static async getResourceById(id) {
    const result = await db.query('SELECT * FROM resources WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async createResource(name, type, description) {
    const result = await db.query(
      'INSERT INTO resources (name, type, description) VALUES ($1, $2, $3) RETURNING *',
      [name, type, description]
    );
    return result.rows[0];
  }

  static async updateResource(id, name, type, description) {
    const result = await db.query(
      'UPDATE resources SET name = $1, type = $2, description = $3 WHERE id = $4 RETURNING *',
      [name, type, description, id]
    );
    return result.rows[0];
  }

  static async deleteResource(id) {
    await db.query('DELETE FROM resources WHERE id = $1', [id]);
  }
}

module.exports = Resource;
EOF

echo "Создаём контроллер GroupController..."

cat > "$SRC_DIR/controllers/groupController.js" <<'EOF'
const Group = require('../models/Group');

async function getAllGroups(req, res, next) {
  try {
    const groups = await Group.getAllGroups();
    res.json(groups);
  } catch (err) {
    next(err);
  }
}

async function getGroupById(req, res, next) {
  try {
    const group = await Group.getGroupById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Группа не найдена' });
    res.json(group);
  } catch (err) {
    next(err);
  }
}

async function createGroup(req, res, next) {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Имя группы обязательно' });
    const group = await Group.createGroup(name, description);
    res.status(201).json(group);
  } catch (err) {
    next(err);
  }
}

async function updateGroup(req, res, next) {
  try {
    const { name, description } = req.body;
    const group = await Group.updateGroup(req.params.id, name, description);
    if (!group) return res.status(404).json({ message: 'Группа не найдена' });
    res.json(group);
  } catch (err) {
    next(err);
  }
}

async function deleteGroup(req, res, next) {
  try {
    await Group.deleteGroup(req.params.id);
    res.json({ message: 'Группа удалена' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
};
EOF

echo "Создаём контроллер ResourceController..."

cat > "$SRC_DIR/controllers/resourceController.js" <<'EOF'
const Resource = require('../models/Resource');

async function getAllResources(req, res, next) {
  try {
    const resources = await Resource.getAllResources();
    res.json(resources);
  } catch (err) {
    next(err);
  }
}

async function getResourceById(req, res, next) {
  try {
    const resource = await Resource.getResourceById(req.params.id);
    if (!resource) return res.status(404).json({ message: 'Ресурс не найден' });
    res.json(resource);
  } catch (err) {
    next(err);
  }
}

async function createResource(req, res, next) {
  try {
    const { name, type, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Имя ресурса обязательно' });
    const resource = await Resource.createResource(name, type, description);
    res.status(201).json(resource);
  } catch (err) {
    next(err);
  }
}

async function updateResource(req, res, next) {
  try {
    const { name, type, description } = req.body;
    const resource = await Resource.updateResource(req.params.id, name, type, description);
    if (!resource) return res.status(404).json({ message: 'Ресурс не найден' });
    res.json(resource);
  } catch (err) {
    next(err);
  }
}

async function deleteResource(req, res, next) {
  try {
    await Resource.deleteResource(req.params.id);
    res.json({ message: 'Ресурс удалён' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
};
EOF

echo "Создаём роуты groupRoutes.js..."

cat > "$SRC_DIR/routes/groupRoutes.js" <<'EOF'
const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', groupController.getAllGroups);
router.get('/:id', groupController.getGroupById);
router.post('/', groupController.createGroup);
router.put('/:id', groupController.updateGroup);
router.delete('/:id', groupController.deleteGroup);

module.exports = router;
EOF

echo "Создаём роуты resourceRoutes.js..."

cat > "$SRC_DIR/routes/resourceRoutes.js" <<'EOF'
const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', resourceController.getAllResources);
router.get('/:id', resourceController.getResourceById);
router.post('/', resourceController.createResource);
router.put('/:id', resourceController.updateResource);
router.delete('/:id', resourceController.deleteResource);

module.exports = router;
EOF

echo "Обновляем src/app.js для подключения новых роутов..."

APP_FILE="$SRC_DIR/app.js"

# Проверяем, есть ли уже подключение groupRoutes
if ! grep -q "groupRoutes" "$APP_FILE"; then
  sed -i "/const userRoutes = require('.\/routes\/userRoutes');/a const groupRoutes = require('./routes/groupRoutes');\nconst resourceRoutes = require('./routes/resourceRoutes');" "$APP_FILE"
fi

# Добавляем использование роутов, если их нет
if ! grep -q "app.use('/api/groups'" "$APP_FILE"; then
  sed -i "/app.use('\/api\/users', userRoutes);/a app.use('/api/groups', groupRoutes);\napp.use('/api/resources', resourceRoutes);" "$APP_FILE"
fi

echo "Обновляем package.json и устанавливаем зависимости..."

cd "$BASE_DIR"

npm install jsonwebtoken

echo "Готово! Теперь вы можете запустить сервис командой:"
echo "  npm run dev"
echo
echo "Проверьте новые маршруты (требуют авторизации):"
echo "  curl -H \"Authorization: Bearer <ваш_токен>\" http://localhost:4001/api/groups"
echo "  curl -H \"Authorization: Bearer <ваш_токен>\" http://localhost:4001/api/resources"
echo
echo "Для теста базового маршрута ping:"
echo "  curl http://localhost:4001/ping"
