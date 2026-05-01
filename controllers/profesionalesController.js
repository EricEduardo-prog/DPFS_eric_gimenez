'use strict';

const { Professional, Service } = require('../database/models');
const { validationResult } = require('express-validator');

async function _getServiciosActivos() {
    return await Service.findAll({ where: { is_active: true }, order: [['name', 'ASC']] });
}

async function _getServicioNombre(professional, servicios) {
    if (professional.service_id) {
        const service = servicios.find(s => s.id === professional.service_id);
        return service ? service.name : 'Servicio no encontrado';
    } else if (professional.custom_service) {
        return `${professional.custom_service} (pendiente)`;
    }
    return 'No especificado';
}

async function _optsForm(titulo, profesional, errores, formData = null) {
    const servicios = await _getServiciosActivos();
    return {
        title: `${titulo} — E-E Admin`,
        pageCss: 'admin_form',
        currentPage: 'admin',
        body: 'pages/admin/professionals/form',
        profesional: profesional ?? null,
        servicios,
        errores: errores ?? [],
        formData,
    };
}

// GET /admin/profesionales
async function listar(req, res, next) {
    try {
        const where = {};
        if (req.query.soloActivos === 'true') where.is_active = true;
        if (req.query.servicioId) where.service_id = req.query.servicioId;

        const profesionales = await Professional.findAll({
            where,
            include: [{ model: Service, as: 'service', attributes: ['name'] }],
            order: [['created_at', 'DESC']]
        });
        const servicios = await _getServiciosActivos();

        const profesionalesConServicio = profesionales.map(prof => ({
            ...prof.toJSON(),
            servicioNombre: prof.service ? prof.service.name : (prof.custom_service ? `${prof.custom_service} (pendiente)` : 'No especificado')
        }));

        res.render('layout', {
            title: 'Profesionales — E-E Admin',
            pageCss: 'admin_list',
            currentPage: 'admin',
            body: 'pages/admin/professionals/list',
            profesionales: profesionalesConServicio,
            servicios,
            filtros: { servicioId: req.query.servicioId || '', soloActivos: req.query.soloActivos || '' },
            mensaje: req.query.mensaje || null,
            error: req.query.error || null,
        });
    } catch (err) {
        next(err);
    }
}

async function mostrarFormNuevo(req, res, next) {
    try {
        const opts = await _optsForm('Nuevo Profesional', null, []);
        res.render('layout', opts);
    } catch (err) {
        next(err);
    }
}

async function mostrarFormEditar(req, res, next) {
    try {
        const profesional = await Professional.findByPk(req.params.id, {
            include: [{ model: Service, as: 'service' }]
        });
        if (!profesional) return res.redirect('/admin/profesionales?error=Profesional no encontrado.');
        const opts = await _optsForm(`Editar ${profesional.name}`, profesional, []);
        res.render('layout', opts);
    } catch (err) {
        next(err);
    }
}

async function toggleBaja(req, res, next) {
    try {
        const profesional = await Professional.findByPk(req.params.id);
        if (!profesional) throw new Error('Profesional no encontrado');
        const newActive = !profesional.is_active;
        await profesional.update({ is_active: newActive });
        const estado = newActive ? 'dado de alta' : 'dado de baja';
        res.redirect(`/admin/profesionales?mensaje=Profesional ${estado} correctamente.`);
    } catch (err) {
        res.redirect(`/admin/profesionales?error=${encodeURIComponent(err.message)}`);
    }
}

module.exports = {
    listar,
    mostrarFormNuevo,
    mostrarFormEditar,
    toggleBaja
};