module.exports = (sequelize, DataTypes) => {
    const Product = sequelize.define('Product', {
        id: {
            type: DataTypes.STRING(50),
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        sku: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true
        },
        category_id: {
            type: DataTypes.STRING(50),
            allowNull: false,
            references: { model: 'categories', key: 'id' }
        },
        description: DataTypes.TEXT,
        characteristics: {
            type: DataTypes.JSON,
            defaultValue: []
        },
        image: DataTypes.STRING(500),
        images: {
            type: DataTypes.JSON,
            defaultValue: []
        },
        colors: {
            type: DataTypes.JSON,
            defaultValue: []
        },
        sizes: {
            type: DataTypes.JSON,
            defaultValue: []
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: { min: 0 }
        },
        original_price: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0,
            validate: { min: 0 }
        },
        installation_available: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        installation_service_id: {
            type: DataTypes.STRING(50),
            allowNull: true,
            references: { model: 'services', key: 'id' }
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
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        created_at: DataTypes.DATE,
        updated_at: DataTypes.DATE
    }, {
        tableName: 'products',
        timestamps: true,
        underscored: true
    });

    Product.associate = (models) => {
        Product.belongsTo(models.Category, {
            foreignKey: 'category_id',
            as: 'category'
        });
        Product.belongsTo(models.Service, {
            foreignKey: 'installation_service_id',
            as: 'installationService'
        });
        Product.hasMany(models.BookingItem, {
            foreignKey: 'product_id',
            as: 'bookingItems'
        });
    };

    return Product;
};