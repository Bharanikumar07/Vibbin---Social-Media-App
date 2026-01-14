import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendEmail = async (to: string, subject: string, text: string) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('Provide EMAIL_USER and EMAIL_PASS in .env to send real emails.');
            console.log(`[Mock Email] To: ${to}, Subject: ${subject}, Body: ${text}`);
            return { sent: false, mock: true };
        }

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            text,
        });
        console.log(`Email sent to ${to}`);
        return { sent: true, mock: false };
    } catch (error) {
        console.error('Error sending email:', error);
        return { sent: false, error };
    }
};
