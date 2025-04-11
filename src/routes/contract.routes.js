const express = require('express');
const contractsController = require('../controllers/contract.controller');

const router = express.Router();

router.get('/:id', contractsController.getContractById);
router.get('/', contractsController.getContracts);

module.exports = router;
