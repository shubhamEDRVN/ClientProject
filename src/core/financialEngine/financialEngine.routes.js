const express = require('express');
const router = express.Router();
const financialEngineController = require('./financialEngine.controller');
const verifyJWT = require('../../middleware/verifyJWT');

router.use(verifyJWT);

router.get('/report', financialEngineController.getReport);
router.post('/snapshots', financialEngineController.createSnapshot);
router.get('/snapshots', financialEngineController.getSnapshots);
router.get('/snapshots/:id', financialEngineController.getSnapshotById);
router.delete('/snapshots/:id', financialEngineController.deleteSnapshot);

module.exports = router;
