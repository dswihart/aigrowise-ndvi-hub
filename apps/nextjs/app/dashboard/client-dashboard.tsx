"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "../../src/utils/trpc";

interface Image {
	id: string;
	url: string;
	createdAt: string;
}

export default function ClientDashboard({ session }: { session: any }) {
	const [selectedImage, setSelectedImage] = useState<Image | null>(null);

	// Fetch user's images using tRPC
	const { data: images = [], isLoading, error, refetch } = trpc.images.getMyImages.useQuery();

	const handleLogout = () => {
		signOut({ callbackUrl: "/login" });
	};

	const openImageModal = (image: Image) => {
		setSelectedImage(image);
	};

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<header className="bg-white shadow-sm border-b">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						<div className="flex items-center">
							<h1 className="text-2xl font-heading font-bold text-secondary-800">
								🌱 Aigrowise NDVI Hub
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
				{/* Welcome Section */}
				<div className="mb-8">
					<h2 className="text-3xl font-heading font-bold text-secondary-800 mb-2">
						Your NDVI Dashboard
					</h2>
					<p className="text-lg text-secondary-600">
						Monitor your agricultural fields with satellite-based vegetation analysis
					</p>
				</div>

				{/* Stats Cards */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
					<Card>
						<CardContent className="pt-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-2xl font-bold text-primary-600">{images.length}</p>
									<p className="text-sm text-secondary-600">NDVI Images</p>
								</div>
								<div className="text-3xl">🖼️</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="pt-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-2xl font-bold text-primary-600">
										{images.length > 0 ? 'Active' : '--'}
									</p>
									<p className="text-sm text-secondary-600">Monitoring Status</p>
								</div>
								<div className="text-3xl">📊</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="pt-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-2xl font-bold text-primary-600">
										{images.length > 0 
											? new Date(images[0].createdAt).toLocaleDateString()
											: '--'
										}
									</p>
									<p className="text-sm text-secondary-600">Last Updated</p>
								</div>
								<div className="text-3xl">🗓️</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Image Gallery */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center space-x-2">
							<span>🌾</span>
							<span>Your NDVI Image Gallery</span>
						</CardTitle>
						<CardDescription>
							Click on any image to view it in full resolution and analyze vegetation health
						</CardDescription>
					</CardHeader>
					<CardContent>
						{error && (
							<Alert variant="destructive" className="mb-6">
								<AlertDescription>
									Failed to load images. Please try refreshing the page.
								</AlertDescription>
							</Alert>
						)}

						{isLoading ? (
							<div className="flex items-center justify-center py-12">
								<div className="text-center">
									<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
									<p className="text-secondary-600">Loading your NDVI images...</p>
								</div>
							</div>
						) : images.length === 0 ? (
							<div className="text-center py-12">
								<div className="text-6xl mb-4">🌱</div>
								<h3 className="text-lg font-semibold text-secondary-800 mb-2">
									No NDVI Images Yet
								</h3>
								<p className="text-secondary-600 mb-4">
									Your agricultural imagery will appear here once our team uploads your field data.
								</p>
								<p className="text-sm text-secondary-500">
									Contact our support team if you're expecting images that haven't appeared yet.
								</p>
							</div>
						) : (
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
								{images.map((image, index) => (
									<Dialog key={image.id}>
										<DialogTrigger asChild>
											<div className="cursor-pointer group">
												<Card className="overflow-hidden hover:shadow-lg transition-shadow">
													<div className="aspect-square bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
														<div className="text-center p-4">
															<div className="text-4xl mb-2">🌾</div>
															<p className="text-sm font-medium text-primary-800">
																NDVI Image #{index + 1}
															</p>
														</div>
													</div>
													<CardContent className="p-4">
														<p className="text-xs text-secondary-500 mb-1">
															Captured: {new Date(image.createdAt).toLocaleDateString()}
														</p>
														<p className="text-sm font-medium text-secondary-700 group-hover:text-primary-600 transition-colors">
															Click to analyze
														</p>
													</CardContent>
												</Card>
											</div>
										</DialogTrigger>
										<DialogContent className="max-w-4xl">
											<DialogHeader>
												<DialogTitle>NDVI Image Analysis</DialogTitle>
												<DialogDescription>
													Captured on {new Date(image.createdAt).toLocaleDateString()}
												</DialogDescription>
											</DialogHeader>
											<div className="space-y-4">
												<div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
													<div className="text-center p-8">
														<div className="text-6xl mb-4">🌾</div>
														<p className="text-lg font-medium text-secondary-700 mb-2">
															NDVI Analysis View
														</p>
														<p className="text-sm text-secondary-500 mb-4">
															High-resolution satellite imagery showing vegetation health
														</p>
														<Button 
															onClick={() => window.open(image.url, '_blank')}
															className="bg-primary-500 hover:bg-primary-600"
														>
															View Full Resolution Image
														</Button>
													</div>
												</div>
												<div className="grid grid-cols-2 gap-4 text-sm">
													<div className="bg-primary-50 p-3 rounded">
														<span className="font-medium text-primary-800">Image ID:</span>
														<br />
														<span className="text-primary-600 font-mono">
															{image.id.slice(-8)}
														</span>
													</div>
													<div className="bg-primary-50 p-3 rounded">
														<span className="font-medium text-primary-800">Date:</span>
														<br />
														<span className="text-primary-600">
															{new Date(image.createdAt).toLocaleString()}
														</span>
													</div>
												</div>
											</div>
										</DialogContent>
									</Dialog>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Information Section */}
				<Card className="mt-8">
					<CardHeader>
						<CardTitle className="flex items-center space-x-2">
							<span>ℹ️</span>
							<span>About NDVI Analysis</span>
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<h4 className="font-semibold text-secondary-800 mb-2">
									What is NDVI?
								</h4>
								<p className="text-sm text-secondary-600 mb-4">
									The Normalized Difference Vegetation Index (NDVI) is a key indicator of vegetation health, 
									calculated from satellite imagery to assess crop vitality and growth patterns.
								</p>
							</div>
							<div>
								<h4 className="font-semibold text-secondary-800 mb-2">
									How to Read Your Images
								</h4>
								<p className="text-sm text-secondary-600 mb-4">
									Higher NDVI values (shown in greener colors) indicate healthier, more vigorous vegetation, 
									while lower values may suggest stress, disease, or poor growing conditions.
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</main>
		</div>
	);
}