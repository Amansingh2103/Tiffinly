// TEMPORARY VERSION WITHOUT NODEMAILER
// Replace this file with the full implementation after installing nodemailer

import nodemailer from 'nodemailer';

// Create a transporter using the provided credentials
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'pythoncoding4u@gmail.com',
    pass: 'bbxemzstvizslzbp' // App password
  }
});

// Function to send OTP via email
export const sendOTPEmail = async (email, otp) => {
  try {
    console.log(`Sending OTP ${otp} to email: ${email}`);
    
    const mailOptions = {
      from: 'pythoncoding4u@gmail.com',
      to: email,
      subject: 'Your OTP for Registration',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #6b46c1;">Verify Your Email</h2>
          </div>
          <p>Thank you for registering with our Tiffin Service. Please use the following OTP to complete your registration:</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="font-size: 24px; font-weight: bold; letter-spacing: 8px; padding: 12px 20px; background-color: #f7f7f7; display: inline-block; border-radius: 6px;">
              ${otp}
            </div>
          </div>
          <p>This OTP is valid for 10 minutes. If you didn't request this, please ignore this email.</p>
          <div style="margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 15px;">
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      `
    };

    // Test the connection first
    try {
      await transporter.verify();
      console.log('SMTP connection verified successfully');
    } catch (verifyError) {
      console.error('SMTP connection verification failed:', verifyError);
      throw verifyError;
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Still log the OTP for testing purposes
    console.log('----------------------------------------');
    console.log(`🔑 FALLBACK - TEST OTP FOR ${email}: ${otp}`);
    console.log('----------------------------------------');
    
    return false;
  }
};

// Verify the transporter connection on startup
transporter.verify()
  .then(() => console.log('SMTP connection verified'))
  .catch(err => console.error('SMTP connection failed:', err));

export default transporter; 