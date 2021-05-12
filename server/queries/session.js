const { jsPDF } = require("jspdf");
const db = require('../db.ts');
const { InvalidVerificationCodeError, InvalidReporterError, DBSelectionError, DBInsertionError, DBUpdateError } = require('../utils/errors/errors');
const FormSections = require('./formsections.js');
const Forms = require('./forms.js')
const Report = require('./report.js');
const Email = require('../utils/email.js')
async function insertReportSessionRelation(reportID, sessionID) {
    const query = 'INSERT INTO reportsessionrelation(report, session) VALUES($1, $2)';
    const values = [reportID, sessionID];
    try {
        await db.query(query, values);
    } catch (err) {
        throw new DBInsertionError('reportsessionrelation', query, values, err);
    }
}

async function updateQueue(sessionID, queue, currentSection) {
    const query = `UPDATE reportsessions SET queue='${JSON.stringify({ value: queue.value, completed: queue.completed, currentSection: currentSection })}' WHERE id='${sessionID}'`;
    try {
        await db.query(query);
    } catch (err) {
        throw new DBUpdateError('reportsessions', query, err);
    }
}



async function addReporter(sectionID, sessionID, reporterNumber, usedBefore) {
    let reports = await getReportsToUpdate(sectionID, sessionID);
    
    let promises = [];
    for (let i = 0; i < reports.length; i++) {
        promises.push(Report.updateReporter(reports[i], reporterNumber));
        promises.push(Report.insertQuestionResponse(reports[i], sectionID, 'usedBefore', { ref: 'usedBefore', title: 'Used before?', type: 'custom' }, usedBefore));
    }

    Promise.all(promises);
}

async function validateReporter(sectionID, reporter) {
    let query = `SELECT reports.id FROM reports JOIN formsections ON formsections.form=reports.form WHERE reporter='${reporter}' AND formsections.id='${sectionID}'`;
    try {
        const results = await db.query(query);
        return results.rows.length > 0;
    } catch (err) {
        throw new DBSelectionError('reports', query, err);
    }
}

async function generateNewReporter() {
    //Note potential (but unlikely) race condition here.
    let reporter = '';
    let results = {};
    let foundNewReporter = false;
    let query = '';
    while (!foundNewReporter) {
        reporter = Math.floor(100000 + Math.random() * 900000).toString(10);
        query = `SELECT id FROM reports WHERE reporter='${reporter}'`;
        try {
            results = await db.query(query);
        } catch (err) {
            throw new DBSelectionError('reports', query, err)
        }
        foundNewReporter = results.rows.length == 0;
    }
    return reporter;
}

async function getReporterNumberFromSession(sessionID) {
    let query = `SELECT reporter FROM reports JOIN reportsessions ON reportsessions.current_report = reports.id WHERE reportsessions.id='${sessionID}'`;
    try {
        const results = await db.query(query);
        return results.rows[0].reporter;
    } catch (err) {
        throw new DBSelectionError('reports', query, err);
    }
}

function generateEmailVerificationBody(verificationCode, reporterNumber, customText) {
    let body = `Hello!\n\nYour verification code is ${verificationCode}.\n\nSince we do not store your email address, you will need to generate a new authentication code every time you submit a report.\n\n`;
    if (reporterNumber) {
        body += `Your reporter number is ${reporterNumber}. You can use this number to report multiple incidents. That lets us know that a set of reports all come from the same source.\n\n`;
    }
    body += customText;
    return body;
}

async function updateVerificationCode(sessionID, verificationCode) {
    const query = `UPDATE reportsessions SET verification_code='${verificationCode}' WHERE id='${sessionID}'`;
    try {
        await db.query(query);
    } catch (err) {
        throw new DBUpdateError('reportsessions', query, err);
    }
}

async function getReports(sessionID) {
    let query = `SELECT report FROM reportsessionrelation WHERE session='${sessionID}'`;
    let results = {};

    try {
        results = await db.query(query);
    } catch (err) {
        throw new DBSelectionError('reportsessions', query, err);
    }

    let reports = results.rows.map((item) => item.report);

    return reports;
}

async function getCurrentReport(sessionID) {
    let query = `SELECT current_report FROM reportsessions WHERE id='${sessionID}'`;
    let results = {};

    try {
        results = await db.query(query);
    } catch (err) {
        throw new DBSelectionError('reportsessions', query, err);
    }

    return results.rows[0].current_report;
}

function generateEmailVerificationCode() {
    let chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let length = 6;
    let verificationCode = '';
    for (var i = length; i > 0; --i) {
        verificationCode += chars[Math.floor(Math.random() * chars.length)]
    }
    return verificationCode
}

async function getReportsToUpdate(sectionID, sessionID) {
    let allReports = await FormSections.getForAllReports(sectionID);
    let reports = allReports ? await getReports(sessionID) : [ await getCurrentReport(sessionID) ];
    return reports;
}

exports.getReportsToUpdate = getReportsToUpdate;

exports.startSession = async function (reportID, sectionQueue, completed) {
    const query = 'INSERT INTO reportsessions(current_report, queue) VALUES($1, $2) RETURNING id'
    const values = [reportID, { value: sectionQueue, completed: completed }];
    let results = {};
    try {
        results = await db.query(query, values);
    } catch (err) {
        throw new DBInsertionError('reportsessions', query, values, err);
    }
    const sessionID = results.rows[0].id;

    await insertReportSessionRelation(reportID, sessionID);

    return sessionID;
}

exports.shiftNextSection = async function (sessionID, test) {
    let query = `SELECT queue FROM reportsessions WHERE id='${sessionID}'`;
    let results = {};

    try {
        results = await db.query(query);
    } catch (err) {
        throw new DBSelectionError('reportsessions', query, err);
    }

    let queue = results.rows[0].queue;
    
    let nextSectionID = queue.value.length > 0 ? queue.value.shift() : queue.completed;
    await updateQueue(sessionID, queue, nextSectionID);
    let nextSection = await FormSections.getSection(nextSectionID, test);
    return nextSection;
}

exports.submitReporterSection = async function (sectionID, sessionID, reporter, usedBefore, test) {
    if (reporter) {
        let validReporter = await validateReporter(sectionID, reporter);
        if (!validReporter) {
            throw new InvalidReporterError(`${reporter} is not a valid reporter number for this form.`);
        }
    } else {
        reporter = await generateNewReporter();
    }

    await addReporter(sectionID, sessionID, reporter, usedBefore);

    let nextSection = await this.shiftNextSection(sessionID, test);

    return nextSection;
}

exports.sendEmailVerification = async function (sessionID, sectionID, email, test) {
    //TODO: Validate email back-end
    let verificationCode = generateEmailVerificationCode();

    let section = await Forms.getSectionJSON(sectionID, test);

    let reporterNumber = await getReporterNumberFromSession(sessionID);
    let emailBody = generateEmailVerificationBody(verificationCode, reporterNumber, section.form.email.text);
    Email.send(email, section.form.email.subject, emailBody); //TODO: Implement this (note: it's async)
    updateVerificationCode(sessionID, verificationCode);
}

exports.submitEmailVerificationSection = async function (sessionID, testVerificationCode, test) {
    let query = `SELECT verification_code FROM reportsessions WHERE id='${sessionID}'`;
    let results = {};

    try {
        results = await db.query(query);
    } catch (err) {
        throw new DBSelectionError('reportsessions', query, err);
    }

    let verificationCode = results.rows[0].verification_code;
    if (testVerificationCode == verificationCode) {
        let nextSection = await this.shiftNextSection(sessionID, test);
        return nextSection;
    } else {
        throw new InvalidVerificationCodeError();
    }
}

async function generateReportPDFText(reportID) {
    let report = await Report.getResponses(reportID);
    let text = '';
    text += `REPORT ${reportID}\n`;
    let fieldText = ''
    for (let i = 0; i < report.length; i++) {
        if (report[i].definition.type == 'file_upload') {
            let fileName = report[i].value.substr(report[i].value.lastIndexOf('/') + 1);
            fieldText = `${report[i].question_ref}: "${fileName}\n`;
        } else {
            fieldText = `${report[i].question_ref}: ${report[i].value}\n`;
        }
        text += fieldText;
    }
    text += '\n\n';
    return text;
}

async function generateSessionPDFText(sessionID) {
    let reports = await getReports(sessionID);
    let text = '';
    let reportText = '';
    for (let i = 0; i < reports.length; i++) {
        reportText = await generateReportPDFText(reports[i]);
        text += reportText;
    }
    return text;
}

exports.generatePDF = async function (sessionID) {
    let text = await generateSessionPDFText(sessionID);
    let path = `./temp/session-${sessionID}.pdf`;
    const doc = new jsPDF();
    let splitText = doc.splitTextToSize(text, 180);
    doc.text(splitText, 10, 10);
    await doc.save(path);
}
