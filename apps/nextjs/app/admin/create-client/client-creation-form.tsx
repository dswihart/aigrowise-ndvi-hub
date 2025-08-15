"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ClientCreationForm() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [isCreating, setIsCreating] = useState(false);
	const [success, setSuccess] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSuccess(null);
		setError(null);
		setIsCreating(true);

		// Validation
		if (!email || !password) {
			setError("Please fill in all fields");
			setIsCreating(false);
			return;
		}

		if (password.length < 6) {
			setError("Password must be at least 6 characters");
			setIsCreating(false);
			return;
		}

		if (password !== confirmPassword) {
			setError("Passwords do not match");
			setIsCreating(false);
			return;
		}

		try {
			const response = await fetch("/api/admin/clients", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					email,
					password,
				}),
			});

			const result = await response.json();

			if (response.ok && result.success) {
				setSuccess(`Client account created successfully for ${result.client.email}`);
				setEmail("");
				setPassword("");
				setConfirmPassword("");
				
				// Redirect to admin dashboard after 2 seconds
				setTimeout(() => {
					router.push("/admin");
				}, 2000);
			} else {
				setError(result.error || "Failed to create client account");
			}
		} catch (err) {
			setError("An unexpected error occurred. Please try again.");
		} finally {
			setIsCreating(false);
		}
	};

	const handleCancel = () => {
		router.push("/admin");
	};

	return (
		<Card className="w-full max-w-md mx-auto">
			<CardHeader>
				<CardTitle className="flex items-center space-x-2">
					<span>👤</span>
					<span>Create New Client Account</span>
				</CardTitle>
				<CardDescription>
					Add a new client to the Aigrowise NDVI system
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-4">
					{success && (
						<Alert className="border-green-200 bg-green-50">
							<AlertDescription className="text-green-800">
								✅ {success}
							</AlertDescription>
						</Alert>
					)}

					{error && (
						<Alert variant="destructive">
							<AlertDescription>
								❌ {error}
							</AlertDescription>
						</Alert>
					)}

					<div className="space-y-2">
						<Label htmlFor="email">Client Email Address</Label>
						<Input
							id="email"
							type="email"
							placeholder="client@example.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							disabled={isCreating}
						/>
						<p className="text-xs text-gray-500">
							This will be the client's login email
						</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="password">Password</Label>
						<Input
							id="password"
							type="password"
							placeholder="Enter secure password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							disabled={isCreating}
							minLength={6}
						/>
						<p className="text-xs text-gray-500">
							Minimum 6 characters
						</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="confirmPassword">Confirm Password</Label>
						<Input
							id="confirmPassword"
							type="password"
							placeholder="Confirm password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							required
							disabled={isCreating}
							minLength={6}
						/>
					</div>

					<div className="flex space-x-4 pt-4">
						<Button 
							type="submit" 
							className="flex-1 bg-blue-600 hover:bg-blue-700"
							disabled={isCreating}
						>
							{isCreating ? (
								<>
									<span className="animate-spin mr-2">⏳</span>
									Creating...
								</>
							) : (
								"Create Client Account"
							)}
						</Button>
						
						<Button 
							type="button"
							variant="outline"
							onClick={handleCancel}
							disabled={isCreating}
						>
							Cancel
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}