const nodemailer = require('nodemailer');
const { google } = require('googleapis');


exports.send = async function(toAddress, title, body) {
    const clientID = process.env.EMAIL_CLIENT_ID;
    const clientSecret = process.env.EMAIL_CLIENT_SECRET;
    const redirectURI = process.env.EMAIL_REDIRECT_URI;
    const refreshToken = process.env.EMAIL_REFRESH_TOKEN;
    const userEmail = process.env.EMAIL_USER;

    let oAuth2Client = new google.auth.OAuth2(clientID, clientSecret, redirectURI);
    oAuth2Client.setCredentials({ refresh_token: refreshToken });
    let accessToken = await oAuth2Client.getAccessToken();
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: userEmail,
            clientId: clientID,
            clientSecret: clientSecret,
            refreshToken: refreshToken,
            accessToken: accessToken,
            accessType: 'offline'
        }
    });
    var mailOptions = {
        from: userEmail,
        to: toAddress,
        subject: title,
        text: body
    };
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            //TODO: Handle errors properly
            console.error(error);
        }
    });
}