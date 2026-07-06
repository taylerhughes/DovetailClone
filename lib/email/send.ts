import { SendEmailCommand } from "@aws-sdk/client-ses";
import { getSesClient, getEmailFromAddress } from "./client";

export { isEmailEnabled } from "./client";

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const client = getSesClient();
  await client.send(
    new SendEmailCommand({
      Source: getEmailFromAddress(),
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject, Charset: "UTF-8" },
        Body: { Html: { Data: html, Charset: "UTF-8" } },
      },
    }),
  );
}
