"use client";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api";
import { getApiError } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

const schema = z
  .object({
    new_password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type FormData = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setError("");
    if (!token) {
      setError("Reset link is missing or invalid. Please request a new one.");
      return;
    }
    try {
      await authApi.resetPassword(token, data.new_password);
      setDone(true);
      setTimeout(() => router.replace("/login"), 3000);
    } catch (err) {
      setError(getApiError(err, "Invalid or expired reset link. Please request a new one."));
    }
  }

  return (
    <Card className="w-full max-w-sm shadow-2xl">
      <CardHeader className="text-center">
        <div className="text-2xl font-bold text-blue-600 mb-1">BillFlow</div>
        <CardTitle className="text-xl">Reset password</CardTitle>
        <CardDescription>
          {done ? "Password updated" : "Enter your new password below"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {done ? (
          <div className="flex flex-col items-center gap-4 py-2 text-center">
            <CheckCircle className="text-green-500" size={40} />
            <p className="text-sm text-slate-600">
              Your password has been reset. Redirecting you to sign in…
            </p>
            <Link href="/login" className="text-sm text-blue-600 hover:underline font-medium">
              Sign in now
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="new_password">New password</Label>
              <Input
                id="new_password"
                type="password"
                placeholder="••••••••"
                className="mt-1"
                {...register("new_password")}
              />
              {errors.new_password && (
                <p className="text-xs text-red-500 mt-1">{errors.new_password.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="confirm_password">Confirm new password</Label>
              <Input
                id="confirm_password"
                type="password"
                placeholder="••••••••"
                className="mt-1"
                {...register("confirm_password")}
              />
              {errors.confirm_password && (
                <p className="text-xs text-red-500 mt-1">{errors.confirm_password.message}</p>
              )}
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting || !token}>
              {isSubmitting ? "Saving…" : "Set new password"}
            </Button>
            <p className="text-center text-sm text-slate-500">
              <Link href="/forgot-password" className="text-blue-600 hover:underline font-medium">
                Request a new link
              </Link>
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
