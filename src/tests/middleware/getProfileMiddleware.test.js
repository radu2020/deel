const request = require('supertest');
const app = require('../../app');
const { Contract, Profile } = require('../../models');

describe('GET /contracts/1', () => {
  it('should attach profile to request and call next when profile_id is valid', async () => {
    const mockProfile = {
      id: 1,
      firstName: 'Harry',
      lastName: 'Potter',
      profession: 'Wizard',
      balance: 1150,
      type: 'client'
    };
    const mockContract = {
      id: 1,
      terms: 'bla bla bla',
      status: 'in_progress',
      ClientId: 1,
      ContractorId: 2
    };
    Contract.findOne = jest.fn().mockResolvedValue(mockContract);
    Profile.findOne = jest.fn().mockResolvedValue(mockProfile);

    const response = await request(app)
      .get('/contracts/1')
      .set('profile_id', '1');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockContract);
  });

  it('should return 400 if profile_id is missing or invalid', async () => {
    // Test with no profile_id header
    let response = await request(app).get('/contracts/1');
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Missing profile_id header' });

    // Test with an invalid profile_id header
    response = await request(app).get('/contracts/1').set('profile_id', 'invalid_id');
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid profile_id header' });
  });

  it('should return 401 if the profile is not found', async () => {
    Profile.findOne = jest.fn().mockResolvedValue(null);

    const response = await request(app)
      .get('/contracts/1')
      .set('profile_id', '1');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Unauthorized: Profile not found' });
  });

  it('should return 500 if there is an internal error', async () => {
    Profile.findOne = jest.fn().mockRejectedValue(new Error('Database error'));

    const response = await request(app)
      .get('/contracts/1')
      .set('profile_id', '1');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal Server Error' });
  });
});
