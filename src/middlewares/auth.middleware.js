const jwt = require('jsonwebtoken');
const User = require('../schema/User.schema');

const auth = async (req, res, next) => {

    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({
            message: 'Access denied, token missing'
        });
    }


    try{
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user){
        throw new Error('User not found');
    }

    
        req.user = {
            id: user._id,
        }
        next();

    } catch (err) {
        res.status(400).json({
            message: 'Invalid token',
            error: err
        });
    }
};

module.exports = auth;