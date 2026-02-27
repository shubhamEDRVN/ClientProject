const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const verifyJWT = require('../../middleware/verifyJWT');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', verifyJWT, authController.getMe);

module.exports = router;
