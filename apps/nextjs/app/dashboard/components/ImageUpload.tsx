"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";

export default function ImageUpload({ onUploadSuccess }: { onUploadSuccess?: () => void }) {
	const [uploading, setUploading] = useState(false);
	const [dragOver, setDragOver] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const { data: session } = useSession();

	const handleFileUpload = async (files: FileList) => {
		if (!files.length || !session) return;

		setUploading(true);
		try {
			const file = files[0];
			const formData = new FormData();
			formData.append("file", file);

			const response = await fetch("/api/images", {
				method: "POST",
				body: formData,
			});

			const result = await response.json();

			if (result.success) {
				onUploadSuccess?.();
				// Show success message
				alert("Image uploaded successfully!");
			} else {
				throw new Error(result.error || "Upload failed");
			}
		} catch (error) {
			console.error("Upload error:", error);
			alert("Upload failed. Please try again.");
		} finally {
			setUploading(false);
		}
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setDragOver(false);
		if (e.dataTransfer.files) {
			handleFileUpload(e.dataTransfer.files);
		}
	};

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setDragOver(true);
	};

	const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setDragOver(false);
	};

	const handleFileSelect = () => {
		fileInputRef.current?.click();
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			handleFileUpload(e.target.files);
		}
	};

	return (
		<div className="mt-8 bg-white rounded-lg shadow-md p-6">
			<h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
				⬆️ Upload New Satellite Image
			</h2>
			<div
				className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
					dragOver
						? "border-green-400 bg-green-50"
						: uploading
						? "border-gray-400 bg-gray-50"
						: "border-gray-300 hover:border-green-400"
				}`}
				onDrop={handleDrop}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onClick={handleFileSelect}
			>
				<input
					type="file"
					ref={fileInputRef}
					onChange={handleFileChange}
					accept=".tiff,.tif,.png,.jpg,.jpeg"
					className="hidden"
				/>
				<div className="space-y-2">
					{uploading ? (
						<>
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
							<p className="text-lg text-gray-600">Uploading image...</p>
						</>
					) : (
						<>
							<p className="text-lg text-gray-600">
								Drop your drone images here or click to browse
							</p>
							<p className="text-sm text-gray-500">
								Supports: TIFF, GeoTIFF, PNG, JPEG formats
							</p>
							<button className="mt-4 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors">
								Browse Files
							</button>
						</>
					)}
				</div>
			</div>
		</div>
	);
}