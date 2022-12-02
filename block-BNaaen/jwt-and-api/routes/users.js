var express = require('express');
var router = express.Router();
var User = require("../models/Users");
var auth = require('../middleware/auth');

/* GET current logged in  user. */
router.get('/', auth.verifyToken, function(req, res, next) {
    if (req.user) {
        return res.status(200).json({ user: req.user.getUserFormat(req.user) });
    } else {
        return res.status(200).json({ error: "You are not logged in yet" });
    }
});

// post to register
router.post('/', async function(req, res, next) {
    try {
        let user = await User.create(req.body);
        let token = await user.signToken();
        return res.status(200).json({ user: user.userJSON(token) });
    } catch (error) {
        next(error);
    }
});

// login router
router.post("/login", async function(req, res, next) {
    let { email, password } = req.body;
    if (!email || !password) {
        return res.status(422).json({ error: "Email/passwrod is required to login" });
    }
    let user = await User.findOne({ email });
    if (user) {
        let result = await user.verifyPassword(password);
        if (result) {
            let token = await user.signToken();
            return res.status(200).json({ user: user.userJSON(token) });
        } else {
            return res.status(401).json({ error: "Password is incorrect" });
        }
    } else {
        return res.status(200).json({ error: "Email is not registered" });
    }
});

router.use(auth.verifyToken);

// update user
router.put("/", async function(req, res, next) {
    try {
        let updatedUser = await User.findByIdAndUpdate(req.user.id, req.body, { $new: true });
        return res.status(200).json({ user: updatedUser.getUserFormat(req.user) });
    } catch (error) {
        return next(error);
    }
});

module.exports = router;