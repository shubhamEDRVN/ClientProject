const express = require('express');
const router = express.Router();
const learnController = require('./learn.controller');
const verifyJWT = require('../../middleware/verifyJWT');

router.use(verifyJWT);

// Owner: Learn routes
router.get('/systems', learnController.getSystems);
router.get('/score', learnController.getScore);
router.post('/complete/:resourceId', learnController.markComplete);
router.delete('/complete/:resourceId', learnController.unmarkComplete);

module.exports = router;
