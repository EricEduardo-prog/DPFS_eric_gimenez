var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const methodOverride = require('method-override');
const session = require('express-session');
const FileStore = require('session-file-store')(session);

var app = express();

// Routers 
var indexRouter = require('./routes/index');
var categoriaRouter = require('./routes/categoriaRoutes');
var productoRouter = require('./routes/productoRoutes');
var profesionalesRouter = require('./routes/profesionalesRoutes');
var usuarioRouter = require('./routes/usuarioRoutes');
var servicioRouter = require('./routes/servicioRoutes');
var validacionesRouter = require('./routes/validacionRoutes');
var disponibilidadRouter = require('./routes/disponibilidadRoutes');
var reservaRouter = require('./routes/reservaRoutes');

// Middlewares Basicos
app.use(express.urlencoded({ extended: true })); // Asegurar que parsea bien el body
app.use(express.json());
app.use(cookieParser());

// Crear carpeta sessions en el directorio del proyecto
const sessionsDir = path.join(__dirname, 'sessions');

// Configuración de sesión con persistencia en disco
app.use(session({
    store: new FileStore({
        path: sessionsDir,
        ttl: 86400,
        reapInterval: 3600,
        retries: 0,  // ← No reintentar
        logFn: function () { }  // ← Silenciar logs de errores
    }),
    secret: 'SHHHHHHHH! Es un secreto para la sesión en E-E',
    resave: false,
    saveUninitialized: false,
    rolling: true,  // ← Renovar sesión en cada petición
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Middleware global para pasar rol a todas las vistas
app.use((req, res, next) => {
    if (req.session?.usuarioId) {
        //comparar directamente con 'admin'
        const esAdmin = req.session?.rol === 'admin';
        res.locals.rol = esAdmin ? 'admin' : 'user';
        res.locals.usuarioId = req.session.usuarioId;
        res.locals.usuarioNombre = req.session.usuarioNombre;
    } else {
        res.locals.rol = 'guest';
        res.locals.usuarioId = null;
        res.locals.usuarioNombre = null;
    }
    next();
});




app.use(methodOverride('_method'));
app.use(logger('dev'));

// view engine 
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');



//Archivos estaticos
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
// Middleware para pasar usuario a todas las vistas
// ============================================================
app.use((req, res, next) => {
    res.locals.usuario = req.session?.usuarioId ? {
        id: req.session.usuarioId,
        nombre: req.session.usuarioNombre,
        email: req.session.usuarioEmail
    } : null;
    next();
});

// Ignorar solicitudes de Chrome DevTools
app.use((req, res, next) => {
    if (req.url.includes('.well-known/appspecific')) {
        return res.status(204).end();
    }
    next();
});

// Ruta principal publicas
app.use('/', usuarioRouter.publicRouter); // POST /register

app.use('/usuarios', usuarioRouter.publicRouter); // Rutas de perfil, login, logout, etc.

// Ruta de reservas
app.use('/reserva', reservaRouter); // Rutas de reserva

// Ruta de disponibilidad
app.use('/disponibilidad', disponibilidadRouter); // Rutas de disponibilidad



app.use('/', indexRouter); // Home, productDetail, etc.



// Ruta admin dashboard
app.get('/admin', (req, res) => res.redirect('/admin/productos'));
app.get('/admin/', (req, res) => res.redirect('/admin/productos'));

//Rutas admin 
app.use('/admin/validaciones', validacionesRouter);
app.use('/admin/categorias', categoriaRouter);
app.use('/admin/productos', productoRouter);
app.use('/admin/profesionales', profesionalesRouter);
app.use('/admin/usuarios', usuarioRouter.adminRouter);
app.use('/admin/servicios', servicioRouter);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// Debug para ver qué archivos estáticos se solicitan
app.use((req, res, next) => {
    if (req.url.match(/\.(css|js|jpg|png|gif|svg)$/)) {
        console.log(`📁 Archivo estático solicitado: ${req.url}`);
        console.log(`   Buscando en: ${path.join(__dirname, 'public', req.url)}`);
    }
    next();
});

app.use((req, res, next) => {
    console.log('📌 Session ID:', req.session?.id);
    console.log('📌 Session data:', req.session);
    next();
});

// middleware captura rutas no encontradas
app.use(function (req, res, next) {
    console.log(`❌ 404 - Ruta no encontrada: ${req.method} ${req.url}`);
    next(createError(404));
});


// error handler
app.use(function (err, req, res, next) {
    // ✅ Si ya se enviaron los headers, no intentar enviar otra respuesta
    if (res.headersSent) {
        return next(err);
    }

    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    console.error('Error global:', err);
    res.status(err.status || 500).send(`
        <h1>Error del servidor</h1>
        <p>${err.message}</p>
        <pre>${err.stack}</pre>
        <a href="/">Volver a la página de inicio</a>
    `);
});

module.exports = app;
