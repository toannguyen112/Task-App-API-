const sgMail = require('@sendgrid/mail');
const SENDGRID_API_KEY =
    "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";
sgMail.setApiKey(SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'nguyencongtoana1nhvt@gmail.com',
        subject: "Thanks to you",
        text: `Welcome to the app , ${name}. Let me know how you get along with the app`
    })
}

module.exports = {
    sendWelcomeEmail
}



