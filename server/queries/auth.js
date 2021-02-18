const bcrypt = require('bcrypt')

const db = require('../db.ts')
const Users = require('./users.js')
const { UserAuthenticationError, MaxIncorrect2FAError } = require('../utils/errors/errors.js')

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
        const match = await bcrypt.compare(password, user.password)
        user.verification_hash = null;
        user.login_attempts = null;
        user.password = null;
        return match ? user : null;
    } catch (err) {
        throw new UserAuthenticationError(err);
    }
}

exports.send2FAEmail = async function (user) {
    let verificationCode = Math.random().toString(36).substring(1, 7);
    const hash = bcrypt.hashSync(verificationCode, 10);

    await Users.addVerificationHash(user.id, hash);

    let emailBody = `Hi ${user.first_name}!\nYour login verification code is ${hash}.\nMany thanks,\nThe Whistle Team`;
    await Email.send(user.email, 'The Whistle Login Verification', emailBody);
}

exports.authenticate2FA = async function (userID, verificationCode) {
    try {
        const results = await db.query(`SELECT * FROM users WHERE id='${userID}'`);
        const user = results.rows[0];
        if (!user) {
            return null;
        }
        user.orgs = await Users.getUserOrgs(user.id);
        const match = await bcrypt.compare(verificationCode, user.verification_hash);
        if (!match) {
            await Users.setAttempts(userID, user.login_attempts + 1);
            if (user.login_attempts > 2) {
                throw new MaxIncorrect2FAError();
            }
            return null;
        } else {
            return true;
        }
    } catch (err) {
        throw new UserAuthenticationError(err);
    }
}