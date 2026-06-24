import { useEffect, useMemo, useState } from 'react';
import { FaDownload, FaFileCsv } from 'react-icons/fa';
import DashboardLayout from '../components/layout/layout';

const CLIENTS_API =
  'https://docsuploadpythonapi.azurewebsites.net/api/clients';

const requiredDocuments = [
  'id',
  'property-documents',
  'credit-history',
  'income-documents',
  'other',
];

const documentLabels: Record<string, string> = {
  id: 'ID',
  'property-documents': 'Property Documents',
  'credit-history': 'Credit History',
  'income-documents': 'Income Documents',
  other: 'Other',
};

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

  const formatDocumentType = (type?: string) =>
    documentLabels[type || ''] ||
    (type || 'document')
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  const clientGroups = useMemo(() => {
    const map = new Map<string, Client[]>();

    clients.forEach((client) => {
      const key = client.uniqueId || String(client.clientId || client.id);

      if (!map.has(key)) {
        map.set(key, []);
      }

      map.get(key)?.push(client);
    });

    return Array.from(map.entries()).map(([key, files]) => {
      const client = files[0];

      const uploadedDocuments = Array.from(
        new Set(
          files
            .map((file) => file.documentType?.toLowerCase())
            .filter(Boolean) as string[],
        ),
      );

      const missingDocuments = requiredDocuments.filter(
        (doc) => !uploadedDocuments.includes(doc),
      );

      return {
        key,
        client,
        files,
        uploadedDocuments,
        missingDocuments,
        isComplete: missingDocuments.length === 0,
      };
    });
  }, [clients]);

  const completeCount = clientGroups.filter((group) => group.isComplete).length;
  const incompleteCount = clientGroups.filter((group) => !group.isComplete).length;

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

    const clientSummaryHeaders = [
      'Unique ID',
      'Full Name',
      'Email',
      'Completion Status',
      'Uploaded Documents',
      'Missing Documents',
      'Total Files',
    ];

    const clientSummaryRows = clientGroups.map((group) => [
      group.client.uniqueId || group.key,
      getFullName(group.client),
      group.client.email || '',
      group.isComplete ? 'Complete' : 'Incomplete',
      group.uploadedDocuments.map(formatDocumentType).join(', '),
      group.missingDocuments.length > 0
        ? group.missingDocuments.map(formatDocumentType).join(', ')
        : 'None',
      group.files.length,
    ]);

    const fileDetailHeaders = [
      'Document ID',
      'Client ID',
      'Unique ID',
      'Full Name',
      'First Name',
      'Middle Name',
      'Last Name',
      'Email',
      'Document Type',
      'File Name',
      'Private Blob URL',
      'Submitted Date',
    ];

    const fileDetailRows = clients.map((client) => [
      client.id,
      client.clientId || '',
      client.uniqueId || '',
      getFullName(client),
      client.firstName || '',
      client.middleName || '',
      client.lastName || '',
      client.email || '',
      formatDocumentType(client.documentType),
      client.fileName || '',
      client.fileUrl || '',
      client.submittedAt || '',
    ]);

    const csvContent = [
      'CLIENT COMPLETION SUMMARY',
      clientSummaryHeaders.map(escapeCsv).join(','),
      ...clientSummaryRows.map((row) => row.map(escapeCsv).join(',')),
      '',
      'FILE DETAILS',
      fileDetailHeaders.map(escapeCsv).join(','),
      ...fileDetailRows.map((row) => row.map(escapeCsv).join(',')),
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
                Generate a CSV file containing client completion summary and file
                details from Azure SQL.
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
            <div className="mb-4 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-600 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase text-slate-400">
                  Total File Records
                </p>
                <p className="mt-1 text-lg font-extrabold text-slate-900">
                  {clients.length}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase text-slate-400">
                  Complete Clients
                </p>
                <p className="mt-1 text-lg font-extrabold text-green-600">
                  {completeCount}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase text-slate-400">
                  Incomplete Clients
                </p>
                <p className="mt-1 text-lg font-extrabold text-red-600">
                  {incompleteCount}
                </p>
              </div>
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
            <li>Completion status</li>
            <li>Missing documents</li>
            <li>Uploaded documents</li>
            <li>Total file count per client</li>
            <li>Unique ID</li>
            <li>Client full name</li>
            <li>Email address</li>
            <li>Document type</li>
            <li>File name</li>
            <li>Private Blob URL</li>
            <li>Submitted date</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}