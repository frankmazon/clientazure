import { useEffect, useMemo, useState } from 'react';
import {
  FaCheckCircle,
  FaDownload,
  FaExclamationTriangle,
  FaEye,
  FaFileAlt,
  FaSearch,
  FaTimes,
} from 'react-icons/fa';
import DashboardLayout from '../components/layout/layout';

const CLIENTS_API =
  'https://docsuploadpythonapi.azurewebsites.net/api/clients';

const FILE_URL_API =
  'https://docsuploadpythonapi.azurewebsites.net/api/file-url';

const requiredDocuments = [
  'id',
  'property-documents',
  'credit-history',
  'income-documents',
  'other',
];

const documentLabels: Record<string, string> = {
  id: 'ID',
  'property-documents': 'Property Documents',
  'credit-history': 'Credit History',
  'income-documents': 'Income Documents',
  other: 'Other',
};

type Client = {
  id: number;
  clientId?: number;
  uniqueId?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  documentType?: string;
  fileName?: string;
  fileUrl?: string;
  submittedAt?: string;
};

type ClientGroup = {
  key: string;
  client: Client;
  files: Client[];
  uploadedDocuments: string[];
  missingDocuments: string[];
  isComplete: boolean;
};

export default function Clients() {
  const [search, setSearch] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getSecureFileUrl = async (fileUrl?: string) => {
    if (!fileUrl) {
      throw new Error('No file URL available.');
    }

    const response = await fetch(
      `${FILE_URL_API}?blobUrl=${encodeURIComponent(fileUrl)}`,
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to generate secure file URL.');
    }

    return result.url as string;
  };

  useEffect(() => {
    const loadClients = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(CLIENTS_API);
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Failed to load clients.');
        }

        setClients(result.clients || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load clients.');
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, []);

  const getFullName = (client: Client) =>
    (
      client.name ||
      `${client.firstName || ''} ${client.middleName || ''} ${client.lastName || ''}`
    )
      .replace(/\s+/g, ' ')
      .trim();

  const formatDocumentType = (type?: string) =>
    documentLabels[type || ''] ||
    (type || 'document')
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  const clientGroups = useMemo<ClientGroup[]>(() => {
    const map = new Map<string, Client[]>();

    clients.forEach((client) => {
      const key = client.uniqueId || String(client.clientId || client.id);

      if (!map.has(key)) {
        map.set(key, []);
      }

      map.get(key)?.push(client);
    });

    return Array.from(map.entries()).map(([key, files]) => {
      const uploadedDocuments = Array.from(
        new Set(
          files
            .map((file) => file.documentType?.toLowerCase())
            .filter(Boolean) as string[],
        ),
      );

      const missingDocuments = requiredDocuments.filter(
        (doc) => !uploadedDocuments.includes(doc),
      );

      return {
        key,
        client: files[0],
        files,
        uploadedDocuments,
        missingDocuments,
        isComplete: missingDocuments.length === 0,
      };
    });
  }, [clients]);

  const filteredGroups = useMemo(() => {
    const searchValue = search.toLowerCase().trim();

    return clientGroups.filter((group) => {
      const fullName = getFullName(group.client).toLowerCase();

      return (
        !searchValue ||
        fullName.includes(searchValue) ||
        (group.client.email || '').toLowerCase().includes(searchValue) ||
        (group.client.uniqueId || '').toLowerCase().includes(searchValue) ||
        group.files.some((file) =>
          (file.fileName || '').toLowerCase().includes(searchValue),
        )
      );
    });
  }, [clientGroups, search]);

  const handlePreview = async (client: Client) => {
    try {
      setSelectedClient(client);
      setPreviewUrl('');
      setPreviewLoading(true);

      const secureUrl = await getSecureFileUrl(client.fileUrl);
      setPreviewUrl(secureUrl);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to open file.');
      setSelectedClient(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = async (client: Client) => {
    try {
      const secureUrl = await getSecureFileUrl(client.fileUrl);
      window.open(secureUrl, '_blank');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to download file.');
    }
  };

  const handleClosePreview = () => {
    setSelectedClient(null);
    setPreviewUrl('');
  };

  const isImageFile =
    selectedClient?.fileName?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/);

  const isPdfFile = selectedClient?.fileName?.toLowerCase().endsWith('.pdf');

  return (
    <DashboardLayout
      title="Clients"
      subtitle="View submitted clients and completion status from Azure SQL."
    >
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search unique ID, name, email, or file..."
              className="h-12 w-full rounded-xl border border-slate-300 pl-12 pr-4 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>
        </div>

        {loading && (
          <div className="rounded-2xl bg-white p-10 text-center font-bold text-slate-500 shadow-sm ring-1 ring-slate-200">
            Loading clients from Azure...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <p className="text-sm font-bold text-slate-500">Clients</p>
                <p className="mt-2 text-3xl font-extrabold text-slate-900">
                  {clientGroups.length}
                </p>
              </div>

              <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
                <p className="text-sm font-bold text-green-700">Complete</p>
                <p className="mt-2 text-3xl font-extrabold text-green-700">
                  {clientGroups.filter((group) => group.isComplete).length}
                </p>
              </div>

              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
                <p className="text-sm font-bold text-red-700">Incomplete</p>
                <p className="mt-2 text-3xl font-extrabold text-red-700">
                  {clientGroups.filter((group) => !group.isComplete).length}
                </p>
              </div>
            </div>

            <div className="space-y-4 lg:hidden">
              {filteredGroups.map((group) => (
                <div
                  key={group.key}
                  className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ${
                    group.isComplete ? 'ring-green-200' : 'ring-red-200'
                  }`}
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-extrabold text-slate-900">
                        {getFullName(group.client) || '-'}
                      </h3>
                      <p className="truncate text-sm text-slate-500">
                        {group.client.email || 'No email'}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                        group.isComplete
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {group.isComplete ? 'Complete' : 'Incomplete'}
                    </span>
                  </div>

                  <div className="grid gap-3 text-sm">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-bold uppercase text-slate-400">
                        Unique ID
                      </p>
                      <p className="mt-1 font-semibold text-slate-800">
                        {group.client.uniqueId || '-'}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-bold uppercase text-slate-400">
                        Uploaded
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {group.uploadedDocuments.map((doc) => (
                          <span
                            key={doc}
                            className="rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-700"
                          >
                            {formatDocumentType(doc)}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-bold uppercase text-slate-400">
                        Missing
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {group.missingDocuments.length > 0 ? (
                          group.missingDocuments.map((doc) => (
                            <span
                              key={doc}
                              className="rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-700"
                            >
                              {formatDocumentType(doc)}
                            </span>
                          ))
                        ) : (
                          <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-700">
                            None
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {group.files.slice(0, 1).map((file) => (
                      <div key={`${file.id}-${file.fileName}`} className="contents">
                        <button
                          type="button"
                          onClick={() => handlePreview(file)}
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-500 text-sm font-bold text-white hover:bg-blue-600"
                        >
                          <FaEye />
                          View
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownload(file)}
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 text-sm font-bold text-white hover:bg-orange-600"
                        >
                          <FaDownload />
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 lg:block">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Client List
                  </h2>
                  <p className="text-sm text-slate-500">
                    {filteredGroups.length} client
                    {filteredGroups.length !== 1 ? 's' : ''}
                  </p>
                </div>

                <FaFileAlt className="text-2xl text-orange-500" />
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[1200px]">
                  <thead className="bg-slate-50">
                    <tr>
                      {[
                        'Unique ID',
                        'Name',
                        'Email',
                        'Status',
                        'Uploaded',
                        'Missing',
                        'Files',
                        'Action',
                      ].map((header) => (
                        <th
                          key={header}
                          className={`px-6 py-4 text-sm font-extrabold uppercase tracking-wide text-slate-600 ${
                            header === 'Action' ? 'text-center' : 'text-left'
                          }`}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {filteredGroups.map((group) => (
                      <tr key={group.key} className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                          {group.client.uniqueId || '-'}
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">
                            {getFullName(group.client) || '-'}
                          </p>
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {group.client.email || '-'}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${
                              group.isComplete
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {group.isComplete ? (
                              <FaCheckCircle />
                            ) : (
                              <FaExclamationTriangle />
                            )}
                            {group.isComplete ? 'Complete' : 'Incomplete'}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            {group.uploadedDocuments.map((doc) => (
                              <span
                                key={doc}
                                className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700"
                              >
                                {formatDocumentType(doc)}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            {group.missingDocuments.length > 0 ? (
                              group.missingDocuments.map((doc) => (
                                <span
                                  key={doc}
                                  className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700"
                                >
                                  {formatDocumentType(doc)}
                                </span>
                              ))
                            ) : (
                              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                                None
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                          {group.files.length}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            {group.files.slice(0, 1).map((file) => (
                              <div key={`${file.id}-${file.fileName}`} className="contents">
                                <button
                                  type="button"
                                  onClick={() => handlePreview(file)}
                                  className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-3 py-2 text-xs font-bold text-white hover:bg-blue-600"
                                >
                                  <FaEye />
                                  View
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDownload(file)}
                                  className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-3 py-2 text-xs font-bold text-white hover:bg-orange-600"
                                >
                                  <FaDownload />
                                  Download
                                </button>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredGroups.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-6 py-12 text-center text-sm text-slate-500"
                        >
                          No clients found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {selectedClient && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Client File Details
                </h2>
                <p className="text-sm text-slate-500">
                  View submitted client information and uploaded file.
                </p>
              </div>

              <button
                type="button"
                onClick={handleClosePreview}
                className="rounded-xl bg-slate-100 p-3 text-slate-600 hover:bg-slate-200"
              >
                <FaTimes />
              </button>
            </div>

            <div className="max-h-[calc(90vh-80px)] overflow-y-auto p-6">
              <div className="mb-6 grid gap-4 md:grid-cols-2">
                {[
                  ['Unique ID', selectedClient.uniqueId || '-'],
                  ['Full Name', getFullName(selectedClient) || '-'],
                  ['Email', selectedClient.email || '-'],
                  [
                    'Document Type',
                    formatDocumentType(selectedClient.documentType),
                  ],
                  ['File Name', selectedClient.fileName || '-'],
                  ['Submitted', selectedClient.submittedAt || '-'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase text-slate-400">
                      {label}
                    </p>
                    <p className="mt-1 break-words font-semibold text-slate-900">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="mb-3 text-sm font-bold text-slate-700">
                  File Preview
                </p>

                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4">
                  <div>
                    <p className="break-all font-semibold text-slate-900">
                      {selectedClient.fileName || 'No file selected'}
                    </p>
                    <p className="text-sm text-slate-500">
                      Submitted client file
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDownload(selectedClient)}
                    className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                  >
                    <FaDownload />
                    Download
                  </button>
                </div>

                {previewLoading && (
                  <div className="flex h-[500px] items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500">
                    Loading secure preview...
                  </div>
                )}

                {!previewLoading && previewUrl && isImageFile && (
                  <img
                    src={previewUrl}
                    alt={selectedClient.fileName || 'Preview'}
                    className="mx-auto max-h-[500px] rounded-xl border border-slate-200 bg-white object-contain"
                  />
                )}

                {!previewLoading && previewUrl && isPdfFile && (
                  <iframe
                    src={previewUrl}
                    title="Client File Preview"
                    className="h-[500px] w-full rounded-xl border border-slate-200"
                  />
                )}

                {!previewLoading && previewUrl && !isImageFile && !isPdfFile && (
                  <div className="flex h-[500px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-white text-center text-slate-500">
                    <FaFileAlt className="mb-4 text-5xl text-slate-300" />
                    <p className="font-bold text-slate-700">
                      Preview not available for this file type.
                    </p>
                    <p className="mt-1 text-sm">
                      Please download the file to view it.
                    </p>
                    <button
                      type="button"
                      onClick={() => window.open(previewUrl, '_blank')}
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-green-500 px-5 py-3 text-sm font-bold text-white hover:bg-green-600"
                    >
                      <FaDownload />
                      Open / Download
                    </button>
                  </div>
                )}

                {!previewLoading && !previewUrl && (
                  <div className="rounded-xl bg-slate-100 p-6 text-center text-sm text-slate-500">
                    No preview available. Filename: {selectedClient.fileName}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}