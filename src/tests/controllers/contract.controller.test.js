const { getContracts, getContractById } = require('../../controllers/contract.controller');
const Sequelize = require('sequelize');

jest.mock('../../models', () => ({
  Contract: { findAll: jest.fn(), findOne: jest.fn() },
  Profile: {},
}));

const { Contract, Profile } = require('../../models');

describe('Contracts Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      profile: { id: 1 },
      params: {},
      app: {
        get: jest.fn(() => ({ Contract }))
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      end: jest.fn()
    };

    jest.clearAllMocks();
  });

  // === getContracts ===
  describe('getContracts', () => {
    it('should return contracts if found', async () => {
      const fakeContracts = [{ id: 1 }, { id: 2 }];
      Contract.findAll.mockResolvedValue(fakeContracts);

      await getContracts(req, res);

      expect(Contract.findAll).toHaveBeenCalledWith({
        where: {
          status: { [Sequelize.Op.ne]: 'terminated' },
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

      expect(res.json).toHaveBeenCalledWith(fakeContracts);
    });

    it('should return 404 if no contracts are found', async () => {
      Contract.findAll.mockResolvedValue([]);

      await getContracts(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'No contracts found for this user' });
    });

    it('should return 500 on error', async () => {
      Contract.findAll.mockRejectedValue(new Error('DB error'));

      await getContracts(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal Server Error' });
    });
  });

  // === getContractById ===
  describe('getContractById', () => {
    it('should return the contract if user is authorized', async () => {
      const contract = { id: 1, ClientId: 1, ContractorId: 2 };
      req.params.id = '1';
      Contract.findOne.mockResolvedValue(contract);

      await getContractById(req, res);

      expect(Contract.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(res.json).toHaveBeenCalledWith(contract);
    });

    it('should return 404 if contract is not found', async () => {
      req.params.id = '1';
      Contract.findOne.mockResolvedValue(null);

      await getContractById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.end).toHaveBeenCalled();
    });

    it('should return 401 if user is not part of the contract', async () => {
      const contract = { id: 1, ClientId: 2, ContractorId: 3 }; // Not matching req.profile.id (1)
      req.params.id = '1';
      Contract.findOne.mockResolvedValue(contract);

      await getContractById(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.end).toHaveBeenCalled();
    });

    it('should return 500 on error', async () => {
      req.params.id = '1';
      Contract.findOne.mockRejectedValue(new Error('DB failure'));

      await getContractById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });
});
