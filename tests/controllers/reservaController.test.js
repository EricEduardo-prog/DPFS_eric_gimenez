jest.mock('../../database/models', () => {
    const mockProfessional = { findByPk: jest.fn() };
    return {
        Professional: mockProfessional,
        Booking: { findOne: jest.fn() },
        BookingItem: { destroy: jest.fn() }
    };
});

jest.mock('../../services/reserveService', () => ({
    getReserva: jest.fn(),
    agregarItem: jest.fn(),
    actualizarCantidad: jest.fn(),
    eliminarItem: jest.fn(),
    calcularTotales: jest.fn()
}));

jest.mock('../../services/checkoutService', () => ({
    procesarCheckout: jest.fn()
}));

const ReserveService = require('../../services/reserveService');
const reservaController = require('../../controllers/reservaController');

function mockReqRes(overrides = {}) {
    const req = {
        query: {},
        params: {},
        body: {},
        session: {},
        ...overrides
    };
    const res = {
        render: jest.fn(),
        json: jest.fn(),
        redirect: jest.fn(),
        status: jest.fn().mockReturnThis()
    };
    const next = jest.fn();
    return { req, res, next };
}

describe('reservaController - verReserva', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renderiza reserva vacia si no hay reserva activa', async () => {
        ReserveService.getReserva.mockResolvedValue(null);

        const { req, res, next } = mockReqRes();
        await reservaController.verReserva(req, res, next);

        expect(res.render).toHaveBeenCalledWith('layout', expect.objectContaining({
            body: 'pages/products/reserve',
            reserva: null,
            items: [],
            total: 0
        }));
    });

    it('renderiza reserva con items', async () => {
        ReserveService.getReserva.mockResolvedValue({
            id: 'res_123',
            user_id: 'usr_1',
            items: [
                { id: 'item_1', product_id: 'prod_1', service_id: null, unit_price: 100, quantity: 2 }
            ]
        });
        ReserveService.calcularTotales.mockReturnValue({ subtotal: 200, totalServicios: 0, total: 200 });

        const { req, res, next } = mockReqRes();
        await reservaController.verReserva(req, res, next);

        expect(res.render).toHaveBeenCalledWith('layout', expect.objectContaining({
            body: 'pages/products/reserve',
            items: expect.arrayContaining([
                expect.objectContaining({ id: 'item_1', product_id: 'prod_1' })
            ])
        }));
    });

    it('maneja errores con next()', async () => {
        ReserveService.getReserva.mockRejectedValue(new Error('Error'));

        const { req, res, next } = mockReqRes();
        await reservaController.verReserva(req, res, next);

        expect(next).toHaveBeenCalled();
    });
});

describe('reservaController - contarItems', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('devuelve 0 si no hay reserva', async () => {
        ReserveService.getReserva.mockResolvedValue(null);

        const { req, res, next } = mockReqRes();
        await reservaController.contarItems(req, res, next);

        expect(res.json).toHaveBeenCalledWith({ totalItems: 0 });
    });

    it('devuelve cantidad total de items', async () => {
        ReserveService.getReserva.mockResolvedValue({
            items: [
                { quantity: 2 },
                { quantity: 3 }
            ]
        });

        const { req, res, next } = mockReqRes();
        await reservaController.contarItems(req, res, next);

        expect(res.json).toHaveBeenCalledWith({ totalItems: 5 });
    });
});
