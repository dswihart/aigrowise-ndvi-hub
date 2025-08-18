"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";

interface Client {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageCount: number;
  createdAt: string;
}

interface Admin {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
}

interface Image {
  id: string;
  url: string;
  originalFileName?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  createdAt: string;
  user?: {
    email: string;
  };
}

interface UploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export default function AdminDashboard({ session }: { session: any }) {
  const [activeTab, setActiveTab] = useState<"overview" | "clients" | "admins" | "images" | "upload">("overview");
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [clientImages, setClientImages] = useState<Image[]>([]);
  const [allImages, setAllImages] = useState<Image[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPassword, setNewClientPassword] = useState("");
  const [newClientFirstName, setNewClientFirstName] = useState("");
  const [newClientLastName, setNewClientLastName] = useState("");
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  
  // Admin management states
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminFirstName, setNewAdminFirstName] = useState("");
  const [newAdminLastName, setNewAdminLastName] = useState("");
  
  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Multiple upload states
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [uploadFiles, setUploadFiles] = useState<UploadProgress[]>([]);
  const [uploadStep, setUploadStep] = useState<'select-client' | 'select-files' | 'uploading' | 'completed'>('select-client');
  const [isUploading, setIsUploading] = useState(false);

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(savedTheme === 'dark' || (!savedTheme && prefersDark));
  }, []);

  // Apply dark mode to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Fetch clients and admins on component mount
  useEffect(() => {
    fetchClients();
    if (activeTab === "images") {
      fetchAllImages();
    } else if (activeTab === "admins") {
      fetchAdmins();
    }
  }, [activeTab]);

  // Fetch client images when selectedClient changes
  useEffect(() => {
    if (selectedClient && activeTab === "images") {
      fetchClientImages(selectedClient);
    } else if (!selectedClient && activeTab === "images") {
      fetchAllImages();
    }
  }, [selectedClient, activeTab]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

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

  const fetchAdmins = async () => {
    try {
      const response = await fetch("/api/admin/admins");
      const data = await response.json();
      if (data.admins) {
        setAdmins(data.admins);
      }
    } catch (error) {
      console.error("Error fetching admins:", error);
    }
  };

  const fetchClientImages = async (clientId: string) => {
    setLoadingImages(true);
    try {
      const response = await fetch(`/api/admin/clients/${clientId}/images`);
      if (response.ok) {
        const data = await response.json();
        setClientImages(data.images || []);
      }
    } catch (error) {
      console.error('Error fetching client images:', error);
    } finally {
      setLoadingImages(false);
    }
  };

  const fetchAllImages = async () => {
    setLoadingImages(true);
    try {
      const response = await fetch('/api/images');
      if (response.ok) {
        const data = await response.json();
        setAllImages(data.images || []);
      }
    } catch (error) {
      console.error('Error fetching all images:', error);
    } finally {
      setLoadingImages(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientEmail || !newClientPassword) {
      alert("Please enter both email and password");
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
          firstName: newClientFirstName,
          lastName: newClientLastName,
        }),
      });

      const result = await response.json();

      if (result.success) {
        fetchClients();
        setShowCreateClient(false);
        setNewClientEmail("");
        setNewClientPassword("");
        setNewClientFirstName("");
        setNewClientLastName("");
        alert(`Client ${result.client.email} created successfully!`);
      } else {
        throw new Error(result.error || "Failed to create client");
      }
    } catch (error) {
      console.error("Error creating client:", error);
      alert("Failed to create client. Please try again.");
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail || !newAdminPassword) {
      alert("Please enter both email and password");
      return;
    }

    try {
      const response = await fetch("/api/admin/admins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: newAdminEmail,
          password: newAdminPassword,
          firstName: newAdminFirstName,
          lastName: newAdminLastName,
        }),
      });

      const result = await response.json();

      if (result.success) {
        fetchAdmins();
        setShowCreateAdmin(false);
        setNewAdminEmail("");
        setNewAdminPassword("");
        setNewAdminFirstName("");
        setNewAdminLastName("");
        alert(`Admin ${result.admin.email} created successfully!`);
      } else {
        throw new Error(result.error || "Failed to create admin");
      }
    } catch (error) {
      console.error("Error creating admin:", error);
      alert("Failed to create admin. Please try again.");
    }
  };

  const handleDeleteAdmin = async (adminId: string, adminEmail: string) => {
    if (!confirm(`Are you sure you want to delete admin ${adminEmail}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/admins?id=${adminId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        fetchAdmins();
        alert(`Admin ${adminEmail} deleted successfully`);
      } else {
        throw new Error(result.error || 'Failed to delete admin');
      }
    } catch (error) {
      console.error('Error deleting admin:', error);
      alert('Failed to delete admin. Please try again.');
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm("Are you sure you want to delete this image?")) {
      return;
    }

    try {
      const response = await fetch(`/api/images/${imageId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        if (selectedClient) {
          fetchClientImages(selectedClient);
        } else {
          fetchAllImages();
        }
        fetchClients();
      } else {
        throw new Error('Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Failed to delete image');
    }
  };

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Upload functionality
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newUploadFiles = files.map(file => ({
      file,
      progress: 0,
      status: 'pending' as const,
    }));
    setUploadFiles(newUploadFiles);
    setUploadStep('select-files');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      const newUploadFiles = imageFiles.map(file => ({
        file,
        progress: 0,
        status: 'pending' as const,
      }));
      setUploadFiles(newUploadFiles);
      setUploadStep('select-files');
    }
  };

  const uploadSingleFile = async (fileProgress: UploadProgress, index: number): Promise<void> => {
    const formData = new FormData();
    formData.append('file', fileProgress.file);
    formData.append('clientId', selectedClientId);

    const xhr = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadFiles(prev => prev.map((item, i) => 
            i === index ? { ...item, progress } : item
          ));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          setUploadFiles(prev => prev.map((item, i) => 
            i === index ? { ...item, status: 'completed', progress: 100 } : item
          ));
          resolve();
        } else {
          setUploadFiles(prev => prev.map((item, i) => 
            i === index ? { ...item, status: 'error', error: 'Upload failed' } : item
          ));
          reject(new Error('Upload failed'));
        }
      });

      xhr.addEventListener('error', () => {
        setUploadFiles(prev => prev.map((item, i) => 
          i === index ? { ...item, status: 'error', error: 'Network error' } : item
        ));
        reject(new Error('Network error'));
      });

      setUploadFiles(prev => prev.map((item, i) => 
        i === index ? { ...item, status: 'uploading' } : item
      ));

      xhr.open('POST', '/api/images');
      xhr.send(formData);
    });
  };

  const handleUploadAll = async () => {
    if (!selectedClientId) {
      alert('Please select a client first');
      return;
    }

    setIsUploading(true);
    setUploadStep('uploading');

    try {
      const uploadPromises = uploadFiles.map((fileProgress, index) => 
        uploadSingleFile(fileProgress, index)
      );

      await Promise.allSettled(uploadPromises);
      setUploadStep('completed');
      fetchClients(); // Refresh client counts
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setUploadFiles([]);
    setUploadStep('select-client');
    setSelectedClientId('');
  };

  const totalImages = clients.reduce((sum, client) => sum + client.imageCount, 0);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <header className={`shadow-sm border-b transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className={`text-2xl font-bold transition-colors duration-300 ${
                isDarkMode ? 'text-green-400' : 'text-green-700'
              }`}>
                🌱 Aigrowise Admin
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Welcome, {session.user?.email}
              </span>
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-md transition-colors duration-300 ${
                  isDarkMode 
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDarkMode ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              <button 
                onClick={handleLogout}
                className={`px-4 py-2 border rounded-md transition-colors duration-300 ${
                  isDarkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Navigation Tabs */}
        <div className={`border-b mb-6 transition-colors duration-300 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <nav className="-mb-px flex space-x-8">
            {[
              { id: "overview", label: "Overview" },
              { id: "clients", label: "Clients" },
              { id: "admins", label: "Admins" },
              { id: "images", label: "Client Images" },
              { id: "upload", label: "Upload" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-300 ${
                  activeTab === tab.id
                    ? isDarkMode 
                      ? "border-green-400 text-green-400"
                      : "border-green-500 text-green-600"
                    : isDarkMode
                      ? "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-6 rounded-lg shadow transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <h3 className={`text-lg font-semibold mb-2 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-100' : 'text-gray-900'
              }`}>Total Clients</h3>
              <p className="text-3xl font-bold text-green-600">{clients.length}</p>
            </div>
            <div className={`p-6 rounded-lg shadow transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <h3 className={`text-lg font-semibold mb-2 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-100' : 'text-gray-900'
              }`}>Total Images</h3>
              <p className="text-3xl font-bold text-blue-600">{totalImages}</p>
            </div>
            <div className={`p-6 rounded-lg shadow transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <h3 className={`text-lg font-semibold mb-2 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-100' : 'text-gray-900'
              }`}>Average Images/Client</h3>
              <p className="text-3xl font-bold text-purple-600">
                {clients.length > 0 ? Math.round(totalImages / clients.length) : 0}
              </p>
            </div>
          </div>
        )}

        {/* Clients Tab */}
        {activeTab === "clients" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-xl font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-gray-100' : 'text-gray-900'
              }`}>Client Management</h2>
              <button
                onClick={() => setShowCreateClient(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors duration-300"
              >
                Create New Client
              </button>
            </div>

            {showCreateClient && (
              <div className={`p-6 rounded-lg shadow mb-6 transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-900'
                }`}>Create New Client</h3>
                <form onSubmit={handleCreateClient} className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={newClientEmail}
                      onChange={(e) => setNewClientEmail(e.target.value)}
                      required
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-300 ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="client@example.com"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Password
                    </label>
                    <input
                      type="password"
                      value={newClientPassword}
                      onChange={(e) => setNewClientPassword(e.target.value)}
                      required
                      minLength={6}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-300 ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Minimum 6 characters"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      First Name
                    </label>
                    <input
                      type="text"
                      value={newClientFirstName}
                      onChange={(e) => setNewClientFirstName(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-300 ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={newClientLastName}
                      onChange={(e) => setNewClientLastName(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-300 ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors duration-300"
                    >
                      Create Client
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateClient(false);
                        setNewClientEmail("");
                        setNewClientPassword("");
                        setNewClientFirstName("");
                        setNewClientLastName("");
                      }}
                      className={`border px-4 py-2 rounded-md transition-colors duration-300 ${
                        isDarkMode 
                          ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className={`rounded-lg shadow overflow-hidden transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className={`transition-colors duration-300 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Client
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Images
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Created
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y transition-colors duration-300 ${
                  isDarkMode ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'
                }`}>
                  {clients.map((client) => (
                    <tr key={client.id}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-100' : 'text-gray-900'
                      }`}>
                        <div>
                          <div className="font-medium">
                            {client.firstName && client.lastName 
                              ? `${client.firstName} ${client.lastName}`
                              : client.firstName || client.lastName || 'No Name'
                            }
                          </div>
                          <div className={`text-sm transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {client.email}
                          </div>
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        {client.imageCount}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        {formatDate(client.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                        <button
                          onClick={() => {
                            setSelectedClient(client.id);
                            setActiveTab("images");
                          }}
                          className="text-green-600 hover:text-green-900 transition-colors duration-300"
                        >
                          View Images ({client.imageCount})
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Admin Management Tab */}
        {activeTab === "admins" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-xl font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-gray-100' : 'text-gray-900'
              }`}>Admin User Management</h2>
              <button
                onClick={() => setShowCreateAdmin(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-300"
              >
                Create New Admin
              </button>
            </div>

            {showCreateAdmin && (
              <div className={`p-6 rounded-lg shadow mb-6 transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-900'
                }`}>Create New Admin</h3>
                <form onSubmit={handleCreateAdmin} className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      required
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300 ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="admin@example.com"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Password
                    </label>
                    <input
                      type="password"
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      required
                      minLength={8}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300 ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Minimum 8 characters"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      First Name
                    </label>
                    <input
                      type="text"
                      value={newAdminFirstName}
                      onChange={(e) => setNewAdminFirstName(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300 ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={newAdminLastName}
                      onChange={(e) => setNewAdminLastName(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300 ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-300"
                    >
                      Create Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateAdmin(false);
                        setNewAdminEmail("");
                        setNewAdminPassword("");
                        setNewAdminFirstName("");
                        setNewAdminLastName("");
                      }}
                      className={`border px-4 py-2 rounded-md transition-colors duration-300 ${
                        isDarkMode 
                          ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className={`rounded-lg shadow overflow-hidden transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className={`transition-colors duration-300 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Admin User
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Created
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y transition-colors duration-300 ${
                  isDarkMode ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'
                }`}>
                  {admins.map((admin) => (
                    <tr key={admin.id}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-100' : 'text-gray-900'
                      }`}>
                        <div>
                          <div className="font-medium">
                            {admin.firstName && admin.lastName 
                              ? `${admin.firstName} ${admin.lastName}`
                              : admin.firstName || admin.lastName || 'No Name'
                            }
                          </div>
                          <div className={`text-sm transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {admin.email}
                          </div>
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        {formatDate(admin.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                        {admin.email !== session.user?.email && (
                          <button
                            onClick={() => handleDeleteAdmin(admin.id, admin.email)}
                            className="text-red-600 hover:text-red-900 transition-colors duration-300"
                          >
                            Delete
                          </button>
                        )}
                        {admin.email === session.user?.email && (
                          <span className={`text-xs px-2 py-1 rounded transition-colors duration-300 ${
                            isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'
                          }`}>
                            Current User
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {admins.length === 0 && (
                <div className="text-center py-12">
                  <p className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>No admin users found.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Client Images Tab */}
        {activeTab === "images" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-xl font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-gray-100' : 'text-gray-900'
              }`}>Client NDVI Images</h2>
              <div className="flex space-x-3">
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className={`px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-gray-100' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="">All Clients</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.firstName && client.lastName 
                        ? `${client.firstName} ${client.lastName} (${client.email})`
                        : client.firstName || client.lastName 
                          ? `${client.firstName || client.lastName} (${client.email})`
                          : client.email
                      } ({client.imageCount} images)
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setSelectedClient("")}
                  className={`px-3 py-2 rounded-md transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Show All
                </button>
              </div>
            </div>

            {/* Loading State */}
            {loadingImages && (
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-2 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className={`transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Loading images...</p>
              </div>
            )}

            {/* Images Grid - Selected Client */}
            {!loadingImages && selectedClient && clientImages.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clientImages.map((image) => (
                  <div key={image.id} className={`rounded-lg shadow overflow-hidden transition-colors duration-300 ${
                    isDarkMode ? 'bg-gray-800' : 'bg-white'
                  }`}>
                    <img
                      src={image.url}
                      alt={image.originalFileName || image.fileName || "NDVI Image"}
                      className="w-full h-48 object-cover cursor-pointer"
                      onClick={() => setSelectedImage(image)}
                    />
                    <div className="p-4">
                      <h3 className={`font-semibold mb-2 truncate transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-100' : 'text-gray-900'
                      }`}>
                        {image.originalFileName || image.fileName || "Untitled"}
                      </h3>
                      <p className={`text-sm mb-2 transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Size: {formatFileSize(image.fileSize)}
                      </p>
                      <p className={`text-xs mb-3 transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        Uploaded: {formatDate(image.createdAt)}
                      </p>
                      <button
                        onClick={() => handleDeleteImage(image.id)}
                        className="w-full bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 text-sm transition-colors duration-300"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Images Grid - All Clients */}
            {!loadingImages && !selectedClient && allImages.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allImages.map((image) => (
                  <div key={image.id} className={`rounded-lg shadow overflow-hidden transition-colors duration-300 ${
                    isDarkMode ? 'bg-gray-800' : 'bg-white'
                  }`}>
                    <img
                      src={image.url}
                      alt={image.originalFileName || image.fileName || "NDVI Image"}
                      className="w-full h-48 object-cover cursor-pointer"
                      onClick={() => setSelectedImage(image)}
                    />
                    <div className="p-4">
                      <h3 className={`font-semibold mb-2 truncate transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-100' : 'text-gray-900'
                      }`}>
                        {image.originalFileName || image.fileName || "Untitled"}
                      </h3>
                      <p className={`text-sm mb-2 transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Size: {formatFileSize(image.fileSize)}
                      </p>
                      <p className={`text-sm mb-2 transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Client: {image.user?.email}
                      </p>
                      <p className={`text-xs mb-3 transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        Uploaded: {formatDate(image.createdAt)}
                      </p>
                      <button
                        onClick={() => handleDeleteImage(image.id)}
                        className="w-full bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 text-sm transition-colors duration-300"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty States */}
            {!loadingImages && selectedClient && clientImages.length === 0 && (
              <div className="text-center py-12">
                <p className={`transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>No images found for this client.</p>
              </div>
            )}

            {!loadingImages && !selectedClient && allImages.length === 0 && (
              <div className="text-center py-12">
                <p className={`transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>No images found.</p>
              </div>
            )}
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === "upload" && (
          <div>
            <h2 className={`text-xl font-semibold mb-6 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-100' : 'text-gray-900'
            }`}>Upload Images to Client</h2>
            
            {uploadStep === 'select-client' && (
              <div className={`p-6 rounded-lg shadow transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-900'
                }`}>Step 1: Select Client</h3>
                <p className={`text-sm mb-4 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Choose which client to upload images for:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => {
                        setSelectedClientId(client.id);
                        setUploadStep('select-files');
                      }}
                      className={`p-4 border-2 rounded-lg text-left transition-all duration-300 ${
                        isDarkMode 
                          ? 'border-gray-600 bg-gray-700 hover:border-green-500 hover:bg-gray-600' 
                          : 'border-gray-300 bg-gray-50 hover:border-green-500 hover:bg-green-50'
                      }`}
                    >
                      <div className={`font-semibold transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-100' : 'text-gray-900'
                      }`}>
                        {client.firstName && client.lastName 
                          ? `${client.firstName} ${client.lastName}`
                          : client.firstName || client.lastName || 'No Name'
                        }
                      </div>
                      <div className={`text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>{client.email}</div>
                      <div className={`text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>{client.imageCount} images</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {uploadStep === 'select-files' && (
              <div className={`p-6 rounded-lg shadow transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-100' : 'text-gray-900'
                  }`}>Step 2: Select Files</h3>
                  <button
                    onClick={() => setUploadStep('select-client')}
                    className={`text-sm underline transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Change Client
                  </button>
                </div>
                <p className={`text-sm mb-4 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Uploading to: <strong>{(() => {
                    const client = clients.find(c => c.id === selectedClientId);
                    if (!client) return 'Unknown Client';
                    return client.firstName && client.lastName 
                      ? `${client.firstName} ${client.lastName} (${client.email})`
                      : client.firstName || client.lastName 
                        ? `${client.firstName || client.lastName} (${client.email})`
                        : client.email;
                  })()}</strong>
                </p>

                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-300 ${
                    isDarkMode 
                      ? 'border-gray-600 bg-gray-700 hover:border-green-500' 
                      : 'border-gray-300 bg-gray-50 hover:border-green-500'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <div className={`text-4xl mb-4 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-400'
                  }`}>📁</div>
                  <p className={`text-lg mb-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Drag and drop images here, or click to select
                  </p>
                  <p className={`text-sm mb-4 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Supports: JPG, PNG, GIF, WebP
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 cursor-pointer inline-block transition-colors duration-300"
                  >
                    Choose Files
                  </label>
                </div>

                {uploadFiles.length > 0 && (
                  <div className="mt-6">
                    <h4 className={`font-semibold mb-3 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-100' : 'text-gray-900'
                    }`}>Selected Files ({uploadFiles.length})</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {uploadFiles.map((fileProgress, index) => (
                        <div key={index} className={`flex items-center justify-between p-3 border rounded transition-colors duration-300 ${
                          isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
                        }`}>
                          <div>
                            <div className={`font-medium transition-colors duration-300 ${
                              isDarkMode ? 'text-gray-100' : 'text-gray-900'
                            }`}>{fileProgress.file.name}</div>
                            <div className={`text-sm transition-colors duration-300 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>{formatFileSize(fileProgress.file.size)}</div>
                          </div>
                          <button
                            onClick={() => setUploadFiles(prev => prev.filter((_, i) => i !== index))}
                            className="text-red-500 hover:text-red-700 transition-colors duration-300"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex space-x-3 mt-4">
                      <button
                        onClick={handleUploadAll}
                        disabled={uploadFiles.length === 0}
                        className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors duration-300"
                      >
                        Upload All ({uploadFiles.length} files)
                      </button>
                      <button
                        onClick={() => setUploadFiles([])}
                        className={`px-4 py-2 border rounded-md transition-colors duration-300 ${
                          isDarkMode 
                            ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {uploadStep === 'uploading' && (
              <div className={`p-6 rounded-lg shadow transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-900'
                }`}>Uploading Files...</h3>
                
                <div className="space-y-3">
                  {uploadFiles.map((fileProgress, index) => (
                    <div key={index} className={`p-3 border rounded transition-colors duration-300 ${
                      isDarkMode ? 'border-gray-600' : 'border-gray-200'
                    }`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-sm font-medium transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-100' : 'text-gray-900'
                        }`}>{fileProgress.file.name}</span>
                        <span className={`text-sm transition-colors duration-300 ${
                          fileProgress.status === 'completed' ? 'text-green-600' :
                          fileProgress.status === 'error' ? 'text-red-600' :
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {fileProgress.status === 'completed' ? '✓ Complete' :
                           fileProgress.status === 'error' ? '✗ Error' :
                           fileProgress.status === 'uploading' ? `${fileProgress.progress}%` : 'Pending'}
                        </span>
                      </div>
                      <div className={`w-full bg-gray-200 rounded-full h-2 transition-colors duration-300 ${
                        isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                      }`}>
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            fileProgress.status === 'completed' ? 'bg-green-600' :
                            fileProgress.status === 'error' ? 'bg-red-600' : 'bg-blue-600'
                          }`}
                          style={{width: `${fileProgress.progress}%`}}
                        ></div>
                      </div>
                      {fileProgress.error && (
                        <div className="text-red-600 text-sm mt-1">{fileProgress.error}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {uploadStep === 'completed' && (
              <div className={`p-6 rounded-lg shadow transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-900'
                }`}>Upload Complete!</h3>
                
                <p className={`mb-4 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Successfully processed {uploadFiles.length} files for {(() => {
                    const client = clients.find(c => c.id === selectedClientId);
                    if (!client) return 'Unknown Client';
                    return client.firstName && client.lastName 
                      ? `${client.firstName} ${client.lastName}`
                      : client.firstName || client.lastName || client.email;
                  })()}
                </p>

                <div className="flex space-x-3">
                  <button
                    onClick={resetUpload}
                    className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors duration-300"
                  >
                    Upload More Files
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('images');
                      setSelectedClient(selectedClientId);
                    }}
                    className={`px-4 py-2 border rounded-md transition-colors duration-300 ${
                      isDarkMode 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    View Uploaded Images
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg max-w-4xl max-h-[90vh] overflow-auto transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`sticky top-0 border-b px-6 py-4 flex justify-between items-center transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-gray-100' : 'text-gray-900'
              }`}>
                {selectedImage.originalFileName || selectedImage.fileName || "NDVI Image"}
              </h3>
              <button
                onClick={() => setSelectedImage(null)}
                className={`transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <img
                src={selectedImage.url}
                alt={selectedImage.originalFileName || selectedImage.fileName || "NDVI Image"}
                className="w-full h-auto max-h-96 object-contain rounded-lg mb-4"
              />
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className={`font-semibold transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-100' : 'text-gray-900'
                    }`}>Upload Date:</span>
                    <span className={`ml-2 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>{formatDate(selectedImage.createdAt)}</span>
                  </div>
                  <div>
                    <span className={`font-semibold transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-100' : 'text-gray-900'
                    }`}>File Size:</span>
                    <span className={`ml-2 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>{formatFileSize(selectedImage.fileSize)}</span>
                  </div>
                  {selectedImage.originalFileName && (
                    <div>
                      <span className={`font-semibold transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-100' : 'text-gray-900'
                      }`}>Original Filename:</span>
                      <span className={`ml-2 transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>{selectedImage.originalFileName}</span>
                    </div>
                  )}
                  {selectedImage.mimeType && (
                    <div>
                      <span className={`font-semibold transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-100' : 'text-gray-900'
                      }`}>Type:</span>
                      <span className={`ml-2 transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>{selectedImage.mimeType}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <a
                    href={selectedImage.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors duration-300"
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