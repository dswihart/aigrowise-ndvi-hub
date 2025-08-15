"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface Client {
	id: string;
	email: string;
	createdAt: string;
}

export default function ClientList() {
	const [clients, setClients] = useState<Client[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchClients = async () => {
		try {
			setLoading(true);
			setError(null);
			
			const response = await fetch("/api/admin/clients");
			const data = await response.json();
			
			if (response.ok) {
				setClients(data.clients || []);
			} else {
				setError(data.error || "Failed to fetch clients");
			}
		} catch (err) {
			setError("Network error occurred");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchClients();
	}, []);

	if (loading) {
		return (
			<Card>
				<CardContent className="py-8">
					<div className="text-center">
						<div className="animate-spin text-2xl mb-2">⏳</div>
						<p>Loading clients...</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card>
				<CardContent className="py-8">
					<Alert variant="destructive">
						<AlertDescription>
							❌ {error}
						</AlertDescription>
					</Alert>
					<div className="mt-4">
						<Button onClick={fetchClients} variant="outline">
							Try Again
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex justify-between items-center">
					<div>
						<CardTitle className="flex items-center space-x-2">
							<span>👥</span>
							<span>Client Accounts</span>
							<span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-normal">
								{clients.length}
							</span>
						</CardTitle>
						<CardDescription>
							Manage and view all client accounts in the system
						</CardDescription>
					</div>
					<Button 
						onClick={fetchClients}
						variant="outline"
						size="sm"
					>
						🔄 Refresh
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				{clients.length === 0 ? (
					<div className="text-center py-12 text-gray-500">
						<div className="text-4xl mb-4">👤</div>
						<h3 className="text-lg font-semibold mb-2">No clients yet</h3>
						<p className="text-sm mb-4">Get started by creating your first client account</p>
						<a 
							href="/admin/create-client" 
							className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md text-sm inline-block"
						>
							Create First Client
						</a>
					</div>
				) : (
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Email Address</TableHead>
									<TableHead>Account Created</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{clients.map((client) => (
									<TableRow key={client.id}>
										<TableCell className="font-medium">
											{client.email}
										</TableCell>
										<TableCell>
											{new Date(client.createdAt).toLocaleDateString("en-US", {
												year: "numeric",
												month: "short",
												day: "numeric",
												hour: "2-digit",
												minute: "2-digit"
											})}
										</TableCell>
										<TableCell>
											<span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
												Active
											</span>
										</TableCell>
										<TableCell>
											<div className="flex space-x-2">
												<Button variant="outline" size="sm">
													View
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				)}
			</CardContent>
		</Card>
	);
}