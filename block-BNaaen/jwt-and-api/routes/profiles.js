var express = require('express');
var router = express.Router();
var User = require("../models/Users");
var auth = require('../middleware/auth');
var slugger = require("slugger");

router.use(auth.verifyToken);

// Get Profile
router.get("/:username", async(req, res, next) => {
    let username = req.params.username;
    try {
        let user = await User.findOne({ username });
        // check if the current logged in user follows this user which i am getting after querying 
        let currentLoggedInUser = await User.findById(req.user.userId);
        let isFollowing;
        if (await currentLoggedInUser.followings.includes(user.id)) {
            console.log("yes you do follow");
            isFollowing = true;
            return res.status(200).json({ profile: user.getUserFormat(), isFollowing });
        } else {
            isFollowing = false;
            return res.status(200).json({ profile: user.getUserFormat(), isFollowing });
        }

    } catch (error) {
        return next(error);
    }
});

// follow user
router.post("/:username/follow", async(req, res, next) => {
    let username = req.params.username;
    try {
        // check if current logged in user has this user already in its followings or not if yes then handle acc it and if no go ahead
        let currentLoggedInUser = await User.findById(req.user.userId);
        let user = await User.findOne({ username });
        if (user) {
            // if by any chance loggedinuser put his name then send him a msg
            if (user.id != req.user.userId) {
                if (currentLoggedInUser.followings.includes(user._id)) {
                    return res.json({ error: "You already follow this user" });
                } else {
                    let updatedUser = await User.findByIdAndUpdate(user.id, { $push: { followers: req.user.userId } }, { new: true });
                    let updatedCurrentLoggedInUser = await User.findByIdAndUpdate(req.user.userId, { $push: { followings: user.id } }, { new: true });
                    return res.status(200).json({ updated_User: updatedUser.getUserFormat(), updated_Current_LoggedInUser: updatedCurrentLoggedInUser.getUserFormat() });
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
        // check if current logged in user has this user already in its followings or not if yes then handle acc it and if no go ahead
        let currentLoggedInUser = await User.findById(req.user.userId);
        let user = await User.findOne({ username });
        if (user) {
            // if by any chance loggedIn user put his name then send him a msg
            if (user.id != req.user.userId) {
                if (currentLoggedInUser.followings.includes(user._id)) {
                    // unfollow the user here
                    let updatedUser = await User.findByIdAndUpdate(user.id, { $pull: { followers: req.user.userId } }, { new: true });
                    let updatedCurrentLoggedInUser = await User.findByIdAndUpdate(req.user.userId, { $pull: { followings: user.id } }, { new: true });
                    return res.status(200).json({ updated_User: updatedUser.getUserFormat(), updated_Current_LoggedInUser: updatedCurrentLoggedInUser.getUserFormat() });
                } else {
                    return res.json({ error: "You don't follow this user" });
                }
            } else {
                return res.status(422).json({ error: "You cannot follow/unfollow yourself!" });
            }
        } else {
            return res.json({ error: `Not able to find user with this username ${username}` });
        }
    } catch (error) {
        return next(error);
    }
});


module.exports = router;