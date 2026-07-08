import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { AcceptInvitationButton } from "@/components/organizations/AcceptInvitationButton";
import { Text } from "@/components/ui/text";

export default async function AcceptInvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const user = await requireUser();

  const invitation = id
    ? await db.invitation.findUnique({
        where: { id },
        include: { organization: { select: { id: true, name: true } } },
      })
    : null;

  const isValid =
    invitation &&
    invitation.status === "pending" &&
    invitation.expiresAt > new Date();
  const isForThisUser =
    isValid && invitation.email.toLowerCase() === user.email.toLowerCase();

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="flex w-full max-w-sm flex-col items-center gap-3 text-center">
        {!invitation || !isValid ? (
          <Text size={100} color="subdued">This invitation link is invalid or has expired.</Text>
        ) : !isForThisUser ? (
          <Text size={100} color="subdued">
            This invitation was sent to {invitation.email}. Sign in with that email address to accept it.
          </Text>
        ) : (
          <>
            <Text size={100}>
              You&rsquo;ve been invited to join{" "}
              <Text as="span" size={100} weight="medium">{invitation.organization.name}</Text>{" "}
              as {invitation.role ?? "a member"}.
            </Text>
            <AcceptInvitationButton
              invitationId={invitation.id}
              organizationId={invitation.organization.id}
            />
          </>
        )}
      </div>
    </div>
  );
}
