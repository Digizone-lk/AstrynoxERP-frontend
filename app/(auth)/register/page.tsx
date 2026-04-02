"use client";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api";
import { getApiError } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CURRENCIES } from "@/lib/constants";
import { toast } from "sonner";

const schema = z.object({
  org_name: z.string().min(1, "Organization name is required"),
  org_slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
  currency: z.string().min(1, "Currency is required"),
  full_name: z.string().min(1, "Your name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();

  const { register, handleSubmit, setValue, watch, control, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { currency: "USD" },
  });

  function handleOrgNameChange(val: string) {
    setValue("org_name", val);
    setValue("org_slug", val.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""), { shouldValidate: true });
  }

  async function onSubmit(data: FormData) {
    try {
      await authApi.register(data);
      const secure = window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `has_account=1; max-age=2592000; path=/; SameSite=Lax${secure}`;
      toast.success("Organization created! Welcome to BillFlow.");
      router.replace("/dashboard");
    } catch (err) {
      toast.error(getApiError(err, "Registration failed"));
    }
  }

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center">
        <div className="text-2xl font-bold text-blue-600 mb-1">BillFlow</div>
        <CardTitle className="text-xl">Create your organization</CardTitle>
        <CardDescription>Set up your account and start billing</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Organization Name</Label>
            <Input
              placeholder="Acme Corp"
              className="mt-1"
              value={watch("org_name") ?? ""}
              onChange={(e) => handleOrgNameChange(e.target.value)}
            />
            {errors.org_name && <p className="text-xs text-red-500 mt-1">{errors.org_name.message}</p>}
          </div>
          <div>
            <Label>Slug</Label>
            <Input
              placeholder="acme-corp"
              className="mt-1"
              {...register("org_slug")}
            />
            {errors.org_slug
              ? <p className="text-xs text-red-500 mt-1">{errors.org_slug.message}</p>
              : <p className="text-xs text-slate-500 mt-1">Used in your unique URL</p>
            }
          </div>
          <div>
            <Label>Currency</Label>
            <Controller
              name="currency"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.currency && <p className="text-xs text-red-500 mt-1">{errors.currency.message}</p>}
          </div>
          <div>
            <Label>Your Name</Label>
            <Input
              placeholder="John Smith"
              className="mt-1"
              {...register("full_name")}
            />
            {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name.message}</p>}
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              placeholder="you@company.com"
              className="mt-1"
              {...register("email")}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <Label>Password</Label>
            <Input
              type="password"
              placeholder="••••••••"
              className="mt-1"
              {...register("password")}
            />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating…" : "Create Organization"}
          </Button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
