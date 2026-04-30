module.exports = (sequelize, DataTypes) => {
    const Booking = sequelize.define('Booking', {
        id: {
            type: DataTypes.STRING(50),
            primaryKey: true
        },
        user_id: {
            type: DataTypes.STRING(50),
            references: { model: 'users', key: 'id' },
            allowNull: true
        },
        session_id: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        created_at: DataTypes.DATE,
        updated_at: DataTypes.DATE
    }, {
        tableName: 'bookings',
        timestamps: true,
        underscored: true
    });

    Booking.associate = (models) => {
        Booking.belongsTo(models.User, {
            foreignKey: 'user_id',
            as: 'user'
        });
        Booking.hasMany(models.BookingItem, {
            foreignKey: 'booking_id',
            as: 'items',
            onDelete: 'CASCADE'
        });
    };

    return Booking;
};