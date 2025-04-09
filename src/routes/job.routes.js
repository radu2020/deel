const express = require('express');
const { getProfile } = require('../middleware/getProfile');
const jobController = require('../controllers/job.controller');

const router = express.Router();

router.get('/unpaid', getProfile, jobController.getUnpaidJobs);
router.post('/:job_id/pay', getProfile, jobController.payForJob);

module.exports = router;
