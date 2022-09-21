var jwt = require("jsonwebtoken");
module.exports = {
    verifyToken: async(req, res, next) => {
        let token = req.headers.authorization;
        try {
            if (token) {
                let payload = await jwt.verify(token, process.env.SECRET);
                console.log(payload);
                req.user = payload;
                next();
            } else {
                return res.status(400).json({ msg: 'token is required' });
            }
        } catch (error) {
            return next(error);
        }
    }
};