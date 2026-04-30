module.exports = (sequelize, DataTypes) => {
    const Professional = sequelize.define('Professional', {
        id: {
            type: DataTypes.STRING(50),
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        license_number: {
            type: DataTypes.STRING(50),
            unique: true,
            allowNull: true
        },
        profession: DataTypes.STRING(100),
        service_id: {
            type: DataTypes.STRING(50),
            references: { model: 'services', key: 'id' }
        },
        custom_service: DataTypes.STRING(255),
        service_status: {
            type: DataTypes.ENUM('aprobado', 'rechazado', 'pendiente'),
            defaultValue: 'pendiente'
        },
        experience_years: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            validate: { min: 0 }
        },
        certification_url: DataTypes.STRING(500),
        certification_verified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        validation_date: DataTypes.DATE,
        validated_by: DataTypes.STRING(100),
        admin_observation: DataTypes.TEXT,
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: { isEmail: true }
        },
        phone: DataTypes.STRING(50),
        availability: {
            type: DataTypes.JSON,
            allowNull: true
        },
        rating_value: {
            type: DataTypes.DECIMAL(2, 1),
            defaultValue: 0,
            validate: { min: 0, max: 5 }
        },
        rating_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            validate: { min: 0 }
        },
        jobs_completed: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            validate: { min: 0 }
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        created_at: DataTypes.DATE,
        updated_at: DataTypes.DATE
    }, {
        tableName: 'professionals',
        timestamps: true,
        underscored: true
    });

    Professional.associate = (models) => {
        Professional.belongsTo(models.Service, {
            foreignKey: 'service_id',
            as: 'service'
        });
        Professional.hasMany(models.BookingItem, {
            foreignKey: 'professional_id',
            as: 'bookingItems'
        });
        Professional.hasMany(models.ServiceRequest, {
            foreignKey: 'professional_id',
            as: 'serviceRequests'
        });
    };

    return Professional;
};