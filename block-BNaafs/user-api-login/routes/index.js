var express = require('express');
var router = express.Router();
var auth = require("../middlewares/auth");

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

// dashboard 
router.get("/dashboard", auth.validateToken, (req, res, next) => {
    return res.status(200).json({ msg: "you have entered on dashboard" });
})

module.exports = router;