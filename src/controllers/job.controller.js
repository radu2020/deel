const { Job, Contract, Profile } = require('../models');
const getUnpaidJobsForActiveContracts = require('../services/job.service');

/**
 * GET jobs/unpaid
 * Get all unpaid jobs for a user (either a client or contractor).
 */
async function getUnpaidJobs(req, res) {
    try {
    const userId = req.profile.id;

    const unpaidJobs = await getUnpaidJobsForActiveContracts(userId);

    if (!unpaidJobs || unpaidJobs.length === 0) {
      return res.status(404).json({ message: 'No unpaid jobs found for this user' });
    }

    res.json(unpaidJobs);
  } catch (err) {
    console.error('Error fetching unpaid jobs:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * POST /jobs/:job_id/pay
 * Pay for a job. A client can only pay if their balance is greater 
 * than or equal to the amount due. The payment amount should be moved 
 * from the client's balance to the contractor's balance.
 */
 async function payForJob (req, res) {
  const transaction = await req.app.get('sequelize').transaction(); // Start a new transaction

  try {
    const { job_id } = req.params;
    const clientId = req.profile.id;

    // Ensure the profile is a client
    if (req.profile.type !== 'client') {
      return res.status(403).json({ error: 'Only clients can make payments.' });
    }

    // Fetch the job and the associated contract, locking rows for both client and contractor profiles
    const job = await Job.findOne({
      where: {
        id: job_id,
        paid: false,
      },
      include: {
        model: Contract,
        required: true, // Make sure the job is associated with a contract
        where: { ClientId: clientId },
      },
      transaction, // Use the same transaction
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found or client is not associated with the job.' });
    }

    // Lock the client and contractor profiles to prevent race conditions
    const clientProfile = await Profile.findOne({
      where: { id: clientId },
      lock: true, // Lock the row
      transaction,
    });

    const contractorProfile = await Profile.findOne({
      where: { id: job.Contract.ContractorId },
      lock: true, // Lock the row
      transaction,
    });

    // Check if the client has enough balance to make the payment
    if (clientProfile.balance < job.price) {
      await transaction.rollback(); // Rollback the transaction in case of failure
      return res.status(400).json({ error: 'Insufficient balance to make payment.' });
    }

    // Proceed with the payment:
    // Deduct the amount from the client balance
    clientProfile.balance -= job.price;

    // Add the amount to the contractor balance
    contractorProfile.balance += job.price;

    // Save the updated client and contractor profiles
    await clientProfile.save({ transaction });
    await contractorProfile.save({ transaction });

    // Mark the job as paid
    job.paid = true;
    job.paymentDate = new Date(); // Set the current date as payment date
    await job.save({ transaction });

    // Check if the contract has any remaining unpaid jobs
    const unpaidJobs = await Job.count({
      where: {
        ContractId: job.ContractId,
        paid: false,
      },
      transaction,
    });

    if (unpaidJobs === 0) {
      // Terminate the contract
      job.Contract.status = 'terminated';
      await job.Contract.save({ transaction });
    }

    // Commit the transaction
    await transaction.commit();

    res.status(200).json({
      message: 'Payment successful.',
      job,
      updatedClientBalance: clientProfile.balance,
      updatedContractorBalance: contractorProfile.balance,
    });
  } catch (error) {
    await transaction.rollback(); // Ensure rollback in case of any error
    console.error('Error processing payment:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = { getUnpaidJobs, payForJob};
