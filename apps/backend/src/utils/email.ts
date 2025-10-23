import nodemailer from 'nodemailer';
import config from '../config';
import logger from './logger';

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: config.email.smtp.host,
  port: config.email.smtp.port,
  secure: config.email.smtp.secure,
  auth: {
    user: config.email.smtp.user,
    pass: config.email.smtp.pass
  }
});

/**
 * Send email verification
 */
export async function sendVerificationEmail(
  to: string,
  username: string,
  verificationToken: string
): Promise<void> {
  const verificationUrl = `${config.urls.frontend}/verify-email?token=${verificationToken}`;

  try {
    await transporter.sendMail({
      from: config.email.from,
      to,
      subject: 'Verify your Perper Wallet email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to Perper Wallet, ${username}!</h2>
          <p>Thank you for registering. Please verify your email address by clicking the link below:</p>
          <p>
            <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #F59E0B; color: white; text-decoration: none; border-radius: 4px;">
              Verify Email
            </a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all;">${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <p><strong>Note:</strong> Your account requires admin approval before you can log in.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #6b7280;">
            This is a closed, centralized token system, not cryptocurrency or e-money.
            No withdrawals or external transfers. Token purchases are non-refundable except where required by law.
          </p>
        </div>
      `
    });
    logger.info(`Verification email sent to ${to}`);
  } catch (error) {
    logger.error('Failed to send verification email:', error);
    throw error;
  }
}

/**
 * Send approval notification
 */
export async function sendApprovalEmail(to: string, username: string): Promise<void> {
  const loginUrl = `${config.urls.frontend}/login`;

  try {
    await transporter.sendMail({
      from: config.email.from,
      to,
      subject: 'Your Perper Wallet account has been approved',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Great news, ${username}!</h2>
          <p>Your Perper Wallet account has been approved by our administrators.</p>
          <p>You can now log in and start using your wallet:</p>
          <p>
            <a href="${loginUrl}" style="display: inline-block; padding: 12px 24px; background-color: #F59E0B; color: white; text-decoration: none; border-radius: 4px;">
              Log In
            </a>
          </p>
          <p>Welcome to Perper Wallet!</p>
        </div>
      `
    });
    logger.info(`Approval email sent to ${to}`);
  } catch (error) {
    logger.error('Failed to send approval email:', error);
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  to: string,
  username: string,
  resetToken: string
): Promise<void> {
  const resetUrl = `${config.urls.frontend}/reset-password?token=${resetToken}`;

  try {
    await transporter.sendMail({
      from: config.email.from,
      to,
      subject: 'Reset your Perper Wallet password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Hello ${username},</p>
          <p>We received a request to reset your password. Click the link below to create a new password:</p>
          <p>
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #F59E0B; color: white; text-decoration: none; border-radius: 4px;">
              Reset Password
            </a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all;">${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, you can safely ignore this email.</p>
        </div>
      `
    });
    logger.info(`Password reset email sent to ${to}`);
  } catch (error) {
    logger.error('Failed to send password reset email:', error);
    throw error;
  }
}

/**
 * Send purchase receipt email
 */
export async function sendPurchaseReceiptEmail(
  to: string,
  username: string,
  details: {
    token: string;
    amount: number;
    fiatAmount: number;
    currency: string;
    transactionId: string;
  }
): Promise<void> {
  try {
    await transporter.sendMail({
      from: config.email.from,
      to,
      subject: 'Purchase Receipt - Perper Wallet',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Purchase Successful!</h2>
          <p>Hello ${username},</p>
          <p>Your token purchase has been completed successfully.</p>
          <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Token:</td>
                <td style="padding: 8px 0; text-align: right;">${details.token}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Amount:</td>
                <td style="padding: 8px 0; text-align: right;">${details.amount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Price:</td>
                <td style="padding: 8px 0; text-align: right;">${details.fiatAmount} ${details.currency}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Transaction ID:</td>
                <td style="padding: 8px 0; text-align: right; font-family: monospace; font-size: 12px;">${details.transactionId}</td>
              </tr>
            </table>
          </div>
          <p>The tokens have been added to your wallet.</p>
          <p>Thank you for your purchase!</p>
        </div>
      `
    });
    logger.info(`Purchase receipt email sent to ${to}`);
  } catch (error) {
    logger.error('Failed to send purchase receipt email:', error);
  }
}

/**
 * Send transaction notification email
 */
export async function sendTransactionEmail(
  to: string,
  username: string,
  details: {
    type: 'sent' | 'received';
    token: string;
    amount: number;
    from?: string;
    toRecipient?: string;
    transactionId: string;
  }
): Promise<void> {
  try {
    const subject = details.type === 'sent' ? 'Tokens Sent' : 'Tokens Received';
    const action = details.type === 'sent' ? 'sent' : 'received';

    await transporter.sendMail({
      from: config.email.from,
      to,
      subject: `${subject} - Perper Wallet`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>${subject}</h2>
          <p>Hello ${username},</p>
          <p>You have ${action} tokens:</p>
          <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Token:</td>
                <td style="padding: 8px 0; text-align: right;">${details.token}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Amount:</td>
                <td style="padding: 8px 0; text-align: right;">${details.amount}</td>
              </tr>
              ${details.from ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">From:</td>
                <td style="padding: 8px 0; text-align: right;">${details.from}</td>
              </tr>
              ` : ''}
              ${details.toRecipient ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">To:</td>
                <td style="padding: 8px 0; text-align: right;">${details.toRecipient}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Transaction ID:</td>
                <td style="padding: 8px 0; text-align: right; font-family: monospace; font-size: 12px;">${details.transactionId}</td>
              </tr>
            </table>
          </div>
        </div>
      `
    });
    logger.info(`Transaction email sent to ${to}`);
  } catch (error) {
    logger.error('Failed to send transaction email:', error);
  }
}
