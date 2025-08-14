"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		const res = await signIn("credentials", { redirect: true, callbackUrl: "/dashboard", email, password });
		if (res?.error) setError(res.error);
	};

	return (
		<div className="min-h-screen flex items-center justify-center p-6">
			<form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
				<h1 className="text-2xl font-semibold">Login</h1>
				<input className="w-full border p-2 rounded" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
				<input className="w-full border p-2 rounded" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
				{error && <p className="text-red-600 text-sm">{error}</p>}
				<button className="w-full bg-black text-white p-2 rounded" type="submit">Sign In</button>
			</form>
		</div>
	);
}
