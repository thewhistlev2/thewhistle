const sgMail = require('@sendgrid/mail')


exports.send = async function(toAddress, title, body) {
    sgMail.setApiKey(process.env.EMAIL_SENDGRID_API_KEY)
    const fromAddress = process.env.EMAIL_USER;

    const msg = {
        to: toAddress, // Change to your recipient
        from: fromAddress, // Change to your verified sender
        subject: title,
        text: body
    }

    sgMail
        .send(msg)
        .catch((error) => {
            console.error(error)
        })
}