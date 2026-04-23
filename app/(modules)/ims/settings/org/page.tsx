"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orgApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { isAdmin, getApiError } from "@/lib/utils";
import type { Organization, PdfTemplate } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(1, "Organization name is required"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").or(z.literal("")).optional(),
  website: z.string().optional(),
  logo_url: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  pdf_template: z.enum(["classic", "modern", "minimal"]),
});

type FormData = z.infer<typeof schema>;

const TEMPLATES: { key: PdfTemplate; label: string; description: string; preview: string }[] = [
  {
    key: "classic",
    label: "Classic",
    description: "Blue header, professional table layout",
    preview: "bg-blue-600",
  },
  {
    key: "modern",
    label: "Modern",
    description: "Indigo accent bar, card-style layout",
    preview: "bg-indigo-500",
  },
  {
    key: "minimal",
    label: "Minimal",
    description: "Serif, black & white, timeless",
    preview: "bg-slate-800",
  },
];

export default function OrgSettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  useEffect(() => {
    if (user && !isAdmin(user.role)) router.replace("/ims/dashboard");
  }, [user, router]);

  const { data: org, isLoading } = useQuery<Organization>({
    queryKey: ["org"],
    queryFn: () => orgApi.get().then((r) => r.data),
  });

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", address: "", phone: "", email: "", website: "", logo_url: "", pdf_template: "classic" },
  });

  useEffect(() => {
    if (org) {
      reset({
        name: org.name,
        address: org.address ?? "",
        phone: org.phone ?? "",
        email: org.email ?? "",
        website: org.website ?? "",
        logo_url: org.logo_url ?? "",
        pdf_template: org.pdf_template ?? "classic",
      });
    }
  }, [org, reset]);

  const selectedTemplate = watch("pdf_template");

  const mut = useMutation({
    mutationFn: (data: FormData) => {
      // strip empty strings for optional fields
      const clean: Record<string, unknown> = { name: data.name, pdf_template: data.pdf_template };
      if (data.address) clean.address = data.address;
      if (data.phone) clean.phone = data.phone;
      if (data.email) clean.email = data.email;
      if (data.website) clean.website = data.website;
      if (data.logo_url) clean.logo_url = data.logo_url;
      return orgApi.update(clean);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org"] });
      toast.success("Organization settings saved");
    },
    onError: (e) => toast.error(getApiError(e, "Failed to save settings")),
  });

  if (!user || !isAdmin(user.role)) return null;

  const logoUrl = watch("logo_url");

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Org Settings</h1>

      {isLoading ? (
        <div className="h-64 bg-white rounded-xl animate-pulse" />
      ) : (
        <form onSubmit={handleSubmit((d) => mut.mutate(d))} className="space-y-6">

          {/* General */}
          <Card>
            <CardHeader><CardTitle className="text-base">General</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Organization Name *</Label>
                <Input className="mt-1" {...register("name")} />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Phone</Label>
                  <Input className="mt-1" placeholder="+1 555 000 0000" {...register("phone")} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input className="mt-1" placeholder="hello@company.com" {...register("email")} />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                </div>
              </div>
              <div>
                <Label>Address</Label>
                <Input className="mt-1" placeholder="123 Main St, City, Country" {...register("address")} />
              </div>
              <div>
                <Label>Website</Label>
                <Input className="mt-1" placeholder="https://company.com" {...register("website")} />
              </div>
            </CardContent>
          </Card>

          {/* Branding */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Logo</CardTitle>
              <p className="text-xs text-slate-500 mt-1">Paste a public image URL — shown on generated PDFs.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Logo URL</Label>
                <Input className="mt-1" placeholder="https://cdn.example.com/logo.png" {...register("logo_url")} />
                {errors.logo_url && <p className="text-xs text-red-500 mt-1">{errors.logo_url.message}</p>}
              </div>
              {logoUrl && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoUrl} alt="Logo preview" className="h-10 max-w-[120px] object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  <span className="text-xs text-slate-400">Preview</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* PDF Template */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">PDF Template</CardTitle>
              <p className="text-xs text-slate-500 mt-1">Applies to all new invoice and quotation PDFs.</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setValue("pdf_template", t.key, { shouldDirty: true })}
                    className={cn(
                      "rounded-xl border-2 p-4 text-left transition-all",
                      selectedTemplate === t.key
                        ? "border-blue-600 bg-blue-50 shadow-sm"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    {/* Mini preview bar */}
                    <div className={cn("h-2 rounded-full mb-3", t.preview)} />
                    <p className="font-semibold text-sm text-slate-800">{t.label}</p>
                    <p className="text-xs text-slate-500 mt-1">{t.description}</p>
                    {selectedTemplate === t.key && (
                      <p className="text-xs text-blue-600 font-medium mt-2">Selected</p>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={mut.isPending || !isDirty}>
              {mut.isPending ? "Saving…" : "Save Settings"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
