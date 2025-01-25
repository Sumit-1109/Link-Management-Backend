const express = require('express');
const router = express.Router();
const {signup, login, modify, deleteUser, getUserDetails} = require('../controllers/auth.controller');
const auth = require('../middlewares/auth.middleware');

router.post('/signup', signup);
router.post('/login', login);
router.put('/modify', auth, modify);
router.delete('/delete', auth, deleteUser);
router.get('/', auth, getUserDetails);

module.exports = router;