const getProfile = async (req, res, next) => {
  try {
    const { Profile } = req.app.get('models');
    const profileId = req.get('profile_id');

    if (!profileId) {
      return res.status(400).json({ error: 'Missing profile_id header' });
    }

    if (isNaN(profileId)) {
      return res.status(400).json({ error: 'Invalid profile_id header' });
    }

    const profile = await Profile.findOne({ where: { id: profileId } });
    if (!profile) {
      return res.status(401).json({ error: 'Unauthorized: Profile not found' });
    }

    req.profile = profile;
    next();
  } catch (error) {
    console.error('Error in getProfile middleware:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = { getProfile };
