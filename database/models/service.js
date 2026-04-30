module.exports = (sequelize, DataTypes) => {
    const Service = sequelize.define('Service', {
        id: {
            type: DataTypes.STRING(50),
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        slug: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        experience_levels: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: []
        },
        certification_required: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        is_featured: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        base_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            validate: { min: 0 }
        },
        hourly_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            validate: { min: 0 }
        },
        created_at: DataTypes.DATE,
        updated_at: DataTypes.DATE
    }, {
        tableName: 'services',
        timestamps: true,
        underscored: true
    });

    Service.associate = (models) => {
        Service.hasMany(models.Professional, {
            foreignKey: 'service_id',
            as: 'professionals'
        });
        Service.hasMany(models.Product, {
            foreignKey: 'installation_service_id',
            as: 'productsWithInstallation'
        });
        Service.hasMany(models.BookingItem, {
            foreignKey: 'service_id',
            as: 'bookingItems'
        });
    };

    return Service;
};