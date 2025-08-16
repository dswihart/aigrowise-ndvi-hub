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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

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
      console.error("Error fetching clients:", error);
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
      alert(error instanceof Error ? error.message : "Failed to create client");
    } finally {
      setAddingClient(false);
    }
  };

  const handleResetPassword = async (clientId: string) => {
    if (!newPassword) {
      alert("Please enter a new password");
      return;
    }

    setResettingPassword(true);
    try {
      const response = await fetch("/api/admin/clients", {
        method: "PUT",
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
        alert("Password reset successfully!");
        setResetPasswordClient("");
        setNewPassword("");
      } else {
        throw new Error(result.error || "Failed to reset password");
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      alert(error instanceof Error ? error.message : "Failed to reset password");
    } finally {
      setResettingPassword(false);
    }
  };

  const handleDeleteClient = async (clientId: string, clientEmail: string) => {
    if (!confirm(`Are you sure you want to delete client ${clientEmail}? This action cannot be undone and will also delete all their images.`)) {
      return;
    }

    setDeletingClient(clientId);
    try {
      const response = await fetch(`/api/admin/clients?id=${clientId}`, {
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
      alert(error instanceof Error ? error.message : "Failed to delete client");
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
    if (!selectedClient) {
      alert("Please select a client first");
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(e.target.files);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary">
                🌱 Aigrowise Admin
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                Welcome, {session.user?.email}
              </span>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 border border-border rounded-md hover:bg-accent"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Client Selection */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Select Client</h3>
                <button
                  onClick={() => setShowAddClient(!showAddClient)}
                  className="text-sm bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1 rounded-md transition-colors"
                >
                  {showAddClient ? "Cancel" : "+ Add Client"}
                </button>
              </div>

              {/* Add New Client Form */}
              {showAddClient && (
                <div className="mb-4 p-4 border border-primary/20 bg-primary/5 rounded-lg">
                  <h4 className="font-medium text-sm mb-3">Create New Client</h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={newClientFirstName}
                          onChange={(e) => setNewClientFirstName(e.target.value)}
                          placeholder="John"
                          className="w-full p-2 text-sm border border-border rounded-md focus:ring-2 focus:ring-ring"
                          disabled={addingClient}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={newClientLastName}
                          onChange={(e) => setNewClientLastName(e.target.value)}
                          placeholder="Doe"
                          className="w-full p-2 text-sm border border-border rounded-md focus:ring-2 focus:ring-ring"
                          disabled={addingClient}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={newClientEmail}
                        onChange={(e) => setNewClientEmail(e.target.value)}
                        placeholder="client@example.com"
                        className="w-full p-2 text-sm border border-border rounded-md focus:ring-2 focus:ring-ring"
                        disabled={addingClient}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        value={newClientPassword}
                        onChange={(e) => setNewClientPassword(e.target.value)}
                        placeholder="Enter password"
                        className="w-full p-2 text-sm border border-border rounded-md focus:ring-2 focus:ring-ring"
                        disabled={addingClient}
                      />
                    </div>
                    <button
                      onClick={handleAddClient}
                      disabled={addingClient || !newClientEmail || !newClientPassword}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                    {client.firstName || client.lastName ? 
                      `${client.firstName || ''} ${client.lastName || ''} (${client.email})`.trim() : 
                      client.email}
                  </option>
                ))}
              </select>
              
              <div className="mt-4">
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Clients ({clients.length})</h4>
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
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => setSelectedClient(client.id)}
                        >
                          <div className="text-sm font-medium">
                            {client.firstName || client.lastName ? 
                              `${client.firstName || ''} ${client.lastName || ''}`.trim() : 
                              'Unnamed Client'}
                          </div>
                          <div className="text-xs text-muted-foreground">{client.email}</div>
                          <div className="text-xs text-muted-foreground">
                            Joined: {new Date(client.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex space-x-1 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setResetPasswordClient(client.id);
                            }}
                            className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors"
                            disabled={resettingPassword || deletingClient === client.id}
                          >
                            🔑 Reset
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClient(client.id, client.email);
                            }}
                            className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded transition-colors"
                            disabled={deletingClient === client.id || resettingPassword}
                          >
                            {deletingClient === client.id ? "..." : "🗑️ Delete"}
                          </button>
                        </div>
                      </div>
                      
                      {/* Reset Password Form */}
                      {resetPasswordClient === client.id && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <div className="text-xs font-medium mb-2">Reset Password for {client.email}</div>
                          <div className="flex space-x-2">
                            <input
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="New password"
                              className="flex-1 text-xs p-2 border border-border rounded focus:ring-2 focus:ring-ring"
                              disabled={resettingPassword}
                            />
                            <button
                              onClick={() => handleResetPassword(client.id)}
                              disabled={resettingPassword || !newPassword}
                              className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded transition-colors disabled:opacity-50"
                            >
                              {resettingPassword ? "..." : "✓ Set"}
                            </button>
                            <button
                              onClick={() => {
                                setResetPasswordClient("");
                                setNewPassword("");
                              }}
                              className="text-xs bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded transition-colors"
                              disabled={resettingPassword}
                            >
                              ✕ Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                📸 Upload NDVI Images
              </h3>
              
              <div
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
                onClick={handleFileSelect}
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

            {/* Recent Uploads */}
            {recentUploads.length > 0 && (
              <div className="bg-card rounded-lg shadow p-6 mt-6">
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
    </div>
  );
}