var express = require('express');
const User = require('../models/User');
var router = express.Router();

/* register an user. */
router.post('/register', async function(req, res, next) {
    try {
        let user = await User.create(req.body);
        return res.status(200).json({ user });
    } catch (error) {
        return next(error);
    }
});

// login a user
router.post("/login", async function(req, res, next) {
    let { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ msg: "Email/password is required" });
    }
    try {
        let user = await User.findOne({ email });
        if (user) {
            let result = await user.verifyPassword(password);
            console.log(result);
            if (result) {
                return res.status(200).json({ msg: "logged in successfully" });
            } else {
                return res.status(400).json({ msg: "Password is incorrect" });
            }
        } else {
            return res.status(400).json({ msg: "Email is not registered" });
        }
    } catch (error) {
        return next(error);
    }
});
module.exports = router;