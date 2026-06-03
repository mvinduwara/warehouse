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
    <div className="flex h-screen items-center justify-center bg-[#0d0f14]">
      {/* Background grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#4ade80 1px, transparent 1px), linear-gradient(90deg, #4ade80 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative w-full max-w-[380px] px-4">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#4ade80] to-[#22d3ee] text-[20px] font-bold text-[#0d0f14]">
            W
          </div>
          <div className="text-center">
            <h1 className="text-[22px] font-semibold text-[#e8eaf0]">WarehouseOS</h1>
            <p className="mt-1 text-[13px] text-[#555d73]">Sign in to your workspace</p>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-[16px] border border-[#2a2f42] bg-[#13161e] p-6"
        >
          <div className="mb-4">
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">
              Email
            </label>
            <input
              {...register("email")}
              type="email"
              placeholder="you@company.com"
              className="w-full rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2.5 font-[inherit] text-[13px] text-[#e8eaf0] outline-none placeholder:text-[#555d73] transition-colors focus:border-[#4ade80]"
            />
            {errors.email && (
              <p className="mt-1 text-[11px] text-[#f87171]">{errors.email.message}</p>
            )}
          </div>

          <div className="mb-6">
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#555d73]">
              Password
            </label>
            <input
              {...register("password")}
              type="password"
              placeholder="••••••••"
              className="w-full rounded-[10px] border border-[#2a2f42] bg-[#1a1e28] px-3 py-2.5 font-[inherit] text-[13px] text-[#e8eaf0] outline-none placeholder:text-[#555d73] transition-colors focus:border-[#4ade80]"
            />
            {errors.password && (
              <p className="mt-1 text-[11px] text-[#f87171]">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={login.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#4ade80] py-2.5 text-[13px] font-semibold text-[#0d0f14] transition-all hover:bg-[#22c55e] disabled:opacity-60"
          >
            {login.isPending ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0d0f14]/30 border-t-[#0d0f14]" />
                Signing in…
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="mt-4 text-center text-[12px] text-[#555d73]">
          Demo: admin@wms.com / password123
        </p>
      </div>
    </div>
  );
}