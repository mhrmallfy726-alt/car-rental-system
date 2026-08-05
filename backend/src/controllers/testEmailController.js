const { sendEmail } = require("../services/emailService");

const testEmail = async (req, res) => {
  try {
    await sendEmail(
      "ضع_بريدك@gmail.com",
      "اختبار البريد",
      "<h2>تم إرسال الرسالة بنجاح ✅</h2>"
    );

    res.json({
      success: true,
      message: "تم إرسال البريد بنجاح"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = { testEmail };