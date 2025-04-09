const Sequelize = require('sequelize');
const { Job, Contract } = require('../models');


// Get all unpaid jobs for a user (either a client or contractor), but only for active contracts.
async function getUnpaidJobsForActiveContracts(userId) {
    return Job.findAll({
      where: { paid: false },
      include: [{
        model: Contract,
        where: {
          status: 'in_progress',
          [Sequelize.Op.or]: [
            { ClientId: userId },
            { ContractorId: userId }
          ]
        }
      }]
    });
  }

module.exports = getUnpaidJobsForActiveContracts;
