const express = require('express');

const {getGreeting} = require('../controllers/greeting.controller');
const auth = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', auth, getGreeting);

module.exports = router;