const express = require('express');
const router = express.Router();
const verifyJWT = require('../../middleware/verifyJWT');
const overheadController = require('./overhead.controller');

router.use(verifyJWT);

router.post('/save', overheadController.save);
router.get('/calculations', overheadController.getCalculations);
router.get('/', overheadController.get);

module.exports = router;
