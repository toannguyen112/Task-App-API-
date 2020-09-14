const jwt = require('jsonwebtoken')
const User = require('../models/user')
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace("Bearer ", ''); // token req
        const decoded = jwt.verify(token, 'thisismynewcourse');
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token }); // tìm user có id và token
        if (!user) {
            throw new Error()
        }
        req.token = token; //save token user gui len server vao req.token
        req.user = user; // save user dc tim thay vao req.user
        next();
    } catch (error) {
        res.status(401).send({ error: 'Please authenticate' });
    }
}

module.exports = auth;