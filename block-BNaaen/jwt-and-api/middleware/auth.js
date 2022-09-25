const jwt = require("jsonwebtoken");

module.exports = {
    verifyToken: async function(req, res, next) {
        let token = req.headers.authorization;
        try {
            if (token) {
                let payload = await jwt.verify(token, process.env.SECRET);
                req.user = payload;
                next();
            } else {
                return res.status(401).json({ error: "Token is required" });
            }
        } catch (error) {
            return next(error);
        }
    }
}