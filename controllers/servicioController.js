'use strict';

const { Service } = require('../database/models');
const { validationResult } = require('express-validator');

// Helpers
function _validar(body, isEdit = false) {
    const errores = [];
    if (!body.name?.trim()) errores.push('El nombre es obligatorio.');
    else if (body.name.length > 100) errores.push('El nombre no puede superar 100 caracteres.');
    if (body.description?.length > 500) errores.push('La descripción no puede superar 500 caracteres.');
    return errores;
}

function _optsForm(title, service, errors, formData = null) {
    return {
        title: `${title} — E-E Admin`,
        pageCss: 'admin_form',
        currentPage: 'admin',
        body: 'pages/admin/service/form',
        servicio: service ?? null,
        errores: errors ?? [],
        formData
    };
}

// GET /admin/servicios
async function listar(req, res, next) {
    try {
        const where = {};
        if (req.query.soloActivos === 'true') where.is_active = true;
        if (req.query.destacados === 'true') where.is_featured = true;

        const servicios = await Service.findAll({
            where,
            order: [['name', 'ASC']]
        });
        res.render('layout', {
            title: 'Servicios — E-E Admin',
            pageCss: 'admin_list',
            currentPage: 'admin',
            body: 'pages/admin/service/list',
            servicios,
            filtros: { soloActivos: req.query.soloActivos || '', destacados: req.query.destacados || '' },
            mensaje: req.query.mensaje || null,
            error: req.query.error || null
        });
    } catch (err) {
        next(err);
    }
}

function mostrarFormNuevo(req, res) {
    res.render('layout', _optsForm('Nuevo Servicio', null, []));
}

async function crear(req, res, next) {
    const errors = _validar(req.body);
    if (errors.length) {
        return res.render('layout', _optsForm('Nuevo Servicio', null, errors, req.body));
    }
    try {
        const newService = await Service.create({
            id: `serv_${Date.now()}`,
            name: req.body.name,
            slug: req.body.slug || req.body.name.toLowerCase().replace(/\s+/g, '-'),
            description: req.body.description,
            experience_levels: req.body.experience_levels || [],
            certification_required: req.body.certification_required === 'true',
            is_featured: req.body.is_featured === 'true',
            is_active: req.body.is_active === 'true',
            base_price: req.body.base_price ? parseFloat(req.body.base_price) : null,
            hourly_price: req.body.hourly_price ? parseFloat(req.body.hourly_price) : null
        });
        res.redirect('/admin/servicios?mensaje=Servicio creado correctamente.');
    } catch (err) {
        res.render('layout', _optsForm('Nuevo Servicio', null, [err.message], req.body));
    }
}

async function mostrarFormEditar(req, res, next) {
    try {
        const servicio = await Service.findByPk(req.params.id);
        if (!servicio) return res.redirect('/admin/servicios?error=Servicio no encontrado.');
        res.render('layout', _optsForm(`Editar ${servicio.name}`, servicio, []));
    } catch (err) {
        next(err);
    }
}

async function actualizar(req, res, next) {
    const service = await Service.findByPk(req.params.id);
    if (!service) return res.redirect('/admin/servicios?error=Servicio no encontrado.');

    const errors = _validar(req.body, true);
    if (errors.length) {
        return res.render('layout', _optsForm('Editar Servicio', service, errors, req.body));
    }
    try {
        await service.update({
            name: req.body.name,
            slug: req.body.slug,
            description: req.body.description,
            experience_levels: req.body.experience_levels,
            certification_required: req.body.certification_required === 'true',
            is_featured: req.body.is_featured === 'true',
            is_active: req.body.is_active === 'true',
            base_price: req.body.base_price ? parseFloat(req.body.base_price) : null,
            hourly_price: req.body.hourly_price ? parseFloat(req.body.hourly_price) : null
        });
        res.redirect('/admin/servicios?mensaje=Servicio actualizado correctamente.');
    } catch (err) {
        res.render('layout', _optsForm('Editar Servicio', service, [err.message], req.body));
    }
}

async function toggleBaja(req, res, next) {
    try {
        const service = await Service.findByPk(req.params.id);
        if (!service) throw new Error('Servicio no encontrado');
        const newActive = !service.is_active;
        await service.update({ is_active: newActive });
        const estado = newActive ? 'activado' : 'desactivado';
        res.redirect(`/admin/servicios?mensaje=Servicio ${estado} correctamente.`);
    } catch (err) {
        res.redirect(`/admin/servicios?error=${encodeURIComponent(err.message)}`);
    }
}

async function toggleDestacado(req, res, next) {
    try {
        const service = await Service.findByPk(req.params.id);
        if (!service) throw new Error('Servicio no encontrado');
        const newFeatured = !service.is_featured;
        await service.update({ is_featured: newFeatured });
        const estado = newFeatured ? 'destacado' : 'no destacado';
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