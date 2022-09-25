var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var User = require("./Users");
var slugger = require("slugger");
var Comment = require("./Comments");

var articleSchema = new Schema({
    title: { type: String, required: true, unique: true },
    description: { type: String },
    author: { type: Schema.Types.ObjectId, ref: 'User' },
    body: { type: String },
    taglist: [String],
    slug: { type: String },
    comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
    favouritedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

articleSchema.pre('save', async function(next) {
    if (this.title && this.isModified('title')) {
        this.slug = slugger(this.title);
        next();
    } else {
        next();
    }
});

articleSchema.methods.getArticleFormat = async function(currentLoggedInUserId) {

    return {
        slug: this.slug,
        title: this.title,
        description: this.description,
        body: this.body,
        taglist: this.taglist,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        favoritesCount: this.favouritedBy.length,
        author: {
            username: this.author.username,
            bio: this.author.bio,
            isFollowing: await this.author.followers.includes(currentLoggedInUserId) ? true : false,
        }
    }
}

module.exports = mongoose.model('Article', articleSchema);