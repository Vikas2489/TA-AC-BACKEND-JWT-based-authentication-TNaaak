var jwt = require("jsonwebtoken");
module.exports = {
    verifyToken: async(req, res, next) => {
        var token = req.headers.authorization;
        try {
            if (token) {
                let payload = await jwt.verify(token, process.env.SECRET);
                req.user = payload;
                next()
            } else {
                return res.status(400).json({ toAccess: "token is required" });
            }
        } catch (error) {
            console.log(error);
            return next(error);
        }

    }
}