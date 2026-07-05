import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { isGoogleAuthEnabled, isGithubAuthEnabled } from "@/lib/auth/server";
import { SignUpForm } from "@/components/auth/SignUpForm";

export default async function SignUpPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <SignUpForm
        googleEnabled={isGoogleAuthEnabled()}
        githubEnabled={isGithubAuthEnabled()}
      />
    </div>
  );
}
