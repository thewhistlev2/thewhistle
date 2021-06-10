const jwt = require('jsonwebtoken');

function requiresVerification(path) {
    if (path == '/login') {
        return false;
    } else if (path == '/api/auth/logout') {
        return false;
    } else if (path == '/api/auth/login') {
        return false;
    } else if (path.startsWith('/api/forms/')) {
        return false; //TODO: Make this more specific
    } else if (path == '/api/session/download-pdf') {
        return false;
    } else if (path == '/api/auth/verification-code') {
        return false;
    } else if (path == '/api/auth/resend-code') {
        return false;
    } else if (path.startsWith('/api/auth/validate-password-token/')) {
        return false;
    } else if (path == '/api/session/download-pdf') {
        return false;
    } else if (path == '/favicon.ico') {
        return false;
    } else if (path.startsWith('/_nuxt/')) {
        return false;
    } else if (path.startsWith('/vuetify.css.map')) {
        return false;
    } else if (path.startsWith('/__webpack_hmr/')) {
        return false;
    } else if (path.startsWith('/api/report/typeform-webhook/')) {
        return false;
    } else if (path.startsWith('/api/report/start/')) {
        return false
    } else if (path.startsWith('/api/report/submit-section/')) {
        return false
    } else if (path.startsWith('/api/report/next-section/')) {
        return false
    } else if (path.startsWith('/api/report/send-email-verification/')) {
        return false
    } else if (path.startsWith('/submit-test-report/')) {
        return false;
    } else if (path.startsWith('/submit-report/')) {
        return false;
    }
    return true;
}

async function verify(req, res, next) {
    //TODO: Make login flow work better
    if (requiresVerification(req.originalUrl)) {
        try {
            const payload = await jwt.verify(req.cookies.authtoken, process.env.JWT_SECRET_KEY);
            if (!payload.user) {
                res.redirect('/login');
                res.send();
            } else {
                next();
            }
        } catch {
            res.redirect('/login')
        }
    } else {
        next();
    }
    
}

module.exports = verify;
