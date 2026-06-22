import { useMemo, useState } from 'react';
import {
  FaDownload,
  FaEye,
  FaFileAlt,
  FaFolder,
  FaIdBadge,
  FaSearch,
  FaTimes,
  FaUser,
} from 'react-icons/fa';

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

export default function ClientDashboard() {
  const [uniqueId, setUniqueId] = useState('');
  const [previewFile, setPreviewFile] = useState<Client | null>(null);

  const clients = useMemo<Client[]>(() => {
    return JSON.parse(localStorage.getItem('clients') || '[]');
  }, []);

  const clientFiles = clients.filter(
    (client) =>
      client.uniqueId?.toLowerCase() === uniqueId.trim().toLowerCase(),
  );

  const selectedClient = clientFiles[0];

  const getFullName = (client: Client) =>
    (
      client.name ||
      `${client.firstName || ''} ${client.middleName || ''} ${client.lastName || ''}`
    )
      .replace(/\s+/g, ' ')
      .trim();

  const formatDocumentType = (type?: string) =>
    (type || 'document')
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  const handleDownload = (file: Client) => {
    if (!file.fileUrl) {
      alert('No file available.');
      return;
    }

    const link = document.createElement('a');
    link.href = file.fileUrl;
    link.download = file.fileName || 'document';
    link.click();
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 font-sans sm:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl bg-gradient-to-r from-blue-700 to-cyan-400 p-8 text-white shadow-xl">
          <h1 className="text-4xl font-extrabold">Client Portal</h1>
          <p className="mt-3 text-blue-50">
            Enter the Unique ID sent to your email to view your submitted documents.
          </p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-xl">
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Unique ID
          </label>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-300 px-4">
            <FaIdBadge className="text-slate-400" />
            <input
              value={uniqueId}
              onChange={(e) => setUniqueId(e.target.value)}
              placeholder="Enter your Unique ID"
              className="h-14 w-full bg-transparent text-sm outline-none"
            />
            <FaSearch className="text-slate-400" />
          </div>
        </div>

        {selectedClient && (
          <div className="rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                <FaUser />
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  {getFullName(selectedClient)}
                </h2>
                <p className="text-sm text-slate-500">
                  Unique ID: {selectedClient.uniqueId}
                </p>
                <p className="text-sm text-slate-500">
                  Email: {selectedClient.email || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )}

        {uniqueId && clientFiles.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {clientFiles.map((file) => (
              <div
                key={file.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <FaFolder className="mb-5 text-6xl text-yellow-400" />

                <h3 className="text-lg font-extrabold text-slate-900">
                  {formatDocumentType(file.documentType)}
                </h3>

                <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <FaFileAlt />
                  {file.fileName || 'No file name'}
                </p>

                <p className="mt-2 text-xs text-slate-400">
                  Submitted: {file.submittedAt || 'N/A'}
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPreviewFile(file)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-sm font-bold text-white hover:bg-blue-600"
                  >
                    <FaEye />
                    View
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownload(file)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-2 text-sm font-bold text-white hover:bg-green-600"
                  >
                    <FaDownload />
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {uniqueId && clientFiles.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
            No documents found for this Unique ID.
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
                <iframe
                  src={previewFile.fileUrl}
                  title={previewFile.fileName}
                  className="h-[70vh] w-full rounded-2xl bg-white"
                />
              ) : (
                <div className="flex h-[70vh] items-center justify-center rounded-2xl bg-white text-slate-500">
                  No preview available.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}