import { useEffect, useState } from 'react';
import { FaDownload, FaFileCsv } from 'react-icons/fa';
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
};

export default function ExportClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getFullName = (client: Client) =>
    (
      client.name ||
      `${client.firstName || ''} ${client.middleName || ''} ${client.lastName || ''}`
    )
      .replace(/\s+/g, ' ')
      .trim();

  const loadClients = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(CLIENTS_API);
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

  const escapeCsv = (value?: string | number) => {
    const text = String(value ?? '');
    return `"${text.replace(/"/g, '""')}"`;
  };

  const handleExport = () => {
    if (clients.length === 0) {
      alert('No client records to export.');
      return;
    }

    const headers = [
      'ID',
      'Unique ID',
      'Full Name',
      'First Name',
      'Middle Name',
      'Last Name',
      'Email',
      'Document Type',
      'File Name',
      'File URL',
      'Submitted Date',
    ];

    const rows = clients.map((client) => [
      client.id,
      client.uniqueId || '',
      getFullName(client),
      client.firstName || '',
      client.middleName || '',
      client.lastName || '',
      client.email || '',
      client.documentType || '',
      client.fileName || '',
      client.fileUrl || '',
      client.submittedAt || '',
    ]);

    const csvContent = [
      headers.map(escapeCsv).join(','),
      ...rows.map((row) => row.map(escapeCsv).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `client-records-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout
      title="Export Clients"
      subtitle="Download all client document submissions from Azure SQL."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow lg:col-span-2">
          <div className="mb-6 flex items-center gap-4">
            <div className="rounded-2xl bg-orange-100 p-4 text-orange-600">
              <FaFileCsv className="text-3xl" />
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Export Client Records
              </h2>
              <p className="text-sm text-slate-500">
                Generate a CSV file containing all submitted client records from
                Azure SQL.
              </p>
            </div>
          </div>

          {loading && (
            <div className="mb-4 rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
              Loading records from Azure...
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="mb-4 rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-600">
              {clients.length} record{clients.length !== 1 ? 's' : ''} ready
              for export.
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleExport}
              disabled={loading || clients.length === 0}
              className="inline-flex items-center gap-3 rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
            >
              <FaDownload />
              Export CSV
            </button>

            <button
              type="button"
              onClick={loadClients}
              disabled={loading}
              className="inline-flex items-center gap-3 rounded-xl bg-slate-100 px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200 disabled:cursor-not-allowed"
            >
              Refresh Data
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <h3 className="mb-3 text-lg font-bold text-slate-900">
            Export Includes
          </h3>

          <ul className="space-y-3 text-sm text-slate-600">
            <li>Unique ID</li>
            <li>Client full name</li>
            <li>Email address</li>
            <li>Document type</li>
            <li>File name</li>
            <li>Blob file URL</li>
            <li>Submitted date</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}