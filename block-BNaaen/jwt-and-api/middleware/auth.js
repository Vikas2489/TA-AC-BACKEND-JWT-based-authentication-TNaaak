const jwt = require('jsonwebtoken');
var User = require('../models/Users');

module.exports = {
  verifyToken: async function (req, res, next) {
    let token = req.headers.authorization;
    try {
      if (token) {
        let payload = await jwt.verify(token, process.env.SECRET);
        let user = await User.findById(
          payload.userId,
          'followings username email'
        );
        req.user = user;
        req.token = token;
        next();
      } else {
        return res.status(401).json({ error: 'Token is required' });
      }
    } catch (error) {
      return next(error);
    }
  },
  authenticationOptional: async function (req, res, next) {
    let token = req.headers.authorization;
    try {
      if (token) {
        let payload = await jwt.verify(token, process.env.SECRET);
        let user = await User.findById(
          payload.userId,
          'followings followers username email'
        );
        req.user = user;
        return next();
      } else {
        req.user = null;
        next();
      }
    } catch (error) {
      return next(error);
    }
  },
};
