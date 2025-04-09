const {
    getProfileById,
    getBestProfession,
    getBestClients
} = require('../../controllers/admin.controller'); // <-- Update path accordingly

const mockFindOne = jest.fn();
const mockFindAll = jest.fn();

const mockModels = {
    Profile: { findOne: mockFindOne },
    Job: { findAll: mockFindAll },
    Contract: {}
};

const createMockReqRes = (overrides = {}) => {
    const req = {
        profile: { id: 1, type: 'admin' },
        params: {},
        query: {},
        app: {
            get: jest.fn().mockReturnValue(mockModels)
        },
        ...overrides.req
    };

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        end: jest.fn(),
        ...overrides.res
    };

    return { req, res };
};

beforeEach(() => {
    jest.clearAllMocks();
});

describe('getProfileById', () => {
    it('should return profile when user is admin', async () => {
        const { req, res } = createMockReqRes({ req: { params: { id: 2 } } });
        mockFindOne
            .mockResolvedValueOnce({ id: 1, type: 'admin' }) // requestingUser
            .mockResolvedValueOnce({ id: 2, name: 'John' }); // target profile

        await getProfileById(req, res);

        expect(res.json).toHaveBeenCalledWith({ id: 2, name: 'John' });
    });

    it('should return 403 if user is not admin', async () => {
        const { req, res } = createMockReqRes();
        mockFindOne.mockResolvedValue({ id: 1, type: 'client' });

        await getProfileById(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: 'Access denied. Admins only.' });
    });

    it('should return 404 if profile not found', async () => {
        const { req, res } = createMockReqRes({ req: { params: { id: 999 } } });
        mockFindOne
            .mockResolvedValueOnce({ id: 1, type: 'admin' }) // requestingUser
            .mockResolvedValueOnce(null); // target not found

        await getProfileById(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.end).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
        const { req, res } = createMockReqRes();
        mockFindOne.mockRejectedValue(new Error('DB error'));

        await getProfileById(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
});

describe('getBestProfession', () => {
    it('should return top earning profession', async () => {
        const { req, res } = createMockReqRes({
            req: { query: { start: '2023-01-01', end: '2023-12-31' } }
        });

        mockFindOne.mockResolvedValue({ id: 1, type: 'admin' });
        mockFindAll.mockResolvedValue([{ profession: 'Dev', totalEarnings: 3000 }]);

        await getBestProfession(req, res);

        expect(res.json).toHaveBeenCalledWith({
            profession: 'Dev',
            totalEarnings: 3000
        });
    });

    it('should return 400 if missing date params', async () => {
        const { req, res } = createMockReqRes();

        await getBestProfession(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Missing start or end date' });
    });

    it('should return 403 if not admin', async () => {
        const { req, res } = createMockReqRes({
            req: {
                profile: { id: 1, type: 'client' },
                query: { start: '2023-01-01', end: '2023-12-31' }
            }
        });

        mockFindOne.mockResolvedValue({ id: 1, type: 'client' });

        await getBestProfession(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should return 404 if no data found', async () => {
        const { req, res } = createMockReqRes({
            req: {
                query: { start: '2023-01-01', end: '2023-12-31' }
            }
        });

        mockFindOne.mockResolvedValue({ id: 1, type: 'admin' });
        mockFindAll.mockResolvedValue([]);

        await getBestProfession(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'No data found for given range.' });
    });

    it('should handle errors', async () => {
        const { req, res } = createMockReqRes({
            req: {
                query: { start: '2023-01-01', end: '2023-12-31' }
            }
        });

        mockFindOne.mockResolvedValue({ id: 1, type: 'admin' });
        mockFindAll.mockRejectedValue(new Error('boom'));

        await getBestProfession(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
});

describe('getBestClients', () => {
    it('should return top clients', async () => {
        const { req, res } = createMockReqRes({
            req: {
                query: { start: '2023-01-01', end: '2023-12-31', limit: '2' }
            }
        });

        mockFindOne.mockResolvedValue({ id: 1, type: 'admin' });
        mockFindAll.mockResolvedValue([
            {
                clientId: 1,
                firstName: 'Jane',
                lastName: 'Doe',
                totalPaid: 500
            }
        ]);

        await getBestClients(req, res);

        expect(res.json).toHaveBeenCalledWith([
            { id: 1, fullName: 'Jane Doe', paid: 500 }
        ]);
    });

    it('should return 400 if missing start/end', async () => {
        const { req, res } = createMockReqRes();

        await getBestClients(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Missing start or end date' });
    });

    it('should return 403 if not admin', async () => {
        const { req, res } = createMockReqRes({
            req: {
                profile: { id: 1, type: 'client' },
                query: { start: '2023-01-01', end: '2023-12-31' }
            }
        });

        mockFindOne.mockResolvedValue({ id: 1, type: 'client' });

        await getBestClients(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: 'Access denied. Admins only.' });
    });

    it('should return 404 if no clients found', async () => {
        const { req, res } = createMockReqRes({
            req: {
                query: { start: '2023-01-01', end: '2023-12-31' }
            }
        });

        mockFindOne.mockResolvedValue({ id: 1, type: 'admin' });
        mockFindAll.mockResolvedValue([]);

        await getBestClients(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            message: 'No clients found for the given time period.'
        });
    });

    it('should handle errors', async () => {
        const { req, res } = createMockReqRes({
            req: {
                query: { start: '2023-01-01', end: '2023-12-31' }
            }
        });

        mockFindOne.mockResolvedValue({ id: 1, type: 'admin' });
        mockFindAll.mockRejectedValue(new Error('DB fail'));

        await getBestClients(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
    });
});