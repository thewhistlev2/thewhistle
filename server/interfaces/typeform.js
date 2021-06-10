// Interface to speak to Typeform
// https://developer.typeform.com/

const request = require('request');
const axios = require('axios');

const { TypeformUpdateError, TypeformWebhookError } = require('../utils/errors/errors.js');

const TYPEFORM_API_BASE_URL = "api.typeform.com"
const ACCESS_TOKEN = "5o33hz2vjVsNbKCu8T4Zb2cYnNM6kWknvqnsfe5mX4Dn"


// TODO - BIG - integrate TS functionality into JS file

const headers = {
    'Authorization': 'Bearer ' + ACCESS_TOKEN,
    'Accept': 'application/json'
}

const bearer = {
    'auth': {
        'bearer': ACCESS_TOKEN
    }
}

function jsonCallback(error, res, body) {
    res.json(body);
}

exports.createWebhook = async function (typeformID, sectionID, test) {
    const url = `https://${TYPEFORM_API_BASE_URL}/forms/${typeformID}/webhooks/${typeformID}`;
    const config = require('../../nuxt.config.js');
    const webhookUrl = config.dev ? `https://${process.env.LOCALTUNNEL_SUBDOMAIN}.loca.lt/api/report/typeform-webhook/${sectionID}` :
        `${process.env.BASE_URL}api/report/typeform-webhook/${sectionID}`;
    const data = {
        url: webhookUrl,
        enabled: true
    }
    //TODO: Add secret
    //TODO: Set SSL true
    try {
        await axios({
            method: 'put',
            url: url,
            headers: headers,
            data: data
        });
    } catch (err) {
        throw new TypeformWebhookError(data.url, err);
    }
}
//TODO: Remove if not used
exports.getForm = function (typeformID) {
    const url = `https://${TYPEFORM_API_BASE_URL}/forms/${typeformID}`;
    const response = request.get(url, bearer, jsonCallback);
}

function moveAlwaysJump(questionLogic) {
    for (let j = 0; j < questionLogic.actions.length; j++) {
        if (questionLogic.actions[j].condition.op == 'always') {
            if (j < questionLogic.actions.length - 1) {
                let alwaysAction = questionLogic.actions.splice(j, 1);
                questionLogic.actions.push(alwaysAction[0]);
            }
            break;
        }
    }
    return questionLogic
}

function moveAlwaysJumps(formLogic) {
    //'An action with `always` condition always has to be the last in list of actions.'
    for (let i = 0; i < formLogic.length; i++) {
        formLogic[i] = moveAlwaysJump(formLogic[i]);
    }
    return formLogic;
}

function adaptForm(form) {
    form.id = form.typeformID;
    delete form.typeformID;
    delete form.type;
    if (form.logic) {
        form.logic = moveAlwaysJumps(form.logic);
    }
    return form;
}

exports.updateForm = async function (form) {
    form = adaptForm(form);
    const url = `https://${TYPEFORM_API_BASE_URL}/forms/${form.id}`;
    const data = JSON.stringify(form);
    try {
        await axios({
            method: 'put',
            url: url,
            headers: headers,
            data: data
        });
    } catch (err) {
        throw new TypeformUpdateError(form, err);
    }
    return form;
}

exports.createForm = async function (form) {
    const url = `https://${TYPEFORM_API_BASE_URL}/forms`;
    try {
        let response = await axios({
            method: 'post',
            url: url,
            headers: headers,
            data: form
        });
        let ret = response.data;
        return ret;
    } catch (err) {
        throw new TypeformUpdateError(form, err);
    }
}
