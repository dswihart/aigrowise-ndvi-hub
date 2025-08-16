"use client";

import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";

interface Client {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function AdminDashboard({ session }: { session: any }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch clients on component mount
  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/admin/clients");
      const data = await response.json();
      if (data.clients) {
        setClients(data.clients);
      }
    } catch (error) {
      console.error("Failed to fetch clients:", error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedClient) {
      setError("Please select both a client and a file to upload.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("clientEmail", selectedClient);

      const response = await fetch("/api/images/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess(`Image uploaded successfully!`);
        setFile(null);
        setSelectedClient("");
        
        // Reset file input
        const fileInput = document.getElementById("file-upload") as HTMLInputElement;
        if (fileInput) fileInput.value = "";

        // Refresh clients list
        fetchClients();
      } else {
        setError(result.error || "Upload failed");
      }
    } catch (error) {
      setError("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
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
              <h1 className="text-2xl font-bold text-gray-800">
                🌱 Aigrowise Admin
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {session.user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <a 
              href="/admin/create-client"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium inline-flex items-center space-x-2 transition-colors"
            >
              <span>👤</span>
              <span>Create New Client</span>
            </a>
            <a 
              href="/admin/clients"
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-lg text-sm font-medium inline-flex items-center space-x-2 transition-colors"
            >
              <span>👥</span>
              <span>Manage Clients</span>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - File Upload */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center space-x-2 mb-6">
                <span className="text-2xl">📤</span>
                <h2 className="text-lg font-medium text-gray-900">Upload NDVI Images</h2>
              </div>
              
              {/* Client Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Client
                </label>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a client...</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.email}>
                      {client.email}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">{clients.length} clients available</p>
              </div>

              {/* File Upload */}
              <div className="mb-6">
                <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
                  Select NDVI Image File
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    id="file-upload"
                    type="file"
                    accept=".tiff,.tif,.png,.jpg,.jpeg"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isUploading}
                  />
                  <label 
                    htmlFor="file-upload" 
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    <span className="text-4xl text-gray-400">📁</span>
                    <span className="text-sm font-medium text-gray-600">
                      Click to browse files
                    </span>
                    <span className="text-xs text-gray-500">
                      TIFF, PNG, JPEG supported
                    </span>
                  </label>
                </div>
                
                {file && (
                  <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-blue-600">📄</span>
                      <div>
                        <div className="text-sm font-medium text-blue-900">{file.name}</div>
                        <div className="text-xs text-blue-600">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <button
                onClick={handleUpload}
                disabled={!file || !selectedClient || isUploading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                {isUploading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <span className="animate-spin">⏳</span>
                    <span>Uploading...</span>
                  </div>
                ) : (
                  "Upload & Assign to Client"
                )}
              </button>

              {/* Success/Error Messages */}
              {success && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">✅ {success}</p>
                </div>
              )}

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">❌ {error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Statistics & Client List */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{clients.length}</div>
                <div className="text-sm text-gray-600">Total Clients</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
                <div className="text-2xl font-bold text-green-600">Active</div>
                <div className="text-sm text-gray-600">System Status</div>
              </div>
            </div>

            {/* Client List */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-2xl">👥</span>
                <h2 className="text-lg font-medium text-gray-900">Recent Clients</h2>
              </div>
              
              {clients.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No clients yet</p>
                  <p className="text-xs mt-1">Create your first client to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {clients.slice(0, 5).map((client) => (
                    <div key={client.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm">👤</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{client.email}</p>
                          <p className="text-xs text-gray-500">
                            Joined {new Date(client.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}