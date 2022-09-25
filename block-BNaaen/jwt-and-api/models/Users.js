var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
var Article = require("./Articles");


var userSchema = new Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, minlength: 5 },
    bio: { type: String },
    followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    followings: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    articles: [{ type: Schema.Types.ObjectId, ref: 'Article' }],
    favourites: [{ type: Schema.Types.ObjectId, ref: 'Article' }]
}, { timestamps: true });

userSchema.pre("save", async function(next) {
    if (this.password && this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    } else {
        return next();
    }
});

userSchema.methods.verifyPassword = async function(password) {
    let result = await bcrypt.compare(password, this.password);
    return result;
};

userSchema.methods.signToken = async function() {
    let payload = {
        email: this.email,
        userId: this._id,
    };
    try {
        let token = await jwt.sign(payload, process.env.SECRET);
        console.log(token, "token");
        return token;
    } catch (error) {
        return error;
    }
};

userSchema.methods.userJSON = function(token) {
    return {
        username: this.username,
        email: this.email,
        token
    };
};

userSchema.methods.getUserFormat = function() {
    return {
        username: this.username,
        email: this.email,
        bio: this.bio,
        total_followers: this.followers.length,
        total_followings: this.followings.length,
    };
};

module.exports = mongoose.model("User", userSchema);