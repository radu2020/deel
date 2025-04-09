const Sequelize = require('sequelize');
const sequelize = require('../config/database');

// Import model definitions
const defineProfile = require('./profile.model');
const defineContract = require('./contract.model');
const defineJob = require('./job.model');

// Initialize models
const Profile = defineProfile(sequelize);
const Contract = defineContract(sequelize);
const Job = defineJob(sequelize);

// Define associations
Profile.hasMany(Contract, { as: 'ContractorContracts', foreignKey: 'ContractorId' });
Contract.belongsTo(Profile, { as: 'Contractor', foreignKey: 'ContractorId' });

Profile.hasMany(Contract, { as: 'ClientContracts', foreignKey: 'ClientId' });
Contract.belongsTo(Profile, { as: 'Client', foreignKey: 'ClientId' });

Contract.hasMany(Job, { foreignKey: 'ContractId' });
Job.belongsTo(Contract, { foreignKey: 'ContractId' });

module.exports = {
  sequelize,
  Profile,
  Contract,
  Job
};
