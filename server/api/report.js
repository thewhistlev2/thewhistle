const express = require('express');
const jwt = require('jsonwebtoken');

const report = require('../queries/report.js');
const session = require('../queries/session.js');
const forms = require('../queries/forms.js')
const router = express.Router()

router.post('/start/:form', startReport);

router.post('/send-email-verification/:session', sendEmailVerification);

router.post('/submit-section/:session', submitSection);

router.post('/typeform-webhook/:section', postWebhook);

router.get('/:id', getReport);

router.get('/next-section/:sessionID', getNextSection);

router.get('/next-section/:sessionID/test', getNextTestSection);

router.post('/assigned/:id', postAssigned);

router.post('/status/:id', postStatus);

router.post('/location/:id', postLocation);

router.post('/tags/:id', postTags);

router.post('/active/:id', postActive);

router.post('/note/:id', postNote);

async function startReport(req, res, next) {
    try {
        let reportID = await report.startReport(req.params.form, req.body.test);
        let sectionQueue = await forms.generateInitialSectionQueue(req.params.form, req.body.test);
        let completedSection = await forms.getCompleted(req.params.form);
        let sessionID = await session.startSession(reportID, sectionQueue, completedSection);
        
        let firstSection = await session.shiftNextSection(sessionID, req.body.test);
        
        const token = await jwt.sign({ sessionID: sessionID }, process.env.JWT_SECRET_KEY, { expiresIn: "2h" });
        const twoHours = 2 * 60 * 60 * 1000;
        res.cookie('reportSession', token, { maxAge: twoHours });
        res.status(200);
        res.json({
            sessionID: sessionID,
            nextSection: firstSection
        });
    } catch (err) {
        res.status(500);
        res.send('Could not start report');
        next(err);
    }
}

async function sendEmailVerification(req, res, next) {
    try {
        await session.sendEmailVerification(req.params.session, req.body.sectionID, req.body.email, req.body.test);
        res.status(200);
        res.send('Email verified');
    } catch (err) {
        res.status(500);
        res.send('Could not send verification email');
        next(err);
    }
}

async function submitSection(req, res, next) {
    
    try {
        let nextSection = {};
        switch(req.body.type) {
            case 'reporter':
                nextSection = await session.submitReporterSection(req.body.section, req.params.session, req.body.reporter, req.body.usedBefore, req.body.test);
                break;
            case 'email-verification':
                nextSection = await session.submitEmailVerificationSection(req.params.session, req.body.verificationCode, req.body.test);
                break;
            default:
                res.status(400);
                res.send('Could not determine section type');
                next(err);
        }
        res.status(200);
        res.json(nextSection);
    } catch (err) {
        if (err.name == 'InvalidReporterError') {
            res.status(404);
            res.send(err.message);
        } else if (err.name == 'InvalidVerificationCodeError') {
            res.status(401);
            res.send(err.message);
        } else {
            res.status(500);
            res.send('Could not submit section');
            next(err);
        }
    }
}

async function postWebhook(req, res, next) {
    try {
        await report.submitTypeformSection(req.params.section, req.body);
        res.status(200);
        res.send();
    } catch (err) {
        res.status(500);
        res.send('Could not process webhook');
        next(err);
    }
}

function getReport(req, res, next) {
    try {
        let responses = report.getResponses(req.params.id);
        let formSlug = report.getForm(req.params.id);
        let metadata = report.getMetadata(req.params.id);
        let notes = report.getNotes(req.params.id);
        let audit = report.getAudit(req.params.id);
        let files = report.getFiles(req.params.id);
        let userOptions = report.getUserOptions(req.params.id);
        let reportOptions = report.getReportOptions(req.params.id);
        Promise.all([ responses, formSlug, metadata, notes, audit, files, userOptions, reportOptions ])
            .catch(() => {
                res.status(500).send('Could not get report data');
                //TODO: Handle errors properly
            })
            .then( data => {
                const ret = {
                    responses: data[0],
                    formSlug: data[1].slug,
                    metadata: data[2],
                    notes: data[3],
                    audit: data[4],
                    files: data[5],
                    options: {
                        assignedTo: data[6],
                        status: data[7].status,
                        tags: data[7].tags
                    }
                }
                res.json(ret)
            })
    } catch (err) {
        res.status(500)
        res.send('Could not get report data');
        next(err);
    }
}

async function getNextSection(req, res, next) {
    try {
        let nextSection = await session.shiftNextSection(req.params.sessionID, false);
        res.json(nextSection);
    } catch (err) {
        res.status(500);
        res.send('Could not get next section');
        next(err);
    }
}

async function getNextTestSection(req, res, next) {
    try {
        let nextSection = await session.shiftNextSection(req.params.sessionID, true);
        res.json(nextSection);
    } catch (err) {
        res.status(500);
        res.send('Could not get next test section');
        next(err);
    }
}

async function postAssigned(req, res, next) {
    try {
        const audit = await report.updateAssigned(req.body.report, req.body.user, req.body.assigned);
        res.json({ audit: audit });
    } catch (err) {
        res.status(500);
        res.send('Could not update report assignment');
        next(err);
    }
}

async function postStatus(req, res, next) {
    try {
        const audit = await report.updateStatus(req.body.report, req.body.user, req.body.status);
        res.json({ audit: audit });
    } catch (err) {
        res.status(500);
        res.send('Could not update report status');
        next(err);
    }
}

async function postLocation(req, res, next) {
    try {
        const audit = await report.updateLocation(req.body.report, req.body.user, req.body.location);
        res.json({ audit: audit });
    } catch (err) {
        res.status(500);
        res.send('Could not update report location');
        next(err);
    }
}

async function postTags(req, res, next) {
    try {
        const audit = await report.updateTags(req.body.report, req.body.user, req.body.tags);
        res.json({ audit: audit });
    } catch (err) {
        res.status(500);
        res.send('Could not update report tags');
        next(err);
    }
}

async function postActive(req, res, next) {
    try {
        const audit = await report.updateActive(req.body.report, req.body.user, req.body.active);
        res.json({ audit: audit });
    } catch (err) {
        res.status(500);
        res.send('Could not archive/unarchive report');
        next(err);
    }
}

async function postNote(req, res, next) {
    try {
        const ret = await report.addNote(req.body.report, req.body.user, req.body.comment);
        res.json({ audit: ret.audit, notes: ret.notes });
    } catch (err) {
        res.status(500);
        res.send('Could not add note to report');
        next(err);
    }
}

module.exports = router
