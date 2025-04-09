const express = require('express');
const { sequelize } = require('./models/index');
const contractsRoutes = require('./routes/contract.routes');
const jobsRoutes = require('./routes/job.routes');
const balancesRoutes = require('./routes/balance.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

// Middleware setup
app.use(express.json());
app.set('sequelize', sequelize);
app.set('models', sequelize.models);

// Routes setup
app.use('/contracts', contractsRoutes);
app.use('/jobs', jobsRoutes);
app.use('/balances', balancesRoutes);
app.use('/admin', adminRoutes);


module.exports = app;
