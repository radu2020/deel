const express = require('express');
const { getProfile } = require('../middleware/getProfile');
const balanceController = require('../controllers/balance.controller');

const router = express.Router();

router.post('/deposit/:userId', getProfile, balanceController.depositToBalance);

module.exports = router;
