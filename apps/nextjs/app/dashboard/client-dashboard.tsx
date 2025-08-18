"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";

interface Image {
  id: string;
  url: string;
  originalFileName?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  createdAt: string;
  companyName?: string;
  location?: string;
  imageType?: string;
}

interface PasswordValidation {
  isValid: boolean;
  errors: string[];
}

// Image type options for vegetation indices
const IMAGE_TYPES = [
  "NDVI",     // Normalized Difference Vegetation Index
  "NDRE",     // Normalized Difference Red Edge Index
  "GNDVI",    // Green Normalized Difference Vegetation Index
  "OSAVI",    // Optimized Soil-Adjusted Vegetation Index
  "CIred-edge", // Chlorophyll Index Red Edge
  "CIgreen"   // Chlorophyll Index Green
];

function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("At least 8 characters long");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("One uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("One lowercase letter");
  }
  if (!/\d/.test(password)) {
    errors.push("One number");
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("One special character");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;

  if (score <= 2) return { score, label: "Weak", color: "red" };
  if (score <= 4) return { score, label: "Fair", color: "orange" };
  if (score <= 5) return { score, label: "Good", color: "green" };
  return { score, label: "Strong", color: "darkgreen" };
}

export default function ClientDashboard({ session }: { session: any }) {
  // Theme and preferences
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState<"en" | "es">("en");

  // Main dashboard states
  const [images, setImages] = useState<Image[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Image editing states
  const [editingImageId, setEditingImageId] = useState<string>("");
  const [editingImageName, setEditingImageName] = useState("");
  const [editingCompanyName, setEditingCompanyName] = useState("");
  const [editingLocation, setEditingLocation] = useState("");
  const [editingImageType, setEditingImageType] = useState("");
  const [updatingImage, setUpdatingImage] = useState(false);

  // Password reset states
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({ isValid: false, errors: [] });
  const [passwordStrength, setPasswordStrength] = useState<{ score: number; label: string; color: string }>({ score: 0, label: "", color: "" });
  const [resettingPassword, setResettingPassword] = useState(false);

  // Mobile menu state
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Load saved preferences on mount
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('aigrowise-dark-mode-client');
    if (savedDarkMode) {
      setIsDarkMode(JSON.parse(savedDarkMode));
    }

    const savedLanguage = localStorage.getItem('aigrowise-language') as 'en' | 'es';
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'es')) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Save dark mode preference when it changes
  useEffect(() => {
    localStorage.setItem('aigrowise-dark-mode-client', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Update password validation when new password changes
  useEffect(() => {
    if (newPassword) {
      const validation = validatePassword(newPassword);
      const strength = getPasswordStrength(newPassword);
      setPasswordValidation(validation);
      setPasswordStrength(strength);
    } else {
      setPasswordValidation({ isValid: false, errors: [] });
      setPasswordStrength({ score: 0, label: "", color: "" });
    }
  }, [newPassword]);

  const changeLanguage = (newLanguage: 'en' | 'es') => {
    setLanguage(newLanguage);
    localStorage.setItem('aigrowise-language', newLanguage);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Fetch user's images
  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/images');
      
      if (response.ok) {
        const data = await response.json();
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

  const startEditImageName = (image: Image) => {
    setEditingImageId(image.id);
    setEditingImageName(image.fileName || image.originalFileName || "");
    setEditingCompanyName(image.companyName || "");
    setEditingLocation(image.location || "");
    setEditingImageType(image.imageType || "NDVI");
  };

  const cancelEditImageName = () => {
    setEditingImageId("");
    setEditingImageName("");
    setEditingCompanyName("");
    setEditingLocation("");
    setEditingImageType("");
  };

  const handleUpdateImageName = async (imageId: string) => {
    if (!editingImageName.trim()) {
      alert(language === "es" ? "El nombre del archivo es requerido" : "File name is required");
      return;
    }

    setUpdatingImage(true);
    try {
      const response = await fetch(`/api/images/${imageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: editingImageName.trim(),
          companyName: editingCompanyName.trim() || null,
          location: editingLocation.trim() || null,
          imageType: editingImageType,
        }),
      });

      if (response.ok) {
        setImages(images.map(img => 
          img.id === imageId 
            ? { 
                ...img, 
                fileName: editingImageName.trim(),
                companyName: editingCompanyName.trim() || undefined,
                location: editingLocation.trim() || undefined,
                imageType: editingImageType,
              }
            : img
        ));
        
        if (selectedImage && selectedImage.id === imageId) {
          setSelectedImage({ 
            ...selectedImage, 
            fileName: editingImageName.trim(),
            companyName: editingCompanyName.trim() || undefined,
            location: editingLocation.trim() || undefined,
            imageType: editingImageType,
          });
        }
        
        cancelEditImageName();
      } else {
        const errorData = await response.json();
        alert(errorData.error || (language === "es" ? "Error al actualizar la información" : "Failed to update information"));
      }
    } catch (error) {
      console.error('Error updating image information:', error);
      alert(language === "es" ? "Error al actualizar la información" : "Failed to update information");
    } finally {
      setUpdatingImage(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert(language === "es" ? "Todos los campos son requeridos" : "All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert(language === "es" ? "Las contraseñas no coinciden" : "Passwords do not match");
      return;
    }

    if (!passwordValidation.isValid) {
      alert(language === "es" ? "La nueva contraseña no cumple con los requisitos" : "New password does not meet requirements");
      return;
    }

    setResettingPassword(true);
    try {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setShowPasswordReset(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        alert(language === "es" ? "Contraseña actualizada exitosamente" : "Password updated successfully");
      } else {
        if (result.details && Array.isArray(result.details)) {
          alert(`${language === "es" ? "Error:" : "Error:"}\n${result.details.join('\n')}`);
        } else {
          alert(result.error || (language === "es" ? "Error al actualizar contraseña" : "Failed to update password"));
        }
      }
    } catch (error) {
      console.error('Error updating password:', error);
      alert(language === "es" ? "Error al actualizar contraseña" : "Failed to update password");
    } finally {
      setResettingPassword(false);
    }
  };

  const t = (en: string, es: string) => language === "es" ? es : en;

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`shadow-sm border-b transition-colors duration-200 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo - responsive */}
            <div className="flex items-center">
              <h1 className={`text-lg sm:text-2xl font-bold transition-colors duration-200 ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>
                <span className="hidden sm:inline">🌱 {t("Aigrowise NDVI Hub", "Centro NDVI Aigrowise")}</span>
                <span className="sm:hidden">🌱 Aigrowise</span>
              </h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <span className={`text-sm transition-colors duration-200 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {t("Welcome", "Bienvenido")}, {session.user?.email}
              </span>
              
              {/* Language Toggle */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => changeLanguage('en')}
                  className={`px-2 py-1 rounded text-sm font-medium transition-colors duration-200 ${
                    language === 'en' 
                      ? 'bg-blue-500 text-white' 
                      : isDarkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => changeLanguage('es')}
                  className={`px-2 py-1 rounded text-sm font-medium transition-colors duration-200 ${
                    language === 'es' 
                      ? 'bg-blue-500 text-white' 
                      : isDarkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  ES
                </button>
              </div>

              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-md transition-colors duration-200 ${
                  isDarkMode 
                    ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>

              {/* Password Reset Button */}
              <button
                onClick={() => setShowPasswordReset(true)}
                className={`px-3 py-2 text-sm rounded-md transition-colors duration-200 ${
                  isDarkMode 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {t("Change Password", "Cambiar Contraseña")}
              </button>

              <button 
                onClick={handleLogout}
                className={`px-4 py-2 border rounded-md transition-colors duration-200 ${
                  isDarkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t("Sign Out", "Cerrar Sesión")}
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className={`p-2 rounded-md transition-colors duration-200 ${
                  isDarkMode 
                    ? 'text-gray-300 hover:bg-gray-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {showMobileMenu ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className={`md:hidden border-t py-4 space-y-4 transition-colors duration-200 ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className={`text-sm transition-colors duration-200 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {t("Welcome", "Bienvenido")}, {session.user?.email}
              </div>
              
              {/* Mobile Language Toggle */}
              <div className="flex items-center space-x-2">
                <span className={`text-sm transition-colors duration-200 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {t("Language", "Idioma")}:
                </span>
                <button
                  onClick={() => changeLanguage('en')}
                  className={`px-2 py-1 rounded text-sm font-medium transition-colors duration-200 ${
                    language === 'en' 
                      ? 'bg-blue-500 text-white' 
                      : isDarkMode
                        ? 'bg-gray-700 text-gray-300'
                        : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => changeLanguage('es')}
                  className={`px-2 py-1 rounded text-sm font-medium transition-colors duration-200 ${
                    language === 'es' 
                      ? 'bg-blue-500 text-white' 
                      : isDarkMode
                        ? 'bg-gray-700 text-gray-300'
                        : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  ES
                </button>
              </div>

              {/* Mobile Dark Mode Toggle */}
              <div className="flex items-center space-x-2">
                <span className={`text-sm transition-colors duration-200 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {t("Theme", "Tema")}:
                </span>
                <button
                  onClick={toggleDarkMode}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors duration-200 ${
                    isDarkMode 
                      ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {isDarkMode ? (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm">{t("Light", "Claro")}</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                      </svg>
                      <span className="text-sm">{t("Dark", "Oscuro")}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Mobile Actions */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setShowPasswordReset(true);
                    setShowMobileMenu(false);
                  }}
                  className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                  {t("Change Password", "Cambiar Contraseña")}
                </button>
                <button 
                  onClick={handleLogout}
                  className={`w-full px-3 py-2 text-sm border rounded-md transition-colors duration-200 ${
                    isDarkMode 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {t("Sign Out", "Cerrar Sesión")}
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <h2 className={`text-2xl sm:text-3xl font-bold mb-2 transition-colors duration-200 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            {t("Your NDVI Images", "Tus Imágenes NDVI")}
          </h2>
          <p className={`text-sm sm:text-base transition-colors duration-200 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {t(
              "Access and view your agricultural NDVI imagery and vegetation analysis data.",
              "Accede y visualiza tus imágenes agrícolas NDVI y datos de análisis de vegetación."
            )}
          </p>
        </div>

        {/* Stats - responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className={`p-4 sm:p-6 rounded-lg shadow transition-colors duration-200 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-base sm:text-lg font-semibold mb-2 transition-colors duration-200 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {t("NDVI Images", "Imágenes NDVI")}
            </h3>
            <p className={`text-2xl sm:text-3xl font-bold transition-colors duration-200 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{images.length}</p>
          </div>
          <div className={`p-4 sm:p-6 rounded-lg shadow transition-colors duration-200 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-base sm:text-lg font-semibold mb-2 transition-colors duration-200 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {t("Last Updated", "Última Actualización")}
            </h3>
            <p className={`text-base sm:text-lg transition-colors duration-200 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              {images.length > 0 ? formatDate(images[0].createdAt) : t("No images yet", "Sin imágenes aún")}
            </p>
          </div>
        </div>

        {/* View Controls - responsive */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <h3 className={`text-lg sm:text-xl font-semibold transition-colors duration-200 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            Image Gallery ({images.length})
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-colors duration-200 ${
                viewMode === "grid"
                  ? "bg-green-600 text-white"
                  : isDarkMode
                    ? "bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-colors duration-200 ${
                viewMode === "list"
                  ? "bg-green-600 text-white"
                  : isDarkMode
                    ? "bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className={`animate-spin h-8 w-8 border-2 border-t-transparent rounded-full mx-auto mb-4 transition-colors duration-200 ${
              isDarkMode ? 'border-green-400' : 'border-green-600'
            }`}></div>
            <p className={`transition-colors duration-200 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {t("Loading your images...", "Cargando tus imágenes...")}
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className={`mb-4 transition-colors duration-200 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
              {error}
            </div>
            <button 
              onClick={fetchImages}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors duration-200"
            >
              {t("Retry", "Reintentar")}
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && images.length === 0 && (
          <div className="text-center py-12">
            <div className={`mx-auto h-20 sm:h-24 w-20 sm:w-24 mb-4 transition-colors duration-200 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="h-full w-full">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className={`text-lg font-semibold mb-2 transition-colors duration-200 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {t("No images yet", "Aún no hay imágenes")}
            </h3>
            <p className={`mb-4 px-4 transition-colors duration-200 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {t(
                "Your NDVI images will appear here once uploaded by your administrator.",
                "Tus imágenes NDVI aparecerán aquí una vez que tu administrador las suba."
              )}
            </p>
            <p className={`text-sm px-4 transition-colors duration-200 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {t(
                "Contact your administrator if you need images uploaded.",
                "Contacta a tu administrador si necesitas que se suban imágenes."
              )}
            </p>
          </div>
        )}

        {/* Grid View - responsive */}
        {!isLoading && images.length > 0 && viewMode === "grid" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {images.map((image) => (
              <div
                key={image.id}
                className={`rounded-lg shadow overflow-hidden hover:shadow-lg transition-all duration-200 ${
                  isDarkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white'
                }`}
              >
                {/* Image - clickable to view full image */}
                <img
                  src={image.url}
                  alt={image.fileName || image.originalFileName || "NDVI Image"}
                  className="w-full h-40 sm:h-48 object-cover cursor-pointer"
                  onClick={() => setSelectedImage(image)}
                />
                <div className="p-3 sm:p-4">
                  {editingImageId === image.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editingImageName}
                        onChange={(e) => setEditingImageName(e.target.value)}
                        className={`w-full px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                        placeholder={t("File name", "Nombre del archivo")}
                        autoFocus
                      />
                      <input
                        type="text"
                        value={editingCompanyName}
                        onChange={(e) => setEditingCompanyName(e.target.value)}
                        className={`w-full px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                        placeholder={t("Company name", "Nombre de la empresa")}
                      />
                      <input
                        type="text"
                        value={editingLocation}
                        onChange={(e) => setEditingLocation(e.target.value)}
                        className={`w-full px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                        placeholder={t("Location", "Ubicación")}
                      />
                      <select
                        value={editingImageType}
                        onChange={(e) => setEditingImageType(e.target.value)}
                        className={`w-full px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-gray-100' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        {IMAGE_TYPES.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleUpdateImageName(image.id)}
                          disabled={updatingImage}
                          className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50 transition-colors duration-200"
                        >
                          {updatingImage ? t("Saving...", "Guardando...") : t("Save", "Guardar")}
                        </button>
                        <button
                          onClick={cancelEditImageName}
                          className={`px-2 py-1 border text-xs rounded transition-colors duration-200 ${
                            isDarkMode 
                              ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {t("Cancel", "Cancelar")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className={`font-semibold mb-1 truncate transition-colors duration-200 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                        {image.fileName || image.originalFileName || "Untitled"}
                      </h3>
                      {image.companyName && (
                        <p className={`text-xs mb-1 truncate transition-colors duration-200 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          🏢 {image.companyName}
                        </p>
                      )}
                      {image.location && (
                        <p className={`text-xs mb-1 truncate transition-colors duration-200 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          📍 {image.location}
                        </p>
                      )}
                      <p className={`text-xs mb-2 transition-colors duration-200 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                        📊 {image.imageType || 'NDVI'}
                      </p>
                      <div className="flex items-center space-x-2 mb-2">
                        <button
                          onClick={() => startEditImageName(image)}
                          className={`text-xs transition-colors duration-200 ${
                            isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-900'
                          }`}
                        >
                          {t("Edit", "Editar")}
                        </button>
                      </div>
                    </>
                  )}
                  <div className={`flex justify-between items-center text-xs transition-colors duration-200 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <span>{formatDate(image.createdAt)}</span>
                    <span>{formatFileSize(image.fileSize)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View - responsive */}
        {!isLoading && images.length > 0 && viewMode === "list" && (
          <div className={`rounded-lg shadow overflow-hidden transition-colors duration-200 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            {/* Mobile List View */}
            <div className="block sm:hidden">
              {images.map((image) => (
                <div key={image.id} className={`p-4 border-b last:border-b-0 transition-colors duration-200 ${
                  isDarkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'
                }`}>
                  <div className="flex items-center space-x-3">
                    <img
                      src={image.url}
                      alt={image.fileName || image.originalFileName || "NDVI Image"}
                      className="h-16 w-16 object-cover rounded-lg flex-shrink-0 cursor-pointer"
                      onClick={() => setSelectedImage(image)}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-medium truncate transition-colors duration-200 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                        {image.fileName || image.originalFileName || "Untitled"}
                      </h4>
                      {image.companyName && (
                        <p className={`text-sm truncate transition-colors duration-200 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          🏢 {image.companyName}
                        </p>
                      )}
                      {image.location && (
                        <p className={`text-sm truncate transition-colors duration-200 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          📍 {image.location}
                        </p>
                      )}
                      <p className={`text-sm transition-colors duration-200 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                        📊 {image.imageType || 'NDVI'}
                      </p>
                      <p className={`text-sm transition-colors duration-200 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {formatDate(image.createdAt)} • {formatFileSize(image.fileSize)}
                      </p>
                      <div className="flex space-x-3 mt-2">
                        <button
                          onClick={() => setSelectedImage(image)}
                          className={`text-sm transition-colors duration-200 ${
                            isDarkMode ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {t("View", "Ver")}
                        </button>
                        <button
                          onClick={() => startEditImageName(image)}
                          className={`text-sm transition-colors duration-200 ${
                            isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-900'
                          }`}
                        >
                          {t("Edit", "Editar")}
                        </button>
                        <a
                          href={image.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`text-sm transition-colors duration-200 ${
                            isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-900'
                          }`}
                        >
                          {t("Download", "Descargar")}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className={`transition-colors duration-200 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Image
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      {t("Name", "Nombre")}
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      {t("Company", "Empresa")}
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      {t("Location", "Ubicación")}
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      {t("Type", "Tipo")}
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Date
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Size
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y transition-colors duration-200 ${isDarkMode ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'}`}>
                  {images.map((image) => (
                    <tr key={image.id} className={`transition-colors duration-200 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <img
                          src={image.url}
                          alt={image.fileName || image.originalFileName || "NDVI Image"}
                          className="h-12 w-12 object-cover rounded-lg cursor-pointer"
                          onClick={() => setSelectedImage(image)}
                        />
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium transition-colors duration-200 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                        {image.fileName || image.originalFileName || "Untitled"}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm transition-colors duration-200 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {image.companyName || "-"}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm transition-colors duration-200 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {image.location || "-"}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium transition-colors duration-200 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                        {image.imageType || "NDVI"}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm transition-colors duration-200 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {formatDate(image.createdAt)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm transition-colors duration-200 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {formatFileSize(image.fileSize)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => setSelectedImage(image)}
                            className={`transition-colors duration-200 ${
                              isDarkMode ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-900'
                            }`}
                          >
                            {t("View", "Ver")}
                          </button>
                          <button
                            onClick={() => startEditImageName(image)}
                            className={`transition-colors duration-200 ${
                              isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-900'
                            }`}
                          >
                            {t("Edit", "Editar")}
                          </button>
                          <a
                            href={image.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`transition-colors duration-200 ${
                              isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-900'
                            }`}
                          >
                            {t("Download", "Descargar")}
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Password Reset Modal */}
      {showPasswordReset && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg max-w-md w-full max-h-[90vh] overflow-auto transition-colors duration-200 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`sticky top-0 border-b px-6 py-4 flex justify-between items-center transition-colors duration-200 ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <h3 className={`text-lg font-semibold transition-colors duration-200 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                {t("Change Password", "Cambiar Contraseña")}
              </h3>
              <button
                onClick={() => {
                  setShowPasswordReset(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className={`transition-colors duration-200 ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t("Current Password", "Contraseña Actual")} *
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder={t("Enter current password", "Ingresa tu contraseña actual")}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t("New Password", "Nueva Contraseña")} *
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder={t("Create a strong password", "Crea una contraseña segura")}
                  />
                  
                  {/* Password Strength Indicator */}
                  {newPassword && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs transition-colors duration-200 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {t("Password Strength:", "Fortaleza de Contraseña:")}
                        </span>
                        <span className={`text-xs font-medium`} style={{ color: passwordStrength.color }}>
                          {t(passwordStrength.label, passwordStrength.label)}
                        </span>
                      </div>
                      <div className={`w-full rounded-full h-2 transition-colors duration-200 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                        <div 
                          className="h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${(passwordStrength.score / 6) * 100}%`,
                            backgroundColor: passwordStrength.color
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  {/* Password Requirements */}
                  {newPassword && passwordValidation.errors.length > 0 && (
                    <div className={`mt-2 p-3 border rounded-md transition-colors duration-200 ${
                      isDarkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'
                    }`}>
                      <p className={`text-sm font-medium mb-1 transition-colors duration-200 ${
                        isDarkMode ? 'text-red-400' : 'text-red-800'
                      }`}>
                        {t("Password must include:", "La contraseña debe incluir:")}
                      </p>
                      <ul className={`text-xs space-y-1 transition-colors duration-200 ${
                        isDarkMode ? 'text-red-300' : 'text-red-700'
                      }`}>
                        {passwordValidation.errors.map((error, index) => (
                          <li key={index} className="flex items-center">
                            <span className={`w-1 h-1 rounded-full mr-2 transition-colors duration-200 ${
                              isDarkMode ? 'bg-red-400' : 'bg-red-500'
                            }`}></span>
                            {language === "es" ? (
                              error === "At least 8 characters long" ? "Al menos 8 caracteres" :
                              error === "One uppercase letter" ? "Una letra mayúscula" :
                              error === "One lowercase letter" ? "Una letra minúscula" :
                              error === "One number" ? "Un número" :
                              error === "One special character" ? "Un carácter especial" :
                              error
                            ) : error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {newPassword && passwordValidation.isValid && (
                    <div className={`mt-2 p-3 border rounded-md transition-colors duration-200 ${
                      isDarkMode ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'
                    }`}>
                      <p className={`text-sm flex items-center transition-colors duration-200 ${
                        isDarkMode ? 'text-green-400' : 'text-green-800'
                      }`}>
                        <span className={`w-4 h-4 mr-2 transition-colors duration-200 ${
                          isDarkMode ? 'text-green-400' : 'text-green-500'
                        }`}>✓</span>
                        {t("Password meets all requirements", "La contraseña cumple todos los requisitos")}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t("Confirm New Password", "Confirmar Nueva Contraseña")} *
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder={t("Confirm your new password", "Confirma tu nueva contraseña")}
                  />
                  
                  {confirmPassword && newPassword && confirmPassword !== newPassword && (
                    <p className={`mt-1 text-sm transition-colors duration-200 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                      {t("Passwords do not match", "Las contraseñas no coinciden")}
                    </p>
                  )}
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={resettingPassword || !passwordValidation.isValid || newPassword !== confirmPassword}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {resettingPassword ? t("Updating...", "Actualizando...") : t("Update Password", "Actualizar Contraseña")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordReset(false);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    className={`px-4 py-2 border rounded-md transition-colors duration-200 ${
                      isDarkMode 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {t("Cancel", "Cancelar")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto transition-colors duration-200 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`sticky top-0 border-b px-4 sm:px-6 py-4 flex justify-between items-center transition-colors duration-200 ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <h3 className={`text-base sm:text-lg font-semibold transition-colors duration-200 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                {selectedImage.fileName || selectedImage.originalFileName || "NDVI Image"}
              </h3>
              <button
                onClick={() => setSelectedImage(null)}
                className={`transition-colors duration-200 ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <img
                src={selectedImage.url}
                alt={selectedImage.fileName || selectedImage.originalFileName || "NDVI Image"}
                className="w-full h-auto max-h-[50vh] sm:max-h-96 object-contain rounded-lg mb-4"
              />
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className={`font-semibold transition-colors duration-200 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                      {t("Upload Date:", "Fecha de Subida:")}
                    </span>
                    <span className={`ml-2 transition-colors duration-200 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {formatDate(selectedImage.createdAt)}
                    </span>
                  </div>
                  <div>
                    <span className={`font-semibold transition-colors duration-200 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                      {t("File Size:", "Tamaño del Archivo:")}
                    </span>
                    <span className={`ml-2 transition-colors duration-200 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {formatFileSize(selectedImage.fileSize)}
                    </span>
                  </div>
                  {selectedImage.companyName && (
                    <div>
                      <span className={`font-semibold transition-colors duration-200 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                        {t("Company:", "Empresa:")}
                      </span>
                      <span className={`ml-2 transition-colors duration-200 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {selectedImage.companyName}
                      </span>
                    </div>
                  )}
                  {selectedImage.location && (
                    <div>
                      <span className={`font-semibold transition-colors duration-200 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                        {t("Location:", "Ubicación:")}
                      </span>
                      <span className={`ml-2 transition-colors duration-200 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {selectedImage.location}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className={`font-semibold transition-colors duration-200 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                      {t("Image Type:", "Tipo de Imagen:")}
                    </span>
                    <span className={`ml-2 transition-colors duration-200 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                      {selectedImage.imageType || 'NDVI'}
                    </span>
                  </div>
                  {selectedImage.originalFileName && (
                    <div className="sm:col-span-2">
                      <span className={`font-semibold transition-colors duration-200 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                        {t("Original Filename:", "Archivo Original:")}
                      </span>
                      <span className={`ml-2 transition-colors duration-200 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {selectedImage.originalFileName}
                      </span>
                    </div>
                  )}
                  {selectedImage.mimeType && (
                    <div className="sm:col-span-2">
                      <span className={`font-semibold transition-colors duration-200 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                        {t("Type:", "Tipo:")}
                      </span>
                      <span className={`ml-2 transition-colors duration-200 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {selectedImage.mimeType}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <a
                    href={selectedImage.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors duration-200"
                  >
                    {t("Download Original", "Descargar Original")}
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