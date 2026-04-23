"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { authApi } from "@/lib/api";
import { getApiError } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

const schema = z.object({
  email: z.string().email("Invalid email address"),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setError("");
    try {
      await authApi.forgotPassword(data.email);
      setSubmitted(true);
    } catch (err) {
      setError(getApiError(err, "Something went wrong. Please try again."));
    }
  }

  return (
    <Card className="w-full max-w-sm shadow-2xl">
      <CardHeader className="text-center">
        <div className="text-2xl font-bold text-blue-600 mb-1">BillFlow</div>
        <CardTitle className="text-xl">Forgot password</CardTitle>
        <CardDescription>
          {submitted
            ? "Check your inbox"
            : "Enter your email and we'll send you a reset link"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {submitted ? (
          <div className="flex flex-col items-center gap-4 py-2 text-center">
            <CheckCircle className="text-green-500" size={40} />
            <p className="text-sm text-slate-600">
              If that email is registered you will receive a reset link shortly.
              Check your spam folder if it doesn't arrive within a few minutes.
            </p>
            <Link href="/login" className="text-sm text-blue-600 hover:underline font-medium">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                className="mt-1"
                {...register("email")}
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Sending…" : "Send reset link"}
            </Button>
            <p className="text-center text-sm text-slate-500">
              <Link href="/login" className="text-blue-600 hover:underline font-medium">
                Back to sign in
              </Link>
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
