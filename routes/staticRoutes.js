const express = require('express');
const router = express.Router();
const staticController = require('../API/staticController');
const verifyToken = require('../middleware/verifyToken');
const upload = require('../middleware/upload');

router.get('/all-statics', verifyToken, staticController.getAllStatics);
router.get('/fill-static-data', verifyToken, staticController.getStaticById);
router.post(
    '/save-or-update-static',
    verifyToken,
    upload.fields([
        { name: 'StaticImage', maxCount: 1 },
        { name: 'StaticBannerVideo', maxCount: 1 },
        { name: 'BannerBigVideo', maxCount: 1 },
        { name: 'Section1File', maxCount: 1 },
        { name: 'ThirdPartyImage', maxCount: 1 },
        { name: 'bannerVideoImage', maxCount: 1 },
        { name: 'bannerVideoImage1', maxCount: 1 },
        { name: 'bannerVideoImage2', maxCount: 1 },
        { name: 'bannerVideoImage3', maxCount: 1 },
        { name: 'bannerVideoImage4', maxCount: 1 },
        { name: 'bannerVideoImage5', maxCount: 1 },
    ]),
    staticController.saveOrUpdateStatic
);

router.delete('/delete-static/:StaticID', verifyToken, staticController.deleteStatic);
router.get('/meta_data/:ID', verifyToken, staticController.getMataDataById);
router.get('/meta_data_by_url/:url', verifyToken, staticController.getMataDataByUrl);
router.get('/meta_data_by_url_trunkey/:url', verifyToken, staticController.getTurnkeyProjectMetaByUrl);

module.exports = router;