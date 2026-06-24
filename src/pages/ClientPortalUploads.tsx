import { useState } from 'react';
import {
  FaDownload,
  FaEye,
  FaFileAlt,
  FaFolder,
  FaIdBadge,
  FaSearch,
  FaTimes,
  FaUser,
  FaUpload,
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

const CLIENTS_API =
  'https://docsuploadpythonapi.azurewebsites.net/api/clients';

const UPLOAD_API =
  'https://docsuploadpythonapi.azurewebsites.net/api/uploadclient';

const documentTypes = [
  { label: 'ID', value: 'id' },
  { label: 'Property Documents', value: 'property-documents' },
  { label: 'Credit History', value: 'credit-history' },
  { label: 'Income Documents', value: 'income-documents' },
  { label: 'Other', value: 'other' },
];

export default function ClientDashboard() {
  const [uniqueId, setUniqueId] = useState('');
  const [clientFiles, setClientFiles] = useState<Client[]>([]);
  const [previewFile, setPreviewFile] = useState<Client | null>(null);
  const [documentType, setDocumentType] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

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

  const loadClientFiles = async () => {
    if (!uniqueId.trim()) {
      alert('Please enter your Unique ID.');
      return;
    }

    try {
      setLoading(true);
      setHasSearched(true);

      const response = await fetch(
        `${CLIENTS_API}?uniqueId=${encodeURIComponent(uniqueId.trim())}`,
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to load documents.');
      }

      setClientFiles(result.clients || []);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to load documents.');
      setClientFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedClient) {
      alert('Please search your Unique ID first.');
      return;
    }

    if (!documentType) {
      alert('Please select document type.');
      return;
    }

    if (!uploadFile) {
      alert('Please choose a file.');
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();

      formData.append('firstName', selectedClient.firstName || '');
      formData.append('middleName', selectedClient.middleName || '');
      formData.append('lastName', selectedClient.lastName || '');
      formData.append('email', selectedClient.email || '');
      formData.append('documentType', documentType);
      formData.append('file', uploadFile);

      const response = await fetch(UPLOAD_API, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Upload failed.');
      }

      alert('Document uploaded successfully.');

      setDocumentType('');
      setUploadFile(null);

      const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
      if (fileInput) fileInput.value = '';

      await loadClientFiles();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (file: Client) => {
    if (!file.fileUrl) {
      alert('No file available.');
      return;
    }

    window.open(file.fileUrl, '_blank');
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

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-300 px-4">
              <FaIdBadge className="text-slate-400" />
              <input
                value={uniqueId}
                onChange={(e) => setUniqueId(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') loadClientFiles();
                }}
                placeholder="Enter your Unique ID"
                className="h-14 w-full bg-transparent text-sm outline-none"
              />
            </div>

            <button
              type="button"
              onClick={loadClientFiles}
              disabled={loading}
              className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 text-sm font-bold text-white hover:bg-blue-700 disabled:bg-blue-300"
            >
              <FaSearch />
              {loading ? 'Searching...' : 'Search'}
            </button>
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

        {selectedClient && (
          <div className="rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-extrabold text-slate-900">
              Upload Additional Document
            </h3>

            <div className="grid gap-4 md:grid-cols-[220px_1fr_auto]">
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-blue-500"
              >
                <option value="">Select Type</option>
                {documentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>

              <input
                type="file"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="block w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700"
              />

              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-green-600 px-6 text-sm font-bold text-white hover:bg-green-700 disabled:bg-green-300"
              >
                <FaUpload />
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        )}

        {clientFiles.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {clientFiles.map((file) => (
              <div
                key={`${file.id}-${file.fileName}`}
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

        {hasSearched && !loading && clientFiles.length === 0 && (
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