"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "../../src/utils/trpc";

export default function AdminDashboard({ session }: { session: any }) {
	const [imageUrl, setImageUrl] = useState("");
	const [clientEmail, setClientEmail] = useState("");
	const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
	const [uploadError, setUploadError] = useState<string | null>(null);
	
	// Client creation state
	const [newClientEmail, setNewClientEmail] = useState("");
	const [newClientPassword, setNewClientPassword] = useState("");
	const [clientCreateSuccess, setClientCreateSuccess] = useState<string | null>(null);
	const [clientCreateError, setClientCreateError] = useState<string | null>(null);
	const [isCreatingClient, setIsCreatingClient] = useState(false);

	// tRPC queries and mutations
	const { data: clients = [], refetch: refetchClients } = trpc.images.getAllClients.useQuery();
	const uploadImageMutation = trpc.images.uploadForClient.useMutation({
		onSuccess: (data) => {
			setUploadSuccess(`Image successfully assigned to ${data.image.clientEmail}`);
			setUploadError(null);
			setImageUrl("");
			setClientEmail("");
			refetchClients();
		},
		onError: (error) => {
			setUploadError(error.message);
			setUploadSuccess(null);
		},
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setUploadSuccess(null);
		setUploadError(null);

		if (!imageUrl || !clientEmail) {
			setUploadError("Please provide both image URL and client email");
			return;
		}

		uploadImageMutation.mutate({
			imageUrl,
			clientEmail,
		});
	};

	const handleCreateClient = async (e: React.FormEvent) => {
		e.preventDefault();
		setClientCreateSuccess(null);
		setClientCreateError(null);
		setIsCreatingClient(true);

		if (!newClientEmail || !newClientPassword) {
			setClientCreateError("Please provide both email and password");
			setIsCreatingClient(false);
			return;
		}

		try {
			const response = await fetch("/api/admin/clients", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					email: newClientEmail,
					password: newClientPassword,
				}),
			});

			const result = await response.json();

			if (result.success) {
				setClientCreateSuccess(`Client ${result.client.email} created successfully`);
				setNewClientEmail("");
				setNewClientPassword("");
				refetchClients();
			} else {
				setClientCreateError(result.error || "Failed to create client");
			}
		} catch (error) {
			setClientCreateError("An unexpected error occurred");
		} finally {
			setIsCreatingClient(false);
		}
	};

	const handleLogout = () => {
		signOut({ callbackUrl: "/login" });
	};

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<header className="bg-white shadow-sm border-b">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						<div className="flex items-center">
							<h1 className="text-2xl font-heading font-bold text-secondary-800">
								🌱 Aigrowise Admin
							</h1>
						</div>
						<div className="flex items-center space-x-4">
							<span className="text-sm text-secondary-600">
								Welcome, {session.user?.email}
							</span>
							<Button 
								onClick={handleLogout}
								variant="outline"
								size="sm"
							>
								Sign Out
							</Button>
						</div>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
				{/* Quick Actions */}
				<div className="mb-8">
					<div className="flex flex-wrap gap-4">
						<a 
							href="/admin/create-client"
							className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium inline-flex items-center space-x-2"
						>
							<span>👤</span>
							<span>Create New Client</span>
						</a>
						<a 
							href="/admin/clients"
							className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-lg text-sm font-medium inline-flex items-center space-x-2"
						>
							<span>👥</span>
							<span>Manage Clients</span>
						</a>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Image Upload Section */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center space-x-2">
								<span>📤</span>
								<span>Upload Image for Client</span>
							</CardTitle>
							<CardDescription>
								Assign an NDVI image to a specific client's account
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleSubmit} className="space-y-4">
								{uploadSuccess && (
									<Alert className="border-primary-200 bg-primary-50">
										<AlertDescription className="text-primary-800">
											{uploadSuccess}
										</AlertDescription>
									</Alert>
								)}

								{uploadError && (
									<Alert variant="destructive">
										<AlertDescription>
											{uploadError}
										</AlertDescription>
									</Alert>
								)}

								<div className="space-y-2">
									<Label htmlFor="imageUrl">Image URL</Label>
									<Input
										id="imageUrl"
										type="url"
										placeholder="https://example.com/ndvi-image.tiff"
										value={imageUrl}
										onChange={(e) => setImageUrl(e.target.value)}
										required
									/>
									<p className="text-xs text-secondary-500">
										Enter the URL of the NDVI image stored in your object storage
									</p>
								</div>

								<div className="space-y-2">
									<Label htmlFor="clientEmail">Client Email</Label>
									<Input
										id="clientEmail"
										type="email"
										placeholder="client@example.com"
										value={clientEmail}
										onChange={(e) => setClientEmail(e.target.value)}
										required
									/>
									<p className="text-xs text-secondary-500">
										The email address of the client who should receive this image
									</p>
								</div>

								<Button 
									type="submit" 
									className="w-full bg-primary-500 hover:bg-primary-600"
									disabled={uploadImageMutation.isLoading}
								>
									{uploadImageMutation.isLoading ? "Uploading..." : "Upload & Assign Image"}
								</Button>
							</form>
						</CardContent>
					</Card>

					{/* Create New Client Section */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center space-x-2">
								<span>👤</span>
								<span>Create New Client</span>
							</CardTitle>
							<CardDescription>
								Add a new client account to the system
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleCreateClient} className="space-y-4">
								{clientCreateSuccess && (
									<Alert className="border-primary-200 bg-primary-50">
										<AlertDescription className="text-primary-800">
											{clientCreateSuccess}
										</AlertDescription>
									</Alert>
								)}

								{clientCreateError && (
									<Alert variant="destructive">
										<AlertDescription>
											{clientCreateError}
										</AlertDescription>
									</Alert>
								)}

								<div className="space-y-2">
									<Label htmlFor="newClientEmail">Client Email</Label>
									<Input
										id="newClientEmail"
										type="email"
										placeholder="client@example.com"
										value={newClientEmail}
										onChange={(e) => setNewClientEmail(e.target.value)}
										required
										disabled={isCreatingClient}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="newClientPassword">Password</Label>
									<Input
										id="newClientPassword"
										type="password"
										placeholder="Enter secure password"
										value={newClientPassword}
										onChange={(e) => setNewClientPassword(e.target.value)}
										required
										disabled={isCreatingClient}
									/>
									<p className="text-xs text-secondary-500">
										Minimum 6 characters
									</p>
								</div>

								<Button 
									type="submit" 
									className="w-full bg-secondary-600 hover:bg-secondary-700"
									disabled={isCreatingClient}
								>
									{isCreatingClient ? "Creating..." : "Create Client Account"}
								</Button>
							</form>
						</CardContent>
					</Card>

					{/* Clients List */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center space-x-2">
								<span>👥</span>
								<span>Client Accounts</span>
							</CardTitle>
							<CardDescription>
								Manage client accounts and view their information
							</CardDescription>
						</CardHeader>
						<CardContent>
							{clients.length === 0 ? (
								<div className="text-center py-8 text-secondary-500">
									<p>No clients registered yet</p>
								</div>
							) : (
								<div className="overflow-x-auto">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Email</TableHead>
												<TableHead>Joined</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{clients.map((client) => (
												<TableRow key={client.id}>
													<TableCell className="font-medium">
														{client.email}
													</TableCell>
													<TableCell>
														{new Date(client.createdAt).toLocaleDateString()}
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							)}
						</CardContent>
					</Card>
				</div>

				{/* Quick Stats */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
					<Card>
						<CardContent className="pt-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-2xl font-bold text-primary-600">{clients.length}</p>
									<p className="text-sm text-secondary-600">Total Clients</p>
								</div>
								<div className="text-3xl">👥</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="pt-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-2xl font-bold text-primary-600">--</p>
									<p className="text-sm text-secondary-600">Images Uploaded</p>
								</div>
								<div className="text-3xl">🖼️</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="pt-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-2xl font-bold text-primary-600">Active</p>
									<p className="text-sm text-secondary-600">System Status</p>
								</div>
								<div className="text-3xl">✅</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</main>
		</div>
	);
}