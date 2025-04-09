const express = require('express');
const { getProfile } = require('../middleware/getProfile');
const contractsController = require('../controllers/contract.controller');

const router = express.Router();

router.get('/:id', getProfile, contractsController.getContractById);
router.get('/', getProfile, contractsController.getContracts);

module.exports = router;
