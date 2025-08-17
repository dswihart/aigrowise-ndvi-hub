"use client";

import { signOut } from "next-auth/react";
import { trpc } from "../../src/utils/trpc";
import { useState, useEffect } from "react";

interface Image {
  id: string;
  url: string;
  filename?: string;
  title?: string;
  description?: string;
  fileSize?: number;
  mimeType?: string;
  createdAt: string;
}

export default function ClientDashboard({ session }: { session: any }) {
  const { data: images = [], isLoading, error } = trpc.images.getMyImages.useQuery();
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [language, setLanguage] = useState<"en" | "es">("en");

  // Load saved language preference
  useEffect(() => {
    const savedLanguage = localStorage.getItem('aigrowise-language') as 'en' | 'es';
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'es')) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Save language preference when changed
  const changeLanguage = (newLanguage: 'en' | 'es') => {
    setLanguage(newLanguage);
    localStorage.setItem('aigrowise-language', newLanguage);
  };

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return language === "es" ? "Desconocido" : "Unknown size";
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === "es" ? "es-ES" : "en-US", {
      year: "numeric",
      month: "long", 
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-green-700">
                🌱 {language === "es" ? "Centro NDVI Aigrowise" : "Aigrowise NDVI Hub"}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {language === "es" ? "Bienvenido" : "Welcome"}, {session.user?.email}
              </span>
              
              {/* Language Toggle */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => changeLanguage('en')}
                  className={`px-2 py-1 rounded text-sm font-medium ${
                    language === 'en' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => changeLanguage('es')}
                  className={`px-2 py-1 rounded text-sm font-medium ${
                    language === 'es' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  ES
                </button>
              </div>

              <button 
                onClick={handleLogout}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                {language === "es" ? "Cerrar Sesión" : "Sign Out"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {language === "es" ? "Tu Panel NDVI" : "Your NDVI Dashboard"}
          </h2>
          <p className="text-lg text-gray-600">
            {language === "es" 
              ? "Monitorea tus campos agrícolas con análisis de vegetación mediante drones" 
              : "Monitor your agricultural fields with drone-based vegetation analysis"
            }
          </p>
        </div>

        {/* Stats - Only 2 cards as requested */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              🖼️ {language === "es" ? "Imágenes NDVI" : "NDVI Images"}
            </h3>
            <p className="text-3xl font-bold text-green-600">{images?.length || 0}</p>
            <p className="text-sm text-gray-500">
              {language === "es" ? "Imágenes analizadas" : "Images analyzed"}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              📅 {language === "es" ? "Última Actualización" : "Last Updated"}
            </h3>
            <p className="text-3xl font-bold text-blue-600">
              {images && images.length > 0 ? formatDate(images[0].createdAt) : "--"}
            </p>
            <p className="text-sm text-gray-500">
              {language === "es" ? "Fecha más reciente" : "Most recent upload"}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              🌾 {language === "es" ? "Tu Galería de Imágenes NDVI" : "Your NDVI Image Gallery"}
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded text-sm ${
                  viewMode === 'grid' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {language === "es" ? "Cuadrícula" : "Grid"}
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded text-sm ${
                  viewMode === 'list' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {language === "es" ? "Lista" : "List"}
              </button>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">
                {language === "es" ? "Cargando tus imágenes..." : "Loading your images..."}
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <div className="text-red-600 mb-4">
                {language === "es" ? "Error al cargar imágenes" : "Failed to load images"}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && (!images || images.length === 0) && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🌱</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {language === "es" ? "Aún No Hay Imágenes NDVI" : "No NDVI Images Yet"}
              </h3>
              <p className="text-gray-600 mb-4">
                {language === "es" 
                  ? "Tus imágenes agrícolas aparecerán aquí una vez que nuestro equipo suba los datos de tu campo." 
                  : "Your agricultural imagery will appear here once our team uploads your field data."
                }
              </p>
              <p className="text-sm text-gray-500">
                {language === "es" 
                  ? "Contacta a nuestro equipo de soporte si esperas imágenes que aún no han aparecido." 
                  : "Contact our support team if you are expecting images that have not appeared yet."
                }
              </p>
            </div>
          )}

          {/* Grid View */}
          {!isLoading && !error && images && images.length > 0 && viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedImage(image)}
                >
                  <img
                    src={image.url}
                    alt={image.title || image.filename || "NDVI Image"}
                    className="w-full h-48 object-cover"
                    loading="lazy"
                  />
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 truncate">
                      {image.title || image.filename || (language === "es" ? "Sin título" : "Untitled")}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2 truncate">
                      {image.description || (language === "es" ? "Sin descripción" : "No description")}
                    </p>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>{formatDate(image.createdAt)}</span>
                      <span>{formatFileSize(image.fileSize)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* List View */}
          {!isLoading && !error && images && images.length > 0 && viewMode === 'list' && (
            <div className="space-y-3">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedImage(image)}
                >
                  <img
                    src={image.url}
                    alt={image.title || image.filename || "NDVI Image"}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                    loading="lazy"
                  />
                  <div className="flex-grow">
                    <h4 className="font-medium text-gray-900">
                      {image.title || image.filename || (language === "es" ? "Sin título" : "Untitled")}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {formatDate(image.createdAt)} • {formatFileSize(image.fileSize)}
                    </p>
                  </div>
                  <button className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">
                    {language === "es" ? "Ver" : "View"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {selectedImage.title || selectedImage.filename || "NDVI Image"}
              </h3>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <img
                src={selectedImage.url}
                alt={selectedImage.title || selectedImage.filename || "NDVI Image"}
                className="w-full h-auto max-h-96 object-contain rounded-lg mb-4"
              />
              <div className="space-y-3">
                {selectedImage.description && (
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {language === "es" ? "Descripción" : "Description"}
                    </h4>
                    <p className="text-gray-600">{selectedImage.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold text-gray-900">
                      {language === "es" ? "Fecha de Subida:" : "Upload Date:"}
                    </span>
                    <span className="ml-2 text-gray-600">{formatDate(selectedImage.createdAt)}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900">
                      {language === "es" ? "Tamaño del Archivo:" : "File Size:"}
                    </span>
                    <span className="ml-2 text-gray-600">{formatFileSize(selectedImage.fileSize)}</span>
                  </div>
                  {selectedImage.filename && (
                    <div>
                      <span className="font-semibold text-gray-900">
                        {language === "es" ? "Nombre del Archivo:" : "Filename:"}
                      </span>
                      <span className="ml-2 text-gray-600">{selectedImage.filename}</span>
                    </div>
                  )}
                  {selectedImage.mimeType && (
                    <div>
                      <span className="font-semibold text-gray-900">
                        {language === "es" ? "Tipo:" : "Type:"}
                      </span>
                      <span className="ml-2 text-gray-600">{selectedImage.mimeType}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <a
                    href={selectedImage.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                  >
                    {language === "es" ? "Descargar Original" : "Download Original"}
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
