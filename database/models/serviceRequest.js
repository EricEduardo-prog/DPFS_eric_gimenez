module.exports = (sequelize, DataTypes) => {
    const ServiceRequest = sequelize.define('ServiceRequest', {
        id: {
            type: DataTypes.STRING(50),
            primaryKey: true
        },
        professional_id: {
            type: DataTypes.STRING(50),
            allowNull: true,
            references: { model: 'professionals', key: 'id' }
        },
        requested_service: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        description: DataTypes.TEXT,
        status: {
            type: DataTypes.ENUM('pendiente', 'aprobado', 'rechazado'),
            defaultValue: 'pendiente'
        },
        request_date: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        response_date: DataTypes.DATE,
        response_admin: DataTypes.STRING(100)
    }, {
        tableName: 'service_requests',
        timestamps: false,
        underscored: true
    });

    ServiceRequest.associate = (models) => {
        ServiceRequest.belongsTo(models.Professional, {
            foreignKey: 'professional_id',
            as: 'professional'
        });
    };

    return ServiceRequest;
};