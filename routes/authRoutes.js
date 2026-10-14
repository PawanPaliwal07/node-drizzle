const express = require('express');
const router = express.Router();
const authController = require('../API/authController');
const verifyToken = require('../middleware/verifyToken');
const upload = require('../middleware/upload');

router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/check-login', verifyToken, authController.checkLogin);

router.get('/all-users', verifyToken, authController.getAllUsers);
router.get('/fill-user-data', verifyToken, authController.getUserById);
router.post(
    '/save-or-update-user',
    verifyToken,
    upload.fields([{ name: 'ProfileImage', maxCount: 1 }]),
    authController.saveOrUpdateUser
);
router.post('/update-user-status', verifyToken, authController.updateUserActiveStatus);
router.post('/update-password', verifyToken, authController.updatePassword);

module.exports = router;