const express = require('express');
const router = express.Router();
const authors = require('../services/authors');

/* GET authors. */
router.get('/', async function(req, res, next) {
  try {
    res.json(await authors.getMultiple(req.query.page));
  } catch (err) {
    console.error(`Error while getting authors `, err.message);
    next(err);
  }
});

/* GET authors. */
router.get('/books', async function(req, res, next) {
  try {
    res.json(await authors.getBookCount(req.query.page));
  } catch (err) {
    console.error(`Error while getting authors `, err.message);
    next(err);
  }
});
/* GET authors. */
router.get('/books/:id', async function(req, res, next) {
  try {
    res.json(await authors.getSingle(req.query.page, req.params.id));
  } catch (err) {
    console.error(`Error while getting authors `, err.message);
    next(err);
  }
});
/* GET authors by filter */
router.get('/books/filter/:filter', async function(req, res, next) {
  try {
    res.json(await authors.getMultipleByFilter(req.query.page, req.params.filter));
  } catch (err) {
    console.error(`Error while getting authors `, err.message);
    next(err);
  }
});

/* POST author */
router.post('/', async function(req, res, next) {
  try {
    res.json(await authors.create(req.body));
  } catch (err) {
    console.error(`Error while creating author`, err.message);
    next(err);
  }
});

/* DELETE circuit */
router.delete('/:autorId', async function (req, res, next) {
  try {
    res.json(await authors.remove(req.params.autorId));
  } catch (err) {
    console.error(`Error while deleting author`, err.message);
    next(err);
  }
});

/* PUT */
router.put('/:authorId', async function(req, res, next) {
  try {
    res.json(await authors.update(req.params.authorId, req.body.author));
  } catch (err) {
    console.error(`Error while editing author`, err.message);
    next(err);
  }
});
module.exports = router;