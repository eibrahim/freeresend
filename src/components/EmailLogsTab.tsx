"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface EmailLog {
  id: string;
  from_email: string;
  to_emails: string[];
  subject: string;
  status:
    | "pending"
    | "sent"
    | "failed"
    | "delivered"
    | "bounced"
    | "complained";
  created_at: string;
  domains?: { domain: string };
  api_keys?: { key_name: string };
}

interface Domain {
  id: string;
  domain: string;
}

export default function EmailLogsTab() {
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [filters, setFilters] = useState({
    domain_id: "",
    status: "",
    page: 1,
    limit: 50,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    loadDomains();
  }, []);

  useEffect(() => {
    loadEmails();
  }, [filters]);

  const loadDomains = async () => {
    try {
      const response = await api.getDomains();
      setDomains(response.data.domains);
    } catch (error) {
      console.error("Failed to load domains:", error);
    }
  };

  const loadEmails = async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== "")
      );
      const response = await api.getEmailLogs(params);
      setEmails(response.data.emails);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Failed to load emails:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailClick = async (emailId: string) => {
    try {
      const response = await api.getEmail(emailId);
      setSelectedEmail(response.data.email);
    } catch (error: any) {
      alert(error.message || "Failed to load email details");
    }
  };

  const getStatusBadge = (status: EmailLog["status"]) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      sent: "bg-blue-100 text-blue-800",
      delivered: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      bounced: "bg-red-100 text-red-800",
      complained: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}
      >
        {status}
      </span>
    );
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
  };

  if (loading && emails.length === 0) {
    return <div className="text-center py-8">Loading email logs...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Email Logs</h1>
          <p className="mt-2 text-sm text-gray-700">
            View and monitor all emails sent through your FreeResend instance.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label
                htmlFor="domain-filter"
                className="block text-sm font-medium text-gray-700"
              >
                Domain
              </label>
              <select
                id="domain-filter"
                value={filters.domain_id}
                onChange={(e) =>
                  setFilters({ ...filters, domain_id: e.target.value, page: 1 })
                }
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">All domains</option>
                {domains.map((domain) => (
                  <option key={domain.id} value={domain.id}>
                    {domain.domain}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="status-filter"
                className="block text-sm font-medium text-gray-700"
              >
                Status
              </label>
              <select
                id="status-filter"
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value, page: 1 })
                }
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">All statuses</option>
                <option value="sent">Sent</option>
                <option value="delivered">Delivered</option>
                <option value="failed">Failed</option>
                <option value="bounced">Bounced</option>
                <option value="complained">Complained</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="limit-filter"
                className="block text-sm font-medium text-gray-700"
              >
                Per Page
              </label>
              <select
                id="limit-filter"
                value={filters.limit}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    limit: parseInt(e.target.value),
                    page: 1,
                  })
                }
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Email List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {emails.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No emails found. Start sending emails to see them here.
          </div>
        ) : (
          <>
            <ul className="divide-y divide-gray-200">
              {emails.map((email) => (
                <li key={email.id} className="hover:bg-gray-50">
                  <button
                    onClick={() => handleEmailClick(email.id)}
                    className="w-full text-left px-4 py-4 sm:px-6"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {email.subject || "(No subject)"}
                          </p>
                          {getStatusBadge(email.status)}
                        </div>
                        <div className="mt-1">
                          <p className="text-sm text-gray-600">
                            From: {email.from_email}
                          </p>
                          <p className="text-sm text-gray-600">
                            To: {email.to_emails.join(", ")}
                          </p>
                        </div>
                        <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                          <span>{email.domains?.domain}</span>
                          <span>{email.api_keys?.key_name}</span>
                          <span>
                            {new Date(email.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing page {pagination.page} of {pagination.totalPages}{" "}
                      ({pagination.total} total emails)
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page >= pagination.totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Email Detail Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Email Details
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium text-gray-700">From:</span>
                    <div className="mt-1">{selectedEmail.from_email}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <div className="mt-1">
                      {getStatusBadge(selectedEmail.status)}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">To:</span>
                    <div className="mt-1">
                      {selectedEmail.to_emails.join(", ")}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Created:</span>
                    <div className="mt-1">
                      {new Date(selectedEmail.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div>
                  <span className="font-medium text-gray-700">Subject:</span>
                  <div className="mt-1">
                    {selectedEmail.subject || "(No subject)"}
                  </div>
                </div>

                {selectedEmail.html_content && (
                  <div>
                    <span className="font-medium text-gray-700">
                      HTML Content:
                    </span>
                    <div className="mt-1 bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                      <iframe
                        srcDoc={selectedEmail.html_content}
                        className="w-full h-48 border rounded"
                        title="Email HTML Content"
                      />
                    </div>
                  </div>
                )}

                {selectedEmail.text_content && (
                  <div>
                    <span className="font-medium text-gray-700">
                      Text Content:
                    </span>
                    <div className="mt-1 bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto whitespace-pre-wrap">
                      {selectedEmail.text_content}
                    </div>
                  </div>
                )}

                {selectedEmail.error_message && (
                  <div>
                    <span className="font-medium text-red-700">Error:</span>
                    <div className="mt-1 text-red-600">
                      {selectedEmail.error_message}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
