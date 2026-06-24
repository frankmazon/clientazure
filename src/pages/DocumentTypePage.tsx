import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  FaChevronDown,
  FaChevronRight,
  FaDownload,
  FaEnvelope,
  FaEye,
  FaFileAlt,
  FaFolder,
  FaFolderOpen,
  FaTimes,
} from 'react-icons/fa';
import DashboardLayout from '../components/layout/layout';

const CLIENTS_API =
  'https://docsuploadpythonapi.azurewebsites.net/api/clients';

const FILE_URL_API =
  'https://docsuploadpythonapi.azurewebsites.net/api/file-url';

type Client = {
  id: number;
  clientId?: number;
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
  sssNumber?: string;
  hdmfNumber?: string;
  philhealthNumber?: string;
  tinNumber?: string;
  licenseNumber?: string;
};

type ClientFolder = {
  key: string;
  client: Client;
  files: Client[];
};

const documentTypeLabels: Record<string, string> = {
  id: 'ID',
  ID: 'ID',
  'property-documents': 'Property Documents',
  'credit-history': 'Credit History',
  'income-documents': 'Income Documents',
  other: 'Other',
};

export default function DocumentTypePage() {
  const { type } = useParams();
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [clients, setClients] = useState<Client[]>([]);
  const [previewFile, setPreviewFile] = useState<Client | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const pageTitle =
    documentTypeLabels[type || ''] ||
    type
      ?.split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') ||
    'Documents';

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
    const loadDocuments = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(
          `${CLIENTS_API}?documentType=${encodeURIComponent(type || '')}`,
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Failed to load documents.');
        }

        setClients(result.clients || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load documents.',
        );
        setClients([]);
      } finally {
        setLoading(false);
      }
    };

    if (type) loadDocuments();
  }, [type]);

  const getFullName = (client: Client) =>
    (
      client.name ||
      `${client.firstName || ''} ${client.middleName || ''} ${client.lastName || ''}`
    )
      .replace(/\s+/g, ' ')
      .trim();

  const clientFolders = useMemo<ClientFolder[]>(() => {
    const map = new Map<string, Client[]>();

    clients.forEach((client) => {
      const key = client.uniqueId || String(client.clientId || client.id);

      if (!map.has(key)) {
        map.set(key, []);
      }

      map.get(key)?.push(client);
    });

    return Array.from(map.entries()).map(([key, files]) => ({
      key,
      client: files[0],
      files,
    }));
  }, [clients]);

  const toggleFolder = (folderKey: string) => {
    setOpenFolders((prev) => ({
      ...prev,
      [folderKey]: !prev[folderKey],
    }));
  };

  const handlePreview = async (file: Client) => {
    try {
      setPreviewFile(file);
      setPreviewUrl('');
      setPreviewLoading(true);

      const secureUrl = await getSecureFileUrl(file.fileUrl);
      setPreviewUrl(secureUrl);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to open file.');
      setPreviewFile(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = async (file: Client) => {
    try {
      const secureUrl = await getSecureFileUrl(file.fileUrl);
      window.open(secureUrl, '_blank');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to download file.');
    }
  };

  const handleClosePreview = () => {
    setPreviewFile(null);
    setPreviewUrl('');
  };

  const isImageFile =
    previewFile?.fileName?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/);

  const isPdfFile = previewFile?.fileName?.toLowerCase().endsWith('.pdf');

  return (
    <DashboardLayout
      title={`${pageTitle} Folders`}
      subtitle={`Client folders containing ${pageTitle} submissions from Azure SQL`}
    >
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-extrabold text-slate-900">
            {pageTitle} Document Folders
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {loading
              ? 'Loading...'
              : `${clientFolders.length} client folder(s), ${clients.length} file(s) found`}
          </p>
        </div>

        {loading && (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-sm font-bold text-slate-500">
            Loading {pageTitle} documents from Azure...
          </div>
        )}

        {error && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid gap-4">
            {clientFolders.map(({ key, client, files }) => {
              const isOpen = openFolders[key];
              const fullName = getFullName(client);
              const isIdDocument =
                client.documentType === 'id' || client.documentType === 'ID';

              return (
                <div
                  key={key}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => toggleFolder(key)}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-slate-50"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                        {isOpen ? (
                          <FaFolderOpen className="text-2xl" />
                        ) : (
                          <FaFolder className="text-2xl" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-extrabold text-slate-900">
                          {fullName || 'Unnamed Client'}
                        </h3>

                        <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                          <FaEnvelope className="text-xs" />
                          {client.email || 'No email'}
                        </p>

                        <p className="mt-1 text-xs font-bold text-orange-600">
                          {client.uniqueId || key} • {files.length} file
                          {files.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-slate-400">
                      {isOpen ? <FaChevronDown /> : <FaChevronRight />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="space-y-4 border-t border-slate-100 bg-slate-50 p-5">
                      {files.map((file) => (
                        <div
                          key={`${file.id}-${file.fileName}`}
                          className="rounded-2xl border border-slate-200 bg-white p-5"
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white">
                              <FaFileAlt />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold uppercase text-orange-600">
                                {pageTitle}
                              </p>

                              <h4 className="mt-1 truncate text-base font-bold text-slate-900">
                                {file.fileName || 'No file name'}
                              </h4>

                              <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                                <p>
                                  <span className="font-semibold text-slate-800">
                                    Client ID:
                                  </span>{' '}
                                  {file.uniqueId || file.clientId || file.id}
                                </p>

                                <p>
                                  <span className="font-semibold text-slate-800">
                                    Submitted:
                                  </span>{' '}
                                  {file.submittedAt || 'N/A'}
                                </p>

                                <p>
                                  <span className="font-semibold text-slate-800">
                                    Document Type:
                                  </span>{' '}
                                  {pageTitle}
                                </p>

                                <p>
                                  <span className="font-semibold text-slate-800">
                                    Email:
                                  </span>{' '}
                                  {file.email || 'N/A'}
                                </p>
                              </div>

                              <div className="mt-5 flex flex-wrap gap-3">
                                <button
                                  type="button"
                                  onClick={() => handlePreview(file)}
                                  className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-sm font-bold text-white hover:bg-blue-600"
                                >
                                  <FaEye />
                                  View File
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDownload(file)}
                                  className="inline-flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2 text-sm font-bold text-white hover:bg-green-600"
                                >
                                  <FaDownload />
                                  Download
                                </button>
                              </div>

                              {isIdDocument && (
                                <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-4">
                                  <h5 className="mb-3 text-sm font-extrabold text-slate-900">
                                    ID Information
                                  </h5>

                                  <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                                    <p>
                                      <span className="font-semibold text-slate-800">
                                        SSS Number:
                                      </span>{' '}
                                      {file.sssNumber || 'N/A'}
                                    </p>

                                    <p>
                                      <span className="font-semibold text-slate-800">
                                        HDMF / Pag-IBIG:
                                      </span>{' '}
                                      {file.hdmfNumber || 'N/A'}
                                    </p>

                                    <p>
                                      <span className="font-semibold text-slate-800">
                                        PhilHealth:
                                      </span>{' '}
                                      {file.philhealthNumber || 'N/A'}
                                    </p>

                                    <p>
                                      <span className="font-semibold text-slate-800">
                                        TIN:
                                      </span>{' '}
                                      {file.tinNumber || 'N/A'}
                                    </p>

                                    <p>
                                      <span className="font-semibold text-slate-800">
                                        License Number:
                                      </span>{' '}
                                      {file.licenseNumber || 'N/A'}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {clientFolders.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
                <FaFolder className="mx-auto text-5xl text-slate-300" />

                <h3 className="mt-4 text-lg font-bold text-slate-900">
                  No folders found
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  No client has submitted {pageTitle} yet.
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
                onClick={handleClosePreview}
                className="rounded-xl bg-slate-100 p-3 text-slate-600 hover:bg-slate-200"
              >
                <FaTimes />
              </button>
            </div>

            <div className="bg-slate-100 p-4">
              {previewLoading && (
                <div className="flex h-[70vh] items-center justify-center rounded-2xl bg-white text-slate-500">
                  Loading secure preview...
                </div>
              )}

              {!previewLoading && previewUrl && isImageFile && (
                <img
                  src={previewUrl}
                  alt={previewFile.fileName || 'Preview'}
                  className="mx-auto max-h-[70vh] rounded-2xl bg-white object-contain"
                />
              )}

              {!previewLoading && previewUrl && isPdfFile && (
                <iframe
                  src={previewUrl}
                  title={previewFile.fileName}
                  className="h-[70vh] w-full rounded-2xl bg-white"
                />
              )}

              {!previewLoading && previewUrl && !isImageFile && !isPdfFile && (
                <div className="flex h-[70vh] flex-col items-center justify-center rounded-2xl bg-white text-center text-slate-500">
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