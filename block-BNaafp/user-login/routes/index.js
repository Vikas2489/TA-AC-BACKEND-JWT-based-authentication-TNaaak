var express = require('express');
var router = express.Router();
var auth = require("../middlewares/auth");

/* GET home page. */
router.get('/', function(req, res, next) {
    return res.status(200).json({ title: 'Express App' });
});

// protected route
router.get("/protected", auth.verifyToken, (req, res, next) => {
    console.log(req.user, "user getting from payload");
    return res.send("You have accessed to our protected route!");
})
module.exports = router;