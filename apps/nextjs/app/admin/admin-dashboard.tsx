"use client";

import { signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";

interface Client {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: string;
  createdAt: string;
}

interface UploadedImage {
  id: string;
  url: string;
  fileName: string;
  originalName: string;
  size: number;
  createdAt: string;
}

interface ClientImage {
  id: string;
  url: string;
  originalFileName?: string;
  originalFileName?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  createdAt: string;
}

export default function AdminDashboard({ session }: { session: any }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [recentUploads, setRecentUploads] = useState<UploadedImage[]>([]);
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPassword, setNewClientPassword] = useState("");
  const [newClientFirstName, setNewClientFirstName] = useState("");
  const [newClientLastName, setNewClientLastName] = useState("");
  const [addingClient, setAddingClient] = useState(false);
  const [resetPasswordClient, setResetPasswordClient] = useState<string>("");
  const [newPassword, setNewPassword] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);
  const [deletingClient, setDeletingClient] = useState<string>("");
  
  // New state for client images
  const [clientImages, setClientImages] = useState<ClientImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ClientImage | null>(null);
  const [deletingImage, setDeletingImage] = useState<string>("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  // Fetch clients on component mount
  useEffect(() => {
    fetchClients();
  }, []);

  // Fetch client images when selectedClient changes
  useEffect(() => {
    if (selectedClient) {
      fetchClientImages(selectedClient);
    } else {
      setClientImages([]);
    }
  }, [selectedClient]);

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/admin/clients");
      const data = await response.json();
      if (data.clients) {
        setClients(data.clients);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  // New function to fetch client images
  const fetchClientImages = async (clientId: string) => {
    setLoadingImages(true);
    try {
      const response = await fetch(`/api/admin/clients/${clientId}/images`);
      const data = await response.json();
      
      if (data.success && data.images) {
        setClientImages(data.images);
      } else {
        setClientImages([]);
      }
    } catch (error) {
      console.error("Error fetching client images:", error);
      setClientImages([]);
    } finally {
      setLoadingImages(false);
    }
  };

  // New function to delete client image
  const handleDeleteImage = async (imageId: string) => {
    if (!confirm("Are you sure you want to delete this image? This action cannot be undone.")) {
      return;
    }

    setDeletingImage(imageId);
    try {
      const response = await fetch(`/api/admin/images/${imageId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        // Remove image from the list
        setClientImages(prev => prev.filter(img => img.id !== imageId));
        alert("Image deleted successfully!");
      } else {
        throw new Error(result.error || "Failed to delete image");
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      alert("Failed to delete image. Please try again.");
    } finally {
      setDeletingImage("");
    }
  };

  const handleAddClient = async () => {
    if (!newClientEmail || !newClientPassword) {
      alert("Please enter both email and password");
      return;
    }

    setAddingClient(true);
    try {
      const response = await fetch("/api/admin/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: newClientEmail,
          password: newClientPassword,
          firstName: newClientFirstName || undefined,
          lastName: newClientLastName || undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Add new client to the list
        setClients(prev => [result.client, ...prev]);
        // Clear form
        setNewClientEmail("");
        setNewClientPassword("");
        setNewClientFirstName("");
        setNewClientLastName("");
        setShowAddClient(false);
        alert(`Client ${result.client.email} created successfully!`);
      } else {
        throw new Error(result.error || "Failed to create client");
      }
    } catch (error) {
      console.error("Error creating client:", error);
      alert("Failed to create client. Please try again.");
    } finally {
      setAddingClient(false);
    }
  };

  const handleResetPassword = async (clientId: string, clientEmail: string) => {
    if (!newPassword || newPassword.length < 6) {
      alert("Password must be at least 6 characters long");
      return;
    }

    setResettingPassword(true);
    try {
      const response = await fetch("/api/admin/clients/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId,
          newPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setResetPasswordClient("");
        setNewPassword("");
        alert(`Password reset successfully for ${clientEmail}!`);
      } else {
        throw new Error(result.error || "Failed to reset password");
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      alert("Failed to reset password. Please try again.");
    } finally {
      setResettingPassword(false);
    }
  };

  const handleDeleteClient = async (clientId: string, clientEmail: string) => {
    if (!confirm(`Are you sure you want to delete client ${clientEmail}? This will also delete all their images and cannot be undone.`)) {
      return;
    }

    setDeletingClient(clientId);
    try {
      const response = await fetch(`/api/admin/clients/${clientId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        // Remove client from the list
        setClients(prev => prev.filter(client => client.id !== clientId));
        // Clear selection if this client was selected
        if (selectedClient === clientId) {
          setSelectedClient("");
        }
        alert(`Client ${clientEmail} deleted successfully!`);
      } else {
        throw new Error(result.error || "Failed to delete client");
      }
    } catch (error) {
      console.error("Error deleting client:", error);
      alert("Failed to delete client. Please try again.");
    } finally {
      setDeletingClient("");
    }
  };

  const handleFileUpload = async (files: FileList) => {
    if (!files.length || !selectedClient) {
      alert("Please select a client first");
      return;
    }

    setUploading(true);
    try {
      const file = files[0];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("clientId", selectedClient);

      const response = await fetch("/api/images", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // Add to recent uploads
        setRecentUploads(prev => [result.image, ...prev.slice(0, 4)]);
        // Refresh client images
        fetchClientImages(selectedClient);
        // Show success message
        alert(`Image uploaded successfully for ${clients.find(c => c.id === selectedClient)?.email}!`);
        // Clear file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileSelect = () => {
    if (!selectedClient) {
      alert("Please select a client first");
      return;
    }
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-foreground">
                🌱 Aigrowise Admin Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                Welcome, {session.user?.email}
              </span>
              <button 
                onClick={handleLogout}
                className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Client Management */}
          <div className="space-y-6">
            {/* Client Management */}
            <div className="bg-card rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Client Management</h2>
                <button 
                  onClick={() => setShowAddClient(!showAddClient)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  {showAddClient ? "Cancel" : "Add Client"}
                </button>
              </div>

              {/* Add Client Form */}
              {showAddClient && (
                <div className="mb-6 p-4 bg-secondary/50 rounded-lg border border-border">
                  <h3 className="text-lg font-medium mb-3">Add New Client</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="email"
                      placeholder="Email Address *"
                      value={newClientEmail}
                      onChange={(e) => setNewClientEmail(e.target.value)}
                      className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-ring"
                      required
                    />
                    <input
                      type="password"
                      placeholder="Password *"
                      value={newClientPassword}
                      onChange={(e) => setNewClientPassword(e.target.value)}
                      className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-ring"
                      required
                    />
                    <input
                      type="text"
                      placeholder="First Name"
                      value={newClientFirstName}
                      onChange={(e) => setNewClientFirstName(e.target.value)}
                      className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-ring"
                    />
                    <input
                      type="text"
                      placeholder="Last Name"
                      value={newClientLastName}
                      onChange={(e) => setNewClientLastName(e.target.value)}
                      className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="flex justify-end space-x-3 mt-4">
                    <button 
                      onClick={() => {
                        setShowAddClient(false);
                        setNewClientEmail("");
                        setNewClientPassword("");
                        setNewClientFirstName("");
                        setNewClientLastName("");
                      }}
                      className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleAddClient}
                      disabled={addingClient || !newClientEmail || !newClientPassword}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {addingClient ? "Creating..." : "Create Client"}
                    </button>
                  </div>
                </div>
              )}
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-ring"
              >
                <option value="">Choose a client...</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.email} {client.firstName && `(${client.firstName} ${client.lastName})`}
                  </option>
                ))}
              </select>

              {/* Client List */}
              {clients.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-3">All Clients ({clients.length})</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {clients.map((client) => (
                      <div 
                        key={client.id} 
                        className={`p-3 rounded border transition-colors ${
                          selectedClient === client.id 
                            ? "bg-primary/10 border-primary" 
                            : "bg-muted border-border hover:bg-accent"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-grow">
                            <div className="font-medium text-sm">{client.email}</div>
                            {(client.firstName || client.lastName) && (
                              <div className="text-xs text-muted-foreground">
                                {client.firstName} {client.lastName}
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground">
                              Created: {formatDate(client.createdAt)}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setResetPasswordClient(client.id)}
                              className="text-xs px-2 py-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded transition-colors"
                            >
                              Reset Password
                            </button>
                            <button
                              onClick={() => handleDeleteClient(client.id, client.email)}
                              disabled={deletingClient === client.id}
                              className="text-xs px-2 py-1 bg-destructive hover:bg-destructive/80 text-destructive-foreground rounded transition-colors disabled:opacity-50"
                            >
                              {deletingClient === client.id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </div>

                        {/* Reset Password Form */}
                        {resetPasswordClient === client.id && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <div className="flex space-x-2">
                              <input
                                type="password"
                                placeholder="New password (min 6 chars)"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="flex-grow p-2 text-xs border border-border rounded focus:ring-1 focus:ring-ring"
                              />
                              <button
                                onClick={() => handleResetPassword(client.id, client.email)}
                                disabled={resettingPassword}
                                className="px-3 py-2 text-xs bg-primary hover:bg-primary/90 text-primary-foreground rounded transition-colors disabled:opacity-50"
                              >
                                {resettingPassword ? "Updating..." : "Update"}
                              </button>
                              <button
                                onClick={() => {
                                  setResetPasswordClient("");
                                  setNewPassword("");
                                }}
                                className="px-3 py-2 text-xs border border-border rounded hover:bg-accent transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Image Management */}
          <div className="space-y-6">
            {/* Image Upload */}
            <div className="bg-card rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Upload NDVI Images</h2>
              
              <div
                onClick={handleFileSelect}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                  dragOver
                    ? "border-primary bg-primary/5"
                    : uploading
                    ? "border-muted-foreground bg-muted"
                    : selectedClient
                    ? "border-border hover:border-primary"
                    : "border-muted-foreground bg-muted cursor-not-allowed"
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".tiff,.tif,.png,.jpg,.jpeg"
                  className="hidden"
                  disabled={!selectedClient}
                />
                <div className="space-y-3">
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="text-lg text-foreground">Uploading image...</p>
                    </>
                  ) : !selectedClient ? (
                    <>
                      <div className="text-4xl text-muted-foreground">📁</div>
                      <p className="text-lg text-muted-foreground">
                        Please select a client first
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Choose a client from the list to enable image uploads
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="text-4xl text-primary">🌾</div>
                      <p className="text-lg text-foreground">
                        Drop NDVI images here or click to browse
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Supports: TIFF, GeoTIFF, PNG, JPEG formats (Max: 500MB)
                      </p>
                      <button 
                        className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 px-6 rounded-lg transition-colors"
                        disabled={!selectedClient}
                      >
                        Browse Files
                      </button>
                    </>
                  )}
                </div>
              </div>

              {selectedClient && (
                <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <div className="text-sm">
                    <strong>Selected Client:</strong> {clients.find(c => c.id === selectedClient)?.email}
                  </div>
                </div>
              )}
            </div>

            {/* Client Images Section */}
            {selectedClient && (
              <div className="bg-card rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    Existing Images ({clientImages.length})
                  </h3>
                  <button
                    onClick={() => fetchClientImages(selectedClient)}
                    disabled={loadingImages}
                    className="text-sm px-3 py-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded transition-colors disabled:opacity-50"
                  >
                    {loadingImages ? "Loading..." : "Refresh"}
                  </button>
                </div>

                {loadingImages ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2 text-muted-foreground">Loading images...</span>
                  </div>
                ) : clientImages.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl text-muted-foreground mb-2">🖼️</div>
                    <p className="text-muted-foreground">No images uploaded yet for this client</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {clientImages.map((image) => (
                      <div key={image.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center space-x-3 flex-grow">
                          <img
                            src={image.url}
                            alt={image.originalFileName || image.originalFileName || "NDVI Image"}
                            className="w-12 h-12 object-cover rounded cursor-pointer"
                            onClick={() => setSelectedImage(image)}
                          />
                          <div className="flex-grow min-w-0">
                            <div className="font-medium text-sm truncate">
                              {image.originalFileName || image.originalFileName || "UnoriginalFileNamed"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatFileSize(image.fileSize || 0)} • {formatDate(image.createdAt)}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedImage(image)}
                            className="text-xs px-2 py-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDeleteImage(image.id)}
                            disabled={deletingImage === image.id}
                            className="text-xs px-2 py-1 bg-destructive hover:bg-destructive/80 text-destructive-foreground rounded transition-colors disabled:opacity-50"
                          >
                            {deletingImage === image.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Recent Uploads */}
            {recentUploads.length > 0 && (
              <div className="bg-card rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Uploads</h3>
                <div className="space-y-3">
                  {recentUploads.map((upload, index) => (
                    <div key={upload.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">📸</div>
                        <div>
                          <div className="font-medium text-sm">{upload.originalName}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatFileSize(upload.size)} • {new Date(upload.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        #{index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">👥 Total Clients</h3>
            <p className="text-3xl font-bold text-primary">{clients.length}</p>
          </div>
          <div className="bg-card rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">📸 Recent Uploads</h3>
            <p className="text-3xl font-bold text-primary">{recentUploads.length}</p>
          </div>
          <div className="bg-card rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">✅ Status</h3>
            <p className="text-lg font-medium text-green-600">System Operational</p>
          </div>
        </div>
      </main>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-card border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {selectedImage.originalFileName || selectedImage.originalFileName || "NDVI Image"}
              </h3>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <img
                src={selectedImage.url}
                alt={selectedImage.originalFileName || selectedImage.originalFileName || "NDVI Image"}
                className="w-full h-auto max-h-96 object-contain rounded-lg mb-4"
              />
              <div className="space-y-3">
                {selectedImage.fileName && (
                  <div>
                    <h4 className="font-semibold text-foreground">Description</h4>
                    <p className="text-muted-foreground">{selectedImage.fileName}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold text-foreground">Upload Date:</span>
                    <span className="ml-2 text-muted-foreground">{formatDate(selectedImage.createdAt)}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">File Size:</span>
                    <span className="ml-2 text-muted-foreground">{formatFileSize(selectedImage.fileSize || 0)}</span>
                  </div>
                  {selectedImage.originalFileName && (
                    <div>
                      <span className="font-semibold text-foreground">Filename:</span>
                      <span className="ml-2 text-muted-foreground">{selectedImage.originalFileName}</span>
                    </div>
                  )}
                  {selectedImage.mimeType && (
                    <div>
                      <span className="font-semibold text-foreground">Type:</span>
                      <span className="ml-2 text-muted-foreground">{selectedImage.mimeType}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <a
                    href={selectedImage.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
                  >
                    Download Original
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}