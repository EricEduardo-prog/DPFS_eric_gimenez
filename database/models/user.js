module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.STRING(50),
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            validate: { isEmail: true }
        },
        password_hash: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        phone: DataTypes.STRING(50),
        address: {
            type: DataTypes.JSON,
            allowNull: true
        },
        terms_accepted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        registered_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updated_at: DataTypes.DATE
    }, {
        tableName: 'users',
        timestamps: true,
        createdAt: 'registered_at',
        updatedAt: 'updated_at',
        underscored: true
    });

    User.associate = (models) => {
        User.hasMany(models.Booking, {
            foreignKey: 'user_id',
            as: 'bookings'
        });
    };

    return User;
};