import { useEffect, useMemo, useState } from 'react';
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

const CLIENTS_API_URL = 'https://docsuploadpythonapi.azurewebsites.net/api/clients';

type Submission = {
  id: number;
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

export default function Dashboard() {
  const [search, setSearch] = useState('');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(CLIENTS_API_URL);
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Failed to fetch clients.');
        }

        setSubmissions(result.clients || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load clients.');
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  const getFullName = (item: Submission) =>
    (
      item.name ||
      `${item.firstName || ''} ${item.middleName || ''} ${item.lastName || ''}`
    )
      .replace(/\s+/g, ' ')
      .trim();

  const formatDocumentType = (type?: string) =>
    (type || 'document')
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  const filteredSubmissions = useMemo(() => {
    const keyword = search.toLowerCase();

    return submissions.filter((item) => {
      const fullName = getFullName(item);

      return (
        fullName.toLowerCase().includes(keyword) ||
        (item.uniqueId || '').toLowerCase().includes(keyword) ||
        (item.email || '').toLowerCase().includes(keyword) ||
        (item.fileName || '').toLowerCase().includes(keyword)
      );
    });
  }, [search, submissions]);

  const idCount = submissions.filter(
    (item) => item.documentType?.toLowerCase() === 'id',
  ).length;

  const handleDownload = (item: Submission) => {
    if (!item.fileUrl) {
      alert('No file available to download.');
      return;
    }

    window.open(item.fileUrl, '_blank');
  };

  return (
    <DashboardLayout
      title="Client Summary"
      subtitle="Monitor submitted client documents from Azure SQL."
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">Total Clients</p>
            <div className="mt-2 flex items-center justify-between">
              <h2 className="text-3xl font-extrabold text-slate-900">
                {submissions.length}
              </h2>
              <FaUsers className="text-3xl text-orange-500" />
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">ID Documents</p>
            <div className="mt-2 flex items-center justify-between">
              <h2 className="text-3xl font-extrabold text-slate-900">
                {idCount}
              </h2>
              <FaIdCard className="text-3xl text-blue-500" />
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">Total Files</p>
            <div className="mt-2 flex items-center justify-between">
              <h2 className="text-3xl font-extrabold text-slate-900">
                {submissions.length}
              </h2>
              <FaFileAlt className="text-3xl text-green-500" />
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search unique ID, name, email, or file..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-12 w-full rounded-xl border border-slate-300 pl-12 pr-4 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>
        </div>

        {loading && (
          <div className="rounded-2xl bg-white p-10 text-center font-bold text-slate-500 shadow-sm">
            Loading clients from Azure...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Unique ID</th>
                    <th className="px-5 py-4">Client</th>
                    <th className="px-5 py-4">Email</th>
                    <th className="px-5 py-4">Type</th>
                    <th className="px-5 py-4">File</th>
                    <th className="px-5 py-4">Submitted</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredSubmissions.map((item) => (
                    <tr key={`${item.id}-${item.fileName}`} className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-bold text-slate-900">
                        {item.uniqueId || '-'}
                      </td>
                      <td className="px-5 py-4">{getFullName(item) || '-'}</td>
                      <td className="px-5 py-4">{item.email || '-'}</td>
                      <td className="px-5 py-4">
                        {formatDocumentType(item.documentType)}
                      </td>
                      <td className="px-5 py-4">{item.fileName || '-'}</td>
                      <td className="px-5 py-4">{item.submittedAt || '-'}</td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedSubmission(item)}
                            className="rounded-lg bg-blue-500 px-3 py-2 text-white hover:bg-blue-600"
                          >
                            <FaEye />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownload(item)}
                            className="rounded-lg bg-orange-500 px-3 py-2 text-white hover:bg-orange-600"
                          >
                            <FaDownload />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredSubmissions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                        No clients found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {selectedSubmission && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b p-5">
              <h2 className="text-xl font-extrabold">
                {selectedSubmission.fileName || 'File Preview'}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="rounded-xl bg-slate-100 p-3 hover:bg-slate-200"
              >
                <FaTimes />
              </button>
            </div>

            <div className="bg-slate-100 p-4">
              {selectedSubmission.fileUrl ? (
                <iframe
                  src={selectedSubmission.fileUrl}
                  title={selectedSubmission.fileName}
                  className="h-[70vh] w-full rounded-2xl bg-white"
                />
              ) : (
                <div className="flex h-[70vh] items-center justify-center bg-white text-slate-500">
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