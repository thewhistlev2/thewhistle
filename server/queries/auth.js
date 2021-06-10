const bcrypt = require('bcrypt')

const db = require('../db.ts')
const Users = require('./users.js')
const { UserAuthenticationError, MaxIncorrect2FAError, DBSelectionError } = require('../utils/errors/errors.js')
const Email = require('../utils/email.js')
const { flattenDiagnosticMessageText } = require('typescript')

exports.serializeUser = function (user, done) {
    return done(null, user.id)
}

//TODO: Redo this function and send new user email etc.
exports.createNewUser = function (email, password, firstName, surname, organisations) {
    bcrypt.genSalt(10, (err, salt) => {
        if (err) return next(err)
        bcrypt.hash(password, salt, (err, hash) => {
            if (err) return err
            const query = 'INSERT INTO users(email, password, first_name, surname) VALUES($1, $2, $3, $4) RETURNING id'
            const values = [email, hash, firstName, surname];

            db.query(query, values, (error, results) => {
                if (error) {
                    //TODO: Handle errors properly
                } else {
                    const userID = results.rows[0].id;
                    addUserOrgs(userID, organisations);
                }
            })
        })
    })
}

//TODO: Refactor this code
function addUserOrgs(userID, organisations) {
    const query = 'INSERT INTO userorgs(user, organisation) VALUES($1, $2)';
    for (let i = 0; i < organisations.length; i++) {
        let values = [userID, organisations[i]];
        db.query(query, values, (error, results) => {
            if (error) {
                //TODO: Handle errors properly
            }
        })
    }
}

function generateVerificationCode() {
    let chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let length = 6;
    let verificationCode = '';
    for (var i = length; i > 0; --i) {
        verificationCode += chars[Math.floor(Math.random() * chars.length)]
    }
    return verificationCode
}

exports.updatePassword = function (id, currentPassword, newPassword) {
    db.query(`SELECT * FROM users WHERE id='${id}'`, (error, results) => {
        if (error) {
            done(error)
        }
        var user = results.rows[0]
        bcrypt.compare(currentPassword, user.password, (err, isMatch) => {
            if (err) return next(err)
            saveNewPassword(id, newPassword)
        })
    })
}

function saveNewPassword(id, newPassword) {
    bcrypt.genSalt(10, (err, salt) => {
        if (err) return next(err)
        bcrypt.hash(newPassword, salt, (err, hash) => {
            if (err) return err
            db.query(`UPDATE users SET password='${hash}' WHERE id='${id}'`, (error, results) => {
                if (error) {
                    throw error;
                }
            })
        })
    })
}

exports.deserializeUser = function (id, done) {
    db.query(`SELECT * FROM users JOIN organisations ON organisations.id = users.organisation WHERE users.id='${id}'`, (error, results) => {
        if (error) {
            done(error)
        }
        var user = results.rows[0]
        return done(error, user)
    })
}

/* function (username, password, done) {
    User.findOne({
        username: username
    }, function (err, user) {
        if (err) {
            return done(err);
        }
        if (!user) {
            return done(null, false);
        }
        if (!user.verifyPassword(password)) {
            return done(null, false);
        }
        return done(null, user);
    });
} */



exports.authenticateUser = async function (email, password) {
    try {
        const results = await db.query(`SELECT * FROM users WHERE email='${email.toLowerCase()}'`);
        const user = results.rows[0];
        if (!user) {
            return null;
        }
        const match = await bcrypt.compare(password, user.password);
        user.orgs = await Users.getUserOrgs(user.id);
        user.verification_code = null;
        user.login_attempts = null;
        user.password = null;
        return match ? user : null;
    } catch (err) {
        throw new UserAuthenticationError(err);
    }
}

exports.send2FAEmail = async function (user) {
    let verificationCode = generateVerificationCode()

    await Users.addVerificationCode(user.id, verificationCode);

    let emailBody = `Hi ${user.first_name}!\nYour login verification code is ${verificationCode}.\nMany thanks,\nThe Whistle Team`;
    await Email.send(user.email, 'The Whistle Login Verification', emailBody);
}

exports.authenticate2FA = async function (userID, testVerificationCode) {
    try {
        const results = await db.query(`SELECT * FROM users WHERE id='${userID}'`);
        const user = results.rows[0];
        if (!user) {
            return false;
        }
        if (user.verification_code.length == 6 && testVerificationCode == user.verification_code) {
            return true;
        } else {
            await Users.setAttempts(userID, user.login_attempts + 1);
            if (user.login_attempts > 2) {
                throw new MaxIncorrect2FAError();
            }
            return false;
        }
    } catch (err) {
        if (err.name == 'MaxIncorrect2FAError') {
            throw err;
        }
        throw new UserAuthenticationError(err);
    }
}

exports.validatePasswordToken = async function (userID, passwordToken) {
    const query = 'SELECT * FROM passwordtokens WHERE user_id=$1';
    let token = {};
    try {
        const results = await db.query(query, [ userID ]);
        token = results.rows[0];
    } catch (err) {
        throw new DBSelectionError('passwordtokens', query, err);
    }
    if (!token) {
        return false;
    }
    const match = await bcrypt.compare(passwordToken, token.token_hash);
    if (match) {
        let expirationDate = new Date(token.expiration);
        return Date.now() < expirationDate.getTime();
    } else {
        return false;
    }
}