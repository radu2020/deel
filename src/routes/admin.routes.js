const express = require('express');
const adminController = require('../controllers/admin.controller');

const router = express.Router();

router.get('/profiles/:id', adminController.getProfileById);
router.get('/best-profession', adminController.getBestProfession);
router.get('/best-clients', adminController.getBestClients);

module.exports = router;
