var express = require('express');
const User = require('../models/User');
var router = express.Router();
var auth = require("../middlewares/auth");

/* register. */
router.post('/register', async function(req, res, next) {
    try {
        let user = await User.create(req.body);
        let token = await user.signToken();
        return res.status(200).json({ user: user.userJSON(token) });
    } catch (error) {
        return next(error);
    }
});

// login
router.post('/login', async function(req, res, next) {
    let { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ msg: "email/password required to login" });
    }
    try {
        let user = await User.findOne({ email });
        if (user) {
            let result = await user.verifyPassword(password);
            if (result) {
                // genarate token
                let token = await user.signToken();
                return res.status(200).json({ user: user.userJSON(token) });
            } else if (!result) {
                return res.status(400).json({ msg: "password is incorrect" });
            }
        } else {
            return res.status(400).json({ msg: "emailID not registered" });
        }
    } catch (error) {
        return next(error);
    }
});

// dashboard 
router.get("/dashboard", auth.validateToken, (req, res, next) => {
    return res.status(200).json({ msg: "you have entered on dashboard" });
});

// get all users
router.get("/", auth.validateToken, async(req, res, next) => {
    let allUsers = await User.find({});
    return res.status(200).json({ allUsers });
})



module.exports = router;