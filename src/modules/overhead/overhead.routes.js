const express = require('express');
const router = express.Router();
const overheadController = require('./overhead.controller');
const verifyJWT = require('../../middleware/verifyJWT');

router.use(verifyJWT);

router.post('/save', overheadController.saveOverhead);
router.get('/me', overheadController.getOverhead);

module.exports = router;
