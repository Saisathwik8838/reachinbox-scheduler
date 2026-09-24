import nodemailer, { Transporter } from "nodemailer";
import { logger } from "../utils/logger.js";

const transporters = new Map<string, Transporter>();

function getTransporter(user: string, pass: string): Transporter {
  let transporter = transporters.get(user);
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user,
        pass,
      },
      pool: true,
      maxConnections: 5,
    });
    transporters.set(user, transporter);
  }
  return transporter;
}

export interface SendMailParams {
  senderUser: string;
  senderPass: string;
  senderEmail: string;
  recipient: string;
  subject: string;
  body: string;
}

export interface SendMailResult {
  messageId: string;
  previewUrl: string | null;
}

// Send an email via Ethereal SMTP and return the messageId and preview URL
export async function sendMail(params: SendMailParams): Promise<SendMailResult> {
  const transporter = getTransporter(params.senderUser, params.senderPass);

  const info = await transporter.sendMail({
    from: `"ReachInbox Dispatch" <${params.senderEmail}>`,
    to: params.recipient,
    subject: params.subject,
    text: params.body,
    html: `<div style="font-family: sans-serif; line-height: 1.6; color: #1e293b;">
      ${params.body.replace(/\n/g, "<br>")}
    </div>`,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info) || null;

  logger.info(`Email sent to ${params.recipient} (${info.messageId})`);

  return {
    messageId: info.messageId,
    previewUrl,
  };
}
