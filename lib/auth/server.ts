import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "@/lib/db";
import { isEmailEnabled } from "@/lib/email/client";
import { sendEmail } from "@/lib/email/send";

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    // Kept non-blocking for now (sign-in still works before verifying) to
    // avoid adding onboarding friction while the client is first getting set
    // up -- sendVerificationEmail below still fires so users *can* verify.
    requireEmailVerification: false,
    async sendResetPassword({ user, url }) {
      if (!isEmailEnabled()) {
        console.log(`[auth] password reset for ${user.email}: ${url}`);
        return;
      }
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        html: `<p>Click the link below to reset your password. This link expires in 1 hour.</p><p><a href="${url}">${url}</a></p>`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    async sendVerificationEmail({ user, url }) {
      if (!isEmailEnabled()) {
        console.log(`[auth] verification email for ${user.email}: ${url}`);
        return;
      }
      await sendEmail({
        to: user.email,
        subject: "Verify your email",
        html: `<p>Click the link below to verify your email address.</p><p><a href="${url}">${url}</a></p>`,
      });
    },
  },
  rateLimit: {
    // Rate limiting is only enabled by default in production; enable it
    // everywhere so dev/staging environments get the same protection.
    enabled: true,
    storage: "database",
    window: 60,
    max: 30,
    customRules: {
      // Stricter limits on the endpoints most attractive to brute-force /
      // account-enumeration attacks.
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 5 },
      "/request-password-reset": { window: 60, max: 3 },
      "/reset-password": { window: 60, max: 5 },
    },
  },
  plugins: [
    organization({
      // Teams are a separate sub-feature of this plugin (project-team
      // groupings within an org) that we don't use — this app already has
      // its own unrelated TeamMember model (assignee labels for the PERSON
      // field type), so leaving teams disabled avoids generating a second,
      // colliding Team/TeamMember model.
      teams: { enabled: false },
      async sendInvitationEmail(data) {
        const url = `${process.env.BETTER_AUTH_URL ?? "http://localhost:3000"}/organizations/accept-invitation?id=${data.id}`;
        if (!isEmailEnabled()) {
          // No email-sending configured -- the inviter's own org settings
          // page still shows the invite as a copyable accept-link, so this
          // is just for local dev visibility, not the only way to invite.
          console.log(`[organization] invite ${data.email} to ${data.organization.name}: ${url}`);
          return;
        }
        await sendEmail({
          to: data.email,
          subject: `You've been invited to join ${data.organization.name}`,
          html: `<p>You've been invited to join <strong>${data.organization.name}</strong>.</p><p><a href="${url}">${url}</a></p>`,
        });
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
