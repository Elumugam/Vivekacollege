"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { apiJson } from "@/lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || !password) {
      toast.error("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      const data = await apiJson<{ token: string }>('/auth/login', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      window.localStorage.setItem("tnou-admin-token", data.token);
      toast.success("Login successful.");
      router.push("/admin");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center px-6 py-20">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white border border-cream-dark rounded-sm shadow-2xl p-8 space-y-5">
        <div>
          <p className="text-maroon uppercase tracking-[0.25em] text-[11px] font-bold mb-2">Admin Login</p>
          <h1 className="font-serif text-4xl font-bold text-navy">Secure access</h1>
        </div>
        <input suppressHydrationWarning className="input" type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <input suppressHydrationWarning className="input" type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} />
        <button suppressHydrationWarning disabled={loading} className="w-full bg-maroon text-white px-6 py-3 rounded-sm font-bold uppercase tracking-[0.2em] text-sm hover:bg-maroon-dark transition-colors disabled:opacity-60">
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>
      <style jsx>{`
        .input {
          width: 100%;
          border: 1px solid #e8e0d5;
          border-radius: 0.125rem;
          padding: 0.875rem 1rem;
          background: #fff;
          color: #00264d;
          outline: none;
        }
      `}</style>
    </main>
  );
}
