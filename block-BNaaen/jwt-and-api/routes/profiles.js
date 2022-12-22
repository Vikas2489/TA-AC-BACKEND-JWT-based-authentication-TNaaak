var express = require('express');
var router = express.Router();
var User = require("../models/Users");
var auth = require('../middleware/auth');


// Get Profile
router.get("/:username", auth.authenticationOptional, async(req, res, next) => {
    let username = req.params.username;
    try {
        let user = await User.findOne({ username });
        return res.status(200).json({ profile: user.getUserFormat(req.user) });
    } catch (error) {
        return next(error);
    }
});

router.use(auth.verifyToken);

// follow user
router.post("/:username/follow", async(req, res, next) => {
    let username = req.params.username;
    try {
        let user = await User.findOne({ username });
        if (user) {
            // if by any chance loggedinuser put his name then send him a msg
            if (user.id != req.user.id) {
                if (req.user.followings.includes(user.id)) {
                    return res.json({ error: "You already follow this user" });
                } else {
                    let updatedUser = await User.findByIdAndUpdate(user.id, { $push: { followers: req.user.id } }, { new: true });
                    let updatedCurrentLoggedInUser = await User.findByIdAndUpdate(req.user.id, { $push: { followings: user.id } }, { new: true });
                    return res.status(200).json({ profile: updatedUser.getUserFormat(updatedCurrentLoggedInUser) });
                }
            } else {
                return res.status(422).json({ error: "You cannot follow yourself" });
            }
        } else {
            return res.json({ error: `Not able to find user with this username ${username}` });
        }
    } catch (error) {
        return next(error);
    }
});

// Unfollow user
router.delete("/:username/follow", async(req, res, next) => {
    let username = req.params.username;
    try {
        let user = await User.findOne({ username });
        if (user) {
            // if by any chance loggedinuser put his name then send him a msg
            if (user.id != req.user.id) {
                if (req.user.followings.includes(user.id)) {
                    let updatedUser = await User.findByIdAndUpdate(user.id, { $pull: { followers: req.user.id } }, { new: true });
                    let updatedCurrentLoggedInUser = await User.findByIdAndUpdate(req.user.id, { $pull: { followings: user.id } }, { new: true });
                    return res.status(200).json({ profile: updatedUser.getUserFormat(updatedCurrentLoggedInUser) });
                } else {
                    return res.json({ error: "You don't follow this user" });
                }
            } else {
                return res.status(422).json({ error: "You cannot follow/unfollow yourself" });
            }
        } else {
            return res.json({ error: `Not able to find user with this username ${username}` });
        }
    } catch (error) {
        return next(error);
    }
});



module.exports = router;