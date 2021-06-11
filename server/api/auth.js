const Auth = require('../queries/auth');
const User = require('../queries/users');
const bcrypt = require('bcrypt');
const express = require('express');
//TODO: Change requires to imports everywhere
const jwt = require('jsonwebtoken');
const router = express.Router()


async function checkToken(token) {
    try {
        const payload = await jwt.verify(token, process.env.JWT_SECRET_KEY);
        return payload.user;
    } catch {
        return false;
    }
    
}

router.post('/login', sendVerificationEmail);

router.post('/resend-code', sendVerificationEmail);

router.post('/verification-code', authenticateVerificationCode);

router.get('/validate-password-token/:token', validatePasswordToken);

router.patch('/set-password', setPassword);

router.post('/logout', (req, res, next) => {
    try {
        res.clearCookie('authtoken');
        res.clearCookie('user');
        res.redirect('/');
    } catch (err) {
        res.redirect('/');
        next(err);
    }
})

router.get('/user', async (req, res, next) => {
    try {
        const tokenCookie = req.cookies['auth._token.local'];
        let validToken = tokenCookie.startsWith('Bearer ');
        if (!validToken) {
            return false;
        }
        const token = tokenCookie.substr(7);
        const validatedUser = await checkToken(token);
        if (validatedUser) {
            validatedUser.token = token;
            res.status(200).json({user: validatedUser})
        } else {
            res.status(401).json({ msg: "Unauthorised"})
        }
    } catch (err) {
        res.status(401).json({ msg: "Not authorised"})
        next(err)
    }
})

async function sendVerificationEmail(req, res, next) {
    try {
        const user = await Auth.authenticateUser(req.body.email, req.body.password);
        if (!user) {
            res.status(401)
            res.send('Incorrect email/password')
            return;
        }

        await Auth.send2FAEmail(user);

        res.status(200);
        res.send('Correct email/password combination.');
    } catch (err) {
        res.status(401);
        res.send('Could not authorise you, please try again.');
        next(err);
    }
}
async function authenticateVerificationCode(req, res, next) {
    try {
        const user = await Auth.authenticateUser(req.body.email, req.body.password);
        if (!user) {
            //TODO: Make max attempts (+ captcha?)
            res.status(401);
            return;
        }
        let verified = await Auth.authenticate2FA(user.id, req.body.verificationCode);
        if (verified) {
            //Logout after 1 week
            const token = await jwt.sign({ user: user }, process.env.JWT_SECRET_KEY, { expiresIn: "7d" });
            //Store token here
            //TODO: Cookie expiration
            //TODO: Sign cookies
            const week = 7 * 24 * 60 * 60 * 1000;
            res.cookie('authtoken', token, { maxAge: week });
            res.cookie('user', JSON.stringify(user), { maxAge: week });
            res.status(200);
            res.json(user);
        } else {
            res.status(401);
            res.send('Incorrect verification code');
            return;
        }
    } catch (err) {
        if (err.name == 'MaxIncorrect2FAError') {
            res.status(401);
            res.send('Too many attempts');
        } else {
            res.status(401);
            res.send('Could not authorise you, please try again.');
            next(err);
        }
    }
}

async function validatePasswordToken(req, res, next) {
    try {
        let token = req.params.token;
        let passwordToken = token.slice(-96);
        let userID = token.slice(0, -96);
        let validToken = await Auth.validatePasswordToken(userID, passwordToken);
        res.status(200);
        res.json({ validToken: validToken });
    } catch (err) {
        res.status(401);
        res.send('Could not validate password token.');
        next(err);
    }
}

async function setPassword(req, res, next) {
    try {
        let token = req.body.token;
        let passwordToken = token.slice(-96);
        let userID = token.slice(0, -96);
        let validToken = await Auth.validatePasswordToken(userID, passwordToken);
        if (validToken) {
            let password = req.body.password;
            await Auth.deletePasswordToken(userID);
            await User.setPassword(userID, password);
            res.status(200);
            res.send();
        } else {
            res.status(401)
            res.send('Could not set password.')
        }
        
        res.json({ validToken: validToken });
    } catch (err) {
        res.status(401);
        res.send('Could not validate password token.');
        next(err);
    }
}

module.exports = router
