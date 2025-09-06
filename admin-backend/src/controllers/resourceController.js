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
