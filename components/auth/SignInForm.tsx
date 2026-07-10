"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { InputAction } from "@/components/ui/input-action";
import { Input } from "@/components/ui/input";
import { WillardLogo } from "@/components/ui/willard-logo";
import { authClient } from "@/lib/auth/client";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 40 40" className="size-5 shrink-0" aria-hidden>
      <path d="M29.6 20.2273C29.6 19.5182 29.5364 18.8364 29.4182 18.1818H20V22.05H25.3818C25.15 23.3 24.4455 24.3591 23.3864 25.0682V27.5773H26.6182C28.5091 25.8364 29.6 23.2727 29.6 20.2273Z" fill="#4285F4"/>
      <path d="M20 30C22.7 30 24.9636 29.1045 26.6181 27.5773L23.3863 25.0682C22.4909 25.6682 21.3454 26.0227 20 26.0227C17.3954 26.0227 15.1909 24.2636 14.4045 21.9H11.0636V24.4909C12.7091 27.7591 16.0909 30 20 30Z" fill="#34A853"/>
      <path d="M14.4045 21.9C14.2045 21.3 14.0909 20.6591 14.0909 20C14.0909 19.3409 14.2045 18.7 14.4045 18.1V15.5091H11.0636C10.3864 16.8591 10 18.3864 10 20C10 21.6136 10.3864 23.1409 11.0636 24.4909L14.4045 21.9Z" fill="#FBBC04"/>
      <path d="M20 13.9773C21.4681 13.9773 22.7863 14.4818 23.8227 15.4727L26.6909 12.6045C24.9591 10.9909 22.6954 10 20 10C16.0909 10 12.7091 12.2409 11.0636 15.5091L14.4045 18.1C15.1909 15.7364 17.3954 13.9773 20 13.9773Z" fill="#E94235"/>
    </svg>
  );
}

function WillardMark() {
  return (
    <div className="flex size-11 items-center justify-center rounded-lg bg-foreground">
      <WillardLogo className="size-6 text-background" />
    </div>
  );
}

export function SignInForm({
  googleEnabled,
  githubEnabled,
}: {
  googleEnabled: boolean;
  githubEnabled: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    const { error } = await authClient.signIn.email({ email, password });
    setIsSubmitting(false);
    if (error) {
      toast.error(error.message ?? "Sign in failed");
      return;
    }
    router.push("/");
    router.refresh();
  }

  async function handleSocial(provider: "google" | "github") {
    await authClient.signIn.social({ provider, callbackURL: "/" });
  }

  const hasSocial = googleEnabled || githubEnabled;

  return (
    <div className="flex w-full flex-col items-center justify-center px-9 sm:w-[480px] sm:px-0">
      <div className="self-start">
        <WillardMark />
      </div>

      <div className="flex w-full flex-col gap-1.5 py-6">
        <p className="font-type-heading text-fs-400 font-bold text-foreground">Willard</p>
        <p className="font-type-body text-fs-100 text-muted-foreground">Sign in to your workspace</p>
      </div>

      <div className="flex w-full flex-col gap-3">
        {hasSocial && (
          <>
            {googleEnabled && (
              <button
                type="button"
                onClick={() => handleSocial("google")}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-md border bg-background px-4 font-type-body text-fs-100 font-medium text-foreground shadow-sm hover:bg-muted transition-colors"
              >
                <GoogleIcon />
                Continue with Google
              </button>
            )}
            {githubEnabled && (
              <button
                type="button"
                onClick={() => handleSocial("github")}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-md border bg-background px-4 font-type-body text-fs-100 font-medium text-foreground shadow-sm hover:bg-muted transition-colors"
              >
                Continue with GitHub
              </button>
            )}
          </>
        )}
      </div>

      {hasSocial && (
        <div className="relative flex w-full items-center gap-2 py-6">
          <div className="h-px flex-1 bg-border" />
          <span className="font-type-body text-fs-75 text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
        <InputAction
          type="email"
          autoFocus
          required
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type="password"
          required
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-11 text-fs-100 font-type-body"
        />
        <button
          type="submit"
          disabled={isSubmitting || !email || !password}
          className="hidden"
          aria-hidden
        />
        <div className="flex items-center justify-between font-type-body text-fs-75 text-muted-foreground">
          <Link href="/sign-up" className="hover:text-foreground transition-colors">
            Create an account
          </Link>
          <Link href="/forgot-password" className="hover:text-foreground transition-colors">
            Forgot password?
          </Link>
        </div>
      </form>
    </div>
  );
}
