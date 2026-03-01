const express = require('express');
const router = express.Router();
const jobCostingController = require('./jobCosting.controller');
const verifyJWT = require('../../middleware/verifyJWT');

router.use(verifyJWT);

router.post('/', jobCostingController.createJob);
router.get('/', jobCostingController.getJobs);
router.get('/:id', jobCostingController.getJobById);
router.put('/:id', jobCostingController.updateJob);
router.delete('/:id', jobCostingController.deleteJob);

module.exports = router;
