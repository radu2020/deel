const { depositToBalance } = require('../../controllers/balance.controller');
const getUnpaidJobsForActiveContracts = require('../../services/job.service');

jest.mock('../../services/job.service');

const mockTransaction = {
  commit: jest.fn(),
  rollback: jest.fn(),
  LOCK: { UPDATE: 'UPDATE' },
};

const mockSequelize = {
  transaction: jest.fn().mockResolvedValue(mockTransaction),
};

const mockFindOne = jest.fn();
const mockSave = jest.fn();

const mockModels = {
  Profile: {
    findOne: mockFindOne,
  },
};

const createMockReqRes = (overrides = {}) => {
  const req = {
    profile: { id: 1 },
    params: { userId: '1' },
    body: { amount: 50 },
    app: {
      get: jest.fn((key) => {
        if (key === 'models') return mockModels;
        if (key === 'sequelize') return mockSequelize;
      }),
    },
    ...overrides.req,
  };

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    end: jest.fn(),
    ...overrides.res,
  };

  return { req, res };
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('depositToBalance', () => {
  it('should deposit successfully when amount is within 25% limit', async () => {
    const { req, res } = createMockReqRes();

    const profile = { id: 1, balance: 100, save: mockSave };
    mockFindOne.mockResolvedValue(profile);

    getUnpaidJobsForActiveContracts.mockResolvedValue([
      { price: 100 },
      { price: 100 },
    ]); // Total unpaid: 200 → Max deposit: 50

    await depositToBalance(req, res);

    expect(mockSequelize.transaction).toHaveBeenCalled();
    expect(mockFindOne).toHaveBeenCalledWith({
      where: { id: '1' },
      transaction: mockTransaction,
      lock: mockTransaction.LOCK.UPDATE,
    });
    expect(mockSave).toHaveBeenCalled();
    expect(mockTransaction.commit).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      message: 'Deposit successful',
      newBalance: 150,
    });
  });

  it('should return 403 if user tries to deposit into someone else\'s account', async () => {
    const { req, res } = createMockReqRes({
      req: { params: { userId: '2' }, profile: { id: 1 } },
    });

    await depositToBalance(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: 'You are not authorized to deposit into this account.',
    });
  });

  it('should return 404 if profile not found', async () => {
    const { req, res } = createMockReqRes();

    mockFindOne.mockResolvedValue(null);

    await depositToBalance(req, res);

    expect(mockTransaction.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'User not found',
    });
  });

  it('should return 400 if deposit exceeds 25% limit', async () => {
    const { req, res } = createMockReqRes({
      req: { body: { amount: 100 } }, // Exceeds 25% of unpaid = 50
    });

    const profile = { id: 1, balance: 100, save: mockSave };
    mockFindOne.mockResolvedValue(profile);

    getUnpaidJobsForActiveContracts.mockResolvedValue([
      { price: 200 },
    ]); // 25% of 200 = 50

    await depositToBalance(req, res);

    expect(mockTransaction.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: expect.stringContaining('Deposit exceeds the 25% limit'),
    });
  });

  it('should return 500 on unexpected errors and rollback', async () => {
    const { req, res } = createMockReqRes();

    mockFindOne.mockRejectedValue(new Error('boom'));

    await depositToBalance(req, res);

    expect(mockTransaction.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal Server Error',
    });
  });
});
