"use client";
import { useRouter } from "next/navigation";
import { Users, ArrowLeft, Clock } from "lucide-react";

export default function HrisPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      {/* Glow backdrop */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-lg">
        {/* Icon */}
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center text-white mb-8 shadow-2xl shadow-violet-500/30">
          <Users size={36} />
        </div>

        {/* Badge */}
        <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full mb-6">
          <Clock size={12} />
          Available Soon
        </span>

        {/* Heading */}
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
          Human Resource
          <br />
          <span className="text-violet-400">Integrated System</span>
        </h1>

        <p className="text-slate-400 text-lg leading-relaxed mb-10">
          Employee management, payroll processing, attendance tracking, and HR analytics are currently under development and will be available soon.
        </p>

        {/* Progress indicator */}
        <div className="w-full bg-white/5 rounded-full h-1.5 mb-3 overflow-hidden">
          <div className="bg-gradient-to-r from-violet-500 to-violet-400 h-full rounded-full w-[30%] animate-pulse" />
        </div>
        <p className="text-slate-600 text-xs mb-10">Module in development</p>

        {/* Back button */}
        <button
          onClick={() => router.push("/modules")}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5"
        >
          <ArrowLeft size={15} />
          Back to modules
        </button>
      </div>
    </div>
  );
}
