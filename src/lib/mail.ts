import nodemailer from "nodemailer";
import { requireAuthUrl } from "@/lib/env";

export function accountLink(pathname: string, token: string): string {
  const base = requireAuthUrl().replace(/\/$/, "");
  const url = new URL(pathname, `${base}/`);
  url.searchParams.set("token", token);
  return url.toString();
}

/** Sends mail only when SMTP is configured. Never logs message bodies. */
export async function sendAccountEmail(to: string, subject: string, text: string): Promise<boolean> {
  const host = process.env.SMTP_HOST?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!host || !from) return false;

  const port = Number(process.env.SMTP_PORT || 587);
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });

  await transporter.sendMail({ from, to, subject, text });
  return true;
}
