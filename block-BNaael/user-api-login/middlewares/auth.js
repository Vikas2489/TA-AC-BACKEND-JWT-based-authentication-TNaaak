var jwt = require("jsonwebtoken");
module.exports = {
    validateToken: async function(req, res, next) {
        let token = req.headers.authorization;
        console.log(req.headers);
        try {
            if (token) {
                let payload = await jwt.verify(token, process.env.SECRET);
                req.user = payload;
                next();
            } else {
                return res.status(400).json({ msg: "token is required" });
            }
        } catch (error) {
            return next(error);
        }

    }
}