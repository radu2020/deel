const request = require('supertest');
const app = require('../../app');

const { Contract, Profile } = require('../../models');

describe('GET /contracts/:id', () => {
  it('should return contract when found and authorized', async () => {
    const mockContract = {
        id:1,
        terms: 'bla bla bla',
        status: 'in_progress',
        ClientId: 1,
        ContractorId: 2
    };

    const mockProfile = {
        id: 1,
        firstName: 'Harry',
        lastName: 'Potter',
        profession: 'Wizard',
        balance: 1150,
        type:'client'
    };

    Contract.findOne = jest.fn().mockResolvedValue(mockContract);
    Profile.findOne = jest.fn().mockResolvedValue(mockProfile);

    const response = await request(app)
    .get('/contracts/1')
    .set('profile_id', 1);
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockContract);
  });

  it('should return 404 when contract is not found', async () => {
     const mockProfile = {
        id: 1,
        firstName: 'Harry',
        lastName: 'Potter',
        profession: 'Wizard',
        balance: 1150,
        type:'client'
    };

    Contract.findOne = jest.fn().mockResolvedValue(null);
    Profile.findOne = jest.fn().mockResolvedValue(mockProfile);

    const response = await request(app)
    .get('/contracts/1')
    .set('profile_id', 1);

    expect(response.status).toBe(404);
  });

  it('should return 401 when the user is not authorized', async () => {
    const mockProfile = {
        id: 3,
        firstName: 'Harry',
        lastName: 'Potter',
        profession: 'Wizard',
        balance: 1150,
        type:'client'
    };
    // Mock a contract where the user is not authorized
    const mockContract = {
        id:1,
        terms: 'bla bla bla',
        status: 'in_progress',
        ClientId: 1,
        ContractorId: 2
    };
    Contract.findOne = jest.fn().mockResolvedValue(mockContract);
    Profile.findOne = jest.fn().mockResolvedValue(mockProfile);

    const response = await request(app)
    .get('/contracts/1')
    .set('profile_id', 3);

    expect(response.status).toBe(401);
  });

  it('should return 500 on server error', async () => {
    const mockProfile = {
        id: 1,
        firstName: 'Harry',
        lastName: 'Potter',
        profession: 'Wizard',
        balance: 1150,
        type:'client'
    };

    // Mock the database to throw an error
    Contract.findOne = jest.fn().mockRejectedValue(new Error('Database error'));
    Profile.findOne = jest.fn().mockResolvedValue(mockProfile);

    const response = await request(app)
    .get('/contracts/1')
    .set('profile_id', 1);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal server error' });
  });
});

describe('GET /contracts', () => {
    it('should return contracts for the client or contractor', async () => {
      // Mock the Profile for the test user
      const mockProfile = {
        id: 1,
        firstName: 'Harry',
        lastName: 'Potter',
        profession: 'Wizard',
        balance: 1150,
        type:'client'
    };
      // Mock the contracts response from the database
      const mockContracts = [
        {
            id:1,
            terms: 'bla bla bla',
            status: 'in_progress',
            ClientId: 1,
            ContractorId: 2
        },
        {
            id:2,
            terms: 'bla bla bla',
            status: 'in_progress',
            ClientId: 1,
            ContractorId: 2
        },
      ];
  
      Profile.findOne = jest.fn().mockResolvedValue(mockProfile);
      Contract.findAll = jest.fn().mockResolvedValue(mockContracts);
  
      const response = await request(app)
        .get('/contracts')
        .set('profile_id', '1'); // Set the profile_id header to simulate an authenticated user
  
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockContracts); // Ensure the correct contracts are returned
    });
  
    it('should return 404 if no contracts are found for the user', async () => {
      // Mock that no contracts were found
      Contract.findAll.mockResolvedValue([]);
  
      const response = await request(app)
        .get('/contracts')
        .set('profile_id', '1');
  
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'No contracts found for this user' });
    });
  
    it('should return 500 if there is an internal server error', async () => {
      // Mock a database error by rejecting the findAll query
      Contract.findAll.mockRejectedValue(new Error('Database error'));
  
      const response = await request(app)
        .get('/contracts')
        .set('profile_id', '1');
  
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ message: 'Internal Server Error' });
    });
  });