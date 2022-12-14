var express = require('express');
var router = express.Router();
var Article = require('../models/Articles');
var User = require('../models/Users');
var auth = require('../middleware/auth');
var slugger = require('slugger');
var Comment = require('../models/Comments');
const { isValidObjectId } = require('mongoose');

// get comments from an article
router.get('/:slug/comments', auth.verifyToken, async (req, res, next) => {
  let slug = req.params.slug;
  let userId = req.user.id;
  try {
    let article = await (
      await (await Article.findOne({ slug })).populate('comments')
    ).populate('comments.author');
    let commentsArr = await article.comments.map((comment) => {
      return comment.getCommentFormat(userId);
    });

    return res.status(200).json({ commentsArr });
  } catch (error) {
    return next(error);
  }
});

// list articles
router.get('/', auth.authenticationOptional, async (req, res, next) => {
  let { taglist, author, favouritedBy, limit, offset } = req.query;
  limit = limit ? limit : 20;
  offset = offset ? offset : 0;
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
    let articles = await Article.find(query)
      .sort({ createdAt: 1 })
      .populate('author')
      .limit(limit)
      .skip(offset)
      .exec();
    articles = articles.map((article) => {
      return article.getArticleFormat(req.user);
    });
    return res.status(200).json({ articles, articlesCount: articles.length });
  } catch (error) {
    return next(error);
  }
});

// feed
router.get('/feed', auth.verifyToken, async (req, res, next) => {
  let limit = req.query.limit ? req.query.limit : 20;
  let offset = req.query.offset ? req.query.offset : 0;
  try {
    let articles = await Article.find({
      author: { $in: req.user.followings },
    })
      .sort({ createdAt: 1 })
      .limit(limit)
      .skip(offset)
      .populate('author')
      .exec();
    articles = articles.map(function (article) {
      return article.getArticleFormat(req.user.userId);
    });
    return res.status(200).json({ articles, articlesCount: articles.length });
  } catch (error) {
    return next(error);
  }
});

// get a single aritcle
router.get('/:slug', auth.authenticationOptional, async (req, res, next) => {
  let slug = req.params.slug;
  try {
    let article = await Article.findOne({ slug }).populate('author');
    if (article) {
      return res
        .status(200)
        .json({ article: article.getArticleFormat(req.user) });
    } else {
      return res.json({ error: `Didn't found any aritcle with name ${slug}` });
    }
  } catch (error) {
    return next(error);
  }
});

router.use(auth.verifyToken);

// create a article
router.post('/', async (req, res, next) => {
  try {
    let { title, description, body } = req.body;
    req.body.author = req.user.id;
    if (title && description && body) {
      let article = await (await Article.create(req.body)).populate('author');
      let updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        { $push: { articles: article.id } },
        { new: true }
      );
      return res
        .status(200)
        .json({ article: article.getArticleFormat(req.user) });
    } else if (title && !description && !body) {
      return res.status(400).send({
        errors: {
          description: 'description is required',
          body: 'body is required',
        },
      });
    } else if (title && description && !body) {
      return res.status(400).send({
        errors: {
          body: 'body is required',
        },
      });
    } else if (!title && description && body) {
      return res.status(400).send({
        errors: {
          title: 'title is required',
        },
      });
    } else if (title && !description && body) {
      return res.status(400).send({
        errors: {
          description: 'description is required',
        },
      });
    } else if (!title && !description && body) {
      return res.status(400).send({
        errors: {
          description: 'description is required',
          title: 'title is required',
        },
      });
    } else {
      return res.status(400).send({
        errors: {
          title: 'title is required',
          description: 'description is required',
          body: 'body is required',
        },
      });
    }
  } catch (error) {
    next(error);
  }
});

// update a article
router.put('/:slug', async (req, res, next) => {
  let slug = req.params.slug;
  let article = await Article.findOne({ slug });
  console.log(req.body);
  try {
    if (article) {
      if (req.user.id == article.author) {
        if (req.body.title) {
          req.body.slug = slugger(req.body.title);
        }
        let updatedArticle = await (
          await Article.findByIdAndUpdate(article._id, req.body, {
            new: true,
          })
        ).populate('author');
        return res
          .status(200)
          .json({ updatedArticle: updatedArticle.getArticleFormat(req.user) });
      } else {
        return res
          .status(422)
          .json({ error: 'You cannot edit articles created by others' });
      }
    } else {
      return res.json({ error: 'there is no article of provided name' });
    }
  } catch (error) {
    return next(error);
  }
});

// delete a article
router.delete('/:slug', async (req, res, next) => {
  let slug = req.params.slug;
  let article = await Article.findOne({ slug });
  try {
    if (article) {
      if (req.user.id == article.author) {
        let deletedArticle = await (
          await Article.findByIdAndDelete(article._id)
        ).populate('author');
        let updatedUser = await User.findByIdAndUpdate(
          req.user.id,
          { $pull: { articles: article._id } },
          { new: true }
        );
        return res
          .status(200)
          .json({ deletedArticle: deletedArticle.getArticleFormat(req.user) });
      } else {
        return res
          .status(422)
          .json({ error: 'You cannot delete articles created by others' });
      }
    } else {
      return res.json({ error: 'there is no article of provided name' });
    }
  } catch (error) {
    return next(error);
  }
});

// add comments to a article
router.post('/:slug/comments', async (req, res, next) => {
  let userId = req.user.id;
  let slug = req.params.slug;
  let article = await Article.findOne({ slug });
  req.body.author = userId;
  if (article) {
    req.body.article = article._id;
  } else {
    return res
      .status(400)
      .json({ error: `not able to find any article with this name ${slug}` });
  }
  try {
    let comment = await (await Comment.create(req.body)).populate('author');
    let updatedArticle = await Article.findByIdAndUpdate(article._id, {
      $push: { comments: comment._id },
    });
    return res
      .status(200)
      .json({ comment: comment.getCommentFormat(req.user.id) });
  } catch (error) {
    return next(error);
  }
});

// Delete Comment
router.delete('/:slug/comments/:commentId', async (req, res, next) => {
  let slug = req.params.slug;
  let userId = req.user.id;
  let commentId;
  if (isValidObjectId(req.params.commentId)) {
    commentId = req.params.commentId;
  } else {
    return res.status(200).json({ error: 'comment Id is not valid' });
  }
  let comment = await Comment.findById(commentId);
  try {
    if (comment) {
      if (comment.author == userId) {
        let deletedComment = await Comment.findByIdAndDelete(commentId);
        let updatedArticle = await Article.findOneAndUpdate(
          { slug },
          { $pull: { comments: commentId } }
        );
        return res.status(200).json({ msg: 'Deleted that comment' });
      } else {
        return res
          .status(422)
          .json({ error: 'you cannot deleted comments of others' });
      }
    } else {
      return res.status(422).json({ error: 'Comment not found' });
    }
  } catch (error) {
    return next(error);
  }
});

//adding the article in favourites
router.post('/:slug/favourite', async (req, res, next) => {
  let slug = req.params.slug;
  let userId = req.user.id;
  let article = await Article.findOne({ slug });
  try {
    if (article) {
      let updatedArticle = await Article.findByIdAndUpdate(
        article.id,
        {
          $push: { favouritedBy: userId },
          $inc: { favouriteCounts: 1 },
        },
        { new: true }
      ).populate('author');
      return res
        .status(200)
        .json({ article: updatedArticle.getArticleFormat(req.user) });
    } else {
      return res
        .status(200)
        .json({ error: `did found any article named as ${slug}` });
    }
  } catch (error) {
    return next(error);
  }
});

// remove an article from favourites
router.delete('/:slug/favourite', async (req, res, next) => {
  let slug = req.params.slug;
  let userId = req.user.id;
  let article = await Article.findOne({ slug });
  try {
    if (article) {
      let updatedArticle = await Article.findByIdAndUpdate(
        article.id,
        {
          $pull: { favouritedBy: userId },
          $inc: { favouriteCounts: -1 },
        },
        { new: true }
      ).populate('author');
      return res
        .status(200)
        .json({ article: updatedArticle.getArticleFormat(req.user) });
    } else {
      return res
        .status(200)
        .json({ error: `did found any article named as ${slug}` });
    }
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
