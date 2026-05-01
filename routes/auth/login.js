// routes/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../../database/models');
const bcrypt = require('bcrypt');

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    if (user.email !== 'admin@ee.com') { // o verificar rol en la base
        return res.status(403).json({ error: 'No autorizado' });
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, role: 'admin' });
});