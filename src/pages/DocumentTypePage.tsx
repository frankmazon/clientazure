import { useEffect, useState } from 'react';
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
} from 'react-icons/fa';
import DashboardLayout from '../components/layout/layout';

const CLIENTS_API =
  'https://docsuploadpythonapi.azurewebsites.net/api/clients';

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
  sssNumber?: string;
  hdmfNumber?: string;
  philhealthNumber?: string;
  tinNumber?: string;
  licenseNumber?: string;
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
  const [openFolders, setOpenFolders] = useState<Record<number, boolean>>({});
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const pageTitle =
    documentTypeLabels[type || ''] ||
    type
      ?.split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') ||
    'Documents';

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

    if (type) {
      loadDocuments();
    }
  }, [type]);

  const getFullName = (client: Client) => {
    return (
      client.name ||
      `${client.firstName || ''} ${client.middleName || ''} ${client.lastName || ''}`
        .replace(/\s+/g, ' ')
        .trim()
    );
  };

  const toggleFolder = (clientId: number) => {
    setOpenFolders((prev) => ({
      ...prev,
      [clientId]: !prev[clientId],
    }));
  };

  const handleOpenFile = (client: Client) => {
    if (!client.fileUrl) {
      alert('No file available.');
      return;
    }

    window.open(client.fileUrl, '_blank');
  };

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
            {loading ? 'Loading...' : `${clients.length} client folder(s) found`}
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
            {clients.map((client) => {
              const isOpen = openFolders[client.id];
              const fullName = getFullName(client);
              const isIdDocument =
                client.documentType === 'id' || client.documentType === 'ID';

              return (
                <div
                  key={`${client.id}-${client.fileName}`}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => toggleFolder(client.id)}
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
                      </div>
                    </div>

                    <div className="shrink-0 text-slate-400">
                      {isOpen ? <FaChevronDown /> : <FaChevronRight />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-slate-100 bg-slate-50 p-5">
                      <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white">
                            <FaFileAlt />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold uppercase text-orange-600">
                              {pageTitle}
                            </p>

                            <h4 className="mt-1 truncate text-base font-bold text-slate-900">
                              {client.fileName || 'No file name'}
                            </h4>

                            <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                              <p>
                                <span className="font-semibold text-slate-800">
                                  Client ID:
                                </span>{' '}
                                {client.uniqueId || client.id}
                              </p>

                              <p>
                                <span className="font-semibold text-slate-800">
                                  Submitted:
                                </span>{' '}
                                {client.submittedAt || 'N/A'}
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
                                {client.email || 'N/A'}
                              </p>
                            </div>

                            <div className="mt-5 flex flex-wrap gap-3">
                              <button
                                type="button"
                                onClick={() => handleOpenFile(client)}
                                className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-sm font-bold text-white hover:bg-blue-600"
                              >
                                <FaEye />
                                View File
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenFile(client)}
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
                                    {client.sssNumber || 'N/A'}
                                  </p>

                                  <p>
                                    <span className="font-semibold text-slate-800">
                                      HDMF / Pag-IBIG:
                                    </span>{' '}
                                    {client.hdmfNumber || 'N/A'}
                                  </p>

                                  <p>
                                    <span className="font-semibold text-slate-800">
                                      PhilHealth:
                                    </span>{' '}
                                    {client.philhealthNumber || 'N/A'}
                                  </p>

                                  <p>
                                    <span className="font-semibold text-slate-800">
                                      TIN:
                                    </span>{' '}
                                    {client.tinNumber || 'N/A'}
                                  </p>

                                  <p>
                                    <span className="font-semibold text-slate-800">
                                      License Number:
                                    </span>{' '}
                                    {client.licenseNumber || 'N/A'}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {clients.length === 0 && (
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
    </DashboardLayout>
  );
}