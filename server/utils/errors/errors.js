class WhistleError extends Error {
    constructor(message, name) {
        super();
        this.name = name;
        this.message = message
    }
}

class InvalidReporterError extends WhistleError {
    constructor(message) {
        super(message, 'InvalidReporterError');
    }
}

class DBInsertionError extends WhistleError {
    constructor(table, query, values, err) {
        //TODO: Refactor all inserts so they don't use values
        super(`Error inserting into the ${table} table.\nExecuting query '${query}' with values '${values}'\n${err.message}`, 'DBInsertionError');
    }
}

class DBSelectionError extends WhistleError {
    constructor(table, query, err) {
        super(`Error selecting data from the ${table} table.\nExecuting query '${query}'\n${err.message}`, 'DBSelectionError');
    }
}

class DBUpdateError extends WhistleError {
    constructor(table, query, err) {
        super(`Error updating data in the ${table} table.\nExecuting query '${query}'\n${err.message}`, 'DBSelectionError');
    }
}

class DBDeleteError extends WhistleError {
    constructor(table, query, values, err) {
        super(`Error deleting data in the ${table} table. Executing query '${query}' with values ${values}.\n${err.message}`);
    }
}

class UserAuthenticationError extends WhistleError {
    constructor(err) {
        super(`Error authenticating user.\n${err.message}`, 'UserAuthenticationError');
    }
}

class TypeformUpdateError extends WhistleError {
    constructor(form, err) {
        let message = '';
        let name = 'TypeformUpdateError';
        try {
            message = `Error updating form. Status ${err.response.status} - ${err.response.statusText}.\n${err.response.data.code} - ${err.response.data.details[0].in}${err.response.data.details[0].field} ${err.response.data.details[0].description}\nForm JSON:\n${JSON.stringify(form)}`;
        } catch {
            message = 'Error updating form.'
        }
        super(message, name);
    }
}

class TypeformWebhookError extends WhistleError {
    constructor(url, err) {
        super(`Error creating webhook at URL ${url}\n${err.message}`, 'TypeformWebhookError');
    }
}

class FormAccessError extends WhistleError {
    constructor(formJSON, err) {
        super(`Error accessing values in form \n${JSON.stringify(formJSON)}\n${err.message}`, 'FormAccessError');
    }
}

class InvalidVerificationCodeError extends WhistleError {
    constructor() {
        super('Invalid verification code.', 'InvalidVerificationCodeError');
    }
}

class MaxIncorrect2FAError extends WhistleError {
    constructor() {
        super('More than 3 incorrect 2FA attempts', 'MaxIncorrect2FAError');
    }
}

exports.InvalidReporterError = InvalidReporterError;
exports.DBInsertionError = DBInsertionError;
exports.DBSelectionError = DBSelectionError;
exports.DBUpdateError = DBUpdateError;
exports.DBDeleteError = DBDeleteError;
exports.UserAuthenticationError = UserAuthenticationError;
exports.TypeformUpdateError = TypeformUpdateError;
exports.TypeformWebhookError = TypeformWebhookError;
exports.FormAccessError = FormAccessError;
exports.InvalidVerificationCodeError = InvalidVerificationCodeError;
exports.MaxIncorrect2FAError = MaxIncorrect2FAError;
