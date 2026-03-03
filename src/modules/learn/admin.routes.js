const express = require('express');
const router = express.Router();
const learnController = require('./learn.controller');
const verifyJWT = require('../../middleware/verifyJWT');
const roleAuthorization = require('../../middleware/roleAuthorization');

router.use(verifyJWT);
router.use(roleAuthorization('admin'));

// Admin: System CRUD
router.get('/systems', learnController.adminGetSystems);
router.post('/systems', learnController.adminCreateSystem);
router.put('/systems/:id', learnController.adminUpdateSystem);
router.delete('/systems/:id', learnController.adminDeleteSystem);

// Admin: Resource CRUD
router.get('/systems/:systemId/resources', learnController.adminGetResources);
router.post('/systems/:systemId/resources', learnController.adminCreateResource);
router.put('/resources/:resourceId', learnController.adminUpdateResource);
router.delete('/resources/:resourceId', learnController.adminDeleteResource);

module.exports = router;
