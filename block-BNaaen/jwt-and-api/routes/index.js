var express = require('express');
const Article = require('../models/Articles');
var router = express.Router();

/* GET home page. */
router.get('/tags', async function (req, res, next) {
  try {
    let tags = await Article.distinct('taglist');
    return res.status(200).json({ tags });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
