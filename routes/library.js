const express = require('express');
const router = express.Router();
const library = require('../services/library');

/* GET books. */
router.get('/', async function(req, res, next) {
  try {
    res.json(await library.getMultiple(req.query.page));
  } catch (err) {
    console.error(`Error while getting books `, err.message);
    next(err);
  }
});

/* GET last books. */
router.get('/last', async function(req, res, next) {
  try {
    res.json(await library.getLast(req.query.page));
  } catch (err) {
    console.error(`Error while getting books `, err.message);
    next(err);
  }
});

/* GET book by Id. */
router.get('/:id', async function(req, res, next) {
  try {
    res.json(await library.getSingle(req.params.id));
  } catch (err) {
    console.error(`Error while getting book `, err.message);
    next(err);
  }
});

/* GET books by filter */
router.get('/filter/:filter', async function(req, res, next) {
  try {
    res.json(await library.getMultipleByFilter(req.query.page, req.params.filter));
  } catch (err) {
    console.error(`Error while getting books `, err.message);
    next(err);
  }
});

/* POST book */
router.post('/', async function(req, res, next) {
  try {
    res.json(await library.create(req.body));
  } catch (err) {
    console.error(`Error while creating book`, err.message);
    next(err);
  }
});

/* DELETE circuit */
router.delete('/:bookId', async function (req, res, next) {
  try {
    res.json(await library.remove(req.params.bookId));
  } catch (err) {
    console.error(`Error while deleting book`, err.message);
    next(err);
  }
});

/* PUT book */
router.put('/:bookId', async function(req, res, next) {
  try {
    res.json(await library.update(req.params.bookId, req.body));
  } catch (err) {
    console.error(`Error while editing book`, err.message);
    next(err);
  }
});
module.exports = router;