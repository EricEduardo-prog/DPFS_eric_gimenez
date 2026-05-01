module.exports = (sequelize, DataTypes) => {
    const BookingItem = sequelize.define('BookingItem', {
        id: {
            type: DataTypes.STRING(50),
            primaryKey: true
        },
        booking_id: {
            type: DataTypes.STRING(50),
            allowNull: false,
            references: { model: 'bookings', key: 'id' }
        },
        type: {
            type: DataTypes.ENUM('product', 'service', 'combo'),
            allowNull: false
        },
        product_id: {
            type: DataTypes.STRING(50),
            allowNull: true,
            references: { model: 'products', key: 'id' }
        },
        service_id: {
            type: DataTypes.STRING(50),
            allowNull: true,
            references: { model: 'services', key: 'id' }
        },
        quantity: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
            validate: { min: 1 }
        },
        unit_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: { min: 0 }
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            comment: 'Snapshot del nombre del producto/servicio'
        },
        professional_id: {
            type: DataTypes.STRING(50),
            allowNull: true,
            references: { model: 'professionals', key: 'id' }
        },
        installation_date: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        installation_time: {
            type: DataTypes.ENUM('manana', 'tarde'),
            allowNull: true
        }
    }, {
        tableName: 'booking_items',
        timestamps: true,
        underscored: true,
        validate: {
            // Validación custom para asegurar que el tipo coincida con las referencias
            validTypeAndRefs() {
                if (this.type === 'product' && (!this.product_id || this.service_id)) {
                    throw new Error('Para tipo "product" debe especificar product_id y service_id nulo');
                }
                if (this.type === 'service' && (!this.service_id || this.product_id)) {
                    throw new Error('Para tipo "service" debe especificar service_id y product_id nulo');
                }
                if (this.type === 'combo' && (!this.product_id || !this.service_id)) {
                    throw new Error('Para tipo "combo" debe especificar product_id y service_id');
                }
            }
        }
    });

    BookingItem.associate = (models) => {
        BookingItem.belongsTo(models.Booking, {
            foreignKey: 'booking_id',
            as: 'booking'
        });
        BookingItem.belongsTo(models.Product, {
            foreignKey: 'product_id',
            as: 'product'
        });
        BookingItem.belongsTo(models.Service, {
            foreignKey: 'service_id',
            as: 'service'
        });
        BookingItem.belongsTo(models.Professional, {
            foreignKey: 'professional_id',
            as: 'professional'
        });
    };

    return BookingItem;
};