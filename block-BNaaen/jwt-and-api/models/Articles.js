var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var User = require('./Users');
var slugger = require('slugger');
var Comment = require('./Comments');

var articleSchema = new Schema(
  {
    title: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User' },
    body: { type: String, required: true },
    taglist: [String],
    slug: { type: String },
    comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
    favouritedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    favouriteCounts: 0,
  },
  { timestamps: true }
);

articleSchema.pre('save', async function (next) {
  if (this.title && this.isModified('title')) {
    this.slug = slugger(this.title);
    next();
  } else {
    next();
  }
});

articleSchema.methods.getArticleFormat = function (currentLoggedInUser = null) {
  return {
    slug: this.slug,
    title: this.title,
    description: this.description,
    body: this.body,
    taglist: this.taglist,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    favouritesCounts: this.favouritedBy.length,
    favourited:
      Boolean(currentLoggedInUser) &&
      this.favouritedBy.includes(currentLoggedInUser.id),
    author: this.author.getUserFormat(currentLoggedInUser),
  };
};

module.exports = mongoose.model('Article', articleSchema);
