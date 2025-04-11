const express = require('express');
const jobController = require('../controllers/job.controller');

const router = express.Router();

router.get('/unpaid', jobController.getUnpaidJobs);
router.post('/:job_id/pay', jobController.payForJob);

module.exports = router;
