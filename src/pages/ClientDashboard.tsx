import { useState } from 'react';
import {
  FaCloudUploadAlt,
  FaDownload,
  FaEye,
  FaFileAlt,
  FaFolderOpen,
  FaIdBadge,
  FaSearch,
  FaTimes,
  FaUser,
} from 'react-icons/fa';

type Submission = {
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

const CLIENTS_API = 'https://docsuploadpythonapi.azurewebsites.net/api/clients';
const UPLOAD_API = 'https://docsuploadpythonapi.azurewebsites.net/api/uploadclient';
const FILE_URL_API = 'https://docsuploadpythonapi.azurewebsites.net/api/file-url';

const documentTypes = [
  { label: 'ID', value: 'id' },
  { label: 'Property Documents', value: 'property-documents' },
  { label: 'Credit History', value: 'credit-history' },
  { label: 'Income Documents', value: 'income-documents' },
  { label: 'Other', value: 'other' },
];

export default function ClientDashboard() {
  const [uniqueId, setUniqueId] = useState('');
  const [fileSearch, setFileSearch] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [newFiles, setNewFiles] = useState<FileList | null>(null);
  const [clientFiles, setClientFiles] = useState<Submission[]>([]);
  const [previewFile, setPreviewFile] = useState<Submission | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const selectedClient = clientFiles[0];

  const getSecureFileUrl = async (fileUrl?: string) => {
    if (!fileUrl) throw new Error('No file URL available.');

    const response = await fetch(
      `${FILE_URL_API}?blobUrl=${encodeURIComponent(fileUrl)}`,
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to generate secure file URL.');
    }

    return result.url as string;
  };

  const getFullName = (client: Submission) =>
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

  const loadClientFiles = async (idValue = uniqueId) => {
    if (!idValue.trim()) {
      alert('Please enter your Unique ID.');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${CLIENTS_API}?uniqueId=${encodeURIComponent(idValue.trim())}`,
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to load files.');
      }

      setClientFiles(result.clients || []);
      setFileSearch('');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to load files.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    const cleanUniqueId = uniqueId.trim();

    if (!cleanUniqueId) {
      alert('Please enter Unique ID first.');
      return;
    }

    if (!documentType) {
      alert('Please select document type.');
      return;
    }

    if (!newFiles?.length) {
      alert('Please choose file/s.');
      return;
    }

    if (!selectedClient) {
      alert('Please load the client files first before uploading.');
      return;
    }

    try {
      setLoading(true);

      for (const file of Array.from(newFiles)) {
        const formData = new FormData();

        formData.append('uniqueId', cleanUniqueId);
        formData.append('firstName', selectedClient.firstName || '');
        formData.append('middleName', selectedClient.middleName || '');
        formData.append('lastName', selectedClient.lastName || '');
        formData.append('email', selectedClient.email || '');
        formData.append('documentType', documentType);
        formData.append('file', file);

        const response = await fetch(UPLOAD_API, {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Upload failed.');
        }
      }

      setNewFiles(null);
      setDocumentType('');

      const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
      if (fileInput) fileInput.value = '';

      await loadClientFiles(cleanUniqueId);

      alert('File uploaded successfully to Azure.');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Upload failed.');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (file: Submission) => {
    try {
      setPreviewFile(file);
      setPreviewUrl('');
      setPreviewLoading(true);

      const secureUrl = await getSecureFileUrl(file.fileUrl);
      setPreviewUrl(secureUrl);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to open file.');
      setPreviewFile(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = async (file: Submission) => {
    try {
      const secureUrl = await getSecureFileUrl(file.fileUrl);
      window.open(secureUrl, '_blank');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to download file.');
    }
  };

  const handleClosePreview = () => {
    setPreviewFile(null);
    setPreviewUrl('');
  };

  const filteredFiles = clientFiles.filter((file) => {
    const keyword = fileSearch.toLowerCase().trim();

    if (!keyword) return true;

    return (
      file.fileName?.toLowerCase().includes(keyword) ||
      file.documentType?.toLowerCase().includes(keyword)
    );
  });

  const isImageFile =
    previewFile?.fileName?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/);

  const isPdfFile = previewFile?.fileName?.toLowerCase().endsWith('.pdf');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-cyan-50 px-4 py-8 font-sans">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-3xl bg-gradient-to-r from-blue-700 via-sky-500 to-cyan-400 p-8 text-white shadow-xl">
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.4em]">
            Client Portal
          </p>

          <h1 className="text-4xl font-extrabold">Document Dashboard</h1>

          <p className="mt-4 text-blue-50">
            Use your Unique ID to view your submitted files.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <section className="rounded-3xl bg-white p-6 shadow-lg">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-blue-100 p-3 text-blue-600">
                  <FaSearch />
                </div>

                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">
                    Find Your Files
                  </h2>
                  <p className="text-sm text-slate-500">
                    Enter the Unique ID sent to your email.
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Unique ID
                  </label>

                  <div className="relative">
                    <FaIdBadge className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={uniqueId}
                      onChange={(event) => setUniqueId(event.target.value)}
                      placeholder="Enter unique ID"
                      className="h-12 w-full rounded-xl border border-slate-300 pl-12 pr-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => loadClientFiles()}
                  disabled={loading}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 font-bold text-white shadow-md hover:bg-blue-700 disabled:bg-blue-300 md:w-fit"
                >
                  <FaFolderOpen />
                  {loading ? 'Loading...' : 'Load My Files'}
                </button>
              </div>
            </section>

            {selectedClient && (
              <section className="rounded-3xl bg-white p-6 shadow-lg">
                <div className="flex items-center gap-5">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                    <FaUser />
                  </div>

                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900">
                      {getFullName(selectedClient)}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Unique ID: {selectedClient.uniqueId || 'N/A'}
                    </p>

                    <p className="text-sm text-slate-500">
                      Email: {selectedClient.email || 'N/A'}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {clientFiles.length > 0 && (
              <section className="rounded-3xl bg-white p-6 shadow-lg">
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Search Files
                </label>

                <div className="relative">
                  <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={fileSearch}
                    onChange={(event) => setFileSearch(event.target.value)}
                    placeholder="Search by file name or document type"
                    className="h-12 w-full rounded-xl border border-slate-300 pl-12 pr-12 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                  {fileSearch && (
                    <button
                      type="button"
                      onClick={() => setFileSearch('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>
              </section>
            )}

            <section className="overflow-hidden rounded-3xl bg-white shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-orange-100 p-3 text-orange-600">
                    <FaFileAlt />
                  </div>

                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900">
                      My Files
                    </h2>
                    <p className="text-sm text-slate-500">
                      {filteredFiles.length} file
                      {filteredFiles.length !== 1 ? 's' : ''} found.
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[780px] w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">
                        File Name
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">
                        Document Type
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">
                        Submitted
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-slate-700">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredFiles.map((file) => (
                      <tr
                        key={`${file.id}-${file.fileName}`}
                        className="border-t border-slate-200 hover:bg-slate-50"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-slate-100 p-3 text-slate-600">
                              <FaFileAlt />
                            </div>

                            <div>
                              <p className="font-bold text-slate-900">
                                {file.fileName || 'No file name'}
                              </p>
                              <p className="text-xs text-slate-500">
                                ID: {file.uniqueId}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                            {formatDocumentType(file.documentType)}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {file.submittedAt || 'N/A'}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
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
                        </td>
                      </tr>
                    ))}

                    {filteredFiles.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-12 text-center text-sm text-slate-500"
                        >
                          No files loaded yet. Enter your Unique ID and click Load
                          My Files.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <aside className="rounded-3xl bg-white p-6 shadow-lg lg:sticky lg:top-8 lg:h-fit">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-cyan-100 p-3 text-cyan-600">
                <FaCloudUploadAlt />
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Upload Files
                </h2>
                <p className="text-sm text-slate-500">
                  Upload additional files under this Unique ID.
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Document Type
              </label>

              <select
                value={documentType}
                onChange={(event) => setDocumentType(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Select document type</option>
                {documentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center hover:border-blue-400 hover:bg-blue-50">
              <FaCloudUploadAlt className="mb-3 text-4xl text-blue-500" />

              <span className="font-bold text-slate-800">Choose files</span>
              <span className="mt-1 text-sm text-slate-500">
                PDF, JPG, PNG, DOCX
              </span>

              <input
                type="file"
                multiple
                onChange={(event) => setNewFiles(event.target.files)}
                className="hidden"
              />
            </label>

            {newFiles && newFiles.length > 0 && (
              <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                <p className="mb-2 text-sm font-bold text-slate-700">
                  Selected Files
                </p>

                <div className="space-y-2">
                  {Array.from(newFiles).map((file) => (
                    <p
                      key={file.name}
                      className="truncate rounded-lg bg-white px-3 py-2 text-sm text-slate-600"
                    >
                      {file.name}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleUpload}
              disabled={loading}
              className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 font-bold text-white shadow-md hover:bg-blue-700 disabled:bg-blue-300"
            >
              <FaCloudUploadAlt />
              {loading ? 'Uploading...' : 'Upload Documents'}
            </button>
          </aside>
        </div>
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
    </div>
  );
}