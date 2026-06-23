import { useMemo, useState } from 'react';
import {
  FaChevronRight,
  FaDownload,
  FaEdit,
  FaExclamationTriangle,
  FaEye,
  FaFileAlt,
  FaFolder,
  FaSave,
  FaSearch,
  FaTimes,
  FaTrash,
  FaUser,
  FaUpload,
} from 'react-icons/fa';
import DashboardLayout from '../components/layout/layout';

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

const documentTypes = [
  { label: 'ID', value: 'id' },
  { label: 'Property Documents', value: 'property-documents' },
  { label: 'Credit History', value: 'credit-history' },
  { label: 'Income Documents', value: 'income-documents' },
  { label: 'Other', value: 'other' },
];

const requiredDocumentTypes = [
  'id',
  'property-documents',
  'credit-history',
  'income-documents',
  'other',
];

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function ClientDocumentSearch() {
  const [search, setSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [previewFile, setPreviewFile] = useState<Client | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFileName, setEditFileName] = useState('');
  const [editDocumentType, setEditDocumentType] = useState('');
  const [replacementFileUrl, setReplacementFileUrl] = useState('');

  const clients = useMemo<Client[]>(() => {
    return JSON.parse(localStorage.getItem('clients') || '[]');
  }, [refreshKey]);

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

  const matchedFiles = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) return [];

    return clients.filter((client) => {
      const fullName = getFullName(client).toLowerCase();
      const uniqueId = client.uniqueId?.toLowerCase() || '';

      return fullName.includes(keyword) || uniqueId.includes(keyword);
    });
  }, [clients, search]);

  const selectedClient = matchedFiles[0];

  const getFilesByType = (type: string) => {
    return matchedFiles.filter((file) => file.documentType === type);
  };

  const getMissingIdFields = (client?: Client | null) => {
    if (!client) return [];

    const missing: string[] = [];

    if (!client.sssNumber?.trim()) missing.push('SSS Number');
    if (!client.hdmfNumber?.trim()) missing.push('HDMF / Pag-IBIG Number');
    if (!client.philhealthNumber?.trim()) missing.push('PhilHealth Number');
    if (!client.tinNumber?.trim()) missing.push('TIN Number');
    if (!client.licenseNumber?.trim()) missing.push('License Number');

    return missing;
  };

  const idFiles = getFilesByType('id');

  const missingDocumentTypes = requiredDocumentTypes.filter(
    (type) => getFilesByType(type).length === 0,
  );

  const missingIdFields = getMissingIdFields(idFiles[0] || selectedClient);

  const isIncomplete =
    selectedClient &&
    (missingDocumentTypes.length > 0 || missingIdFields.length > 0);

  const handleDownload = (file: Client) => {
    if (!file.fileUrl) {
      alert('No file available to download.');
      return;
    }

    const link = document.createElement('a');
    link.href = file.fileUrl;
    link.download = file.fileName || 'document';
    link.click();
  };

  const handleStartEdit = (file: Client) => {
    setEditingId(file.id);
    setEditFileName(file.fileName || '');
    setEditDocumentType(file.documentType || 'other');
    setReplacementFileUrl(file.fileUrl || '');
  };

  const handleReplaceFile = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const base64 = await fileToBase64(file);

    setEditFileName(file.name);
    setReplacementFileUrl(base64);
  };

  const handleSaveEdit = (id: number) => {
    const allClients = JSON.parse(localStorage.getItem('clients') || '[]') as Client[];

    const updatedClients = allClients.map((client) =>
      client.id === id
        ? {
            ...client,
            fileName: editFileName,
            documentType: editDocumentType,
            fileUrl: replacementFileUrl,
          }
        : client,
    );

    localStorage.setItem('clients', JSON.stringify(updatedClients));

    setEditingId(null);
    setEditFileName('');
    setEditDocumentType('');
    setReplacementFileUrl('');
    setRefreshKey((prev) => prev + 1);
  };

  const handleDelete = (id: number) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this file?',
    );

    if (!confirmDelete) return;

    const allClients = JSON.parse(localStorage.getItem('clients') || '[]') as Client[];
    const updatedClients = allClients.filter((client) => client.id !== id);

    localStorage.setItem('clients', JSON.stringify(updatedClients));
    setRefreshKey((prev) => prev + 1);
  };

  const isImageFile = (file?: Client | null) => {
    return file?.fileUrl?.startsWith('data:image');
  };

  return (
    <DashboardLayout
      title="Search Client"
      subtitle="Search by client name or unique ID"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <FaSearch className="ml-3 text-slate-400" />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or unique ID"
            className="h-12 flex-1 text-sm font-semibold text-slate-700 outline-none"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="rounded-xl p-3 text-slate-400 hover:bg-slate-100"
            >
              <FaTimes />
            </button>
          )}
        </div>

        {selectedClient && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-xl font-extrabold text-blue-700">
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

              {isIncomplete ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-2 text-sm font-bold text-red-700">
                  <FaExclamationTriangle />
                  Incomplete File
                </span>
              ) : (
                <span className="inline-flex rounded-full bg-green-100 px-4 py-2 text-sm font-bold text-green-700">
                  Complete
                </span>
              )}
            </div>

            {isIncomplete && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="flex items-center gap-2 font-bold text-red-700">
                  <FaExclamationTriangle />
                  Incomplete Requirements
                </p>

                {missingDocumentTypes.length > 0 && (
                  <p className="mt-2 text-sm text-red-600">
                    Missing documents:{' '}
                    {missingDocumentTypes.map(formatDocumentType).join(', ')}
                  </p>
                )}

                {missingIdFields.length > 0 && (
                  <p className="mt-2 text-sm text-red-600">
                    Missing ID information: {missingIdFields.join(', ')}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {search && selectedClient && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {documentTypes.map((type) => {
              const files = getFilesByType(type.value);
              const folderIncomplete =
                requiredDocumentTypes.includes(type.value) &&
                files.length === 0;

              const idFolderIncomplete =
                type.value === 'id' && missingIdFields.length > 0;

              return (
                <div
                  key={type.value}
                  className={`rounded-3xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
                    folderIncomplete || idFolderIncomplete
                      ? 'border-red-300'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="mb-6 flex items-center justify-between">
                    <FaFolder className="text-6xl text-yellow-400" />

                    {folderIncomplete || idFolderIncomplete ? (
                      <FaExclamationTriangle className="text-red-500" />
                    ) : (
                      <FaChevronRight className="text-slate-400" />
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-extrabold text-slate-900">
                      {type.label}
                    </h3>

                    {(folderIncomplete || idFolderIncomplete) && (
                      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                        Incomplete
                      </span>
                    )}
                  </div>

                  <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                    <FaFileAlt />
                    {files.length} file(s)
                  </p>

                  {folderIncomplete && (
                    <div className="mt-3 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">
                      Missing document: {type.label}
                    </div>
                  )}

                  {idFolderIncomplete && (
                    <div className="mt-3 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">
                      Missing ID information: {missingIdFields.join(', ')}
                    </div>
                  )}

                  {files.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {files.map((file) => {
                        const isEditing = editingId === file.id;

                        return (
                          <div
                            key={file.id}
                            className="rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-700"
                          >
                            {isEditing ? (
                              <div className="space-y-2">
                                <input
                                  value={editFileName}
                                  onChange={(event) =>
                                    setEditFileName(event.target.value)
                                  }
                                  placeholder="File name"
                                  className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-orange-500"
                                />

                                <select
                                  value={editDocumentType}
                                  onChange={(event) =>
                                    setEditDocumentType(event.target.value)
                                  }
                                  className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-orange-500"
                                >
                                  {documentTypes.map((docType) => (
                                    <option
                                      key={docType.value}
                                      value={docType.value}
                                    >
                                      {docType.label}
                                    </option>
                                  ))}
                                </select>

                                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-orange-500 px-3 py-2 text-xs font-bold text-white hover:bg-orange-600">
                                  <FaUpload />
                                  Replace File
                                  <input
                                    type="file"
                                    className="hidden"
                                    onChange={handleReplaceFile}
                                  />
                                </label>

                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEdit(file.id)}
                                    className="flex items-center justify-center gap-2 rounded-lg bg-green-500 px-3 py-2 text-xs font-bold text-white hover:bg-green-600"
                                  >
                                    <FaSave />
                                    Save
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setEditingId(null)}
                                    className="flex items-center justify-center gap-2 rounded-lg bg-slate-500 px-3 py-2 text-xs font-bold text-white hover:bg-slate-600"
                                  >
                                    <FaTimes />
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="mb-3 flex items-start gap-2">
                                  <FaFileAlt className="mt-1 text-orange-500" />

                                  <div className="min-w-0">
                                    <p className="truncate">
                                      {file.fileName || 'No file name'}
                                    </p>

                                    <p className="mt-1 text-xs font-medium text-slate-400">
                                      {file.submittedAt || 'N/A'}
                                    </p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewFile(file)}
                                    className="flex items-center justify-center gap-2 rounded-lg bg-slate-700 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800"
                                  >
                                    <FaEye />
                                    View
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDownload(file)}
                                    className="flex items-center justify-center gap-2 rounded-lg bg-green-500 px-3 py-2 text-xs font-bold text-white hover:bg-green-600"
                                  >
                                    <FaDownload />
                                    Download
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleStartEdit(file)}
                                    className="flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-3 py-2 text-xs font-bold text-white hover:bg-blue-600"
                                  >
                                    <FaEdit />
                                    Edit
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDelete(file.id)}
                                    className="flex items-center justify-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-xs font-bold text-white hover:bg-red-600"
                                  >
                                    <FaTrash />
                                    Delete
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {search && !selectedClient && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
            No client found.
          </div>
        )}
      </div>

      {previewFile && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  {previewFile.fileName || 'File Preview'}
                </h2>
                <p className="text-sm text-slate-500">
                  {previewFile.documentType || 'Document'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="rounded-xl bg-slate-100 p-3 text-slate-600 transition hover:bg-slate-200"
              >
                <FaTimes />
              </button>
            </div>

            <div className="min-h-[500px] flex-1 bg-slate-100 p-4">
              {previewFile.fileUrl ? (
                isImageFile(previewFile) ? (
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