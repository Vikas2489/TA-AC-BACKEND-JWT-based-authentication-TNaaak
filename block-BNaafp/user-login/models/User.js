var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var bcrypt = require("bcrypt");
const { NotExtended } = require("http-errors");


var userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, minlength: 5 },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
    if (this.password && this.isModified('password')) {
        let newPassword = await bcrypt.hash(this.password, 8);
        this.password = newPassword;
    } else {
        next();
    }
});

userSchema.methods.verifyPassword = async function(password) {
    let result = await bcrypt.compare(password, this.password);
    return result;
}

module.exports = mongoose.model("User", userSchema);