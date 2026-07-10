import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default async function ForgotPasswordPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <ForgotPasswordForm />
    </div>
  );
}
