const express = require('express');
const router = express.Router();
const device = require('express-device');
const linkController = require('../controllers/link.controller');
const auth = require('../middlewares/auth.middleware');

router.use(device.capture());

router.get('/:shortURL', linkController.redirectToOriginal);
router.post('/create', auth, linkController.createShortURL);
router.get('/dashboard', auth, linkController.getDashboardLinkDetails);
router.get('/analytics',auth ,linkController.getLinkAnalytics);
router.get('/', auth, linkController.getLinks);
router.put('/edit/:shortURL', auth, linkController.updateLink);
router.delete('/delete/:shortURL', auth, linkController.deleteLink);


module.exports = router;
