const express = require('express');
const router = express.Router();
const scoreboardController = require('./scoreboard.controller');
const verifyJWT = require('../../middleware/verifyJWT');
const roleAuthorization = require('../../middleware/roleAuthorization');

router.use(verifyJWT);

// ─── Admin: Resource CRUD (owner & admin only) ─────────────────────
router.post('/resources', roleAuthorization('owner', 'admin'), scoreboardController.createResource);
router.put('/resources/:id', roleAuthorization('owner', 'admin'), scoreboardController.updateResource);
router.delete('/resources/:id', roleAuthorization('owner', 'admin'), scoreboardController.deleteResource);

// ─── All Users: Read resources & manage progress ────────────────────
router.get('/resources', scoreboardController.getResources);
router.get('/resources/:id', scoreboardController.getResourceById);
router.get('/progress', scoreboardController.getMyProgress);
router.put('/progress/:resourceId', scoreboardController.updateProgress);
router.get('/leaderboard', scoreboardController.getScoreboard);

module.exports = router;
