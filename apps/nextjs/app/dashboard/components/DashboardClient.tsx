"use client";

import { useState, useEffect } from "react";
import ImageUpload from "./ImageUpload";

interface Image {
	id: string;
	url: string;
	createdAt: string;
}

export default function DashboardClient({ session }: { session: any }) {
	const [images, setImages] = useState<Image[]>([]);
	const [loading, setLoading] = useState(true);

	const fetchImages = async () => {
		try {
			const response = await fetch("/api/images");
			const data = await response.json();
			setImages(data.images || []);
		} catch (error) {
			console.error("Failed to fetch images:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchImages();
	}, []);

	const handleUploadSuccess = () => {
		fetchImages(); // Refresh images list
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
			<div className="container mx-auto px-6 py-8">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-4xl font-bold text-gray-800 mb-2">
						🌱 Aigrowise NDVI Hub
					</h1>
					<p className="text-lg text-gray-600">
						Welcome back, {session.user?.email ?? session.user?.name ?? "user"}
					</p>
				</div>

				{/* Quick Stats */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
					<div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
						<h3 className="text-lg font-semibold text-gray-700 mb-2">
							🖼️ Total Images
						</h3>
						<p className="text-3xl font-bold text-green-600">{images.length}</p>
						<p className="text-sm text-gray-500">Satellite images analyzed</p>
					</div>
					<div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
						<h3 className="text-lg font-semibold text-gray-700 mb-2">
							📊 NDVI Analysis
						</h3>
						<p className="text-3xl font-bold text-blue-600">--</p>
						<p className="text-sm text-gray-500">Average vegetation index</p>
					</div>
					<div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
						<h3 className="text-lg font-semibold text-gray-700 mb-2">
							🌾 Fields Monitored
						</h3>
						<p className="text-3xl font-bold text-yellow-600">0</p>
						<p className="text-sm text-gray-500">Agricultural areas</p>
					</div>
				</div>

				{/* Main Content Grid */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					{/* Recent Images */}
					<div className="bg-white rounded-lg shadow-md p-6">
						<h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
							📷 Recent Satellite Images
						</h2>
						{loading ? (
							<div className="text-center py-8">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
								<p className="text-gray-500 mt-2">Loading images...</p>
							</div>
						) : images.length > 0 ? (
							<div className="space-y-3 max-h-64 overflow-y-auto">
								{images.map((image) => (
									<div key={image.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
										<div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
											🖼️
										</div>
										<div className="flex-1">
											<p className="font-semibold text-gray-800 truncate">
												Image #{image.id.slice(-6)}
											</p>
											<p className="text-sm text-gray-500">
												{new Date(image.createdAt).toLocaleDateString()}
											</p>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="text-center py-8 text-gray-500">
								<p className="text-lg mb-2">No images uploaded yet</p>
								<p className="text-sm">Upload your first satellite image to get started</p>
							</div>
						)}
					</div>

					{/* NDVI Analysis Tools */}
					<div className="bg-white rounded-lg shadow-md p-6">
						<h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
							🔬 NDVI Analysis Tools
						</h2>
						<div className="space-y-3">
							<button className="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors">
								<h3 className="font-semibold text-green-800">Vegetation Health Assessment</h3>
								<p className="text-sm text-green-600">Analyze crop health using NDVI values</p>
							</button>
							<button className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors">
								<h3 className="font-semibold text-blue-800">Temporal Analysis</h3>
								<p className="text-sm text-blue-600">Track vegetation changes over time</p>
							</button>
							<button className="w-full text-left p-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg border border-yellow-200 transition-colors">
								<h3 className="font-semibold text-yellow-800">Field Comparison</h3>
								<p className="text-sm text-yellow-600">Compare NDVI across different areas</p>
							</button>
						</div>
					</div>
				</div>

				{/* Upload Section */}
				<ImageUpload onUploadSuccess={handleUploadSuccess} />
			</div>
		</div>
	);
}