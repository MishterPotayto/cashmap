import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

const from = process.env.RESEND_FROM_EMAIL ?? "noreply@updates.cashmapnz.com";
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function sendVerificationEmail({
  to,
  token,
}: {
  to: string;
  token: string;
}) {
  const verifyUrl = `${appUrl}/api/auth/verify?token=${token}`;
  return resend.emails.send({
    from: `CashMap <${from}>`,
    to,
    subject: "Verify your CashMap email",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a56db;">Verify your email</h2>
        <p>Thanks for signing up for CashMap. Please verify your email to get started.</p>
        <a href="${verifyUrl}"
           style="display: inline-block; background: #1a56db; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
          Verify Email
        </a>
        <p style="color: #6b7280; font-size: 14px;">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
      </div>
    `,
  });
}

export async function sendClientInviteEmail({
  to,
  adviserName,
  orgName,
  token,
}: {
  to: string;
  adviserName: string;
  orgName: string;
  token: string;
}) {
  return resend.emails.send({
    from: `CashMap <${from}>`,
    to,
    subject: `You've been invited to CashMap by ${adviserName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a56db;">You're invited to CashMap</h2>
        <p>${adviserName} from <strong>${orgName}</strong> has invited you to manage your budget on CashMap.</p>
        <p>CashMap helps you understand where your money goes with smart transaction categorisation and budget tracking.</p>
        <a href="${appUrl}/invite/${token}"
           style="display: inline-block; background: #1a56db; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
          Accept Invitation
        </a>
        <p style="color: #6b7280; font-size: 14px;">This invitation expires in 7 days.</p>
      </div>
    `,
  });
}

export async function sendWelcomeEmail({ to, name }: { to: string; name: string }) {
  return resend.emails.send({
    from: `CashMap <${from}>`,
    to,
    subject: "Welcome to CashMap!",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a56db;">Welcome to CashMap, ${name}!</h2>
        <p>You're all set up. Here's how to get started:</p>
        <ol>
          <li><strong>Upload a bank statement</strong> — drag and drop a CSV file</li>
          <li><strong>Review categories</strong> — CashMap auto-categorises your transactions</li>
          <li><strong>Set up your budget</strong> — enter your income and expenses</li>
          <li><strong>See your waterfall</strong> — watch your money flow</li>
        </ol>
        <a href="${appUrl}/dashboard"
           style="display: inline-block; background: #1a56db; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
          Go to Dashboard
        </a>
      </div>
    `,
  });
}

export async function sendProConfirmationEmail({ to, name }: { to: string; name: string }) {
  return resend.emails.send({
    from: `CashMap <${from}>`,
    to,
    subject: "CashMap Pro — you're all set!",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a56db;">Welcome to CashMap Pro, ${name}!</h2>
        <p>You now have access to all Pro features:</p>
        <ul>
          <li>Client management dashboard</li>
          <li>Advanced reports (trends, budget vs actual, income vs expenses)</li>
          <li>Unlimited goals and transaction history</li>
          <li>Organisation-level mapping rules</li>
        </ul>
        <p><strong>Ready to invite your first client?</strong></p>
        <a href="${appUrl}/clients"
           style="display: inline-block; background: #1a56db; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
          Manage Clients
        </a>
      </div>
    `,
  });
}
