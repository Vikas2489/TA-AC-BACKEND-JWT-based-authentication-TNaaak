var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var Comment = require("../models/Comments");
var User = require("./Users");

var bookSchema = new Schema({
    title: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User' },
    description: { type: String, required: true },
    comment: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
    price: { type: Number },
    quantity: { type: Number }
}, {
    timestamps: true
});

module.exports = mongoose.model("Book", bookSchema);