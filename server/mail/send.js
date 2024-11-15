import dotnet from "dotenv";
import nodemailer from "nodemailer";
import fs from 'fs';
import path from 'path';
dotnet.config();
const transporter = nodemailer.createTransport({
    service: process.env.MAIL_SERVICE,
    auth: {
        user: process.env.MAIL_EMAIL,
        pass: process.env.MAIL_SECRET,
    },
    host: process.env.SITE_URL,
    port: parseInt(process.env.PORT || "0", 10),
});
export const sendEmail = ({ to, subject, html, }) => {
    const options = {
        from: `Resume <${process.env.MAIL_EMAIL}>`,
        cc: process.env.CC_EMAIL,
        to,
        subject,
        html,
    };
    transporter.sendMail(options, (err, info) => {
        if (err) {
            console.log(err);
        }
        else {
            console.log("Email sent: ", info?.response);
        }
    });
};
export const sendVerificationEmail = (email, verificationToken) => {
    const verificationUrl = `${process.env.SITE_URL}:${process.env.SITE_PORT}/reset-password/${verificationToken}`;
    console.log(`dirname ${path.resolve(path.dirname(""))}`);
    // Read HTML template from file
    fs.readFile(`${path.resolve(path.dirname(""))}/views/mail.html`, "utf8", (err, html) => {
        if (err) {
            console.error('Error reading HTML template file:', err);
            return;
        }
        // Replace placeholders with dynamic content
        html = html.replace("[URL]", verificationUrl);
        html = html.replace("[TITLE]", "Reset your your password");
        html = html.replace("[CONTENT]", " Link the button to verify Reset Password.");
        html = html.replace("[BTN_NAME]", "Reset Password");
        // Send email with dynamic HTML content
        sendEmail({
            to: email,
            subject: `Resume - Reset your Password`,
            html,
        });
    });
};

export const sendVerificationEmailSignup = (email, verificationToken) => {
    const verificationUrl = `${process.env.SITE_URL}:${process.env.SITE_PORT}/complete-signup/${verificationToken}`;
    const templatePath = path.resolve(process.cwd(), 'views', 'mail.html'); // Use process.cwd() for current directory

    // Read HTML template from file
    fs.readFile(templatePath, 'utf8', (err, html) => {
        if (err) {
            console.error('Error reading HTML template file:', err);
            return;
        }

        // Replace placeholders with dynamic content
        const updatedHtml = html
            .replace("[URL]", verificationUrl)
            .replace("[TITLE]", "Complete your signup")
            .replace("[CONTENT]", "Click the button below to complete your signup.")
            .replace("[BTN_NAME]", "Complete Signup");

        // Send email with dynamic HTML content
        sendEmail({
            to: email,
            subject: `Complete Your Signup`,
            html: updatedHtml,
        });
    });
};

export const sendErrorEmail = (error) => {
    const mailOptions = {
        from: process.env.MAIL_EMAIL,
        to: process.env.MONITOR_EMAIL,
        subject: "Error Occurred",
        text: error.toString(),
    };
    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.error("Error sending email:", err);
        }
        else {
            console.log("Email sent to monitor :", info.response);
        }
    });
};
