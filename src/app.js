const { sequelize } = require('./models/index');
const { getProfile } = require('./middleware/getProfile');
const contractsRoutes = require('./routes/contract.routes');
const jobsRoutes = require('./routes/job.routes');
const balancesRoutes = require('./routes/balance.routes');
const adminRoutes = require('./routes/admin.routes');

const cors = require('cors'); // Import the cors package

const express = require('express');
const app = express();

// Middleware setup
app.use(cors());
app.use(express.json());
app.use(getProfile);
app.set('sequelize', sequelize);
app.set('models', sequelize.models);

// Routes setup
app.use('/contracts', contractsRoutes);
app.use('/jobs', jobsRoutes);
app.use('/balances', balancesRoutes);
app.use('/admin', adminRoutes);


module.exports = app;