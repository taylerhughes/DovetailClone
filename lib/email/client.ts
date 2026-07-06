import { SESClient } from "@aws-sdk/client-ses";

let client: SESClient | null = null;

export function isEmailEnabled(): boolean {
  return Boolean(process.env.EMAIL_FROM_ADDRESS);
}

export function getSesClient(): SESClient {
  if (!process.env.EMAIL_FROM_ADDRESS) {
    throw new Error("EMAIL_FROM_ADDRESS is not set; email sending is disabled.");
  }
  if (!client) {
    client = new SESClient({ region: process.env.AWS_REGION ?? "us-east-1" });
  }
  return client;
}

export function getEmailFromAddress(): string {
  const from = process.env.EMAIL_FROM_ADDRESS;
  if (!from) {
    throw new Error("EMAIL_FROM_ADDRESS is not set; email sending is disabled.");
  }
  return from;
}
