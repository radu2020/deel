const getUnpaidJobsForActiveContracts = require('../services/job.service');

/**
 * POST /balances/deposit/:userId
 * Deposit money into a client's balance. 
 * A client cannot deposit more than 25% of the total of jobs to pay at the time of deposit.
 */
async function depositToBalance(req, res) {
  const { userId } = req.params;
  const { amount } = req.body;

  // Prevent user from depositing into someone else's account
  if (parseInt(userId) !== req.profile.id) {
    return res.status(403).json({ message: 'You are not authorized to deposit into this account.' });
  }

  let t;
  try {
    const { Profile } = req.app.get('models');
    const sequelize = req.app.get('sequelize');

    t = await sequelize.transaction();

    // Lock the profile row to prevent concurrent writes
    const profile = await Profile.findOne({
      where: { id: userId },
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!profile) {
      await t.rollback();
      return res.status(404).json({ message: 'User not found' });
    }

    const unpaidJobs = await getUnpaidJobsForActiveContracts(userId);

    const totalUnpaid = unpaidJobs.reduce((sum, job) => {
      return sum + parseFloat(job.price);
    }, 0);

    const maxDepositAllowed = totalUnpaid * 0.25;

    if (amount > maxDepositAllowed) {
      await t.rollback();
      return res.status(400).json({
        message: `Deposit exceeds the 25% limit of unpaid jobs. Max allowed: ${maxDepositAllowed.toFixed(2)}`
      });
    }

    profile.balance += parseFloat(amount);
    await profile.save({ transaction: t });

    await t.commit();

    res.json({ message: 'Deposit successful', newBalance: profile.balance });
  } catch (err) {
    if (t) await t.rollback();
    console.error('Error during deposit:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

module.exports = { depositToBalance };