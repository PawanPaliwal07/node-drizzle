const express = require('express');
const router = express.Router();
const contactUsController = require('../API/contactUsController');
const verifyToken = require('../middleware/verifyToken');

router.get('/all-leads', verifyToken, contactUsController.getAllLeads);
router.post('/save-enquiry', verifyToken, contactUsController.saveNewEnquiry);
router.delete('/delete-enquiry/:ContactID', verifyToken, contactUsController.deleteEnquiry);

module.exports = router;