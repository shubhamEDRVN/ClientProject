const express = require('express');
const router = express.Router();
const learnController = require('./learn.controller');
const verifyJWT = require('../../middleware/verifyJWT');

router.use(verifyJWT);

// Scorecard: History route
router.get('/history', learnController.getHistory);

module.exports = router;
