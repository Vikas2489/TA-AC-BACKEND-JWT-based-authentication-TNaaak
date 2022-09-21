var express = require('express');
var router = express.Router();
var Book = require("../models/Books");

router.get("/", (req, res) => {
    return res.send("welcome to express");
})

module.exports = router;