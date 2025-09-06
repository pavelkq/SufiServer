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
