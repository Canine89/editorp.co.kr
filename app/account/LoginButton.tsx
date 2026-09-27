"use client";
import { signIn } from "next-auth/react";

export function LoginButton() {
  return (
    <button type="button" className="btn btn-primary" onClick={() => signIn("google", { callbackUrl: "/account" })}>
      구글로 로그인
    </button>
  );
}
