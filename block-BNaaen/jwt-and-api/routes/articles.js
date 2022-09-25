var express = require('express');
var router = express.Router();
var Article = require('../models/Articles');
var User = require("../models/Users");
var auth = require('../middleware/auth');
var slugger = require("slugger");
var Comment = require("../models/Comments");
const { isValidObjectId } = require('mongoose');

router.use(auth.verifyToken);

// feed
router.get("/feed", async(req, res, next) => {
    let limit = req.query.limit ? req.query.limit : 20;
    let offset = req.query.offset ? req.query.offset : 0;
    try {
        let articlesArr = await Article.find({}).sort({ createdAt: 1 }).limit(limit).skip(offset).populate('author').exec();
        articlesArr = articlesArr.map(function(article) { return article.getArticleFormat(req.user.userId); });
        return res.status(200).json({ articlesArr, articlesCount: articlesArr.length });
    } catch (error) {
        return next(error);
    }
});

// list articles
router.get("/", async(req, res, next) => {
    let userId = req.user.userId;
    let user = await User.findById(userId);
    let { taglist, author, favouritedBy } = req.query;
    var limit = req.query.limit ? req.query.limit : 20;
    var offset = req.query.offset ? req.query.offset : 0;
    let query = {};
    if (taglist) {
        query.taglist = taglist;
    }
    if (author) {
        try {
            let user = await User.findOne({ username: author });
            if (user) {
                query.author = user.id;
            }
        } catch (error) {
            return error;
        }
    }
    if (favouritedBy) {
        try {
            let user = await User.findOne({ username: favouritedBy });
            if (user) {
                query.favouritedBy = user.id;
            }
        } catch (error) {
            return error;
        }

    }
    try {
        console.log(query, "this is the query");
        Article.find(query).sort({ createdAt: 1 }).populate("author").limit(limit).skip(offset).exec((err, articlesArr) => {
            if (err) return next(err);
            articlesArr = articlesArr.map(article => {
                return {
                    slug: article.slug,
                    title: article.title,
                    description: article.description,
                    body: article.body,
                    taglist: article.taglist,
                    createdAt: article.createdAt,
                    updatedAt: article.updatedAt,
                    favoritesCount: article.favouritedBy.length,
                    favorited: user.favourites.includes(this.id) ? true : false,
                    author: {
                        username: article.author.username,
                        bio: article.author.bio,
                        isFollowing: article.author.followers.includes(userId) ? true : false,
                    }
                }
            });
            return res.status(200).json({ articlesArr });
        });
    } catch (error) {
        return next(error);
    }
});

// get a single aritcle 
router.get("/:slug", async(req, res, next) => {
    let slug = req.params.slug;
    try {
        let article = await Article.findOne({ slug }).populate('author');
        if (article) {
            return res.status(200).json({ singleArticle: article.getArticleFormat(req.user.userId) });
        } else {
            return res.json({ error: `Didn't found any aritcle with name ${slug}` });
        }
    } catch (error) {
        return next(error);
    }
});

// create a article
router.post("/", async(req, res, next) => {
    try {
        req.body.author = req.user.userId;
        let article = await (await Article.create(req.body)).populate('author');
        let updatedUser = await User.findByIdAndUpdate(req.user.userId, { $push: { articles: article.id } }, { new: true });
        return res.status(200).json({ article: article.getArticleFormat() });
    } catch (error) {
        next(error);
    }
});

// update a article
router.put("/:slug", async(req, res, next) => {
    let slug = req.params.slug;
    let currentLoggedInUser = await User.findById(req.user.userId);
    let article = await Article.findOne({ slug });
    try {
        if (article) {
            if (await currentLoggedInUser.articles.includes(article._id)) {
                req.body.slug = slugger(req.body.title);
                let updatedArticle = await (await Article.findByIdAndUpdate(article._id, req.body, { new: true })).populate('author');
                return res.status(200).json({ updatedArticle: updatedArticle.getArticleFormat() });
            } else {
                return res.status(422).json({ error: "You cannot edit articles created by others" });
            }
        } else {
            return res.json({ error: "there is no article of provided name" });
        }
    } catch (error) {
        return next(error);
    }

});

// delete a article
router.delete("/:slug", async(req, res, next) => {
    let slug = req.params.slug;
    let currentLoggedInUser = await User.findById(req.user.userId);
    let article = await Article.findOne({ slug });
    // check if article is of current logged in user or not and then if yes then delete from the articles collections as well as from the users.
    // if not then handle acc to it.

    try {
        if (article) {
            if (await currentLoggedInUser.articles.includes(article._id)) {
                let deletedArticle = await (await Article.findByIdAndDelete(article._id)).populate('author');
                let updatedUser = await User.findByIdAndUpdate(req.user.userId, { $pull: { articles: article._id } }, { new: true });
                return res.status(200).json({ deletedArticle: deletedArticle.getArticleFormat() });
            } else {
                return res.status(422).json({ error: "You cannot delete articles created by others" });
            }
        } else {
            return res.json({ error: "there is no article of provided name" });
        }
    } catch (error) {
        return next(error);
    }
});

// add comments to a article
router.post("/:slug/comments", async(req, res, next) => {
    let userId = req.user.userId;
    let slug = req.params.slug;
    let article = await Article.findOne({ slug });
    req.body.author = userId;
    if (article) {
        req.body.article = article._id;
    } else {
        return res.status(200).json({ error: `not able to find any article with this name ${slug}` });
    }

    try {
        let comment = await (await Comment.create(req.body)).populate('author');
        let updatedArticle = await Article.findByIdAndUpdate(article._id, { $push: { comments: comment._id } });
        return res.status(200).json({ comment: comment.getCommentFormat(userId) });
    } catch (error) {
        return next(error);
    }
});

// get comments from an article
router.get("/:slug/comments", async(req, res, next) => {
    let slug = req.params.slug;
    let userId = req.user.userId;
    try {
        let article = await (await (await Article.findOne({ slug })).populate('comments')).populate('comments.author');
        let commentsArr = await article.comments.map(comment => comment.getCommentFormat(userId));
        return res.status(200).json({ commentsArr });
    } catch (error) {
        return next(error);
    }
});

// Delete Comment
router.delete("/:slug/comments/:commentId", async(req, res, next) => {
    let slug = req.params.slug;
    let userId = req.user.userId;
    let commentId;
    if (isValidObjectId(req.params.commentId)) {
        commentId = req.params.commentId;
    } else {
        return res.status(200).json({ error: "comment Id is not valid" });
    }
    let comment = await Comment.findById(commentId);
    try {
        if (comment.author == userId) {

            let deletedComment = await Comment.findByIdAndDelete(commentId);
            let updatedArticle = await Article.findOneAndUpdate({ slug }, { $pull: { comments: commentId } });
            return res.status(200).json({ msg: 'Deleted that comment' });
        } else {
            return res.status(422).json({ msg: 'you cannot deleted comments of others' });
        }
    } catch (error) {
        return next(error);
    }
});

//adding the article in favourites
router.post("/:slug/favourite", async(req, res, next) => {
    let slug = req.params.slug;
    let userId = req.user.userId;
    let article = await Article.findOne({ slug });
    let user = await User.findById(userId);
    try {
        if (article) {
            if ((await user).favourites.includes(article.id)) {
                return res.json({ msg: "Already added in the favourites" });
            } else {
                let updatedUser = await User.findByIdAndUpdate(userId, { $push: { favourites: article.id } });
                let updatedArticle = await Article.findByIdAndUpdate(article.id, { $push: { favouritedBy: userId } });
                return res.status(200).json({ success_msg: "Added to favourites" });
            }
        } else {
            return res.status(200).json({ error: `did found any article named as ${slug}` });
        }
    } catch (error) {
        return next(error);
    }
});

// remove an article from favourites
router.delete("/:slug/favourite", async(req, res, next) => {
    let slug = req.params.slug;
    let userId = req.user.userId;
    let article = await Article.findOne({ slug });
    let user = await User.findById(userId);
    try {
        if (article) {
            if ((await user).favourites.includes(article.id)) {
                let updatedUser = await User.findByIdAndUpdate(userId, { $pull: { favourites: article.id } });
                let updatedArticle = await Article.findByIdAndUpdate(article.id, { $pull: { favouritedBy: userId } });
                return res.status(200).json({ success_msg: "removed from favourites" });
            } else {
                return res.json({ msg: "not found in the favourites" });
            }
        } else {
            return res.status(400).json({ error: `did found any article named as ${slug}` });
        }
    } catch (error) {
        return next(error);
    }
});


module.exports = router;