const nodemailer = require("nodemailer");

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(" ")[0];
    this.url = url;
    this.from = `Eslam Alawy <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    // if (process.env.NODE_ENV.trim() === "production") {
    //   // sendgrid
    //   return 1;
    // }

    //)development with ELASTIC email service
    return nodemailer.createTransport({
      host: process.env.ELASTIC_EMAIL_HOST,
      port: process.env.ELASTIC_EMAIL_PORT,
      auth: {
        user: process.env.ELASTIC_EMAIL_USERNAME,
        pass: process.env.ELASTIC_EMAIL_PASSWORD,
      },
    });
  }

  async send(text, subject) {
    // define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      text: text + ` URL : ${this.url}`,
    };

    //3) create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome(txt) {
    await this.send(txt, "Welcome to the Discinema Family!");
  }

  async sendPasswordReset() {
    await this.send(
      "passwordReset",
      "Your password reset token (valid for 10 minutes)"
    );
  }
};
