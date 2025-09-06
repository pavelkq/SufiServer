const Group = require('../models/Group');

/**
 * Получить все группы
 * Возвращает объект с data и total — формат, который ожидает React-admin
 */
async function getAllGroups(req, res, next) {
  try {
    const groups = await Group.getAllGroups();
    const total = groups.length;

    // Корректно выставляем заголовки для пагинации (React-admin их ждёт)
    res.set('Content-Range', `groups 0-${total - 1}/${total}`);
    res.set('Access-Control-Expose-Headers', 'Content-Range');

    // Важно вернуть объект { data: [...], total: N }
    res.json({
      data: groups,
      total: total,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Получить группу по ID
 */
async function getGroupById(req, res, next) {
  try {
    const group = await Group.getGroupById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Группа не найдена' });
    res.json(group);
  } catch (err) {
    next(err);
  }
}

/**
 * Создать группу
 */
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

/**
 * Обновить группу по ID
 */
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

/**
 * Удалить группу по ID
 */
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
