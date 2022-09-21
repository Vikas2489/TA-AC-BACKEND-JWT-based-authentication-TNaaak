var express = require('express');
var router = express.Router();
var Book = require("../models/Books");
var Comment = require("../models/Comments");
var auth = require("../middleware/auth");
var User = require("../models/Users");

router.use(auth.verifyToken);

// create a comment
router.post("/:bookId", async(req, res, next) => {
    let bookId = req.params.bookId;
    req.body.bookId = bookId;
    req.body.user = req.user.userId;
    Comment.create(req.body, async(err, newComment) => {
        if (err) return next(err);
        Book.findByIdAndUpdate(bookId, { $push: { comment: newComment.id } }, async(err, updatedBook) => {
            if (err) return next(err);
            await User.findByIdAndUpdate(updatedBook.author, { $push: { comments: newComment.id } });
            return res.status(200).json({ updatedBook });
        })
    })
});

// get all comments on a book
router.get("/:bookId", (req, res, next) => {
    let bookId = req.params.bookId;
    Comment.find({ bookId }, (err, comment) => {
        if (err) return next(err);
        return res.status(200).json({ comment });
    });
});

// update a comment 
router.put("/:commentId", async(req, res, next) => {
    let commentId = req.params.commentId;
    let userId = req.user.userId;
    let comment = await Comment.findById(commentId);
    if (userId == comment.user) {
        Comment.findByIdAndUpdate(commentId, req.body, (err, updatedComment) => {
            if (err) return next(err);
            return res.status(200).json({ updatedComment });
        });
    } else {
        return res.status(400).json({ msg: "you can't edit comments written by them" });
    }
});

// delete a comment 
router.delete("/:commentId/delete", async(req, res, next) => {
    let commentId = req.params.commentId;
    let userId = req.user.userId;
    let comment = await Comment.findById(commentId);

    if (userId == comment.author) {
        Comment.findByIdAndDelete(commentId, async(err, deletedComment) => {
            if (err) return next(err);
            Book.findByIdAndUpdate(deletedComment.bookId, { $pull: { comment: deletedComment.id } }, async(err, updatedBook) => {
                if (err) return next(err);
                await User.findByIdAndUpdate(userId, { $pull: { comments: commentId } });
                return res.status(200).json({ deletedComment });
            });
        });
    }

});

module.exports = router;