import nodemailer from "nodemailer";

const sendMail = async function ({ to, subject, text, html }) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST,
      port: process.env.MAILTRAP_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.MAILTRAP_USERNAME,
        pass: process.env.MAILTRAP_PASSWORD,
      },
    });

    const mailOption = {
      from: process.env.MAILTRAP_SENDEREMAIL,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOption);
    console.log("Email sent: ", info.messageId);
    return info;
  } catch (error) {
    console.error("Email sending failed:", error);
    throw new Error("Email could not be sent");
  }
};

export default sendMail;
