const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  // For development, use ethereal email (fake SMTP service)
  // For production, configure with real SMTP credentials
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  } else {
    // For development without email config, log to console
    console.log('⚠️  Email service not configured. Set EMAIL_HOST, EMAIL_USER, and EMAIL_PASSWORD in .env');
    return null;
  }
};

// Send verification email
const sendVerificationEmail = async (email, name, verificationToken) => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      // If no transporter, just log the verification link
      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${verificationToken}`;
      console.log('\n📧 Email Verification Link (Copy this link):');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`To: ${email}`);
      console.log(`Link: ${verificationUrl}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      return { success: true, isDevelopment: true };
    }

    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${verificationToken}`;

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Inventory Management'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email - Grocery Inventory Management',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border: 1px solid #ddd;
              border-top: none;
            }
            .button {
              display: inline-block;
              padding: 15px 30px;
              margin: 20px 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #666;
              font-size: 12px;
              border: 1px solid #ddd;
              border-top: none;
              border-radius: 0 0 10px 10px;
              background: #f9f9f9;
            }
            .warning {
              background: #fff3cd;
              border: 1px solid #ffc107;
              padding: 10px;
              margin: 15px 0;
              border-radius: 5px;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🛒 Welcome to Grocery Inventory Management</h1>
          </div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            <p>Thank you for registering with us. We're excited to have you on board!</p>
            <p>To complete your registration and activate your account, please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="background: #fff; padding: 10px; border: 1px solid #ddd; border-radius: 5px; word-break: break-all;">
              ${verificationUrl}
            </p>
            
            <div class="warning">
              ⏰ <strong>Note:</strong> This verification link will expire in 24 hours for security reasons.
            </div>
            
            <p>If you didn't create an account with us, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Grocery Inventory Management. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to: ${email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    return { success: false, error: error.message };
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, name, resetToken) => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
      console.log('\n📧 Password Reset Link (Copy this link):');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`To: ${email}`);
      console.log(`Link: ${resetUrl}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      return { success: true, isDevelopment: true };
    }

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Inventory Management'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request - Grocery Inventory Management',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border: 1px solid #ddd;
              border-top: none;
            }
            .button {
              display: inline-block;
              padding: 15px 30px;
              margin: 20px 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #666;
              font-size: 12px;
              border: 1px solid #ddd;
              border-top: none;
              border-radius: 0 0 10px 10px;
              background: #f9f9f9;
            }
            .warning {
              background: #fff3cd;
              border: 1px solid #ffc107;
              padding: 10px;
              margin: 15px 0;
              border-radius: 5px;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="background: #fff; padding: 10px; border: 1px solid #ddd; border-radius: 5px; word-break: break-all;">
              ${resetUrl}
            </p>
            
            <div class="warning">
              ⏰ <strong>Note:</strong> This reset link will expire in 1 hour for security reasons.
            </div>
            
            <p><strong>If you didn't request this password reset, please ignore this email and your password will remain unchanged.</strong></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Grocery Inventory Management. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to: ${email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail
};
