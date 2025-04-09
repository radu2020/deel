const request = require('supertest');
const app = require('../../app');

const { Job, Profile, Contract } = require('../../models');

jest.mock('../../models');

describe('GET /jobs/unpaid', () => {
  it('should return unpaid jobs for the client or contractor', async () => {
    // Mock the Profile for the test user
    const mockProfile = {
      id: 1,
      firstName: 'Harry',
      lastName: 'Potter',
      profession: 'Wizard',
      balance: 1150,
      type: 'client'
    };
    const mockJobs = [
      {
        description: 'work',
        price: 5,
        paid: false,
        ContractId: 1,
      },
      {
        description: 'work',
        price: 5,
        paid: false,
        ContractId: 1,
      }
    ];

    Profile.findOne = jest.fn().mockResolvedValue(mockProfile);
    Job.findAll = jest.fn().mockResolvedValue(mockJobs);

    const response = await request(app)
      .get('/jobs/unpaid')
      .set('profile_id', '1');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockJobs);
  });

  it('should return empty list if no jobs are found for the user', async () => {
    const mockProfile = {
      id: 1,
      firstName: 'Harry',
      lastName: 'Potter',
      profession: 'Wizard',
      balance: 1150,
      type: 'client'
    };
    const mockJobs = [];

    Profile.findOne = jest.fn().mockResolvedValue(mockProfile);
    Job.findAll = jest.fn().mockResolvedValue(mockJobs);

    const response = await request(app)
      .get('/jobs/unpaid')
      .set('profile_id', '1');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockJobs);
  });

  it('should return 500 if there is an internal server error', async () => {
    // Mock a database error by rejecting the findAll query
    Job.findAll.mockRejectedValue(new Error('Database error'));

    const response = await request(app)
      .get('/jobs/unpaid')
      .set('profile_id', '1');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal Server Error' });
  });
});