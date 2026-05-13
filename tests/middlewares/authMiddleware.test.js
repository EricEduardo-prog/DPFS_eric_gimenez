const { isGuest, isUser, isAdmin, redirectIfAuthenticated } = require('../../middlewares/authMiddleware');

function mockReqRes(sessionOverrides = {}) {
    const req = {
        session: { usuarioId: null, rol: null, ...sessionOverrides }
    };
    const res = {
        redirect: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn()
    };
    const next = jest.fn();
    return { req, res, next };
}

describe('isGuest', () => {
    it('llama next() si no hay usuarioId en sesion', () => {
        const { req, res, next } = mockReqRes({ usuarioId: null });
        isGuest(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    it('redirige a / si hay usuarioId en sesion', () => {
        const { req, res, next } = mockReqRes({ usuarioId: 'usr_123' });
        isGuest(req, res, next);
        expect(res.redirect).toHaveBeenCalledWith('/');
        expect(next).not.toHaveBeenCalled();
    });
});

describe('isUser', () => {
    it('llama next() si existe usuarioId en sesion', () => {
        const { req, res, next } = mockReqRes({ usuarioId: 'usr_123' });
        isUser(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    it('redirige a /login si no hay usuarioId', () => {
        const { req, res, next } = mockReqRes({ usuarioId: null });
        isUser(req, res, next);
        expect(res.redirect).toHaveBeenCalledWith('/login');
        expect(next).not.toHaveBeenCalled();
    });
});

describe('isAdmin', () => {
    it('llama next() si el rol es admin', () => {
        const { req, res, next } = mockReqRes({ usuarioId: 'usr_1', rol: 'admin' });
        isAdmin(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    it('redirige a /login si no hay usuarioId', () => {
        const { req, res, next } = mockReqRes({ usuarioId: null });
        isAdmin(req, res, next);
        expect(res.redirect).toHaveBeenCalledWith('/login');
    });

    it('devuelve 403 si no es admin', () => {
        const { req, res, next } = mockReqRes({ usuarioId: 'usr_2', rol: 'user' });
        isAdmin(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.send).toHaveBeenCalledWith(expect.stringContaining('Acceso denegado'));
    });
});

describe('redirectIfAuthenticated', () => {
    it('llama next() si no hay sesion', () => {
        const { req, res, next } = mockReqRes({ usuarioId: null });
        redirectIfAuthenticated(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    it('redirige a / si el usuario ya esta autenticado', () => {
        const { req, res, next } = mockReqRes({ usuarioId: 'usr_123' });
        redirectIfAuthenticated(req, res, next);
        expect(res.redirect).toHaveBeenCalledWith('/');
    });
});
