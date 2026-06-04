import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin } from "../../hooks/useAuth";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormData) => login.mutate(data);

  return (
    <div className="relative flex h-screen items-center justify-center overflow-hidden bg-[#0d0f14]">
      {/* Background grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#4ade80 1px, transparent 1px), linear-gradient(90deg, #4ade80 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Glow blobs */}
      <div
        className="pointer-events-none absolute left-1/4 top-1/4 h-96 w-96 rounded-full opacity-5"
        style={{
          background: "radial-gradient(circle, #4ade80 0%, transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full opacity-5"
        style={{
          background: "radial-gradient(circle, #22d3ee 0%, transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-[400px] px-4">
        {/* Logo mark */}
        <div className="mb-8 flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-gradient-to-br from-[#4ade80] to-[#22d3ee] shadow-lg shadow-[rgba(74,222,128,0.2)]">
            <span className="text-[22px] font-bold text-[#0d0f14]">W</span>
          </div>
          <div className="text-center">
            <h1 className="text-[24px] font-semibold tracking-tight text-[#e8eaf0]">
              WarehouseOS
            </h1>
            <p className="mt-1 text-[14px] text-[#555d73]">
              Sign in to your workspace
            </p>
          </div>
        </div>

        {/* Form card */}
        <div className="rounded-[16px] border border-[#2a2f42] bg-[#13161e] p-6 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {/* Email */}
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">
                Email Address
              </label>
              <input
                {...register("email")}
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                className="w-full rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3.5 py-2.5 font-[inherit] text-[13px] text-[#e8eaf0] outline-none transition-colors placeholder:text-[#555d73] focus:border-[#4ade80]"
              />
              {errors.email && (
                <p className="mt-1.5 text-[11px] text-[#f87171]">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">
                Password
              </label>
              <input
                {...register("password")}
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3.5 py-2.5 font-[inherit] text-[13px] text-[#e8eaf0] outline-none transition-colors placeholder:text-[#555d73] focus:border-[#4ade80]"
              />
              {errors.password && (
                <p className="mt-1.5 text-[11px] text-[#f87171]">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Error from API */}
            {login.isError && (
              <div className="rounded-[10px] border border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.08)] px-3.5 py-2.5">
                <p className="text-[12px] text-[#f87171]">
                  {login.error?.message ?? "Invalid credentials. Please try again."}
                </p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={login.isPending}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#4ade80] py-3 text-[14px] font-semibold text-[#0d0f14] shadow-lg shadow-[rgba(74,222,128,0.15)] transition-all hover:bg-[#22c55e] disabled:opacity-60"
            >
              {login.isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0d0f14]/20 border-t-[#0d0f14]" />
                  Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        {/* Demo hint */}
        <div className="mt-5 rounded-[12px] border border-[#2a2f42] bg-[#13161e]/60 px-4 py-3">
          <p className="text-center text-[11px] font-medium text-[#555d73]">
            Demo credentials
          </p>
          <div className="mt-1.5 flex items-center justify-center gap-4 font-['JetBrains_Mono',monospace] text-[11px]">
            <span className="text-[#8b92a8]">admin@wms.com</span>
            <span className="text-[#2a2f42]">·</span>
            <span className="text-[#8b92a8]">password123</span>
          </div>
        </div>
      </div>
    </div>
  );
}