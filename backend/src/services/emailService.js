const https = require('https');
const otpGenerator = require('otp-generator');
require('dotenv').config();

const generateOTP = () => otpGenerator.generate(6, {
  upperCaseAlphabets: false,
  lowerCaseAlphabets: false,
  specialChars: false,
  digits: true,
});

const brevoRequest = (payload) => new Promise((resolve, reject) => {
  const request = https.request(
    'https://api.brevo.com/v3/smtp/email',
    {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(payload),
      },
      timeout: 10000,
    },
    (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => {
        const statusCode = response.statusCode || 500;
        if (statusCode >= 200 && statusCode < 300) {
          resolve(body ? JSON.parse(body) : {});
          return;
        }

        reject(new Error(`Brevo API ${statusCode}: ${body}`));
      });
    }
  );

  request.on('timeout', () => request.destroy(new Error('Brevo API connection timeout')));
  request.on('error', reject);
  request.write(payload);
  request.end();
});

const sendEmail = async (to, subject, html) => {
  if (!process.env.BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY is not configured');
  }

  if (!process.env.EMAIL_FROM) {
    throw new Error('EMAIL_FROM is not configured');
  }

  try {
    const result = await brevoRequest(JSON.stringify({
      sender: {
        email: process.env.EMAIL_FROM,
        name: process.env.EMAIL_FROM_NAME || 'Car Rental',
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }));

    console.log('Email sent successfully through Brevo');
    return result;
  } catch (error) {
    console.error('Email sending failed:', error.message);
    throw error;
  }
};

module.exports = {
  sendEmail,
  generateOTP,
};
