const { getProfile } = require('../middleware/getProfile');
const adminController = require('../controllers/admin.controller');
const express = require('express');
const router = express.Router();

router.get('/profiles/:id', getProfile, adminController.getProfileById);
router.get('/best-profession', getProfile, adminController.getBestProfession);
router.get('/best-clients', getProfile, adminController.getBestClients);


module.exports = router;
