const express = require('express');
const balanceController = require('../controllers/balance.controller');

const router = express.Router();

router.post('/deposit/:userId', balanceController.depositToBalance);

module.exports = router;
