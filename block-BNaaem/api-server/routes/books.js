var express = require('express');
var router = express.Router();
var Book = require("../models/Books");
var Comment = require("../models/Comments");
var auth = require("../middleware/auth");
var User = require("../models/Users");

router.use(auth.verifyToken);

// post a book
router.post("/", async function(req, res, next) {
    req.body.author = req.user.userId;
    Book.create(req.body, async(err, book) => {
        if (err) return next(err);
        try {
            let user = await User.findByIdAndUpdate(book.author, {
                $push: { books: book.id }
            });
        } catch (error) {
            return next(error);
        }
        return res.status(200).json({ book });
    });
});

/* list all books */
router.get('/', function(req, res, next) {
    Book.find({}, (err, booksArr) => {
        if (err) return next(err);
        return res.status(200).json({ booksArr });
    });
});

// get a single book detail 
router.get("/:id", (req, res, next) => {
    let bookId = req.params.id;
    Book.findById(bookId, (err, book) => {
        if (err) return next(err);
        return res.status(200).json({ book });
    });
});

// update a book
router.put("/:id", async(req, res, next) => {
    let bookId = req.params.id;
    let book = await Book.findById(bookId);
    try {
        if (req.user.userId == book.author) {
            let updatedBook = await Book.findByIdAndUpdate(bookId, req.body);
            return res.status(200).json({ updatedBook });
        } else {
            return res.status(400).json({ msg: "You can't update books which are created by others" });
        }
    } catch (err) {
        return next(err);
    }
});

// delete a book
router.delete("/:id/delete", async(req, res, next) => {
    let bookId = req.params.id;
    let book = await Book.findById(bookId);
    try {
        if (req.user.userId == book.author) {
            let deletedBook = await Book.findByIdAndDelete(bookId);
            await User.findByIdAndUpdate(deletedBook.author, { $pull: { books: bookId } });
            return res.status(200).json({ deletedBook });
        } else {
            return res.status(400).json({ msg: "You can't delete books which are created by others" });
        }
    } catch (err) {
        return next(err);
    }
});


module.exports = router;