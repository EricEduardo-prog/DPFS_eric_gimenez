jest.mock('../../database/models', () => {
    const mockCategory = {
        findAll: jest.fn()
    };
    const mockProduct = {
        findAll: jest.fn(),
        findByPk: jest.fn()
    };
    const mockService = {
        findAll: jest.fn()
    };
    return {
        Product: mockProduct,
        Category: mockCategory,
        Service: mockService,
        sequelize: { Op: { like: Symbol('like') } }
    };
});

const { Product, Category, Service } = require('../../database/models');
const indexController = require('../../controllers/indexController');

function mockReqRes(overrides = {}) {
    const req = {
        query: {},
        params: {},
        session: {},
        ...overrides
    };
    const res = {
        render: jest.fn(),
        redirect: jest.fn()
    };
    const next = jest.fn();
    return { req, res, next };
}

describe('indexController - home', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renderiza layout con productos y categorias', async () => {
        Product.findAll.mockResolvedValue([
            { id: 'prod_1', name: 'Producto 1', toJSON: () => ({ id: 'prod_1', name: 'Producto 1' }) }
        ]);
        Category.findAll.mockResolvedValue([
            { id: 'cat_1', name: 'Iluminacion', toJSON: () => ({ id: 'cat_1', name: 'Iluminacion' }) }
        ]);

        const { req, res, next } = mockReqRes();
        await indexController.home(req, res, next);

        expect(res.render).toHaveBeenCalledWith('layout', expect.objectContaining({
            title: expect.stringContaining('E-E'),
            body: 'pages/index',
            productos: expect.arrayContaining([expect.objectContaining({ id: 'prod_1' })]),
            categorias: expect.arrayContaining([expect.objectContaining({ id: 'cat_1' })])
        }));
    });

    it('llama next(err) si Product.findAll falla', async () => {
        const error = new Error('DB error');
        Product.findAll.mockRejectedValue(error);

        const { req, res, next } = mockReqRes();
        await indexController.home(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
    });
});

describe('indexController - buscar', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('busca productos y renderiza resultados', async () => {
        Product.findAll.mockResolvedValue([
            { id: 'prod_1', name: 'Lámpara LED', toJSON: () => ({ id: 'prod_1', name: 'Lámpara LED' }) }
        ]);

        const { req, res, next } = mockReqRes();
        req.query = { q: 'lámpara' };

        await indexController.buscar(req, res, next);

        expect(Product.findAll).toHaveBeenCalledWith(
            expect.objectContaining({ where: expect.objectContaining({ is_active: true }) })
        );
        expect(res.render).toHaveBeenCalledWith('layout', expect.objectContaining({
            body: 'pages/search/results',
            query: 'lámpara'
        }));
    });
});

describe('indexController - verProducto', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('redirige si producto no existe', async () => {
        Product.findByPk.mockResolvedValue(null);

        const { req, res, next } = mockReqRes({ params: { id: 'fake' } });
        await indexController.verProducto(req, res, next);

        expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('error=Producto'));
    });

    it('renderiza detalle si producto existe y esta activo', async () => {
        const mockProduct = {
            id: 'prod_1',
            name: 'Lámpara',
            is_active: true,
            category: { id: 'cat_1', name: 'Iluminacion' }
        };
        Product.findByPk.mockResolvedValue(mockProduct);
        Category.findAll.mockResolvedValue([]);
        Service.findAll.mockResolvedValue([]);

        const { req, res, next } = mockReqRes({ params: { id: 'prod_1' } });
        await indexController.verProducto(req, res, next);

        expect(res.render).toHaveBeenCalledWith('layout', expect.objectContaining({
            body: 'pages/products/detail',
            producto: mockProduct
        }));
    });
});
