"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Component for displaying images with direct URLs (public bucket)
function NDVIImage({ src, alt, className }: { src: string; alt: string; className: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  if (error) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center`}>
        <div className="text-center">
          <span className="text-2xl mb-1 block">🌾</span>
          <span className="text-xs text-gray-600">NDVI Image</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {loading && (
        <div className={`${className} bg-gray-200 animate-pulse flex items-center justify-center absolute inset-0`}>
          <span className="text-gray-500 text-sm">Loading...</span>
        </div>
      )}
      <img 
        src={src}
        alt={alt}
        className={className}
        loading="lazy"
        onLoad={handleLoad}
        onError={handleError}
        style={{ display: loading ? 'none' : 'block' }}
      />
    </div>
  );
}

interface Image {
  id: string;
  url: string;
  thumbnailUrl?: string;
  optimizedUrl?: string;
  filename?: string;
  originalFileName?: string;
  fileName?: string;
  title?: string;
  description?: string;
  fileSize?: number;
  mimeType?: string;
  createdAt: string;
}


export default function ClientDashboard({ session }: { session: any }) {
  const [images, setImages] = useState<Image[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch user's images
  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/images');
      const data = await response.json();
      
      if (response.ok) {
        setImages(data.images || []);
      } else {
        setError('Failed to load images');
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      setError('Failed to load images');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  const handleDownload = async (image: Image) => {
    try {
      // Use direct URL for download (public bucket)
      const link = document.createElement('a');
      link.href = image.url;
      link.download = image.originalFileName || image.fileName || image.filename || `ndvi-image-${image.id}.tiff`;
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download image. Please try again.');
    }
  };

  const handleViewFullResolution = async (image: Image) => {
    try {
      // Generate signed URL for viewing
      const response = await fetch('/api/images/signed-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: image.url }),
      });

      if (response.ok) {
        const data = await response.json();
        window.open(data.signedUrl, '_blank');
      } else {
        console.error('Failed to generate signed URL for viewing');
        alert('Failed to open image. Please try again.');
      }
    } catch (error) {
      console.error('View error:', error);
      alert('Failed to open image. Please try again.');
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

const getImagePreview = (image: Image) => {
    // Use thumbnail if available, fallback to optimized, then original
    const imageUrl = image.thumbnailUrl || image.optimizedUrl || image.url;
    
    // Show placeholder only for TIFF files that have no thumbnails
    if (!image.thumbnailUrl && !image.optimizedUrl && 
        (image.mimeType?.includes("tiff") || 
         image.filename?.toLowerCase().includes(".tif") || 
         image.fileName?.toLowerCase().includes(".tif"))) {
      return (
        <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
          <div className="text-center">
            <span className="text-4xl mb-2 block">🌾</span>
            <span className="text-sm font-medium text-green-800">NDVI Image</span>
            <span className="text-xs text-green-600 block mt-1">Click to view</span>
          </div>
        </div>
      );
    }
    
    return (
      <NDVIImage 
        src={imageUrl}
        alt={image.title || image.originalFileName || image.fileName || "NDVI Image"}
        className="w-full h-full object-cover"
      />
    );
  };

  const totalFileSize = images.reduce((sum, img) => sum + (img.fileSize || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-800">
                🌱 Aigrowise NDVI Hub
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Your NDVI Dashboard
          </h2>
          <p className="text-lg text-gray-600">
            Monitor your agricultural fields with drone-based vegetation analysis
          </p>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{images.length}</p>
                  <p className="text-sm text-gray-600">NDVI Images</p>
                </div>
                <div className="text-3xl">🖼️</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {formatFileSize(totalFileSize)}
                  </p>
                  <p className="text-sm text-gray-600">Total Storage</p>
                </div>
                <div className="text-3xl">💾</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-purple-600">
                    {images.length > 0 ? 'Active' : 'Inactive'}
                  </p>
                  <p className="text-sm text-gray-600">Monitoring</p>
                </div>
                <div className="text-3xl">📊</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-orange-600">
                    {images.length > 0 
                      ? new Date(Math.max(...images.map(img => new Date(img.createdAt).getTime()))).toLocaleDateString()
                      : '--'
                    }
                  </p>
                  <p className="text-sm text-gray-600">Last Updated</p>
                </div>
                <div className="text-3xl">🗓️</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Image Gallery */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <span>🌾</span>
                  <span>Your NDVI Image Gallery</span>
                </CardTitle>
                <CardDescription>
                  View, analyze, and download your agricultural drone imagery
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 rounded text-sm ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded text-sm ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                >
                  List
                </button>
                <button
                  onClick={fetchImages}
                  className="px-3 py-1 rounded text-sm bg-gray-200 hover:bg-gray-300"
                >
                  Refresh
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading your NDVI images...</p>
                </div>
              </div>
            ) : images.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🌱</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  No NDVI Images Yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Your agricultural imagery will appear here once our team uploads your field data.
                </p>
                <p className="text-sm text-gray-500">
                  Contact our support team if you're expecting images that haven't appeared yet.
                </p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {images.map((image, index) => (
                  <Dialog key={image.id}>
                    <DialogTrigger asChild>
                      <div className="cursor-pointer group">
                        <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                          <div className="aspect-square bg-gray-100">
                            {getImagePreview(image)}
                          </div>
                          <CardContent className="p-4">
                            <p className="text-sm font-medium text-gray-900 mb-1 truncate">
                              {image.title || image.originalFileName || image.fileName || image.filename || `Image #${index + 1}`}
                            </p>
                            <p className="text-xs text-gray-500 mb-2">
                              {new Date(image.createdAt).toLocaleDateString()}
                            </p>
                            {image.fileSize && (
                              <p className="text-xs text-gray-400">
                                {formatFileSize(image.fileSize)}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center space-x-2">
                          <span>🌾</span>
                          <span>{image.title || image.originalFileName || image.fileName || image.filename || 'NDVI Image'}</span>
                        </DialogTitle>
                        <DialogDescription>
                          Captured on {new Date(image.createdAt).toLocaleDateString()} at{' '}
                          {new Date(image.createdAt).toLocaleTimeString()}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6">
                        {/* Image Preview */}
                        <div className="bg-gray-100 rounded-lg overflow-hidden">
                          <div className="aspect-video flex items-center justify-center">
                            {getImagePreview(image)}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3">
                          <Button 
                            onClick={() => handleViewFullResolution(image)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <span className="mr-2">🔍</span>
                            View Full Resolution
                          </Button>
                          <Button 
                            onClick={() => handleDownload(image)}
                            variant="outline"
                          >
                            <span className="mr-2">📥</span>
                            Download Image
                          </Button>
                        </div>

                        {/* Image Metadata */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="font-medium text-blue-900 mb-3">Image Details</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-blue-700">Image ID:</span>
                                <span className="font-mono text-blue-600">{image.id.slice(-8)}</span>
                              </div>
                              {(image.originalFileName || image.fileName || image.filename) && (
                                <div className="flex justify-between">
                                  <span className="text-blue-700">Filename:</span>
                                  <span className="text-blue-600 truncate ml-2">{image.originalFileName || image.fileName || image.filename}</span>
                                </div>
                              )}
                              {image.fileSize && (
                                <div className="flex justify-between">
                                  <span className="text-blue-700">File Size:</span>
                                  <span className="text-blue-600">{formatFileSize(image.fileSize)}</span>
                                </div>
                              )}
                              {image.mimeType && (
                                <div className="flex justify-between">
                                  <span className="text-blue-700">Format:</span>
                                  <span className="text-blue-600">{image.mimeType.split('/')[1]?.toUpperCase()}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="bg-green-50 p-4 rounded-lg">
                            <h4 className="font-medium text-green-900 mb-3">Analysis Info</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-green-700">Upload Date:</span>
                                <span className="text-green-600">{new Date(image.createdAt).toLocaleDateString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-green-700">Time:</span>
                                <span className="text-green-600">{new Date(image.createdAt).toLocaleTimeString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-green-700">Status:</span>
                                <span className="text-green-600">✅ Ready for Analysis</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {image.description && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                            <p className="text-sm text-gray-600">{image.description}</p>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            ) : (
              /* List View */
              <div className="space-y-3">
                {images.map((image, index) => (
                  <Dialog key={image.id}>
                    <DialogTrigger asChild>
                      <div className="cursor-pointer">
                        <Card className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-4">
                              <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                                {getImagePreview(image)}
                              </div>
                              <div className="flex-grow">
                                <h4 className="font-medium text-gray-900">
                                  {image.title || image.originalFileName || image.fileName || image.filename || `NDVI Image #${index + 1}`}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  {new Date(image.createdAt).toLocaleDateString()} • {formatFileSize(image.fileSize)}
                                </p>
                              </div>
                              <div className="text-right">
                                <Button size="sm" variant="outline">
                                  View Details
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center space-x-2">
                          <span>🌾</span>
                          <span>{image.title || image.originalFileName || image.fileName || image.filename || 'NDVI Image'}</span>
                        </DialogTitle>
                        <DialogDescription>
                          Captured on {new Date(image.createdAt).toLocaleDateString()} at{' '}
                          {new Date(image.createdAt).toLocaleTimeString()}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6">
                        {/* Image Preview */}
                        <div className="bg-gray-100 rounded-lg overflow-hidden">
                          <div className="aspect-video flex items-center justify-center">
                            {getImagePreview(image)}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3">
                          <Button 
                            onClick={() => handleViewFullResolution(image)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <span className="mr-2">🔍</span>
                            View Full Resolution
                          </Button>
                          <Button 
                            onClick={() => handleDownload(image)}
                            variant="outline"
                          >
                            <span className="mr-2">📥</span>
                            Download Image
                          </Button>
                        </div>

                        {/* Image Metadata */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="font-medium text-blue-900 mb-3">Image Details</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-blue-700">Image ID:</span>
                                <span className="font-mono text-blue-600">{image.id.slice(-8)}</span>
                              </div>
                              {(image.originalFileName || image.fileName || image.filename) && (
                                <div className="flex justify-between">
                                  <span className="text-blue-700">Filename:</span>
                                  <span className="text-blue-600 truncate ml-2">{image.originalFileName || image.fileName || image.filename}</span>
                                </div>
                              )}
                              {image.fileSize && (
                                <div className="flex justify-between">
                                  <span className="text-blue-700">File Size:</span>
                                  <span className="text-blue-600">{formatFileSize(image.fileSize)}</span>
                                </div>
                              )}
                              {image.mimeType && (
                                <div className="flex justify-between">
                                  <span className="text-blue-700">Format:</span>
                                  <span className="text-blue-600">{image.mimeType.split('/')[1]?.toUpperCase()}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="bg-green-50 p-4 rounded-lg">
                            <h4 className="font-medium text-green-900 mb-3">Analysis Info</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-green-700">Upload Date:</span>
                                <span className="text-green-600">{new Date(image.createdAt).toLocaleDateString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-green-700">Time:</span>
                                <span className="text-green-600">{new Date(image.createdAt).toLocaleTimeString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-green-700">Status:</span>
                                <span className="text-green-600">✅ Ready for Analysis</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {image.description && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                            <p className="text-sm text-gray-600">{image.description}</p>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* NDVI Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>ℹ️</span>
              <span>Understanding Your NDVI Data</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">What is NDVI?</h4>
                <p className="text-sm text-gray-600">
                  The Normalized Difference Vegetation Index measures plant health and vigor using drone imagery, 
                  helping you monitor crop conditions across your fields.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Reading Your Images</h4>
                <p className="text-sm text-gray-600">
                  Green areas indicate healthy vegetation, while red/brown areas may show stress, disease, 
                  or areas needing attention in your agricultural management.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Data Usage</h4>
                <p className="text-sm text-gray-600">
                  Download high-resolution images for detailed analysis, or view them directly in your browser. 
                  Contact support for interpretation assistance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}