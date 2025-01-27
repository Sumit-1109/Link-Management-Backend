const express = require('express');
const router = express.Router();
const device = require('express-device');
const redirectController = require('../controllers/redirect.controller');
const deviceType = require('../middlewares/deviceType');

router.use(device.capture());
router.use(deviceType);

router.get('/:shortURL', redirectController.redirectToOriginal);

module.exports = router;
