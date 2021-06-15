const Typeform = require('../interfaces/typeform.js');

const db = require('../db.ts');

const { DBSelectionError, DBUpdateError, DBInsertionError, FormAccessError } = require('../utils/errors/errors.js');

async function getOrgForms(organisationID) {
    let query = `SELECT forms.slug, title, published, organisations.name AS organisation FROM forms JOIN organisations ON organisations.id=forms.organisation WHERE organisations.id='${organisationID}'`;
    try {
        let orgs = await db.query(query)
        orgs = orgs.rows;
        return orgs
    } catch (err) {
        throw new DBSelectionError('forms', query, err);
    }
}

async function getUserOrgForms(userID, organisationID) {
    let query = `SELECT forms.slug, title, published, organisations.name AS organisation, userforms.user_role AS role FROM forms JOIN organisations ON organisations.id=forms.organisation JOIN userforms ON userforms.form=forms.id WHERE organisations.id='${organisationID}' AND userforms.user='${userID}'`;
    try {
        let orgs = await db.query(query)
        orgs = orgs.rows;
        return orgs;
    } catch (err) {
        throw new DBSelectionError('forms', query, err);
    }
}

exports.getUserForms = async function(userID) {
    let query = `SELECT organisation, role FROM userorgs WHERE userorgs.user='${userID}'`;
    let orgs = {};
    try {
        orgs = await db.query(query)
    } catch (err) {
        throw new DBSelectionError('userorgs', query, err);
    }
    orgs = orgs.rows;
    let forms = [];
    let orgForms = [];
    for (let i = 0; i < orgs.length; i++) {
        if (orgs[i].role == 'admin') {
            try {
                orgForms = await getOrgForms(orgs[i].organisation);
            } catch (err) {
                //TODO: Remove unnecessary try/catch?
                throw err;
            }
            for (let j = 0; j < orgForms.length; j++) {
                orgForms[j].role = 'admin';
            }
        } else {
            try {
                orgForms = await getUserOrgForms(userID, orgs[i].organisation);
            } catch (err) {
                //TODO: Remove unnecessary try/catch?
                throw err;
            }
        }
        forms = forms.concat(orgForms);
    }
    return forms;
}

function getJumpToText(value) {
    return value == 'default_tys' ? 'End of form' : value;
}

function getQuestionJump(formLogic, questionRef) {
    for (let i = 0; i < formLogic.length; i++) {
        if (formLogic[i].ref == questionRef) {
            let actions = formLogic[i].actions;
            for (let j = 0; j < actions.length; j++) {
                if (actions[j].condition.op == 'always') {
                    return getJumpToText(actions[j].details.to.value)
                }
            }
        }
    }
    return null;
}

function getJumpOptions(fields, questionRef) {
    let passedRef = false;
    let jumpOptions = [];
    for (let i = 0; i < fields.length; i++) {
        if (passedRef) {
            jumpOptions.push(fields[i].ref);
        } else if (fields[i].ref == questionRef) {
            passedRef = true;
        }   
    }
    jumpOptions.push('End of form');
    return jumpOptions;
}

function getQuestionLogic(typeformJSON, questionRef) {
    let logic = typeformJSON.logic;
    if (logic) {
        for (let i = 0; i < logic.length; i++) {
            if (logic[i].ref == questionRef) {
                return logic[i].actions;
            }
        }
    }   
    return [];
}

function getChoiceJump(questionLogic, choice) {
    if (questionLogic) {
        for (let i = 0; i < questionLogic.length; i++) {
            if (questionLogic[i].condition.op == 'equal') {
                const logicValue = questionLogic[i].condition.vars[1].value;
                const choiceValue = choice.label;
                if (logicValue == choiceValue) {
                    return getJumpToText(questionLogic[i].details.to.value);
                }
            } else if (questionLogic[i].condition.op == 'is') {
                const logicValue = questionLogic[i].condition.vars[1].value;
                const choiceValue = choice.ref;
                if (logicValue == choiceValue) {
                    return getJumpToText(questionLogic[i].details.to.value);
                }
            }
        }
    }
    return null;
}

function getQuestionChoices(typeformJSON, questionRef) {
    let questionLogic = getQuestionLogic(typeformJSON, questionRef);
    let fields = typeformJSON.fields;
    let allJumps = [];
    for (let i = 0; i < fields.length; i++) {
        if (fields[i].ref == questionRef) {
            if (fields[i].properties && fields[i].properties.choices) {
                let choices = fields[i].properties.choices;
                for (let j = 0; j < choices.length; j++) {
                    choices[j].jump = getChoiceJump(questionLogic, choices[j])
                    if (choices[j].jump) {
                        allJumps.push(choices[j].jump);
                    }
                }
                return {
                    choices: choices,
                    jumps: allJumps
                };
            }
        }
    }
    return {
        choices: null,
        jumps: []
    };
}

function getRequired(question) {
    try {
        return question.validations.required ? true : false;
    } catch {
        return false;
    }
}

function getDescription(question) {
    try {
        return question.properties.description;
    } catch {
        return null;
    }
}

function getAllowMultiple(question) {
    try {
        return question.properties.allow_multiple_selection ? true : false;
    } catch {
        return false;
    }
}

function getAllowOther(question) {
    try {
        return question.properties.allow_other_choice ? true : false;
    } catch {
        return false;
    }
}

function generateEditJSON(typeformJSON) {
    try {
        //TODO: Handle all section types
        if (!typeformJSON.logic) {
            typeformJSON.logic = [];
        }
        if (!typeformJSON.fields) {
            typeformJSON.fields = [];
        }
        let formLogic = typeformJSON.logic;
        let fields = typeformJSON.fields;
        let question = {};
        let editJSON = [];
        let choices = {};
        for (let i = 0; i < fields.length; i++) {
            question = {};
            question.ref = fields[i].ref;
            question.title = fields[i].title;
            question.type = fields[i].type;
            question.jump = formLogic ? getQuestionJump(formLogic, fields[i].ref) : null;
            question.jumpOptions = getJumpOptions(fields, fields[i].ref);
            choices = getQuestionChoices(typeformJSON, fields[i].ref);
            question.choices = choices.choices;
            if (question.jump) {
                choices.jumps.push(question.jump);
            }
            question.jumps = [...new Set(choices.jumps)]
            question.required = getRequired(fields[i]);
            question.description = getDescription(fields[i]);
            if (question.type == 'multiple_choice') {
                question.allowMultiple = getAllowMultiple(fields[i]);
                question.allowOther = getAllowOther(fields[i]);
            }
            editJSON.push(question);
        }
        return editJSON;
    } catch (err) {
        if (err.name == 'TypeError') {
            throw new FormAccessError(typeformJSON, err);
        }
        else {
            throw err;
        }
    }
}

async function getSectionLogicFromForm(formID, test) {
    let logicField = test ? 'test_logic' : 'logic';
    let query = `SELECT ${logicField} FROM formsectionlogic WHERE form='${formID}'`;
    let results = {};

    try {
        results = await db.query(query);
    } catch (err) {
        throw new DBSelectionError('formsections', query, err);
    }

    return results.rows[0][logicField];
}

//Used in edit form
exports.getEditFormJSON = async function(slug) {
    //TODO: Move some of this to form gen
    let query = `SELECT test_logic AS logic, forms.title AS title, forms.description AS description, forms.web AS web, forms.id AS form, forms.image AS image FROM formsectionlogic JOIN forms ON forms.id=formsectionlogic.form WHERE forms.slug='${slug}'`;
    let results = {};
    try {
        results = await db.query(query);
    } catch (err) {
        throw new DBSelectionError('forms', query, err);
    }
    const title = results.rows[0].title;
    const description = results.rows[0].description;
    const web = results.rows[0].web;
    const sectionLogic = results.rows[0].logic.sections;
    const formID = results.rows[0].form;
    const image = results.rows[0].image;
    for (let i = 0; i < sectionLogic.length; i++) {
        query = `SELECT type, test_json AS json, header, footer FROM formsections WHERE id=${sectionLogic[i].sectionID}`;
        try {
            results = await db.query(query);
        } catch (err) {
            throw new DBSelectionError('formsections', query, err);
        }
        sectionLogic[i].title = results.rows[0].json.title;
        sectionLogic[i].type = results.rows[0].type;
        sectionLogic[i].header = results.rows[0].header;
        sectionLogic[i].footer = results.rows[0].footer;
        if (sectionLogic[i].type == 'Questions') {
            sectionLogic[i].questions = generateEditJSON(results.rows[0].json);
            sectionLogic[i].completedText = results.rows[0].json.thankyou_screens[0].title;
        } else {
            sectionLogic[i].json = results.rows[0].json;
        }
    }

    let completedID = await getCompleted(formID);
    let completed = await getSectionJSON(completedID, true);

    return {
        title: title,
        description: description,
        completed: completed.form,
        web: web,
        image: image,
        sectionLogic: sectionLogic
    }
    //TODO: Add in ret example structures documentation
}

async function getSectionJSON(sectionID, test) {
    let query = `SELECT ${test ? 'test_' : ''}json AS json, type FROM formsections WHERE id='${sectionID}'`;
    let results = {};
    try {
        results = await db.query(query);
    } catch (err) {
        throw new DBSelectionError('formsections', query, err);
    }
    return {
        form: results.rows[0].json,
        type: results.rows[0].type
    }
}

exports.getSectionJSON = getSectionJSON;
//Used to get /submit-report pages
exports.getFormFromSlug = async function (slug, test) {
    let query = `SELECT logic, test_logic, forms.web AS web, forms.title AS title, forms.description AS description, forms.id AS form_id, forms.image AS image FROM formsectionlogic JOIN forms ON forms.id=formsectionlogic.form WHERE forms.slug='${slug}'`;
    let results = {};
    try {
        results = await db.query(query);
    } catch (err) {
        throw new DBSelectionError('formsectionlogic', query, err);
    }
    if (results.rows[0]) {
        const web = results.rows[0].web;
        const title = results.rows[0].title;
        const description = results.rows[0].description;
        const formID = results.rows[0].form_id;
        const image = results.rows[0].image;
        const sectionLogic = test ? results.rows[0].test_logic.sections : results.rows[0].logic.sections;
        for (let i = 0; i < sectionLogic.length; i++) {
            let query = `SELECT type, json, test_json, header, footer FROM formsections WHERE id=${sectionLogic[i].sectionID}`;
            try {
                results = await db.query(query);
            } catch (err) {
                throw new DBSelectionError('formsections', query, err);
            }
            sectionLogic[i].type = results.rows[0].type;
            sectionLogic[i].json = test ? results.rows[0].test_json : results.rows[0].json;
            sectionLogic[i].header = results.rows[0].header;
            sectionLogic[i].footer = results.rows[0].footer;
        }
        return {
            web: web,
            id: formID,
            slug: slug,
            title: title,
            description: description,
            image: image,
            sections: sectionLogic
        }
    }
}

exports.updateDescription = async function(slug, description) {
    let query = `UPDATE forms SET description=$1 WHERE slug='${slug}'`;
    let values = [ description ];
    try {
        await db.query(query, values);
    } catch (err) {
        throw new DBUpdateError('forms', query, err);
    }
}

exports.updatePublished = async function(slug, published) {
    let query = `UPDATE forms SET published=${published} WHERE slug='${slug}' RETURNING id`;
    try {
        let results = await db.query(query);
        let formID = results.rows[0].id;
        return formID
    } catch (err) {
        throw new DBUpdateError('forms', query, err);
    }
}

exports.updateJSON = async function(sectionID, form) {
    //TODO: Make work for multiple sections
    let query = `UPDATE formsections SET test_json='${JSON.stringify(form)}' WHERE id='${sectionID}'`;
    try {
        await db.query(query);
    } catch (err) {
        throw new DBUpdateError('formsections', query, err);
    }
    return form.type == 'Questions' ? generateEditJSON(form) : form;
}

exports.updateImage = async function (slug, image) {
    let query = `UPDATE forms SET image=$1 WHERE slug=$2`;
    let values = [image, slug];
    try {
        await db.query(query, values);
    } catch (err) {
        throw new DBUpdateError('forms', query, err);
    }
}

exports.getFormIDFromSlug = async function (slug) {
    let query = `SELECT id FROM forms WHERE slug='${slug}'`;
    let results = {};
    try {
        results = await db.query(query);
    } catch (err) {
        throw new DBSelectionError('forms', query, err);
    }
    return results.rows[0].id;
}

exports.addFormSectionLogicSection = async function (index, formID, sectionID, defaultSection) {
    let sectionLogic = await getSectionLogicFromForm(formID, true);
    let newSection = {
        sectionID: sectionID,
        sectionLogic: {
            default: defaultSection
        }
    };
    sectionLogic.sections.splice(index, 0, newSection);
    let query = `UPDATE formsectionlogic SET test_logic='${JSON.stringify(sectionLogic)}' WHERE form='${formID}'`;
    try {
        await db.query(query);
    } catch (err) {
        throw new DBUpdateError('formsections', query, err);
    }
}

exports.publishLogic = async function(formID) {
    let query = `UPDATE formsectionlogic SET logic=test_logic WHERE form=${formID}`;
    try {
        await db.query(query);
    } catch (err) {
        throw new DBUpdateError('formsectionlogic', query, err);
    }
}

function generateSectionLogic(sectionID) {
    //TODO: Add section logic
    return {
        sections: [
            {
                sectionID: sectionID,
                sectionLogic: { default: true },
            }
        ]
    }
}

async function insertIntoForms(form) {
    const query = 'INSERT INTO forms(organisation, title, description, slug, web, image) VALUES($1, $2, $3, $4, $5, $6) RETURNING id'
    const values = [form.org, form.title, form.description, form.slug, form.web, form.image];
    let results = {};
    try {
        results = await db.query(query, values);
    } catch (err) {
        throw new DBInsertionError('forms', query, values, err);
    }
    const formID = results.rows[0].id;
    return formID;
}

async function insertCompletedSection(formID) {
    let json = {
        text: 'Form complete',
        allowDownload: true
    };
    const query = 'INSERT INTO formsections (form, type, json, test_json) VALUES ($1, $2, $3, $4) RETURNING id';
    const values = [formID, 'Completed', JSON.stringify(json), JSON.stringify(json)];
    try {
        await db.query(query, values);
    } catch (err) {
        throw new DBInsertionError('formsections', query, values, err);
    }
}

async function insertIntoFormSections(form) {
    //TODO: Handle errors
    let actualJSON = {};
    let testJSON = {};

    //TODO: Add other types
    switch (form.type) {
        case 'Questions':
            try {
                actualJSON = await Typeform.createForm(form.json);
                testJSON = await Typeform.createForm(form.json);
            } catch (err) {
                //TODO: Remove unnecessary try/catch?
                throw err;
            }
            break;
        case 'sms':
            actualJSON = form.json;
            testJSON = form.json;
            break;
    }
    const query = 'INSERT INTO formsections (form, type, json, test_json) VALUES ($1, $2, $3, $4) RETURNING id';
    const values = [form.id, form.type, JSON.stringify(actualJSON), JSON.stringify(testJSON)];
    let results = {};
    try {
        results = await db.query(query, values);
    } catch (err) {
        throw new DBInsertionError('formsections', query, values, err);
    }
    const sectionID = results.rows[0].id;

    if (form.type == 'typeform') {
        try {
            await Typeform.createWebhook(actualJSON.id, sectionID, false);
            await Typeform.createWebhook(testJSON.id, sectionID, true);
        } catch (err) {
            //TODO: Remove unnecessary try/catch?
            throw err;
        }
    }

    return sectionID;
}

async function insertIntoFormSectionLogic(form) {
    //let logic = generateSectionLogic(sectionID)
    let logic = { sections: [] };
    const query = 'INSERT INTO formsectionlogic (form, logic, test_logic) VALUES ($1, $2, $3)';
    const values = [form.id, logic, logic];
    try {
        await db.query(query, values);
    } catch (err) {
        throw new DBInsertionError('formsectionlogic', query, values, err);
    }
}

exports.insertForm = async function (form) {
    try {
        form.id = await insertIntoForms(form);
        await insertCompletedSection(form.id);
        //const sectionID = await insertIntoFormSections(form);
        await insertIntoFormSectionLogic(form);
    } catch (err) {
        //TODO: Remove unnecessary try/catch?
        throw err
    }
}

exports.generateInitialSectionQueue = async function (formID, test) {
    let sectionLogic = await getSectionLogicFromForm(formID, test);
    let sections = sectionLogic.sections;
    let sectionQueue = [];

    for (let i = 0; i < sections.length; i++) {
        if (sections[i].sectionLogic.default) {
            sectionQueue.push(sections[i].sectionID);
        } else {
            break;
        }
    }

    return sectionQueue;
}

exports.getOrderedRefs = async function (formID, test) {
    let sectionLogic = await getSectionLogicFromForm(formID, test);
    let sections = sectionLogic.sections.map(s => s.sectionID);
    let sectionJSON = {};
    let orderedRefs = [];
    for (let i = 0; i < sections.length; i++) {
        sectionJSON = await getSectionJSON(sections[i], test);
        if (sectionJSON.type == 'Reporter Number') {
            orderedRefs.push('usedBefore');
        } else if (sectionJSON.type == 'Questions') {
            let fields = sectionJSON.form.fields;
            for (let j = 0; j < fields.length; j++) {
                orderedRefs.push(fields[j].ref);
            }
        }
    }
    return orderedRefs;
}

async function getCompleted(formID) {
    let query = `SELECT id FROM formsections WHERE form='${formID}' AND type='Completed'`;
    let results = {};

    try {
        results = await db.query(query);
    } catch (err) {
        throw new DBSelectionError('formsections', query, err);
    }

    return results.rows[0].id
}

exports.getCompleted = getCompleted;

exports.generateEditJSON = generateEditJSON;

//TODO: Delete if not needed
/* updateSurvey = function (slug, survey) {
    db.query(`UPDATE subforms SET form_json='${JSON.stringify(survey)}' WHERE slug='${slug}'`, (error, results) => {
        if (error) {
            throw error;
        }

        const typeFormResponse = typeform.updateForm(survey.id, survey);        
    });

} */


/* function extractQuestionLogic(formLogic, questionRef) {
    if(!formLogic) {
        return null
    }
    for (let i = 0; i < formLogic.length; i++) {
        if (formLogic[i].ref == questionRef) {
            return formLogic[i].actions;
        }
    }
    return null;
} */

//TODO: Delete if not needed
/* function editSurvey(req, res, updateFunction) {
    const slug = req.query.surveyID

    db.query(`SELECT form_json FROM subforms WHERE slug='${slug}'`, (error, results) => {
        if (error) {
            throw error;
        }
        var query = req.query;
        const survey = results.rows[0].form_json;
        updatedSurvey = updateFunction(survey, query);
        updateSurvey(slug, updatedSurvey);
        query.survey = updatedSurvey;
        res.status(200).json(query);
    });
} */

//TODO: Delete if not needed
/* exports.updateField = function (req, res) {
    editSurvey(req, res, surveyUtils.updateField);
} */

//TODO: Delete if not needed
/* exports.updateSurveyChoice = function (req, res) {
    editSurvey(req, res, surveyUtils.updateChoice);
} */

//TODO: Delete if not needed
/* exports.updateDropdownChoice = function (req, res) {
    editSurvey(req, res, surveyUtils.updateDropdownChoice);
} */

/* function rearrangeFormJSON(formJSON) {
    let formLogic = formJSON.logic;
    let ret = formJSON.fields;
    let questionLogic = [];
    for (let i = 0; i < ret.length; i++) {
        questionLogic = extractQuestionLogic(formLogic, ret[i].ref);
        ret[i].logic = questionLogic ? questionLogic : [];
    }
    return ret;
} */

//TODO: Delete if not needed
/* exports.getFormJSON = function (slug, res) {
    db.query(`SELECT form_json FROM subforms WHERE slug='${ slug }'`, (error, results) => {
        if (error) {
            throw error;
        }
        const form = results.rows[0].form_json;
        const ret = rearrangeFormJson(form);
        res.json(ret);
    });
} */

//TODO: Delete if not needed
/* exports.getTestFormJSON = function (slug, res) {
    db.query(`SELECT test_form_json FROM subforms WHERE slug='${ slug }'`, (error, results) => {
        if (error) {
            throw error;
        }
        const form = results.rows[0].test_form_json;
        const ret = rearrangeFormJson(form);
        res.json(ret);
    });
} */

//TODO: Remove if not used
/* exports.getMyForms = function (uid, res) {
    db.query(`SELECT form_json, subforms.slug AS slug, user_role, published FROM subforms left join userforms on userforms.form_id=subforms.id WHERE user=${uid}`, (error, results) => {
        if (error) {
            res.json(error);
        }
        res.json(_.map(results.rows, function (res) {
            return {
                title: res.form_json.title,
                slug: res.slug,
                userRole: res.user_role,
                published: res.published
            }
        }))
    });
} */

//TODO: Delete if not needed
/* exports.getSurveyJSON = function (id, res) {
    db.query(`SELECT form_json FROM subforms WHERE typeform_id='${id}'`, (error, results) => {
        if (error) {
            res.json(error);
        }
        res.json(extractTestSurvey(results.rows[0].form_json));
    });
} */

/* function extractTestSurvey(survey) {
    return _.each(survey.fields, function (item) {
        var tmpItem = item;

        tmpItem.field_title = "" + item.id + "_" + item.title;

        if (item.hasOwnProperty("properties")) {
            tmpItem.properties.choices = _.each(item.properties.choices, function (choice) {
                var tmpChoice = choice;
                tmpChoice.field_label = "" + item.id + "_" + choice.label;
                return tmpChoice;
            })
        }
        return tmpItem
    })
} */