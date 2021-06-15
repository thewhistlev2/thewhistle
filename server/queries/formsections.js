const db = require('../db.ts');
const Typeform = require('../interfaces/typeform.js')
const { DBSelectionError, DBInsertionError, DBUpdateError } = require('../utils/errors/errors.js');


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

exports.getSectionsFromSlug = async function (slug) {
    let query = `SELECT formsections.id, type, json, test_json FROM formsections JOIN forms ON forms.id=form WHERE forms.slug='${slug}'`;
    try {
        results = await db.query(query);
        return results.rows;
    } catch (err) {
        throw new DBSelectionError('formsections', query, err);
    }
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

    return results.rows[0];
}

exports.insertSection = async function (formID, type, json, testJSON, allReports, header, footer) {
    const query = 'INSERT INTO formsections (form, type, json, test_json, all_reports, header, footer) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id';
    const values = [formID, type, JSON.stringify(json), JSON.stringify(testJSON), allReports, header, footer];
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

exports.getCompletedSectionFromSlug = async function (slug) {
    let query = `SELECT formsections.id AS id FROM formsections JOIN forms ON formsections.form = forms.id WHERE forms.slug='${slug}' AND type='Completed'`;
    let results = {};

    try {
        results = await db.query(query);
    } catch (err) {
        throw new DBSelectionError('formsections', query, err);
    }

    return results.rows[0].id
}

exports.updateJSON = async function (sectionID, json) {
    let query = `UPDATE formsections SET json='${JSON.stringify(json)}' WHERE id='${sectionID}'`;
    try {
        await db.query(query);
    } catch (err) {
        throw new DBUpdateError('formsections', query, err);
    }
}

exports.updateHeader = async function (sectionID, header) {
    let query = `UPDATE formsections SET header=$1 WHERE id=$2`;
    let values = [header, sectionID];
    try {
        await db.query(query, values);
    } catch (err) {
        throw new DBUpdateError('formsections', query, err);
    }
}

exports.updateFooter = async function (sectionID, footer) {
    let query = `UPDATE formsections SET footer=$1 WHERE id=$2`;
    let values = [footer, sectionID];
    try {
        await db.query(query, values);
    } catch (err) {
        throw new DBUpdateError('formsections', query, err);
    }
}
