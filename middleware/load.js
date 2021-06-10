import axios from 'axios'

import Pages from './pages.ts'

//import Lowtech from './lowtech';
import { verify } from 'crypto';



export default async function (context) {
    var params = context.route.params;
    var path = context.route.path;

    // if (path == '/forms') {
    //     var user = context.req.user
    //     context.forms = await Pages.loadForms(user);
    // }

    // if (path == '/users') {
    //     context.users = await Pages.loadUsers();
    // }

    if (path.startsWith('/reports') && params.hasOwnProperty('form')) {
        try {
            context.reports = await Pages.loadReports(params.form, false, context.$axios);
        } catch (err) {
            console.error('Could not get reports');
        }
    }

    if (path.startsWith('/test-reports') && params.hasOwnProperty('form')) {
        try {
            context.reports = await Pages.loadReports(params.form, true, context.$axios);
        } catch (err) {
            console.error('Could not get test reports');
        }
    }

    if (path.startsWith('/errors')) {
        try {
            context.errors = await Pages.loadErrors(context.$axios);
        } catch (err) {
            console.error('Could not get errors');
        }
    }

    /* if (path.startsWith('/edit-form/') && params.hasOwnProperty('form')) {
        //context.form = await Pages.loadEditForm(params.form);
        //context.slug = params.form;
    } */

    // if (path.startsWith('/report/') && params.hasOwnProperty('report')) {
    //     context.report = await Pages.loadReport(params.report);
    // }

    if (path.startsWith('/submit-report/') && params.hasOwnProperty('form')) {
        try {
            context.form = await Pages.loadFormFromSlug(params.form, false, context.$axios);
        } catch (err) {
            console.error('Could not get form');
        }
    }

    if (path.startsWith('/submit-test-report/') && params.hasOwnProperty('form')) {
        try {
            context.form = await Pages.loadFormFromSlug(params.form, true, context.$axios);
        } catch (err) {
            console.error('Could not get test form')
        }
    }

    if (path.startsWith('/set-password/') && params.hasOwnProperty('token')) {
        try {
            context.validToken = await Pages.validatePasswordToken(params.token, context.$axios);
        } catch (err) {
            console.error('Error validating set password token');
        }
    }

    // TODO - change conditions for path
    if (params.hasOwnProperty('htmlform')) {
        try {
            context.survey = extractTestSurvey(getTestSurvey());
        } catch (err) {
            console.error('Could not get HTML form');
        }
    }
    // TODO - change conditions for path
    /* if (params.hasOwnProperty('lowtech')) {
        context.questions = Lowtech.getNextQuestions(params.lowtech);
    } */
    return context
}
