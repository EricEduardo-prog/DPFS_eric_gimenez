jest.mock('../../database/models', () => {
    const mockCategory = {
        findAll: jest.fn(),
        findByPk: jest.fn(),
        count: jest.fn(),
        name: 'Category'
    };
    const mockProduct = {
        findAll: jest.fn(),
        findByPk: jest.fn(),
        findAndCountAll: jest.fn(),
        count: jest.fn(),
        name: 'Product'
    };
    const mockUser = {
        findAndCountAll: jest.fn(),
        findByPk: jest.fn(),
        name: 'User'
    };
    const mockService = {
        findAndCountAll: jest.fn(),
        findByPk: jest.fn(),
        name: 'Service'
    };
    const mockProfessional = {
        findAndCountAll: jest.fn(),
        findByPk: jest.fn(),
        name: 'Professional'
    };
    return {
        Category: mockCategory,
        Product: mockProduct,
        User: mockUser,
        Service: mockService,
        Professional: mockProfessional,
        sequelize: { fn: jest.fn(), col: jest.fn() }
    };
});

const { Category, Product } = require('../../database/models');
const apiController = require('../../controllers/apiController');

function mockReqRes(overrides = {}) {
    const req = {
        query: {},
        params: {},
        protocol: 'http',
        get: jest.fn().mockReturnValue('localhost'),
        baseUrl: '/api',
        path: '/categories',
        ...overrides
    };
    const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
    };
    const next = jest.fn();
    return { req, res, next };
}

describe('API Controller - listCategories', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('devuelve lista paginada de categorias', async () => {
        Category.findAll.mockResolvedValue([
            { id: 'cat_1', name: 'Iluminacion', slug: 'iluminacion', toJSON: () => ({ id: 'cat_1', name: 'Iluminacion' }) },
            { id: 'cat_2', name: 'Pintura', slug: 'pintura', toJSON: () => ({ id: 'cat_2', name: 'Pintura' }) }
        ]);
        Product.findAll.mockResolvedValue([
            { category_id: 'cat_1' },
            { category_id: 'cat_1' },
            { category_id: 'cat_2' }
        ]);

        const { req, res, next } = mockReqRes({ query: { page: '1', limit: '10' } });
        await apiController.listCategories(req, res, next);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            count: 2,
            totalPages: 1,
            currentPage: 1,
            limit: 10,
            categories: expect.arrayContaining([
                expect.objectContaining({ id: 'cat_1', products_count: 2 }),
                expect.objectContaining({ id: 'cat_2', products_count: 1 })
            ])
        }));
    });

    it('filtra por onlyActive', async () => {
        Category.findAll.mockResolvedValue([]);
        Product.findAll.mockResolvedValue([]);

        const { req, res, next } = mockReqRes({ query: { onlyActive: 'true' } });
        await apiController.listCategories(req, res, next);

        expect(Category.findAll).toHaveBeenCalledWith(
            expect.objectContaining({ where: { is_active: true } })
        );
    });

    it('maneja errores con next()', async () => {
        const error = new Error('DB error');
        Category.findAll.mockRejectedValue(error);

        const { req, res, next } = mockReqRes();
        await apiController.listCategories(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
    });
});

describe('API Controller - getCategoryById', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('devuelve categoria por ID', async () => {
        Category.findByPk.mockResolvedValue({
            id: 'cat_1',
            name: 'Iluminacion',
            toJSON: () => ({ id: 'cat_1', name: 'Iluminacion' })
        });
        Product.count.mockResolvedValue(5);

        const { req, res, next } = mockReqRes({ params: { id: 'cat_1' } });
        await apiController.getCategoryById(req, res, next);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ id: 'cat_1', products_count: 5 })
        );
    });

    it('devuelve 404 si no existe', async () => {
        Category.findByPk.mockResolvedValue(null);

        const { req, res, next } = mockReqRes({ params: { id: 'inexistente' } });
        await apiController.getCategoryById(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: expect.any(String) });
    });
});

describe('API Controller - getProductById', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('devuelve producto con categoria incluida', async () => {
        Product.findByPk.mockResolvedValue({
            id: 'prod_1',
            name: 'Lámpara LED',
            toJSON: () => ({ id: 'prod_1', name: 'Lámpara LED' })
        });

        const { req, res, next } = mockReqRes({ params: { id: 'prod_1' } });
        await apiController.getProductById(req, res, next);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ id: 'prod_1', name: 'Lámpara LED' })
        );
    });

    it('devuelve 404 si producto no existe', async () => {
        Product.findByPk.mockResolvedValue(null);

        const { req, res, next } = mockReqRes({ params: { id: 'fake' } });
        await apiController.getProductById(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
    });
});
