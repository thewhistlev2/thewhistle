const db = require('../db.ts');
const Typeform = require('../interfaces/typeform.js')
const { DBSelectionError, DBInsertionError } = require('../utils/errors/errors.js');


exports.getForAllReports = async function (sectionID) {
    let query = `SELECT all_reports FROM formsections WHERE id='${sectionID}'`;
    let results = {};

    try {
        results = await db.query(query);
    } catch (err) {
        throw new DBSelectionError('formsections', query, err);
    }

    return results.rows[0].all_reports;
}

exports.getSection = async function (sectionID, test) {
    let jsonField = test ? 'test_json' : 'json';
    let query = `SELECT id, type, ${jsonField} AS json FROM formsections WHERE id='${sectionID}'`;
    let results = {};

    try {
        results = await db.query(query);
    } catch (err) {
        throw new DBSelectionError('formsections', query, err);
    }

    return results.rows;
}

exports.insertSection = async function (formID, type, json, testJSON, allReports) {
    const query = 'INSERT INTO formsections (form, type, json, test_json, all_reports) VALUES ($1, $2, $3, $4, $5) RETURNING id';
    const values = [formID, type, JSON.stringify(json), JSON.stringify(testJSON), allReports];
    let results = {};
    try {
        results = await db.query(query, values);
    } catch (err) {
        throw new DBInsertionError('formsections', query, values, err);
    }
    const sectionID = results.rows[0].id;
    
    if (type == 'Questions') {
        try {
            await Typeform.createWebhook(json.id, sectionID, false);
            await Typeform.createWebhook(testJSON.id, sectionID, true);
        } catch (err) {
            //TODO: Remove unnecessary try/catch?
            throw err;
        }
    }

    return results.rows[0].id;
}