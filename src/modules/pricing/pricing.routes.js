const express = require('express');
const router = express.Router();
const pricingController = require('./pricing.controller');
const verifyJWT = require('../../middleware/verifyJWT');

router.use(verifyJWT);

router.post('/save', pricingController.savePricingMatrix);
router.get('/me', pricingController.getPricingMatrix);

module.exports = router;
