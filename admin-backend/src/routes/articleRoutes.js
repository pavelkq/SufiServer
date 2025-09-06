const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');

// Сначала специфичные роуты, потом общие
// Категории
router.get('/categories', articleController.listCategories);
router.post('/categories', articleController.createNewCategory);
router.put('/categories/:id', articleController.updateCategoryHandler);
router.delete('/categories/:id', articleController.deleteCategoryHandler);

// Теги
router.get('/tags', articleController.listTags);
router.post('/tags', articleController.createNewTag);
router.put('/tags/:id', articleController.updateTagHandler);
router.delete('/tags/:id', articleController.deleteTagHandler);

// Статьи
router.get('/', articleController.listArticles);
router.post('/', articleController.createNewArticle);
router.get('/:id', articleController.getArticle);
router.put('/:id', articleController.updateArticleHandler);
router.delete('/:id', articleController.deleteArticleHandler);

// Дополнительные роуты для статей
router.get('/:id/tags', articleController.getArticleTags);
router.post('/article_tags', articleController.createArticleTag);
router.delete('/article_tags', articleController.deleteArticleTag);

// Загрузка файлов
router.post('/upload', articleController.uploadFiles);

module.exports = router;
