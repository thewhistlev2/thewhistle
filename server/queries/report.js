const db = require('../db.ts');
const { InvalidReporterError, DBInsertionError, DBSelectionError, DBUpdateError } = require('../utils/errors/errors.js');
const users = require('./users.js');
const session = require('./session.js');
const Forms = require('./forms');

async function getFormFromSection(sectionID) {
    //TODO: Remove if not needed
    const results = await db.query(`SELECT form FROM formsections where id=${sectionID}`)
    const formID = results.rows[0].form;
    return formID;
}

async function insertReport(formID, test) {
    const query = `INSERT INTO reports(form, active, test, date) VALUES($1, $2, $3, to_timestamp(${Date.now()} / 1000.0)) RETURNING id`;
    const values = [formID, true, test];
    try {
        const results = await db.query(query, values);
        const reportID = results.rows[0].id;
        return reportID;
    } catch (err) {
        throw new DBInsertionError('reports', query, values, err);
    }
}

function getValueFromAnswer(answer) {
    switch (answer.type) {
        case 'short_text':
        case 'long_text':
            return answer.text;
        case 'choices':
            return answer.choices.labels.join();
        case 'choice':
            return answer.choice.label;
        default:
            return answer[answer.type];
    }
}

function getDefinitionFromID(definitions, fieldID) {
    for (let i = 0; i < definitions.length; i++) {
        if (definitions[i].id == fieldID) {
            return definitions[i];
        }
    }
    //TODO: Handle errors
    return {};
}

exports.insertQuestionResponse = async function (reportID, sectionID, ref, definition, value) {
    const query = 'INSERT INTO questionresponses(report, section, question_ref, definition, value) VALUES($1, $2, $3, $4, $5)';
    const values = [reportID, sectionID, ref, JSON.stringify(definition), JSON.stringify(value)];
    try {
        await db.query(query, values);
    } catch (err) {
        throw new DBInsertionError('questionresponses', query, values, err);
    }
}

exports.startReport = async function (formID, test) {
    try {
        let reportID = await insertReport(formID, test);
        return reportID;
    } catch (err) {
        //Unnecessary try/catch?
        throw err;
    }
}

exports.submitTypeformSection = async function (sectionID, payload) {
    try {
        let hiddenFields = payload.form_response.hidden;
        let sessionID = hiddenFields.session;
        let reports = await session.getReportsToUpdate(sectionID, sessionID);
        const definitions = payload.form_response.definition.fields;
        const answers = payload.form_response.answers;
        let promises = [];
        let value = {};
        let ref = '';
        let definition = {};
        for (let i = 0; i < answers.length; i++) {
            value = getValueFromAnswer(answers[i]);
            definition = getDefinitionFromID(definitions, answers[i].field.id);
            ref = definition.ref;
            for (let j = 0; j < reports.length; j++) {
                promises.push(this.insertQuestionResponse(reports[j], sectionID, ref, definition, value));
            }
        }
        Promise.all(promises);
    } catch (err) {
        //Unnecessary try/catch?
        throw err;
    }
}

async function getForm(reportID) {
    let query = `SELECT slug, forms.id AS form_id, reports.test AS test FROM forms JOIN reports ON reports.form=forms.id WHERE reports.id=${parseInt(reportID)}`;
    try {
        const slugs = await db.query(query)
        return slugs.rows[0];
    } catch (err) {
        throw new DBSelectionError('forms', query, err);
    }
}

exports.getForm = getForm;

exports.getResponses = async function (reportID) {
    
    let query = `SELECT * FROM questionresponses where report=${reportID}`;
    let responses = {};
    try {
        //TODO: Check ID change still works
        const results = await db.query(query)
        responses = results.rows;
        
    } catch (err) {
        throw new DBSelectionError('questionresponses', query, err)
    }
    let form = await getForm(reportID);
    let orderedRefs = await Forms.getOrderedRefs(form.form_id, form.test);
    let ret = [];
    for (let i = 0; i < orderedRefs.length; i++) {
        for (let j = 0; j < responses.length; j++) {
            if (orderedRefs[i] == responses[j].question_ref) {
                ret.push(responses[j]);
                break;
            }
        }
    }
    return ret;
}



exports.getMetadata = async function (reportID) {
    let query = `SELECT reports.date, reports.status, reports.tags, reports.active, reports.location, reports.reporter, assigned_to FROM reports WHERE reports.id=${parseInt(reportID)}`;
    try {
        let metadata = await db.query(query);
        if (metadata.rows.length > 0) {
            metadata = metadata.rows[0];
            if (metadata.tags) {
                metadata.tags = metadata.tags.split(',')
            }

            if (metadata.date) {
                const date = new Date(metadata.date);
                metadata.date = `${date.getDate()}/${date.getMonth()}/${date.getFullYear()} - ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
            } else {
                metadata.date = ''
            }

            metadata.assignedTo = metadata.assigned_to;
            if (metadata.assigned_to) {
                delete metadata.assigned_to;
            }

            return metadata;
        } else {
            return {
                date: '',
                status: '',
                tags: [],
                assignedTo: '',
                active: '',
                location: '',
                reporter: ''
            }
        }
    } catch (err) {
        throw new DBSelectionError('reports', query, err);
    }
}

async function getNotes(reportID) {
    let query = `SELECT notes.time, notes.comment, CONCAT(users.first_name, ' ', users.surname) AS user FROM notes JOIN users ON notes.user=users.id  WHERE notes.report=${parseInt(reportID)}`;
    try {
        let notes = await db.query(query);
        notes = notes.rows;
        for (let i = 0; i < notes.length; i++) {
            let date = new Date(notes[i].time);
            notes[i].time = `${date.getDate()}/${date.getMonth()}/${date.getFullYear()} - ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
        }
        return notes;
    } catch (err) {
        throw new DBSelectionError('notes', query, err);
    }
}

exports.getNotes = getNotes;

async function getAudit(reportID) {
    let query = `SELECT audit.time, audit.action, CONCAT(users.first_name, ' ', users.surname) AS user FROM audit JOIN users ON audit.user=users.id  WHERE audit.report=${parseInt(reportID)}`;
    try {
        let audit = await db.query(query);
        audit = audit.rows;
        for (let i = 0; i < audit.length; i++) {
            let date = new Date(audit[i].time);
            audit[i].time = date.toLocaleString('en-GB', { timeZone: 'UTC' });
        }
        return audit;
    } catch (err) {
        throw new DBSelectionError('audit', query, err);
    }
}

exports.getAudit = getAudit;

exports.getFiles = async function (reportID) {
    //TODO: Implement
    return [
        {
            name: 'document1',
            type: 'pdf',
            url: 'www.downloadfile.com'
        },
        {
            name: 'Evidence Video',
            type: 'video',
            url: 'www.video.com'
        }
    ]
}



exports.getUserOptions = async function (reportID) {
    let query = `SELECT users.id, CONCAT(users.first_name, ' ', users.surname) AS name FROM users JOIN userorgs ON users.id=userorgs.user JOIN forms ON forms.organisation=userorgs.organisation JOIN reports ON reports.form=forms.id WHERE reports.id=${parseInt(reportID)}`;
    try {
        let userOptions = await db.query(query);
        userOptions = userOptions.rows;
        return userOptions;
    } catch (err) {
        throw new DBSelectionError('users', query, err);
    }
}

exports.getReportOptions = async function (reportID) {
    let query = `SELECT allreports.status, allreports.tags FROM reports allreports JOIN reports onereport ON onereport.form=allreports.form WHERE onereport.id=${parseInt(reportID)}`;
    try {
        let reportOptions = await db.query(query);
        reportOptions = reportOptions.rows;
        const statuses = [];
        const tags = [];
        for (let i = 0; i < reportOptions.length; i++) {
            if (reportOptions[i].status) {
                statuses.push(reportOptions[i].status)
            }
            if (reportOptions[i].tags) {
                let currentTags = reportOptions[i].tags.split(',')
                for(let j = 0; j < currentTags.length; j++) {
                    tags.push(currentTags[j]);
                }
            }
        }
        return {
            status: statuses,
            tags: tags
        };
    } catch (err) {
        throw new DBSelectionError('reports', query, err);
    }
}

async function addAudit(audit) {
    let query = `INSERT INTO audit(report, "user", time, action) VALUES (${audit.report}, ${audit.user}, to_timestamp(${Date.now()} / 1000.0), '${audit.action}')`;
    try {
        await db.query(query);
    } catch (err) {
        throw new DBInsertionError('audit', query, [], err);
    }
}

exports.updateAssigned = async function (report, user, assignedID) {
    let query = `UPDATE reports SET assigned_to='${assignedID}' WHERE id='${report}'`;
    try {
        await db.query(query);
    } catch (err) {
        throw new DBUpdateError('reports', query, err);
    }
    let assigned = {};
    try {
        assigned = await users.getUser(assignedID);
    } catch (err) {
        //TODO: remove unnecessary try/catch?
        throw err;
    }
    const audit = {
        report: report,
        user: user,
        action: `Assigned report to ${assigned.first_name} ${assigned.surname}`
    }
    try {
        await addAudit(audit);
        const ret = await getAudit(report);
        return ret;
    } catch (err) {
        //TODO: Remove unnecessary try/catch?
        throw err;
    }
}

exports.updateReporter = async function (reportID, reporterNumber) {
    let query = `UPDATE reports SET reporter='${reporterNumber}' WHERE id='${reportID}'`;
    try {
        await db.query(query);
    } catch (err) {
        throw new DBUpdateError('reports', query, err);
    }
}

exports.updateStatus = async function (report, user, status) {
    let query = `UPDATE reports SET status='${status}' WHERE id='${report}'`;
    try {
        await db.query(query);
    } catch (err) {
        throw new DBUpdateError('reports', query, err)
    }
    const audit = {
        report: report,
        user: user,
        action: `Set status to ${status}`
    }
    try {
        await addAudit(audit);
        const ret = getAudit(report);
        return ret;
    } catch (err) {
        //TODO: Remove unnecessary try/catch?
        throw err;
    }
}

exports.updateLocation = async function (report, user, location) {
    let query = `UPDATE reports SET location='${location}' WHERE id='${report}'`;
    try {
        await db.query(query);
    } catch (err) {
        throw new DBUpdateError('reports', query, err);
    }
    const audit = {
        report: report,
        user: user,
        action: `Set location to ${location}`
    }
    try {
        await addAudit(audit);
        const ret = getAudit(report);
        return ret;
    } catch (err) {
        //TODO: Remove unnecessary try/catch?
        throw err;
    }
}

exports.updateTags = async function (report, user, tags) {
    let query = `UPDATE reports SET tags='${tags}' WHERE id='${report}'`;
    try {
        await db.query(query);
    } catch (err) {
        throw new DBUpdateError('reports', query, err)
    }
    const audit = {
        report: report,
        user: user,
        action: `Set tags to ${tags.join(', ')}`
    }
    try {
        await addAudit(audit);
        const ret = getAudit(report);
        return ret;
    } catch (err) {
        //TODO: Remove unnecessary try/catch?
        throw err;
    }
}

exports.updateActive = async function (report, user, active) {
    let query = `UPDATE reports SET active=${active} WHERE id='${report}'`;
    try {
        await db.query(query);        
    } catch (err) {
        throw new DBUpdateError('reports', query, err)
    }
    const audit = {
        report: report,
        user: user,
        action: active ? 'Set report to active' : 'Archived report'
    }
    try {
        await addAudit(audit);
        const ret = getAudit(report);
        return ret;
    } catch (err) {
        //TODO: remove unnecessary try/catch?
        throw err;
    }
}

exports.addNote = async function (report, user, comment) {
    let query = `INSERT INTO notes(report, "user", time, comment) VALUES (${report}, ${user}, to_timestamp(${Date.now()} / 1000.0), '${comment}')`;
    try {
        await db.query(query);
    } catch (err) {
        throw new DBInsertionError('notes', query, [], err);
    }
    const audit = {
        report: report,
        user: user,
        action: `Added note ${comment}`
    };
    try {
        await addAudit(audit);
        let auditTrail = await getAudit(report);
        let notes = await getNotes(report);
        const ret = {
            audit: auditTrail,
            notes: notes
        }
        return ret;
    } catch (err) {
        //TODO: Remove unnecessary try/catch?
        throw err;
    }
}
