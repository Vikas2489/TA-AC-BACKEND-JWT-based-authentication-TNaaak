var express = require('express');
const User = require('../models/User');
var router = express.Router();

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




module.exports = router;