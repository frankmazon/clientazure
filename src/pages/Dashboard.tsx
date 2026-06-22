import { useMemo, useState } from 'react';
import {
  FaDownload,
  FaEye,
  FaFileAlt,
  FaIdCard,
  FaSearch,
  FaTimes,
  FaUsers,
} from 'react-icons/fa';
import DashboardLayout from '../components/layout/layout';

type Submission = {
  id: number;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  documentType: string;
  sssNumber?: string;
  hdmfNumber?: string;
  philhealthNumber?: string;
  tinNumber?: string;
  fileName: string;
  fileUrl?: string;
  submittedAt: string;
};

export default function Dashboard() {
  const [search, setSearch] = useState('');
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);

  const submissions = useMemo<Submission[]>(() => {
    return JSON.parse(localStorage.getItem('clients') || '[]');
  }, []);

  const getFullName = (item: Submission) => {
    return (
      item.name ||
      `${item.firstName || ''} ${item.middleName || ''} ${item.lastName || ''}`
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

  const filteredSubmissions = submissions.filter((item) => {
    const fullName = getFullName(item);

    return (
      fullName.toLowerCase().includes(search.toLowerCase()) ||
      (item.email || '').toLowerCase().includes(search.toLowerCase()) ||
      item.fileName.toLowerCase().includes(search.toLowerCase())
    );
  });

  const governmentIdCount = submissions.filter(
    (item) => item.documentType === 'government-id',
  ).length;

  const handleDownload = (item: Submission) => {
    if (!item.fileUrl) {
      alert('No file available to download.');
      return;
    }

    const link = document.createElement('a');
    link.href = item.fileUrl;
    link.download = item.fileName || 'document';
    link.click();
  };

  return (
    <DashboardLayout
      title="Client Summary"
      subtitle="Monitor submitted client documents."
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Clients
                </p>
                <h2 className="mt-2 text-3xl font-extrabold text-slate-900">
                  {submissions.length}
                </h2>
              </div>
              <FaUsers className="text-3xl text-orange-500" />
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Government IDs
                </p>
                <h2 className="mt-2 text-3xl font-extrabold text-slate-900">
                  {governmentIdCount}
                </h2>
              </div>
              <FaIdCard className="text-3xl text-blue-500" />
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Files sdasd
                </p>
                <h2 className="mt-2 text-3xl font-extrabold text-slate-900">
                  {submissions.length}
                </h2>
              </div>
              <FaFileAlt className="text-3xl text-green-500" />
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              placeholder="Search name, email, or file..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-12 w-full rounded-xl border border-slate-300 pl-12 pr-4 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>
        </div>

        {/* Mobile cards */}
        <div className="space-y-4 lg:hidden">
          {filteredSubmissions.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-extrabold text-slate-900">
                    {getFullName(item) || '-'}
                  </h3>
                  <p className="truncate text-sm text-slate-500">
                    {item.email || 'No email'}
                  </p>
                </div>

                <span className="shrink-0 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
                  {formatDocumentType(item.documentType)}
                </span>
              </div>

              <div className="grid gap-3 text-sm">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-bold uppercase text-slate-400">
                    File
                  </p>
                  <p className="mt-1 break-all font-semibold text-slate-800">
                    {item.fileName || '-'}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-bold uppercase text-slate-400">
                    Submitted
                  </p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {item.submittedAt || '-'}
                  </p>
                </div>

                {item.documentType === 'government-id' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-bold uppercase text-slate-400">
                        SSS
                      </p>
                      <p className="mt-1 font-semibold text-slate-800">
                        {item.sssNumber || '-'}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-bold uppercase text-slate-400">
                        HDMF
                      </p>
                      <p className="mt-1 font-semibold text-slate-800">
                        {item.hdmfNumber || '-'}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-bold uppercase text-slate-400">
                        PhilHealth
                      </p>
                      <p className="mt-1 font-semibold text-slate-800">
                        {item.philhealthNumber || '-'}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-bold uppercase text-slate-400">
                        TIN
                      </p>
                      <p className="mt-1 font-semibold text-slate-800">
                        {item.tinNumber || '-'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedSubmission(item)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-500 text-sm font-bold text-white hover:bg-blue-600"
                >
                  <FaEye />
                  View
                </button>

                <button
                  type="button"
                  onClick={() => handleDownload(item)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 text-sm font-bold text-white hover:bg-orange-600"
                >
                  <FaDownload />
                  Download
                </button>
              </div>
            </div>
          ))}

          {filteredSubmissions.length === 0 && (
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
              <FaFileAlt className="mx-auto mb-3 text-3xl text-slate-300" />
              <p className="font-bold text-slate-700">No clients found</p>
              <p className="mt-1 text-sm text-slate-500">
                Try adjusting your search.
              </p>
            </div>
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 lg:block">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Submitted Client Files
              </h2>
              <p className="text-sm text-slate-500">
                {filteredSubmissions.length} result
                {filteredSubmissions.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1200px]">
              <thead className="sticky top-0 bg-slate-50">
                <tr>
                  {[
                    'Name',
                    'Email',
                    'Document Type',
                    'SSS',
                    'HDMF',
                    'PhilHealth',
                    'TIN',
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
                {filteredSubmissions.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">
                        {getFullName(item) || '-'}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {item.email || '-'}
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
                        {formatDocumentType(item.documentType)}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {item.sssNumber || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {item.hdmfNumber || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {item.philhealthNumber || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {item.tinNumber || '-'}
                    </td>

                    <td className="max-w-[220px] px-6 py-4">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {item.fileName || '-'}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {item.submittedAt || '-'}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedSubmission(item)}
                          className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-3 py-2 text-xs font-bold text-white hover:bg-blue-600"
                        >
                          <FaEye />
                          View
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownload(item)}
                          className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-3 py-2 text-xs font-bold text-white hover:bg-orange-600"
                        >
                          <FaDownload />
                          Download
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredSubmissions.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
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
      </div>

      {selectedSubmission && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Document Details
                </h2>
                <p className="text-sm text-slate-500">
                  View submitted client information and file.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="rounded-xl bg-slate-100 p-3 text-slate-600 hover:bg-slate-200"
              >
                <FaTimes />
              </button>
            </div>

            <div className="max-h-[calc(90vh-80px)] overflow-y-auto p-6">
              <div className="mb-6 grid gap-4 md:grid-cols-2">
                {[
                  ['Full Name', getFullName(selectedSubmission) || '-'],
                  ['Email', selectedSubmission.email || '-'],
                  [
                    'Document Type',
                    formatDocumentType(selectedSubmission.documentType),
                  ],
                  ['Submitted', selectedSubmission.submittedAt || '-'],
                  ['SSS Number', selectedSubmission.sssNumber || '-'],
                  ['HDMF / Pag-IBIG Number', selectedSubmission.hdmfNumber || '-'],
                  [
                    'PhilHealth Number',
                    selectedSubmission.philhealthNumber || '-',
                  ],
                  ['TIN Number', selectedSubmission.tinNumber || '-'],
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
                  Uploaded File
                </p>

                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4">
                  <div>
                    <p className="break-all font-semibold text-slate-900">
                      {selectedSubmission.fileName || 'No file selected'}
                    </p>
                    <p className="text-sm text-slate-500">
                      Submitted document file
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDownload(selectedSubmission)}
                    className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                  >
                    <FaDownload />
                    Download
                  </button>
                </div>

                {selectedSubmission.fileUrl ? (
                  <iframe
                    src={selectedSubmission.fileUrl}
                    title="Document Preview"
                    className="h-[500px] w-full rounded-xl border border-slate-200"
                  />
                ) : (
                  <div className="rounded-xl bg-slate-100 p-6 text-center text-sm text-slate-500">
                    File preview is not available. Showing filename only.
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