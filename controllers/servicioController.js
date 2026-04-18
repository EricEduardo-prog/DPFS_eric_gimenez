'use strict';

const servicioModel = require('../models/servicioModel');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers internos
// ─────────────────────────────────────────────────────────────────────────────

function _validar(body, esEdicion = false) {
    const errores = [];

    if (!body.nombre?.trim()) {
        errores.push('El nombre es obligatorio.');
    } else if (body.nombre.trim().length > 80) {
        errores.push('El nombre no puede superar los 80 caracteres.');
    }

    if (body.descripcion?.trim() && body.descripcion.trim().length > 500) {
        errores.push('La descripción no puede superar los 500 caracteres.');
    }

    return errores;
}

function _optsForm(titulo, servicio, errores, formData = null) {
    return {
        title: `${titulo} — E-E Admin`,
        pageCss: 'admin_form',
        currentPage: 'admin',
        body: 'pages/admin/service/form',
        servicio: servicio ?? null,
        errores: errores ?? [],
        formData: formData
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Controladores
// ─────────────────────────────────────────────────────────────────────────────

function listar(req, res, next) {
    try {
        const { soloActivos, destacados } = req.query;
        const servicios = servicioModel.getAll({
            soloActivos: soloActivos === 'true',
            destacados: destacados === 'true'
        });

        res.render('layout', {
            title: 'Servicios — E-E Admin',
            pageCss: 'admin_list',
            currentPage: 'admin',
            body: 'pages/admin/service/list',
            servicios,
            filtros: { soloActivos: soloActivos || '', destacados: destacados || '' },
            mensaje: req.query.mensaje || null,
            error: req.query.error || null
        });
    } catch (err) {
        next(err);
    }
}

function mostrarFormNuevo(req, res, next) {
    try {
        res.render('layout', _optsForm('Nuevo Servicio', null, []));
    } catch (err) {
        next(err);
    }
}

function crear(req, res, next) {
    console.log('🔵 POST /admin/servicios - Body:', req.body);

    const errores = _validar(req.body);

    if (errores.length > 0) {
        return res.render('layout', _optsForm('Nuevo Servicio', null, errores, req.body));
    }

    try {
        const nuevoServicio = servicioModel.create(req.body);
        console.log('✅ Servicio creado:', nuevoServicio.id);
        res.redirect('/admin/servicios?mensaje=Servicio creado correctamente.');
    } catch (err) {
        console.error('❌ Error:', err.message);
        res.render('layout', _optsForm('Nuevo Servicio', null, [err.message], req.body));
    }
}

function mostrarFormEditar(req, res, next) {
    try {
        const servicio = servicioModel.getById(req.params.id);
        if (!servicio) {
            return res.redirect('/admin/servicios?error=Servicio no encontrado.');
        }
        res.render('layout', _optsForm(`Editar ${servicio.nombre}`, servicio, []));
    } catch (err) {
        next(err);
    }
}

function actualizar(req, res, next) {
    console.log('🟡 POST /admin/servicios/:id - ID:', req.params.id);

    const errores = _validar(req.body, true);

    if (errores.length > 0) {
        const servicio = servicioModel.getById(req.params.id);
        return res.render('layout', _optsForm('Editar Servicio', servicio, errores, req.body));
    }

    try {
        servicioModel.update(req.params.id, req.body);
        res.redirect('/admin/servicios?mensaje=Servicio actualizado correctamente.');
    } catch (err) {
        console.error('❌ Error:', err.message);
        const servicio = servicioModel.getById(req.params.id);
        res.render('layout', _optsForm('Editar Servicio', servicio, [err.message], req.body));
    }
}

function toggleBaja(req, res, next) {
    console.log('🔴 POST /admin/servicios/:id/baja - ID:', req.params.id);

    try {
        const servicio = servicioModel.toggleActivo(req.params.id);
        const estado = servicio.activo ? 'activado' : 'desactivado';
        res.redirect(`/admin/servicios?mensaje=Servicio ${estado} correctamente.`);
    } catch (err) {
        res.redirect(`/admin/servicios?error=${encodeURIComponent(err.message)}`);
    }
}

function toggleDestacado(req, res, next) {
    console.log('⭐ POST /admin/servicios/:id/destacado - ID:', req.params.id);

    try {
        const servicio = servicioModel.toggleDestacado(req.params.id);
        const estado = servicio.destacado ? 'destacado' : 'no destacado';
        res.redirect(`/admin/servicios?mensaje=Servicio marcado como ${estado}.`);
    } catch (err) {
        res.redirect(`/admin/servicios?error=${encodeURIComponent(err.message)}`);
    }
}

module.exports = {
    listar,
    mostrarFormNuevo,
    crear,
    mostrarFormEditar,
    actualizar,
    toggleBaja,
    toggleDestacado
};