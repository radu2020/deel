const { getProfile } = require('../../middleware/getProfile');

describe('getProfile Middleware', () => {
  let req, res, next, Profile;

  beforeEach(() => {
    Profile = {
      findOne: jest.fn()
    };

    req = {
      get: jest.fn(),
      app: {
        get: jest.fn(() => ({ Profile }))
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    next = jest.fn();
  });

  it('should return 400 if profile_id is missing', async () => {
    req.get.mockReturnValue(undefined);

    await getProfile(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing profile_id header' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if profile_id is not a number', async () => {
    req.get.mockReturnValue('abc');

    await getProfile(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid profile_id header' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if profile not found', async () => {
    req.get.mockReturnValue('1');
    Profile.findOne.mockResolvedValue(null);

    await getProfile(req, res, next);

    expect(Profile.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized: Profile not found' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should set req.profile and call next if profile is found', async () => {
    const fakeProfile = { id: 1, name: 'Test User' };
    req.get.mockReturnValue('1');
    Profile.findOne.mockResolvedValue(fakeProfile);

    await getProfile(req, res, next);

    expect(Profile.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    expect(req.profile).toBe(fakeProfile);
    expect(next).toHaveBeenCalled();
  });

  it('should handle unexpected errors and return 500', async () => {
    req.get.mockReturnValue('1');
    Profile.findOne.mockRejectedValue(new Error('DB error'));

    await getProfile(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
    expect(next).not.toHaveBeenCalled();
  });
});
