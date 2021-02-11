const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../../middleware/auth');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator/check');

const User = require('../../models/User');

router.get('/', auth, async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('-password');
      res.json(user);
    } catch(err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
});

router.post('/', [
    check('email', 'Please include valid email ID').isEmail(),
    check('password','Password required').exists()
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    console.log(req.body);

    const { email, password }  = req.body;

    try {
        let user = await User.findOne({ email });
        if(!user) {
            return res.status(400).json({ errors: [{ msg: 'Invalid credentials'}] });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) {
            return res.status(400).json({ errors: [{ msg: 'Invalid Credentials'}] });
        }

        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(payload, 
            config.get('jwtSecret'),
            { expires: 360000 },
            (err, token) => {
                if(err) throw err;
                res.json({ token });
            }
            );
    } catch(err) {
        console.log(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;