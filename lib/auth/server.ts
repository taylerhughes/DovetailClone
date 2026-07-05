import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "@/lib/db";

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    organization({
      // Teams are a separate sub-feature of this plugin (project-team
      // groupings within an org) that we don't use — this app already has
      // its own unrelated TeamMember model (assignee labels for the PERSON
      // field type), so leaving teams disabled avoids generating a second,
      // colliding Team/TeamMember model.
      teams: { enabled: false },
      // No email-sending integration exists in this app. The inviter's own
      // org settings page shows the invite as a copyable accept-link
      // instead, so this hook only needs to log for local dev visibility.
      async sendInvitationEmail(data) {
        const url = `${process.env.BETTER_AUTH_URL ?? "http://localhost:3000"}/organizations/accept-invitation?id=${data.id}`;
        console.log(`[organization] invite ${data.email} to ${data.organization.name}: ${url}`);
      },
    }),
  ],
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          },
        }
      : {}),
  },
});

export function isGoogleAuthEnabled(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function isGithubAuthEnabled(): boolean {
  return Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
}
