"use client";

import { signOut } from "next-auth/react";
import { trpc } from "../../src/utils/trpc";
import { useState } from "react";

export default function ClientDashboard({ session }: { session: any }) {
  const { data: images, isLoading } = trpc.images.getMyImages.useQuery();
  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Your NDVI Dashboard
          </h2>
          <p className="text-lg text-gray-600">
            Monitor your agricultural fields with satellite-based vegetation analysis
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              🖼️ Total Images
            </h3>
            <p className="text-3xl font-bold text-green-600">{images?.length || 0}</p>
            <p className="text-sm text-gray-500">Satellite images analyzed</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              📊 NDVI Analysis
            </h3>
            <p className="text-3xl font-bold text-blue-600">--</p>
            <p className="text-sm text-gray-500">Average vegetation index</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              🌾 Fields Monitored
            </h3>
            <p className="text-3xl font-bold text-yellow-600">0</p>
            <p className="text-sm text-gray-500">Agricultural areas</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            🌾 Your NDVI Image Gallery
          </h2>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🌱</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              No NDVI Images Yet
            </h3>
            <p className="text-gray-600 mb-4">
              Your agricultural imagery will appear here once our team uploads your field data.
            </p>
            <p className="text-sm text-gray-500">
              Contact our support team if you are expecting images that have not appeared yet.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
