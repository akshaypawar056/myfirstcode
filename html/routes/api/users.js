const express = require('express');
const router = express.Router();
const gravatar = require('gravatar')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');
const Users1 = require('../../models/Users1');


router.post(
    '/',
   [
    check('name', 'Name is required')
     .not()
     .isEmpty(),
    check('email', 'please include a valid email').isEmail(),
    check(
        'password',
        'please enter a password with 6 or more character'
    ).isLength({ min: 6 })
     
],
async(req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;
    try {
        let user = await Users1.findOne({ email });

        if (user) {
           return res.status(400).json({ errors: [{ msg: 'user already exists' }] });
        }

        const avatar = gravatar.url(email, {
            s: '200',
            r: "pg",
            d: "mm"
        })
        user = new Users1({
            name,
            email,
            avatar,
            password
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        
        await user.save();

        const payload = {
            user: {
                id: user.id
            }
        }

        jwt.sign(
            payload, 
            config.get('jwtSecret'),
            
            (err, token) => {
                if(err) throw err;
                res.json({ token });
            });
    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server error');

    }

    }
 );

module.exports = router;