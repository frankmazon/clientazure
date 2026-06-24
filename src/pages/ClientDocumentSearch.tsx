import { useEffect, useMemo, useState } from 'react';
import {
  FaCheckCircle,
  FaDownload,
  FaEdit,
  FaExclamationTriangle,
  FaEye,
  FaFileAlt,
  FaFolder,
  FaIdBadge,
  FaSearch,
  FaSyncAlt,
  FaTimes,
  FaTrash,
  FaUser,
} from 'react-icons/fa';
import DashboardLayout from '../components/layout/layout';

const CLIENTS_API =
  'https://docsuploadpythonapi.azurewebsites.net/api/clients';

const requiredDocuments = [
  'id',
  'property-documents',
  'credit-history',
  'income-documents',
  'other',
];

type Client = {
  id: number;
  uniqueId?: string;
  name?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email?: string;
  documentType?: string;
  fileName?: string;
  fileUrl?: string;
  submittedAt?: string;
};

const documentTypeLabels: Record<string, string> = {
  id: 'ID',
  ID: 'ID',
  'property-documents': 'Property Documents',
  'credit-history': 'Credit History',
  'income-documents': 'Income Documents',
  other: 'Other',
};

export default function ClientDocumentSearch() {
  const [search, setSearch] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [previewFile, setPreviewFile] = useState<Client | null>(null);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadClients = async (keyword = '') => {
    try {
      setLoading(true);
      setError('');

      const url = keyword.trim()
        ? `${CLIENTS_API}?search=${encodeURIComponent(keyword.trim())}`
        : CLIENTS_API;

      const response = await fetch(url);
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

  useEffect(() => {
    loadClients();
  }, []);

  const getFullName = (client: Client) =>
    (
      client.name ||
      `${client.firstName || ''} ${client.middleName || ''} ${client.lastName || ''}`
    )
      .replace(/\s+/g, ' ')
      .trim();

  const formatDocumentType = (type?: string) => {
    if (!type) return 'Document';

    return (
      documentTypeLabels[type] ||
      type
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    );
  };

  const filteredClients = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return clients.filter((client) => {
      const fullName = getFullName(client).toLowerCase();

      const matchesSearch =
        !keyword ||
        fullName.includes(keyword) ||
        (client.uniqueId || '').toLowerCase().includes(keyword) ||
        (client.email || '').toLowerCase().includes(keyword) ||
        (client.fileName || '').toLowerCase().includes(keyword) ||
        (client.documentType || '').toLowerCase().includes(keyword);

      const matchesType =
        selectedType === 'all' || client.documentType === selectedType;

      return matchesSearch && matchesType;
    });
  }, [clients, search, selectedType]);

  const documentTypes = useMemo(() => {
    return Array.from(
      new Set(clients.map((client) => client.documentType).filter(Boolean)),
    ) as string[];
  }, [clients]);

  const clientFolders = useMemo(() => {
    const map = new Map<string, Client[]>();

    filteredClients.forEach((client) => {
      const key = client.uniqueId || String(client.id);

      if (!map.has(key)) {
        map.set(key, []);
      }

      map.get(key)?.push(client);
    });

    return Array.from(map.entries()).map(([uniqueId, files]) => {
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
        uniqueId,
        client: files[0],
        files,
        uploadedDocuments,
        missingDocuments,
        isComplete: missingDocuments.length === 0,
      };
    });
  }, [filteredClients]);

  const incompleteCount = clientFolders.filter((folder) => !folder.isComplete).length;
  const completeCount = clientFolders.filter((folder) => folder.isComplete).length;

  const handleSearch = () => {
    loadClients(search);
  };

  const handleDownload = (file: Client) => {
    if (!file.fileUrl) {
      alert('No file available.');
      return;
    }

    window.open(file.fileUrl, '_blank');
  };

  const handleUnsupportedAction = (action: string) => {
    alert(`${action} is not available yet.`);
  };

  const isImageFile =
    previewFile?.fileName?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) ||
    previewFile?.fileUrl?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)/);

  return (
    <DashboardLayout
      title="Client Document Search"
      subtitle="Search client files and check missing required documents."
    >
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Search Client Documents
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Search by Unique ID, name, email, document type, or file name.
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadClients()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 text-sm font-bold text-slate-700 hover:bg-slate-200"
            >
              <FaSyncAlt />
              Refresh
            </button>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_260px_auto]">
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleSearch();
                }}
                placeholder="Search Unique ID, name, email, or file..."
                className="h-12 w-full rounded-xl border border-slate-300 pl-12 pr-4 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <select
              value={selectedType}
              onChange={(event) => setSelectedType(event.target.value)}
              className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            >
              <option value="all">All Document Types</option>
              {documentTypes.map((type) => (
                <option key={type} value={type}>
                  {formatDocumentType(type)}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleSearch}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 text-sm font-bold text-white shadow-sm hover:bg-orange-600"
            >
              <FaSearch />
              Search
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">Total Records</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">
              {clients.length}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">Client Folders</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">
              {clientFolders.length}
            </p>
          </div>

          <div className="rounded-3xl border border-green-200 bg-green-50 p-5 shadow-sm">
            <p className="text-sm font-bold text-green-700">Complete</p>
            <p className="mt-2 text-3xl font-extrabold text-green-700">
              {completeCount}
            </p>
          </div>

          <div className="rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <p className="text-sm font-bold text-red-700">Incomplete</p>
            <p className="mt-2 text-3xl font-extrabold text-red-700">
              {incompleteCount}
            </p>
          </div>
        </section>

        {loading && (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm font-bold text-slate-500 shadow-sm">
            Loading client documents from Azure...
          </div>
        )}

        {error && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-4">
            {clientFolders.map(
              ({
                uniqueId,
                client,
                files,
                uploadedDocuments,
                missingDocuments,
                isComplete,
              }) => (
                <div
                  key={uniqueId}
                  className={`overflow-hidden rounded-3xl border bg-white shadow-sm ${
                    isComplete ? 'border-green-200' : 'border-red-200'
                  }`}
                >
                  <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                      <div
                        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
                          isComplete
                            ? 'bg-green-100 text-green-600'
                            : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {isComplete ? (
                          <FaCheckCircle className="text-2xl" />
                        ) : (
                          <FaExclamationTriangle className="text-2xl" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-extrabold text-slate-900">
                          {getFullName(client) || 'Unnamed Client'}
                        </h3>

                        <div className="mt-1 flex flex-wrap gap-3 text-sm text-slate-500">
                          <span className="inline-flex items-center gap-2">
                            <FaIdBadge className="text-xs" />
                            {client.uniqueId || uniqueId}
                          </span>

                          <span className="inline-flex items-center gap-2">
                            <FaUser className="text-xs" />
                            {client.email || 'No email'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-4 py-2 text-sm font-bold ${
                        isComplete
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {isComplete ? 'Complete' : 'Incomplete'}
                    </span>
                  </div>

                  <div className="border-b border-slate-100 bg-slate-50 p-5">
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div>
                        <p className="mb-2 text-xs font-bold uppercase text-slate-500">
                          Uploaded Documents
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {uploadedDocuments.map((doc) => (
                            <span
                              key={doc}
                              className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700"
                            >
                              {formatDocumentType(doc)}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="mb-2 text-xs font-bold uppercase text-slate-500">
                          Missing Documents
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {missingDocuments.length > 0 ? (
                            missingDocuments.map((doc) => (
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
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
                    {files.map((file) => (
                      <div
                        key={`${file.id}-${file.fileName}`}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white">
                            <FaFileAlt />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold uppercase tracking-wide text-orange-600">
                              {formatDocumentType(file.documentType)}
                            </p>

                            <h4 className="mt-1 truncate text-sm font-extrabold text-slate-900">
                              {file.fileName || 'No file name'}
                            </h4>

                            <p className="mt-1 text-xs text-slate-500">
                              Submitted: {file.submittedAt || 'N/A'}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewFile(file)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-3 py-2 text-xs font-bold text-white hover:bg-blue-600"
                          >
                            <FaEye />
                            View
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownload(file)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-3 py-2 text-xs font-bold text-white hover:bg-green-600"
                          >
                            <FaDownload />
                            Download
                          </button>

                          <button
                            type="button"
                            onClick={() => handleUnsupportedAction('Edit')}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-500 px-3 py-2 text-xs font-bold text-white hover:bg-slate-600"
                          >
                            <FaEdit />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleUnsupportedAction('Delete')}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-3 py-2 text-xs font-bold text-white hover:bg-red-600"
                          >
                            <FaTrash />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ),
            )}

            {clientFolders.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
                <FaFolder className="mx-auto text-5xl text-slate-300" />

                <h3 className="mt-4 text-lg font-bold text-slate-900">
                  No client documents found
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Try searching another Unique ID, name, or document type.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {previewFile && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <h2 className="text-xl font-extrabold text-slate-900">
                {previewFile.fileName || 'File Preview'}
              </h2>

              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="rounded-xl bg-slate-100 p-3 text-slate-600 hover:bg-slate-200"
              >
                <FaTimes />
              </button>
            </div>

            <div className="bg-slate-100 p-4">
              {previewFile.fileUrl ? (
                isImageFile ? (
                  <img
                    src={previewFile.fileUrl}
                    alt={previewFile.fileName || 'Preview'}
                    className="mx-auto max-h-[70vh] rounded-2xl bg-white object-contain"
                  />
                ) : (
                  <iframe
                    src={previewFile.fileUrl}
                    title={previewFile.fileName}
                    className="h-[70vh] w-full rounded-2xl bg-white"
                  />
                )
              ) : (
                <div className="flex h-[70vh] items-center justify-center rounded-2xl bg-white text-slate-500">
                  No preview available.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}