const db = require('../db.ts')
const Email = require('../utils/email.js')

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { DBSelectionError, DBInsertionError, DBUpdateError } = require('../utils/errors/errors');
const { set } = require('core-js/fn/reflect');

// TODO - combine the users.js API functions with this file

async function hashString(str) {
    let salt = await bcrypt.genSalt();
    let hash = await bcrypt.hash(str, salt);
    return hash;
}

async function generatePasswordToken(userID, expirationTime) {
    const token = crypto.randomBytes(64).toString('hex');
    const tokenHash = await hashString(token);
    const expirationDate = new Date(Date.now() + expirationTime);
    const query = `INSERT INTO passwordtokens(user_id, token_hash, expiration, used) VALUES($1, $2, $3, false)`;
    const values = [userID, tokenHash, expirationDate];
    try {
        await db.query(query, values);
        return token;
    } catch (err) {
        throw new DBInsertionError('passwordtokens', query, values, err);
    }
}

exports.getUserOrgs = async function (userID) {
    let query = `SELECT organisations.id, organisations.name, organisations.active, organisations.slug, userorgs.role FROM organisations JOIN userorgs ON organisations.id=userorgs.organisation WHERE userorgs.user=${userID}`;
    try {
        const results = await db.query(query)
        return results.rows;
    } catch (err) {
        throw new DBSelectionError('organisations', query, err);
    }
}

exports.getUsers = async function (userID) {
    const userOrgs = await this.getUserOrgs(userID);
    let userOrgIDs = userOrgs.map(el => el.id);
    let userOrgString = `(${userOrgIDs.join(',')})`;
    let query = `select users.id, first_name, surname, email, organisations.id as org_id, organisations."name" as org_name, userorgs."role" as user_role from users join userorgs on userorgs."user" = users.id join organisations on organisations.id = userorgs.organisation where organisations.id in ${userOrgString}`;
    let results = {};
    try {
        results = await db.query(query);
    } catch (err) {
        throw new DBSelectionError('users', query, err);
    }
    let rows = results.rows;
    let usersObj = {}
    for (let i = 0; i < rows.length; i++) {
        if (usersObj.hasOwnProperty(rows[i].id)) {
            usersObj[rows[i].id].orgs.push({
                id: rows[i].org_id,
                name: rows[i].org_name,
                role: rows[i].user_role
            });
            usersObj[rows[i].id].canEdit = usersObj[rows[i].id].canEdit || userOrgIDs.includes(rows[i].id);
        } else {
            usersObj[rows[i].id] = {
                id: rows[i].id,
                firstName: rows[i].first_name,
                surname: rows[i].surname,
                email: rows[i].email,
                orgs: [{
                    id: rows[i].org_id,
                    name: rows[i].org_name,
                    role: rows[i].user_role
                }],
                canEdit: userOrgIDs.includes(rows[i].id)
            };
        }
    }

    return Object.values(usersObj);
}

//TODO: Remove this?
exports.getAllUsers = function (res) {
    db.query(`SELECT * FROM users`, (error, results) => {
        res.json(results.rows)
    })
}

exports.getOrgUsers = async function (orgID) {
    const query = `SELECT * FROM users where organisation=${orgID}`;
    try {
        let results = await db.query(query);
        return results.rows;
    } catch (err) {
        throw new DBSelectionError('users', query, err);
    }
}

exports.getUser = async function (userID) {
    const query = `SELECT * FROM users WHERE id='${userID}'`;
    try {
        const user = await db.query(query);
        return user.rows[0];
    } catch (err) {
        throw new DBSelectionError('users', query, err);
    }
}

exports.hash = hashString;

exports.createUser = async function (user) {

    let query = `INSERT INTO users(first_name, surname, email) VALUES($1, $2, $3) RETURNING id`;
    let values = [user.firstName, user.surname, user.email];
    let results = {};
    try {
        results = await db.query(query, values);
    } catch (err) {
        throw new DBInsertionError('users', query, values, err);
    }
    user.id = results.rows[0].id;

    for (let i = 0; i < user.orgs.length; i++) {
        query = `INSERT INTO userorgs("user", organisation, "role") VALUES($1, $2, $3)`;
        values = [user.id, user.orgs[i].id, user.orgs[i].role];
        try {
            await db.query(query, values);
        } catch (err) {
            throw new DBInsertionError('userorgs', query, values, err);
        }
    }

    let passwordToken = await generatePasswordToken(user.id, 1000*60*60*24*7);
    let setPasswordURL = `${process.env.BASE_URL}auth/set-password/${passwordToken}`;
    let subject = `Welcome to The Whistle ${user.firstName}`;
    let body = `Hi ${user.firstName} ${user.surname},\n\nSomeone has created an account for you on The Whistle platform. Please use this link to finish setting up your account: ${setPasswordURL}.\n\nThis link will expire in 7 days.\n\nMany thanks,\nThe Whistle Team`;
    await Email.send(user.email, subject, body);
}

exports.addVerificationCode = async function (userID, verificationCode) {
    let query = `UPDATE users SET verification_code='${verificationCode}', login_attempts=0 WHERE id='${userID}'`;
    try {
        await db.query(query);
    } catch (err) {
        throw new DBUpdateError('users', query, err);
    }
}

exports.setAttempts = async function (userID, attempts) {
    let setVerificationCode = attempts > 3 ? `, verification_code=''` : '';
    let query = `UPDATE users SET login_attempts=${attempts}${setVerificationCode} WHERE id='${userID}'`;
    try {
        await db.query(query);
    } catch (err) {
        throw new DBUpdateError('users', query, err);
    }
}