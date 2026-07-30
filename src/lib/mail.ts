import nodemailer from 'nodemailer';
import type { CandidateRow } from './db';
import { fmtDate } from './dates';
import { companyOrDefault } from './companies';

/**
 * Invite delivery over Google Workspace SMTP, mirroring the SRP website's
 * enquiry mailer: authenticate as a real Workspace mailbox (SMTP_USER) with a
 * 16-char App Password (SMTP_PASS; 2-Step Verification must be enabled on
 * that account). MAIL_FROM may differ from SMTP_USER only if the account is
 * authorised to "Send mail as" it — otherwise Gmail rewrites the From header.
 *
 * When SMTP is unconfigured the app still works: invites are created and the
 * link can be copied manually; send attempts report a clear error instead.
 */

const MAIL_FROM = process.env.MAIL_FROM || process.env.SMTP_USER;
/** Optional CC on every invite (e.g. the HR coordinator's mailbox). */
const MAIL_CC = (process.env.MAIL_CC || '').trim();

export const mailConfigured = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

const mailer = mailConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: (process.env.SMTP_SECURE || 'true') !== 'false', // true for port 465
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export type SendOutcome = 'sent' | 'unconfigured' | 'failed';

export async function sendInviteEmail(c: CandidateRow, link: string): Promise<SendOutcome> {
  if (!mailer) return 'unconfigured';

  const minutes = Math.round(c.duration_sec / 60);
  // Salutations use the first name only; fall back to the first word for
  // records created before the name was stored in parts.
  const dear = c.first_name || c.name.split(/\s+/)[0];
  const company = companyOrDefault(c.company);
  const expires = fmtDate(c.expires_at);
  const forRole = c.position ? ` for the position of ${c.position}` : '';

  const text = [
    `Dear ${dear},`,
    '',
    `As part of your application${forRole} with ${company}, you are invited to complete an online cognitive aptitude assessment.`,
    '',
    `Your personal test link:`,
    link,
    '',
    `Before you begin:`,
    `- The assessment has 30 multiple-choice questions and a ${minutes}-minute time limit.`,
    `- The clock starts only when you press Begin, not when you open the link.`,
    `- Complete it in one sitting, in a quiet place, without calculators, notes or assistance.`,
    `- The link is personal to you and works for one attempt only.`,
    `- Please complete the assessment by ${expires}.`,
    '',
    `If you have any questions, simply reply to this email.`,
    '',
    `Kind regards,`,
    `SRP International — Human Resources`,
  ].join('\n');

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a;max-width:560px">
      <p>Dear ${esc(dear)},</p>
      <p>As part of your application${esc(forRole)} with ${esc(company)}, you are invited to complete
         an online cognitive aptitude assessment.</p>
      <p style="margin:24px 0">
        <a href="${esc(link)}" style="background:#1a56db;color:#ffffff;text-decoration:none;
           padding:12px 24px;border-radius:6px;font-weight:bold;display:inline-block">
          Start the Assessment</a>
      </p>
      <p style="font-size:13px;color:#555">Or copy this link into your browser:<br>
        <span style="word-break:break-all">${esc(link)}</span></p>
      <p><b>Before you begin:</b></p>
      <ul>
        <li>The assessment has 30 multiple-choice questions and a <b>${minutes}-minute</b> time limit.</li>
        <li>The clock starts only when you press <b>Begin</b>, not when you open the link.</li>
        <li>Complete it in one sitting, in a quiet place, without calculators, notes or assistance.</li>
        <li>The link is personal to you and works for <b>one attempt only</b>.</li>
        <li>Please complete the assessment by <b>${esc(expires)}</b>.</li>
      </ul>
      <p>If you have any questions, simply reply to this email.</p>
      <p>Kind regards,<br>SRP International &mdash; Human Resources</p>
    </div>`;

  try {
    await mailer.sendMail({
      from: `"SRP International HR" <${MAIL_FROM}>`,
      // Object form: nodemailer handles display-name quoting/encoding itself.
      to: { name: c.name, address: c.email },
      ...(MAIL_CC ? { cc: MAIL_CC } : {}),
      subject: `Your Assessment Invitation — ${company}`,
      text,
      html,
    });
    return 'sent';
  } catch (err) {
    console.error('[mail] Failed to send invite email:', (err as Error)?.message);
    return 'failed';
  }
}
