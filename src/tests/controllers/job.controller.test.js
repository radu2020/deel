const { payForJob } = require('../../controllers/job.controller'); // Adjust path
const { mockRequest, mockResponse } = require('jest-mock-req-res');

describe('payForJob', () => {
  let req, res, sequelize, transaction;

  const mockJob = {
    id: 1,
    price: 200,
    paid: false,
    ContractId: 10,
    paymentDate: null,
    Contract: {
      id: 10,
      ContractorId: 2,
      status: 'in_progress',
      save: jest.fn(),
    },
    save: jest.fn(),
  };

  const clientProfile = {
    id: 1,
    balance: 500,
    save: jest.fn(),
  };

  const contractorProfile = {
    id: 2,
    balance: 300,
    save: jest.fn(),
  };

  beforeEach(() => {
    transaction = {
      commit: jest.fn(),
      rollback: jest.fn(),
    };

    sequelize = {
      transaction: jest.fn().mockResolvedValue(transaction),
    };

    req = mockRequest({
      params: { job_id: 1 },
      profile: { id: 1, type: 'client' },
      app: {
        get: jest.fn((key) => {
          if (key === 'sequelize') return sequelize;
          if (key === 'models') {
            return {
              Job: {
                findOne: jest.fn().mockResolvedValue(mockJob),
                count: jest.fn().mockResolvedValue(0),
              },
              Contract: {},
              Profile: {
                findOne: jest
                  .fn()
                  .mockImplementation(({ where: { id } }) => {
                    return id === 1
                      ? Promise.resolve(clientProfile)
                      : Promise.resolve(contractorProfile);
                  }),
              },
            };
          }
        }),
      },
    });

    res = mockResponse();
  });

  it('should successfully process a payment', async () => {
    await payForJob(req, res);

    expect(clientProfile.balance).toBe(300);
    expect(contractorProfile.balance).toBe(500);
    expect(mockJob.paid).toBe(true);
    expect(mockJob.paymentDate).toBeInstanceOf(Date);

    expect(transaction.commit).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Payment successful.',
        updatedClientBalance: 300,
        updatedContractorBalance: 500,
      })
    );
  });

  it('should return 403 if profile is not a client', async () => {
    req.profile.type = 'contractor';

    await payForJob(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Only clients can make payments.',
    });
  });

  it('should return 404 if job is not found or not associated with the client', async () => {
    req.app.get = jest.fn((key) => {
      if (key === 'sequelize') return sequelize;
      if (key === 'models') {
        return {
          Job: {
            findOne: jest.fn().mockResolvedValue(null),
          },
          Profile: {},
          Contract: {},
        };
      }
    });

    await payForJob(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Job not found or client is not associated with the job.',
    });
  });

  it('should return 400 if client balance is insufficient', async () => {
    clientProfile.balance = 100; // Less than job price

    await payForJob(req, res);

    expect(transaction.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Insufficient balance to make payment.',
    });
  });

  it('should handle internal server errors gracefully', async () => {
    const error = new Error('Something went wrong');
    console.log("error = ", error)
    req.app.get = jest.fn((key) => {
      if (key === 'sequelize') return sequelize;
      if (key === 'models') {
        throw error;
      }
    });

    await payForJob(req, res);

    expect(transaction.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal Server Error',
    });
  });
});
