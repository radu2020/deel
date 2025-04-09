const { Op, fn, col } = require('sequelize');

/**
 * GET /admin/profiles/:id
 * Returns a user profile. 
 */
const getProfileById = async (req, res) => {
  try {
    const { Profile } = req.app.get('models');

    const requestingUser = await Profile.findOne({ where: { id: req.profile.id } });

    if (!requestingUser || requestingUser.type !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    const { id } = req.params;

    // Validate that 'id' is a valid integer
    if (!id || isNaN(id) || !Number.isInteger(parseInt(id))) {
      return res.status(400).json({ message: 'Invalid profile ID.' });
    }

    // Fetch the profile from the database
    const profile = await Profile.findOne({ where: { id } });

    if (!profile) {
      return res.status(404).end();
    }

    // Return the contract
    res.json(profile);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /admin/best-profession?start=<date>&end=<date>
 * Returns the profession that earned the most money (sum of jobs paid) 
 * for any contractor who worked within the specified time range.
 */
const getBestProfession = async (req, res) => {
  const { start, end } = req.query;

  // Validate start and end dates
  if (!start || !end) {
    return res.status(400).json({ error: 'Missing start or end date' });
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  // Ensure valid date format
  if (isNaN(startDate) || isNaN(endDate)) {
    return res.status(400).json({ error: 'Invalid date format. Please provide valid start and end dates.' });
  }

  try {
    const { Profile, Job, Contract } = req.app.get('models');

    const requestingUser = await Profile.findOne({ where: { id: req.profile.id } });

    if (!requestingUser || requestingUser.type !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    const result = await Job.findAll({
      where: {
        paid: true,
        paymentDate: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [{
        model: Contract,
        attributes: [],
        include: [{
          model: Profile,
          as: 'Contractor',
          where: { type: 'contractor' }, // Only contractors
          attributes: ['profession']
        }]
      }],
      attributes: [
        [col('Contract.Contractor.profession'), 'profession'],
        [fn('sum', col('price')), 'totalEarnings']
      ],
      group: ['Contract.Contractor.profession'],
      order: [[fn('sum', col('price')), 'DESC']],
      limit: 1,
      raw: true
    });

    if (!result.length) {
      return res.status(404).json({ message: 'No data found for given range.' });
    }

    const { profession, totalEarnings } = result[0];

    res.json({ profession, totalEarnings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /admin/best-clients?start=<date>&end=<date>&limit=<integer>
 * Returns the clients who paid the most for jobs within the specified time period.
 * The `limit` query parameter should be applied, and the default limit is 2.
 */
const getBestClients = async (req, res) => {
  const { start, end, limit = 2 } = req.query;

  // Validate start and end dates
  if (!start || !end) {
    return res.status(400).json({ error: 'Missing start or end date' });
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  // Ensure valid date format
  if (isNaN(startDate) || isNaN(endDate)) {
    return res.status(400).json({ error: 'Invalid date format. Please provide valid start and end dates.' });
  }

  // Validate limit (ensure it's a positive integer)
  if (isNaN(limit) || parseInt(limit) <= 0) {
    return res.status(400).json({ error: 'Invalid limit. Please provide a positive integer for limit.' });
  }

  try {
    const { Profile, Job, Contract } = req.app.get('models');

    const requestingUser = await Profile.findOne({ where: { id: req.profile.id } });

    if (!requestingUser || requestingUser.type !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    const result = await Job.findAll({
      where: {
        paid: true,
        paymentDate: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [{
        model: Contract,
        attributes: [],
        include: [{
          model: Profile,
          as: 'Client',
          where: { type: 'client' },
          attributes: ['id', 'firstName', 'lastName']
        }]
      }],
      attributes: [
        [col('Contract.Client.id'), 'clientId'],
        [col('Contract.Client.firstName'), 'firstName'],
        [col('Contract.Client.lastName'), 'lastName'],
        [fn('sum', col('price')), 'totalPaid']
      ],
      group: ['Contract.Client.id'],
      order: [[fn('sum', col('price')), 'DESC']],
      limit: parseInt(limit),
      raw: true,
      nest: true, // <- This keeps nested structure clean
    });

    if (!result.length) {
      return res.status(404).json({ message: 'No clients found for the given time period.' });
    }

    // Clean up to return only relevant fields
    const cleanResult = result.map(r => ({
      id: r.clientId,
      fullName: `${r.firstName} ${r.lastName}`,
      paid: parseFloat(r.totalPaid)
    }));

    res.json(cleanResult);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  getProfileById,
  getBestProfession,
  getBestClients
};
