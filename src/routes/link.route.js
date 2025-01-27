const express = require('express');
const router = express.Router();
const device = require('express-device');
const linkController = require('../controllers/link.controller');
const auth = require('../middlewares/auth.middleware');
const deviceType = require('../middlewares/deviceType');

router.use(device.capture());
router.use(deviceType);

router.post('/create', auth, linkController.createShortURL);
router.get('/dashboard',auth ,linkController.getDashboardLinkDetails);
router.get('/linksPage', auth, linkController.getLinks);
router.get('/analytics',auth ,linkController.getLinkAnalytics);
router.get('/getLinkDetails/:id', auth, linkController.getLinkDetails);
router.put('/edit/:id', auth, linkController.updateLink);
router.delete('/delete/:id', auth, linkController.deleteLink);



module.exports = router;
