import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { isGoogleAuthEnabled, isGithubAuthEnabled } from "@/lib/auth/server";
import { SignInForm } from "@/components/auth/SignInForm";

export default async function SignInPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <SignInForm
        googleEnabled={isGoogleAuthEnabled()}
        githubEnabled={isGithubAuthEnabled()}
      />
    </div>
  );
}
