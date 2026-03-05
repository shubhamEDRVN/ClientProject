const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const verifyJWT = require('../../middleware/verifyJWT');
const roleAuthorization = require('../../middleware/roleAuthorization');

router.use(verifyJWT);
router.use(roleAuthorization('admin'));

// Business management
router.get('/companies', adminController.listCompanies);
router.get('/companies/:companyId', adminController.getCompanyDetails);
router.put('/companies/:companyId', adminController.updateCompany);
router.patch('/companies/:companyId/toggle', adminController.toggleCompanyActive);

// User management
router.get('/users', adminController.listUsers);
router.put('/users/:userId/role', adminController.updateUserRole);

module.exports = router;
