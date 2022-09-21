var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var Book = require('./Books');
var Comment = require('./Comments');
var jwt = require("jsonwebtoken");
var bcrypt = require("bcrypt");

var userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    books: [{ type: Schema.Types.ObjectId, ref: 'Book' }],
    comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
    password: { type: String },
    cart: [{ type: Schema.Types.ObjectId, ref: 'Book' }]
}, { timestamps: true });

userSchema.pre("save", async function(next) {
    if (this.password && this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
        next();
    } else {
        return next();
    }
});

userSchema.methods.verifyPassword = async function(password) {
    let result = await bcrypt.compare(password, this.password);
    return result;
};

userSchema.methods.userJSON = function(token) {
    return {
        name: this.name,
        email: this.email,
        token
    }
};

userSchema.methods.signToken = async function() {
    let payload = {
        userId: this.id,
        email: this.email,
    };
    try {
        let token = await jwt.sign(payload, process.env.SECRET);
        return token;
    } catch (error) {
        console.log(error);
        return error;
    }
};

module.exports = mongoose.model('User', userSchema);