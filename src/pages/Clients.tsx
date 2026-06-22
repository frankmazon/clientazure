import { useMemo, useState } from 'react';
import {
  FaDownload,
  FaEye,
  FaFileAlt,
  FaSearch,
  FaTimes,
} from 'react-icons/fa';
import DashboardLayout from '../components/layout/layout';

type Client = {
  id: number;
  uniqueId?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  documentType: string;
  fileName: string;
  fileUrl?: string;
  submittedAt: string;
};

export default function Clients() {
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const clients = useMemo<Client[]>(() => {
    return JSON.parse(localStorage.getItem('clients') || '[]');
  }, []);

  const getFullName = (client: Client) => {
    return (
      client.name ||
      `${client.firstName || ''} ${client.middleName || ''} ${client.lastName || ''}`
        .replace(/\s+/g, ' ')
        .trim()
    );
  };

  const formatDocumentType = (type: string) => {
    return type
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const filteredClients = clients.filter((client) => {
    const fullName = getFullName(client).toLowerCase();
    const searchValue = search.toLowerCase();

    return (
      fullName.includes(searchValue) ||
      (client.email || '').toLowerCase().includes(searchValue) ||
      (client.uniqueId || '').toLowerCase().includes(searchValue) ||
      (client.fileName || '').toLowerCase().includes(searchValue)
    );
  });

  const handleDownload = (client: Client) => {
    if (!client.fileUrl) {
      alert('No file available to download.');
      return;
    }

    const link = document.createElement('a');
    link.href = client.fileUrl;
    link.download = client.fileName || 'document';
    link.click();
  };

  return (
    <DashboardLayout
      title="Clients"
      subtitle="View and manage all submitted clients."
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

        {/* Mobile Cards */}
        <div className="space-y-4 lg:hidden">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-extrabold text-slate-900">
                    {getFullName(client) || '-'}
                  </h3>
                  <p className="truncate text-sm text-slate-500">
                    {client.email || 'No email'}
                  </p>
                </div>

                <span className="shrink-0 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
                  {formatDocumentType(client.documentType)}
                </span>
              </div>

              <div className="grid gap-3 text-sm">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-bold uppercase text-slate-400">
                    Unique ID
                  </p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {client.uniqueId || '-'}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-bold uppercase text-slate-400">
                    File
                  </p>
                  <p className="mt-1 break-all font-semibold text-slate-800">
                    {client.fileName || '-'}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-bold uppercase text-slate-400">
                    Submitted
                  </p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {client.submittedAt || '-'}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedClient(client)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-500 text-sm font-bold text-white hover:bg-blue-600"
                >
                  <FaEye />
                  View
                </button>

                <button
                  type="button"
                  onClick={() => handleDownload(client)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 text-sm font-bold text-white hover:bg-orange-600"
                >
                  <FaDownload />
                  Download
                </button>
              </div>
            </div>
          ))}

          {filteredClients.length === 0 && (
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
              <FaFileAlt className="mx-auto mb-3 text-3xl text-slate-300" />
              <p className="font-bold text-slate-700">No clients found</p>
              <p className="mt-1 text-sm text-slate-500">
                Try adjusting your search.
              </p>
            </div>
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 lg:block">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Client List
              </h2>
              <p className="text-sm text-slate-500">
                {filteredClients.length} submitted file
                {filteredClients.length !== 1 ? 's' : ''}
              </p>
            </div>

            <FaFileAlt className="text-2xl text-orange-500" />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1000px]">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    'Unique ID',
                    'Name',
                    'Email',
                    'Document Type',
                    'File',
                    'Submitted',
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
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                      {client.uniqueId || '-'}
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">
                        {getFullName(client) || '-'}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {client.email || '-'}
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
                        {formatDocumentType(client.documentType)}
                      </span>
                    </td>

                    <td className="max-w-[260px] px-6 py-4">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {client.fileName || '-'}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {client.submittedAt || '-'}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedClient(client)}
                          className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-3 py-2 text-xs font-bold text-white hover:bg-blue-600"
                        >
                          <FaEye />
                          View
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownload(client)}
                          className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-3 py-2 text-xs font-bold text-white hover:bg-orange-600"
                        >
                          <FaDownload />
                          Download
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredClients.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-sm text-slate-500"
                    >
                      No submitted files yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
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
                onClick={() => setSelectedClient(null)}
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

                {selectedClient.fileUrl ? (
                  <iframe
                    src={selectedClient.fileUrl}
                    title="Client File Preview"
                    className="h-[500px] w-full rounded-xl border border-slate-200"
                  />
                ) : (
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