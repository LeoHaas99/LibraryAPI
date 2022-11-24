const express = require('express');
const router = express.Router();
const statistics = require('../services/statistics');

/* GET books. */
router.get('/years', async function(req, res, next) {
    try {
      res.json(await statistics.getYears(req.query.page));
    } catch (err) {
      console.error(`Error while getting stats `, err.message);
      next(err);
    }
  });





module.exports = router;