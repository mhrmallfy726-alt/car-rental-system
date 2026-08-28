const otpGenerator = require('otp-generator');
const nodemailer = require('nodemailer');
const dns = require('dns');
require('dotenv').config();

dns.setDefaultResultOrder('ipv4first');

const smtpPort = Number(process.env.SMTP_PORT || 587);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: smtpPort,
  secure: smtpPort === 465,
  family: 4,
  lookup: (hostname, options, callback) => {
    dns.lookup(hostname, { family: 4, all: false }, callback);
  },
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 8000,
  greetingTimeout: 8000,
  socketTimeout: 8000,
});

const generateOTP = () => {
    return otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
      digits: true,
    });
  };
const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });

    console.log("Email sent successfully");
  } catch (error) {
    console.error("Email sending failed:", error);
    throw error;
  }
};

module.exports = {
    sendEmail,
    generateOTP,
  };