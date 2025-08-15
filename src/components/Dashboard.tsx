"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DomainsTab from "./DomainsTab";
import ApiKeysTab from "./ApiKeysTab";
import EmailLogsTab from "./EmailLogsTab";

type Tab = "domains" | "apikeys" | "logs";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("domains");

  const tabs = [
    {
      id: "domains" as Tab,
      name: "Domains",
      description: "Manage your email domains",
    },
    {
      id: "apikeys" as Tab,
      name: "API Keys",
      description: "Manage API keys for sending emails",
    },
    {
      id: "logs" as Tab,
      name: "Email Logs",
      description: "View sent email history",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">FreeResend</h1>
              <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Self-hosted
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.email}</span>
              <button
                onClick={logout}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {activeTab === "domains" && <DomainsTab />}
          {activeTab === "apikeys" && <ApiKeysTab />}
          {activeTab === "logs" && <EmailLogsTab />}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <div>
              <span>Built with ❤️ by </span>
              <a
                href="https://x.com/eibrahim"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Emad Ibrahim
              </a>
              <span className="mx-2">•</span>
              <a
                href="https://www.frontendweekly.co/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Frontend Weekly
              </a>
              <span className="mx-2">•</span>
              <a
                href="https://www.elitesaas.dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                EliteSaaS
              </a>
            </div>
            <div className="text-xs">
              <span>Powered by EliteCoders - </span>
              <a
                href="https://elitecoders.co/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Get in touch
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
