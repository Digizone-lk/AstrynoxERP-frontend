"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    org_name: "",
    org_slug: "",
    currency: "USD",
    full_name: "",
    email: "",
    password: "",
  });

  function handleNameChange(val: string) {
    setForm((f) => ({
      ...f,
      org_name: val,
      org_slug: val.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.register(form);
      toast.success("Organization created! Welcome to BillFlow.");
      router.replace("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? "Registration failed");
    } finally {
      setLoading(false);
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Organization Name</Label>
            <Input
              placeholder="Acme Corp"
              value={form.org_name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label>Slug</Label>
            <Input
              placeholder="acme-corp"
              value={form.org_slug}
              onChange={(e) => setForm({ ...form, org_slug: e.target.value })}
              required
              className="mt-1"
            />
            <p className="text-xs text-slate-500 mt-1">Used in your unique URL</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Currency</Label>
              <Input
                placeholder="USD"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                maxLength={5}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label>Your Name</Label>
            <Input
              placeholder="John Smith"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label>Password</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={8}
              className="mt-1"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating…" : "Create Organization"}
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
