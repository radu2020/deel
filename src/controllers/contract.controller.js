const { Contract, Profile } = require('../models');
const Sequelize = require('sequelize');

/**
 * GET /contracts
 * Returns all contracts for a client or contractor
 */
async function getContracts(req, res) {
  try {
    // Fetch the contracts
    const contracts = await Contract.findAll({
      where: {
        status: { // Only include non-terminated contracts
          [Sequelize.Op.ne]: 'terminated',
        },
        [Sequelize.Op.or]: [
          { ClientId: req.profile.id },
          { ContractorId: req.profile.id },
        ],
      },
      include: [
        { model: Profile, as: 'Client' },
        { model: Profile, as: 'Contractor' },
      ],
    });

    if (!contracts || contracts.length === 0) {
      return res.status(404).json({ message: 'No contracts found for this user' });
    }

    return res.json(contracts);
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}

/**
 * GET /contracts/:id
 * Returns a contract if found and the user has the proper permissions
 */
const getContractById = async (req, res) => {
  try {
    const { Contract } = req.app.get('models');
    const { id } = req.params;

    // Fetch the contract from the database
    const contract = await Contract.findOne({ where: { id } });

    if (!contract) {
      return res.status(404).end();
    }

    // Authorize request. Check if the user is part of this contract
    if (contract.ClientId !== req.profile.id && contract.ContractorId !== req.profile.id) {
      return res.status(401).end();
    }

    // Return the contract
    res.json(contract);
  } catch (err) {
    console.error('Error fetching contract:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getContracts, getContractById };
