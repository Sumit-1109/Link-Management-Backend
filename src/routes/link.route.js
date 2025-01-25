const express = require('express');
const router = express.Router();
const device = require('express-device');
const linkController = require('../controllers/link.controller');
const auth = require('../middlewares/auth.middleware');

router.use(device.capture());

router.post('/shorten', auth, linkController.createShortURL);
router.get('/', auth, linkController.getLinks);
router.get('/:shortURL', linkController.redirectToOriginal);
router.get('/analytics/:shortURL', linkController.getLinkAnalytics);
router.put('/edit/:shortURL', auth, linkController.updateLink);
router.delete('/delete/:shortURL', auth, linkController.deleteLink);


module.exports = router;
