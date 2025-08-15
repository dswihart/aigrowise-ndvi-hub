"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";

export default function LoginForm() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setLoading(true);

		try {
			const res = await signIn("credentials", { 
				redirect: false, 
				email, 
				password 
			});

			if (res?.error) {
				setError("Invalid email or password. Please try again.");
			} else if (res?.ok) {
				// Successful login - let NextAuth handle the redirect
				window.location.href = "/dashboard";
			}
		} catch (err) {
			setError("An unexpected error occurred. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={onSubmit} className="space-y-6">
			{error && (
				<Alert variant="destructive">
					<AlertDescription>
						{error}
					</AlertDescription>
				</Alert>
			)}
			
			<div className="space-y-2">
				<Label htmlFor="email">Email Address</Label>
				<Input
					id="email"
					type="email"
					placeholder="Enter your email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
					disabled={loading}
					className="h-12"
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="password">Password</Label>
				<Input
					id="password"
					type="password"
					placeholder="Enter your password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					required
					disabled={loading}
					className="h-12"
				/>
			</div>

			<Button 
				type="submit" 
				className="w-full h-12 bg-primary-500 hover:bg-primary-600 text-white font-semibold"
				disabled={loading || !email || !password}
			>
				{loading ? "Signing In..." : "Sign In"}
			</Button>

			<div className="text-center">
				<p className="text-sm text-secondary-600">
					Need help accessing your account?{" "}
					<span className="text-primary-600 cursor-pointer hover:underline">
						Contact support
					</span>
				</p>
			</div>
		</form>
	);
}