const express = require('express');
const router = express.Router();
const {signup, login, modify, deleteUser} = require('../controllers/auth.controller');
const auth = require('../middlewares/auth.middleware');

router.post('/signup', signup);
router.post('/login', login);
router.put('/modify', auth, modify);
router.delete('/delete', auth, deleteUser);

module.exports = router;