"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface Domain {
  id: string;
  domain: string;
  status: string;
}

interface ApiKey {
  id: string;
  domain_id: string;
  key_name: string;
  key_prefix: string;
  permissions: string[];
  last_used_at?: string;
  created_at: string;
  domains?: { domain: string };
}

export default function ApiKeysTab() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKey, setNewKey] = useState({
    domainId: "",
    keyName: "",
    permissions: ["send"],
  });
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [apiKeysResponse, domainsResponse] = await Promise.all([
        api.getApiKeys(),
        api.getDomains(),
      ]);
      setApiKeys(apiKeysResponse.data.apiKeys);
      setDomains(
        domainsResponse.data.domains.filter(
          (d: Domain) => d.status === "verified"
        )
      );
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.domainId || !newKey.keyName.trim()) return;

    setCreating(true);
    try {
      const response = await api.createApiKey(
        newKey.domainId,
        newKey.keyName.trim(),
        newKey.permissions
      );
      setApiKeys([response.data.apiKey, ...apiKeys]);
      setCreatedKey(response.data.apiKey.key);
      setNewKey({ domainId: "", keyName: "", permissions: ["send"] });
      setShowCreateForm(false);
    } catch (error: any) {
      alert(error.message || "Failed to create API key");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this API key? This action cannot be undone."
      )
    )
      return;

    try {
      await api.deleteApiKey(keyId);
      setApiKeys(apiKeys.filter((k) => k.id !== keyId));
    } catch (error: any) {
      alert(error.message || "Failed to delete API key");
    }
  };

  const maskApiKey = (keyPrefix: string) => {
    return `${keyPrefix}_${"*".repeat(32)}`;
  };

  if (loading) {
    return <div className="text-center py-8">Loading API keys...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">API Keys</h1>
          <p className="mt-2 text-sm text-gray-700">
            Create and manage API keys for sending emails through your verified
            domains.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => setShowCreateForm(true)}
            disabled={domains.length === 0}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create API Key
          </button>
        </div>
      </div>

      {domains.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                No verified domains
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  You need to add and verify at least one domain before creating
                  API keys.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create API Key Form */}
      {showCreateForm && domains.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Create New API Key
            </h3>
            <form onSubmit={handleCreateKey} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="domain"
                  className="block text-sm font-medium text-gray-700"
                >
                  Domain
                </label>
                <select
                  id="domain"
                  value={newKey.domainId}
                  onChange={(e) =>
                    setNewKey({ ...newKey, domainId: e.target.value })
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                >
                  <option value="">Select a domain</option>
                  {domains.map((domain) => (
                    <option key={domain.id} value={domain.id}>
                      {domain.domain}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="keyName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Key Name
                </label>
                <input
                  type="text"
                  id="keyName"
                  value={newKey.keyName}
                  onChange={(e) =>
                    setNewKey({ ...newKey, keyName: e.target.value })
                  }
                  placeholder="e.g., Production Key, Development Key"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? "Creating..." : "Create Key"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Created API Key Display */}
      {createdKey && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                API Key Created Successfully!
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p className="mb-2">
                  Save this API key now - it will not be shown again:
                </p>
                <div className="bg-white p-3 rounded border font-mono text-sm break-all">
                  {createdKey}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(createdKey);
                    alert("API key copied to clipboard!");
                  }}
                  className="mt-2 text-green-600 hover:text-green-800 text-sm font-medium"
                >
                  Copy to clipboard
                </button>
              </div>
              <button
                onClick={() => setCreatedKey(null)}
                className="mt-3 text-sm font-medium text-green-600 hover:text-green-800"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Keys List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {apiKeys.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No API keys created yet. Create your first API key to start sending
            emails.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {apiKeys.map((key) => (
              <li key={key.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {key.key_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Domain: {key.domains?.domain || "Unknown"}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">
                        {maskApiKey(key.key_prefix)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Created {new Date(key.created_at).toLocaleDateString()}
                        {key.last_used_at && (
                          <span>
                            {" "}
                            • Last used{" "}
                            {new Date(key.last_used_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {key.permissions.join(", ")}
                      </span>
                      <button
                        onClick={() => handleDeleteKey(key.id)}
                        className="text-red-600 hover:text-red-900 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
