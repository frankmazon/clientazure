import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FaCheckCircle, FaEye, FaEyeSlash, FaLock } from "react-icons/fa";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
const RESET_API = `${API_BASE}/client-reset-password`;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token")?.trim() || "", [searchParams]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!token) return setError("This reset link is invalid or incomplete.");
    if (password !== confirmPassword) return setError("The passwords do not match.");

    try {
      setLoading(true);
      const response = await fetch(RESET_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to reset your password.");
      }
      setComplete(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to reset your password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#eef8f6] p-4">
      <section className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.14)] sm:p-9">
        <img src="/logo/logo.png" alt="SBR Funding" className="mb-6 h-16 w-16 rounded-2xl object-contain shadow-sm ring-1 ring-slate-200" />
        {complete ? (
          <div>
            <FaCheckCircle className="mb-4 text-4xl text-green-600" />
            <h1 className="text-2xl font-black text-slate-950">Password reset</h1>
            <p className="mt-2 text-slate-600">Your new password is ready to use.</p>
            <Link to="/clients" className="mt-6 flex h-12 items-center justify-center rounded-xl bg-[#259b8f] font-black text-white">Return to client login</Link>
          </div>
        ) : (
          <form onSubmit={submit}>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#259b8f]">Client Portal</p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">Create a new password</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Use at least 8 characters with uppercase, lowercase, number, and symbol.</p>
            {[{ label: "New password", value: password, set: setPassword }, { label: "Confirm password", value: confirmPassword, set: setConfirmPassword }].map((field) => (
              <label key={field.label} className="mt-5 block">
                <span className="mb-2 block text-sm font-black text-slate-700">{field.label}</span>
                <span className="relative block">
                  <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type={showPassword ? "text" : "password"} value={field.value} onChange={(event) => field.set(event.target.value)} required className="h-12 w-full rounded-xl border border-slate-300 pl-11 pr-12 outline-none focus:border-[#259b8f] focus:ring-4 focus:ring-[#259b8f]/15" />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" aria-label={showPassword ? "Hide passwords" : "Show passwords"}>{showPassword ? <FaEyeSlash /> : <FaEye />}</button>
                </span>
              </label>
            ))}
            {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}
            <button disabled={loading} className="mt-6 h-12 w-full rounded-xl bg-[#259b8f] font-black text-white disabled:opacity-50">{loading ? "Resetting..." : "Reset password"}</button>
          </form>
        )}
      </section>
    </main>
  );
}
