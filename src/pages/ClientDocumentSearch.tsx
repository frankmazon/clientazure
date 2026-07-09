import { useEffect, useMemo, useState } from 'react';
import {
  FaBriefcase,
  FaCheckCircle,
  FaDownload,
  FaExclamationTriangle,
  FaEye,
  FaFileAlt,
  FaFolder,
  FaIdBadge,
  FaPhone,
  FaSearch,
  FaSyncAlt,
  FaTimes,
  FaUser,
  FaUserFriends,
} from 'react-icons/fa';
import DashboardLayout from '../components/layout/layout';

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  'https://docsuploadpythonapi.azurewebsites.net/api'
).replace(/\/$/, '');

const CLIENTS_API = `${API_BASE}/clients`;
const FILE_URL_API = `${API_BASE}/file-url`;
const DOCUMENTS_API = `${API_BASE}/documents`;

const requiredDocuments = [
  'id',
  'property-documents',
  'credit-history',
  'income-documents',
  'other',
];

type Client = {
  id: number;
  clientId?: number;
  uniqueId?: string;
  name?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  leadType?: string;
  source?: string;
  applicationSource?: string;
  status?: string;

  classificationType?: string;
  borrowerType?: string;
  objective?: string;
  loanType?: string;
  purpose?: string;
  transactionType?: string;
  withBorrowersGuarantors?: string;

  vedaIssues?: string;
  conductIssues?: string;
  clientNeedsObjectives?: string;
  applicantBackground?: string;
  explanationOfIncome?: string;
  security?: string;

  loanAmount?: string | number;
  securityValue?: string | number;
  lvr?: string | number;
  anticipatedSettlementDate?: string;
  specialNotes?: string;

  referrer?: {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
  };

  referrerFirstName?: string;
  referrerMiddleName?: string;
  referrerLastName?: string;
  referrerPhone?: string;
  referrerEmail?: string;
  brokerFirstName?: string;
  brokerMiddleName?: string;
  brokerLastName?: string;
  brokerPhone?: string;
  brokerEmail?: string;

  documentType?: string;
  fileName?: string;
  fileUrl?: string;
  submittedAt?: string;

  documentStatus?: string;
  verifiedBy?: string;
  verifiedDate?: string;
  remarks?: string;
  progress?: number;
  completedDate?: string;
  reminderSent?: boolean;
  lastReminderDate?: string;
  assignedSpecialist?: string;
};

type ClientFolder = {
  uniqueId: string;
  client: Client;
  files: Client[];
  uploadedDocuments: string[];
  verifiedDocuments: string[];
  rejectedDocuments: string[];
  pendingDocuments: string[];
  missingDocuments: string[];
  isComplete: boolean;
  progress: number;
};

const documentTypeLabels: Record<string, string> = {
  id: 'ID',
  ID: 'ID',
  'property-documents': 'Property Documents',
  'credit-history': 'Credit History',
  'income-documents': 'Income Documents',
  other: 'Other',
};

const normalizeDocumentStatus = (status?: string) => {
  const value = (status || 'Pending').trim().toLowerCase();

  if (value === 'verified' || value === 'approved' || value === 'approve') {
    return 'Verified';
  }

  if (value === 'rejected' || value === 'reject') {
    return 'Rejected';
  }

  return 'Pending';
};

const getDocumentStatusStyle = (status?: string) => {
  const normalized = normalizeDocumentStatus(status);

  if (normalized === 'Verified') {
    return 'bg-green-100 text-green-700 border-green-200';
  }

  if (normalized === 'Rejected') {
    return 'bg-red-100 text-red-700 border-red-200';
  }

  return 'bg-orange-100 text-orange-700 border-orange-200';
};

const getDocumentStatusIcon = (status?: string) => {
  const normalized = normalizeDocumentStatus(status);

  if (normalized === 'Verified') return <FaCheckCircle />;
  if (normalized === 'Rejected') return <FaExclamationTriangle />;
  return <FaSyncAlt />;
};

export default function ClientDocumentSearch() {
  const [search, setSearch] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [previewFile, setPreviewFile] = useState<Client | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const loadClients = async (keyword = '') => {
    try {
      setLoading(true);
      setError('');

      const url = keyword.trim()
        ? `${CLIENTS_API}?search=${encodeURIComponent(keyword.trim())}`
        : CLIENTS_API;

      const response = await fetch(url);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to load clients.');
      }

      setClients((result.clients || []).map(normalizeClient));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load clients.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const normalizeKey = (key: string) =>
    key
      .replace(/[^a-zA-Z0-9]+/g, '')
      .toLowerCase();

  const pickValue = (
    source: Record<string, unknown>,
    keys: string[],
  ): string | number | undefined => {
    for (const key of keys) {
      const value = source[key];
      if (value !== undefined && value !== null && value !== '') {
        return value as string | number;
      }
    }

    const normalizedSource = Object.entries(source).reduce<Record<string, unknown>>(
      (acc, [key, value]) => {
        acc[normalizeKey(key)] = value;
        return acc;
      },
      {},
    );

    for (const key of keys) {
      const value = normalizedSource[normalizeKey(key)];
      if (value !== undefined && value !== null && value !== '') {
        return value as string | number;
      }
    }

    return undefined;
  };

  const normalizeClient = (rawClient: Client & Record<string, unknown>): Client => {
    const referrer =
      typeof rawClient.referrer === 'object' && rawClient.referrer !== null
        ? (rawClient.referrer as Client['referrer'])
        : undefined;

    const normalizedSource = pickValue(rawClient, [
      'applicationSource',
      'ApplicationSource',
      'application_source',
      'Application Source',
      'application source',
      'contact.application_source',
      'source',
      'Source',
      'leadType',
      'LeadType',
      'lead_type',
    ]) as string | undefined;

    return {
      ...rawClient,
      id: Number(pickValue(rawClient, ['id', 'Id', 'DocumentId', 'documentId']) || rawClient.id),
      clientId: Number(pickValue(rawClient, ['clientId', 'ClientId', 'Id']) || rawClient.clientId || rawClient.id),
      uniqueId: pickValue(rawClient, ['uniqueId', 'UniqueId', 'uniqueID']) as string | undefined,
      name: pickValue(rawClient, ['name', 'Name', 'fullName', 'FullName']) as string | undefined,
      firstName: pickValue(rawClient, ['firstName', 'FirstName']) as string | undefined,
      middleName: pickValue(rawClient, ['middleName', 'MiddleName']) as string | undefined,
      lastName: pickValue(rawClient, ['lastName', 'LastName']) as string | undefined,
      email: pickValue(rawClient, ['email', 'Email']) as string | undefined,
      phone: pickValue(rawClient, ['phone', 'Phone', 'mobile', 'Mobile']) as string | undefined,
      leadType: pickValue(rawClient, ['leadType', 'LeadType', 'lead_type']) as string | undefined,
      source: normalizedSource,
      applicationSource: normalizedSource,
      status: pickValue(rawClient, ['status', 'Status']) as string | undefined,

      classificationType: pickValue(rawClient, ['classificationType', 'ClassificationType', 'classification_type']) as string | undefined,
      borrowerType: pickValue(rawClient, ['borrowerType', 'BorrowerType', 'borrower_type']) as string | undefined,
      objective: pickValue(rawClient, ['objective', 'Objective']) as string | undefined,
      loanType: pickValue(rawClient, ['loanType', 'LoanType', 'loan_type']) as string | undefined,
      purpose: pickValue(rawClient, ['purpose', 'Purpose']) as string | undefined,
      transactionType: pickValue(rawClient, ['transactionType', 'TransactionType', 'transaction_type']) as string | undefined,
      withBorrowersGuarantors: pickValue(rawClient, [
        'withBorrowersGuarantors',
        'WithBorrowersGuarantors',
        'with_borrowers_guarantors',
        'withBorrowers',
      ]) as string | undefined,

      vedaIssues: pickValue(rawClient, ['vedaIssues', 'VedaIssues', 'veda_issues', 'veda issues', 'Veda Issues']) as string | undefined,
      conductIssues: pickValue(rawClient, ['conductIssues', 'ConductIssues', 'conduct_issues', 'conduct issues', 'Conduct Issues']) as string | undefined,
      clientNeedsObjectives: pickValue(rawClient, [
        'clientNeedsObjectives',
        'ClientNeedsObjectives',
        'client_needs_objectives',
        'client needs objectives',
        'Client Needs Objectives',
        'Client Needs & Objectives',
      ]) as string | undefined,
      applicantBackground: pickValue(rawClient, [
        'applicantBackground',
        'ApplicantBackground',
        'applicant_background',
        'applicant background',
        'Applicant Background',
      ]) as string | undefined,
      explanationOfIncome: pickValue(rawClient, [
        'explanationOfIncome',
        'ExplanationOfIncome',
        'explanation_of_income',
        'explanation of income',
        'Explanation Of Income',
      ]) as string | undefined,
      security: pickValue(rawClient, ['security', 'Security']) as string | undefined,

      loanAmount: pickValue(rawClient, ['loanAmount', 'LoanAmount', 'loan_amount', 'loan amount', 'Loan Amount']),
      securityValue: pickValue(rawClient, ['securityValue', 'SecurityValue', 'security_value', 'security value', 'Security Value']),
      lvr: pickValue(rawClient, ['lvr', 'Lvr', 'LVR', 'LvrPercent', 'lvr_percent']),
      anticipatedSettlementDate: pickValue(rawClient, [
        'anticipatedSettlementDate',
        'AnticipatedSettlementDate',
        'anticipated_settlement_date',
      ]) as string | undefined,
      specialNotes: pickValue(rawClient, ['specialNotes', 'SpecialNotes', 'special_notes', 'special notes', 'Special Notes']) as string | undefined,

      referrer: {
        firstName:
          referrer?.firstName ||
          (pickValue(rawClient, ['referrerFirstName', 'ReferrerFirstName', 'brokerFirstName', 'BrokerFirstName']) as string | undefined),
        middleName:
          referrer?.middleName ||
          (pickValue(rawClient, ['referrerMiddleName', 'ReferrerMiddleName', 'brokerMiddleName', 'BrokerMiddleName']) as string | undefined),
        lastName:
          referrer?.lastName ||
          (pickValue(rawClient, ['referrerLastName', 'ReferrerLastName', 'brokerLastName', 'BrokerLastName']) as string | undefined),
        phone:
          referrer?.phone ||
          (pickValue(rawClient, ['referrerPhone', 'ReferrerPhone', 'brokerPhone', 'BrokerPhone']) as string | undefined),
        email:
          referrer?.email ||
          (pickValue(rawClient, ['referrerEmail', 'ReferrerEmail', 'brokerEmail', 'BrokerEmail']) as string | undefined),
      },

      documentType: pickValue(rawClient, ['documentType', 'DocumentType']) as string | undefined,
      fileName: pickValue(rawClient, ['fileName', 'FileName']) as string | undefined,
      fileUrl: pickValue(rawClient, ['fileUrl', 'FileUrl', 'blobUrl', 'BlobUrl']) as string | undefined,
      submittedAt: pickValue(rawClient, ['submittedAt', 'SubmittedAt', 'UploadedAt', 'uploadedAt']) as string | undefined,
      documentStatus: normalizeDocumentStatus(pickValue(rawClient, ['documentStatus', 'DocumentStatus', 'document_status']) as string | undefined),
      verifiedBy: pickValue(rawClient, ['verifiedBy', 'VerifiedBy', 'verified_by']) as string | undefined,
      verifiedDate: pickValue(rawClient, ['verifiedDate', 'VerifiedDate', 'verified_date']) as string | undefined,
      remarks: pickValue(rawClient, ['remarks', 'Remarks', 'adminRemarks', 'AdminRemarks']) as string | undefined,
      progress: Number(pickValue(rawClient, ['progress', 'Progress']) || 0),
      completedDate: pickValue(rawClient, ['completedDate', 'CompletedDate', 'completed_date']) as string | undefined,
      reminderSent: Boolean(pickValue(rawClient, ['reminderSent', 'ReminderSent', 'reminder_sent'])),
      lastReminderDate: pickValue(rawClient, ['lastReminderDate', 'LastReminderDate', 'last_reminder_date']) as string | undefined,
      assignedSpecialist: pickValue(rawClient, ['assignedSpecialist', 'AssignedSpecialist', 'assigned_specialist']) as string | undefined,
    };
  };

  const getFullName = (client: Client) =>
    (
      client.name ||
      `${client.firstName || ''} ${client.middleName || ''} ${client.lastName || ''}`
    )
      .replace(/\s+/g, ' ')
      .trim();

  const formatDocumentType = (type?: string) => {
    if (!type) return 'Document';

    return (
      documentTypeLabels[type] ||
      type
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    );
  };

  const formatSource = (type?: string) => {
    const rawValue = (type || '').trim();
    const value = rawValue.toLowerCase().replace(/[_\s]+/g, '-');

    if (!value) return '-';
    if (value === 'broker' || value === 'business-owner') return 'Broker';
    if (value === 'referral' || value === 'referrer') return 'Referral';
    if (value === 'direct-client' || value === 'directclient') return 'Direct Client';

    return rawValue
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ') || '-';
  };

  const getClientSource = (client: Client) =>
    formatSource(client.applicationSource || client.source || client.leadType);

  const getStatus = (client: Client) => client.status || 'Pending Team Call';

  const getDetailLabel = (client: Client) =>
    getClientSource(client) === 'Broker' ? 'Broker' : 'Referrer';

  const displayValue = (value?: string | number | null) => {
    if (value === null || value === undefined || value === '') return '-';
    return value;
  };

  const getReferrerName = (client: Client) =>
    [
      client.referrer?.firstName || client.referrerFirstName || client.brokerFirstName,
      client.referrer?.middleName || client.referrerMiddleName || client.brokerMiddleName,
      client.referrer?.lastName || client.referrerLastName || client.brokerLastName,
    ]
      .filter(Boolean)
      .join(' ');

  const getReferrerPhone = (client: Client) =>
    client.referrer?.phone || client.referrerPhone || client.brokerPhone;

  const getReferrerEmail = (client: Client) =>
    client.referrer?.email || client.referrerEmail || client.brokerEmail;

  const getDocumentStatus = (file: Client) =>
    normalizeDocumentStatus(file.documentStatus);

  const updateDocumentStatus = async (
    file: Client,
    action: 'verify' | 'reject' | 'pending',
  ) => {
    if (!file.id) {
      alert('Document ID is missing. Please refresh and try again.');
      return;
    }

    const label =
      action === 'verify'
        ? 'verify'
        : action === 'reject'
          ? 'reject'
          : 'mark as pending';

    const remarks = window.prompt(
      action === 'reject'
        ? 'Add rejection remarks for the client:'
        : 'Add remarks for this document (optional):',
      file.remarks || '',
    );

    if (remarks === null) return;

    const adminName =
      localStorage.getItem('adminName') ||
      localStorage.getItem('username') ||
      'Admin';

    try {
      setLoading(true);

      const response = await fetch(`${DOCUMENTS_API}/${file.id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verifiedBy: adminName,
          remarks,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(result.message || `Failed to ${label} document.`);
      }

      await loadClients(search);
      alert(result.message || `Document ${label} updated.`);
    } catch (err) {
      alert(err instanceof Error ? err.message : `Failed to ${label} document.`);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return clients.filter((client) => {
      const fullName = getFullName(client).toLowerCase();
      const source = getClientSource(client);
      const status = getStatus(client);

      const matchesSearch =
        !keyword ||
        fullName.includes(keyword) ||
        (client.uniqueId || '').toLowerCase().includes(keyword) ||
        (client.email || '').toLowerCase().includes(keyword) ||
        (client.phone || '').toLowerCase().includes(keyword) ||
        (client.applicationSource || '').toLowerCase().includes(keyword) ||
        source.toLowerCase().includes(keyword) ||
        status.toLowerCase().includes(keyword) ||
        (client.fileName || '').toLowerCase().includes(keyword) ||
        (client.documentType || '').toLowerCase().includes(keyword) ||
        (client.classificationType || '').toLowerCase().includes(keyword) ||
        (client.borrowerType || '').toLowerCase().includes(keyword) ||
        (client.objective || '').toLowerCase().includes(keyword) ||
        (client.loanType || '').toLowerCase().includes(keyword) ||
        (client.purpose || '').toLowerCase().includes(keyword) ||
        (client.transactionType || '').toLowerCase().includes(keyword) ||
        (client.withBorrowersGuarantors || '').toLowerCase().includes(keyword) ||
        (client.anticipatedSettlementDate || '').toLowerCase().includes(keyword) ||
        (client.vedaIssues || '').toLowerCase().includes(keyword) ||
        (client.conductIssues || '').toLowerCase().includes(keyword) ||
        (client.clientNeedsObjectives || '').toLowerCase().includes(keyword) ||
        (client.applicantBackground || '').toLowerCase().includes(keyword) ||
        (client.explanationOfIncome || '').toLowerCase().includes(keyword) ||
        (client.security || '').toLowerCase().includes(keyword) ||
        (client.specialNotes || '').toLowerCase().includes(keyword) ||
        getReferrerName(client).toLowerCase().includes(keyword) ||
        (getReferrerEmail(client) || '').toLowerCase().includes(keyword) ||
        (getReferrerPhone(client) || '').toLowerCase().includes(keyword);

      const matchesType =
        selectedType === 'all' || client.documentType === selectedType;

      const matchesSource =
        selectedSource === 'all' || source === selectedSource;

      const matchesStatus =
        selectedStatus === 'all' ||
        status === selectedStatus ||
        normalizeDocumentStatus(client.documentStatus) === selectedStatus;

      return matchesSearch && matchesType && matchesSource && matchesStatus;
    });
  }, [clients, search, selectedType, selectedSource, selectedStatus]);

  const documentTypes = useMemo(() => {
    return Array.from(
      new Set(clients.map((client) => client.documentType).filter(Boolean)),
    ) as string[];
  }, [clients]);

  const statuses = useMemo(() => {
    return Array.from(
      new Set([
        ...clients.map((client) => getStatus(client)),
        ...clients.map((client) => normalizeDocumentStatus(client.documentStatus)),
      ].filter(Boolean)),
    );
  }, [clients]);

  const clientFolders = useMemo<ClientFolder[]>(() => {
    const map = new Map<string, Client[]>();

    filteredClients.forEach((client) => {
      const key = client.uniqueId || String(client.clientId || client.id);

      if (!map.has(key)) map.set(key, []);
      map.get(key)?.push(client);
    });

    return Array.from(map.entries()).map(([uniqueId, files]) => {
      const uploadedDocuments = Array.from(
        new Set(
          files
            .map((file) => file.documentType?.toLowerCase())
            .filter(Boolean) as string[],
        ),
      );

      const verifiedDocuments = Array.from(
        new Set(
          files
            .filter((file) => getDocumentStatus(file) === 'Verified')
            .map((file) => file.documentType?.toLowerCase())
            .filter(Boolean) as string[],
        ),
      );

      const rejectedDocuments = Array.from(
        new Set(
          files
            .filter((file) => getDocumentStatus(file) === 'Rejected')
            .map((file) => file.documentType?.toLowerCase())
            .filter(Boolean) as string[],
        ),
      );

      const pendingDocuments = Array.from(
        new Set(
          files
            .filter((file) => getDocumentStatus(file) === 'Pending')
            .map((file) => file.documentType?.toLowerCase())
            .filter(Boolean) as string[],
        ),
      );

      const missingDocuments = requiredDocuments.filter(
        (doc) => !uploadedDocuments.includes(doc),
      );

      const isComplete = requiredDocuments.every((doc) =>
        verifiedDocuments.includes(doc),
      );

      return {
        uniqueId,
        client: files[0],
        files,
        uploadedDocuments,
        verifiedDocuments,
        rejectedDocuments,
        pendingDocuments,
        missingDocuments,
        isComplete,
        progress: Math.round(
          (verifiedDocuments.length / requiredDocuments.length) * 100,
        ),
      };
    });
  }, [filteredClients]);

  const incompleteCount = clientFolders.filter((folder) => !folder.isComplete).length;
  const completeCount = clientFolders.filter((folder) => folder.isComplete).length;
  const brokerCount = clientFolders.filter(
    (folder) => getClientSource(folder.client) === 'Broker',
  ).length;
  const referralCount = clientFolders.filter(
    (folder) => getClientSource(folder.client) === 'Referral',
  ).length;
  const directClientCount = clientFolders.filter(
    (folder) =>
      getClientSource(folder.client) === 'Direct Client',
  ).length;
  const verifiedDocsCount = clientFolders.reduce(
    (total, folder) => total + folder.verifiedDocuments.length,
    0,
  );
  const pendingDocsCount = clientFolders.reduce(
    (total, folder) => total + folder.pendingDocuments.length,
    0,
  );
  const rejectedDocsCount = clientFolders.reduce(
    (total, folder) => total + folder.rejectedDocuments.length,
    0,
  );

  const handleSearch = () => {
    loadClients(search);
  };

  const handlePreview = async (file: Client) => {
    try {
      setPreviewFile(file);
      setPreviewUrl('');
      setPreviewLoading(true);

      const secureUrl = await getSecureFileUrl(file.fileUrl);
      setPreviewUrl(secureUrl);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to open file.');
      setPreviewFile(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = async (file: Client) => {
    try {
      const secureUrl = await getSecureFileUrl(file.fileUrl);
      window.open(secureUrl, '_blank');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to download file.');
    }
  };

  const handleClosePreview = () => {
    setPreviewFile(null);
    setPreviewUrl('');
  };


  const isImageFile =
    previewFile?.fileName?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/);

  const isPdfFile = previewFile?.fileName?.toLowerCase().endsWith('.pdf');

  const InfoBox = ({
    label,
    value,
  }: {
    label: string;
    value?: string | number | null;
  }) => (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
      <p className="mt-1 break-words font-semibold text-slate-900">
        {displayValue(value)}
      </p>
    </div>
  );

  const StatCard = ({
    label,
    value,
    className,
  }: {
    label: string;
    value: number;
    className: string;
  }) => (
    <div
      className={`rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${className}`}
    >
      <p className="text-sm font-black leading-snug">{label}</p>
      <p className="mt-4 text-4xl font-black leading-none">{value}</p>
    </div>
  );

  return (
    <DashboardLayout
      title="Client Document Search"
      subtitle="Search client files, source, phone number, team status, loan details, and missing documents."
    >
      <div className="mx-auto max-w-[1800px] space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <h2 className="text-2xl font-black text-slate-900">
                Search Client Documents
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Search by Unique ID, name, email, phone, source, status, loan details, document type, or file name.
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadClients()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 text-sm font-bold text-slate-700 hover:bg-slate-200"
            >
              <FaSyncAlt />
              Refresh
            </button>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(280px,1fr)_200px_180px_180px_auto]">
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleSearch();
                }}
                placeholder="Search Unique ID, name, email, phone, source, loan details, status, or file..."
                className="h-14 w-full rounded-2xl border border-slate-300 pl-12 pr-4 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
              />
            </div>

            <select
              value={selectedType}
              onChange={(event) => setSelectedType(event.target.value)}
              className="h-14 rounded-2xl border border-slate-300 bg-white px-4 text-sm font-medium outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
            >
              <option value="all">All Document Types</option>
              {documentTypes.map((type) => (
                <option key={type} value={type}>
                  {formatDocumentType(type)}
                </option>
              ))}
            </select>

            <select
              value={selectedSource}
              onChange={(event) => setSelectedSource(event.target.value)}
              className="h-14 rounded-2xl border border-slate-300 bg-white px-4 text-sm font-medium outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
            >
              <option value="all">All Sources</option>
              <option value="Broker">Broker</option>
              <option value="Referral">Referral</option>
              <option value="Direct Client">Direct Client</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
              className="h-14 rounded-2xl border border-slate-300 bg-white px-4 text-sm font-medium outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
            >
              <option value="all">All Statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleSearch}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 text-sm font-bold text-white shadow-sm hover:bg-orange-600"
            >
              <FaSearch />
              Search
            </button>
          </div>
        </section>

        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-10">
          <StatCard
            label="Total Records"
            value={clients.length}
            className="border-slate-200 bg-white text-slate-900"
          />
          <StatCard
            label="Client Folders"
            value={clientFolders.length}
            className="border-slate-200 bg-white text-slate-900"
          />
          <StatCard
            label="Brokers"
            value={brokerCount}
            className="border-blue-200 bg-blue-50 text-blue-700"
          />
          <StatCard
            label="Referrals"
            value={referralCount}
            className="border-purple-200 bg-purple-50 text-purple-700"
          />
          <StatCard
            label="Direct Clients"
            value={directClientCount}
            className="border-cyan-200 bg-cyan-50 text-cyan-700"
          />
          <StatCard
            label="Complete"
            value={completeCount}
            className="border-green-200 bg-green-50 text-green-700"
          />
          <StatCard
            label="Incomplete"
            value={incompleteCount}
            className="border-red-200 bg-red-50 text-red-700"
          />
          <StatCard
            label="Verified Docs"
            value={verifiedDocsCount}
            className="border-emerald-200 bg-emerald-50 text-emerald-700"
          />
          <StatCard
            label="Pending Docs"
            value={pendingDocsCount}
            className="border-orange-200 bg-orange-50 text-orange-700"
          />
          <StatCard
            label="Rejected Docs"
            value={rejectedDocsCount}
            className="border-rose-200 bg-rose-50 text-rose-700"
          />
        </section>

        {loading && (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm font-bold text-slate-500 shadow-sm">
            Loading client documents from Azure...
          </div>
        )}

        {error && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-5">
            {clientFolders.map(
              ({
                uniqueId,
                client,
                files,
                verifiedDocuments,
                rejectedDocuments,
                pendingDocuments,
                missingDocuments,
                isComplete,
                progress,
              }) => {
                const sourceLabel = getClientSource(client);

                return (
                  <div
                    key={uniqueId}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-center gap-4">
                        <div
                          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
                            isComplete
                              ? 'bg-green-100 text-green-600'
                              : 'bg-red-100 text-red-600'
                          }`}
                        >
                          {isComplete ? (
                            <FaCheckCircle className="text-2xl" />
                          ) : (
                            <FaExclamationTriangle className="text-2xl" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <h3 className="break-words text-xl font-black text-slate-900">
                            {getFullName(client) || 'Unnamed Client'}
                          </h3>

                          <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-500">
                            <span className="inline-flex min-w-0 items-center gap-2 break-all">
                              <FaIdBadge className="text-xs" />
                              {client.uniqueId || uniqueId}
                            </span>

                            <span className="inline-flex min-w-0 items-center gap-2 break-all">
                              <FaUser className="text-xs" />
                              {client.email || 'No email'}
                            </span>

                            <span className="inline-flex items-center gap-2">
                              <FaPhone className="text-xs" />
                              {client.phone || 'No phone'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black sm:px-4 sm:text-sm ${
                            sourceLabel === 'Referral'
                              ? 'bg-purple-100 text-purple-700'
                              : sourceLabel === 'Direct Client'
                                ? 'bg-cyan-100 text-cyan-700'
                                : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {sourceLabel === 'Referral' ? (
                            <FaUserFriends />
                          ) : (
                            <FaBriefcase />
                          )}
                          {sourceLabel}
                        </span>

                        <span className="rounded-full bg-orange-100 px-3 py-2 text-xs font-black text-orange-700 sm:px-4 sm:text-sm">
                          {getStatus(client)}
                        </span>

                        <span
                          className={`rounded-full px-3 py-2 text-xs font-black sm:px-4 sm:text-sm ${
                            isComplete
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {isComplete ? 'Complete' : 'Incomplete'}
                        </span>
                      </div>
                    </div>

                    <div className="border-b border-slate-100 bg-white p-4 sm:p-5">
                      <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">
                        Submitted Loan Information
                      </p>

                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <InfoBox
                          label="Classification Type"
                          value={client.classificationType}
                        />
                        <InfoBox label="Borrower Type" value={client.borrowerType} />
                        <InfoBox label="Objective" value={client.objective} />
                        <InfoBox label="Loan Type" value={client.loanType} />
                        <InfoBox label="Purpose" value={client.purpose} />
                        <InfoBox
                          label="Transaction Type"
                          value={client.transactionType}
                        />
                        <InfoBox
                          label="With Borrowers / Guarantors?"
                          value={client.withBorrowersGuarantors}
                        />
                        <InfoBox
                          label="Anticipated Settlement Date"
                          value={client.anticipatedSettlementDate}
                        />
                      </div>

                      {['Broker', 'Referral'].includes(sourceLabel) && (
                        <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                          <p className="mb-3 text-sm font-extrabold text-slate-900">
                            {getDetailLabel(client)} Details
                          </p>

                          <div className="grid gap-3 md:grid-cols-3">
                            <InfoBox
                              label={`${getDetailLabel(client)} Name`}
                              value={getReferrerName(client)}
                            />
                            <InfoBox
                              label={`${getDetailLabel(client)} Phone`}
                              value={getReferrerPhone(client)}
                            />
                            <InfoBox
                              label={`${getDetailLabel(client)} Email`}
                              value={getReferrerEmail(client)}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="border-b border-slate-100 bg-white p-4 sm:p-5">
                      <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">
                        Scenario Details
                      </p>

                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        <InfoBox label="Veda Issues" value={client.vedaIssues} />
                        <InfoBox label="Conduct Issues" value={client.conductIssues} />
                        <InfoBox
                          label="Client Needs & Objectives"
                          value={client.clientNeedsObjectives}
                        />
                        <InfoBox
                          label="Applicant Background"
                          value={client.applicantBackground}
                        />
                        <InfoBox
                          label="Explanation of Income"
                          value={client.explanationOfIncome}
                        />
                        <InfoBox label="Security" value={client.security} />
                      </div>
                    </div>

                    <div className="border-b border-slate-100 bg-white p-4 sm:p-5">
                      <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">
                        Loan Amount & Settlement
                      </p>

                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <InfoBox label="Loan Amount" value={client.loanAmount} />
                        <InfoBox label="Security Value" value={client.securityValue} />
                        <InfoBox label="LVR" value={client.lvr} />
                        <InfoBox
                          label="Anticipated Settlement Date"
                          value={client.anticipatedSettlementDate}
                        />
                        <InfoBox label="Special Notes" value={client.specialNotes} />
                      </div>
                    </div>

                    <div className="border-b border-slate-100 bg-slate-50 p-4 sm:p-5">
                      <div className="mb-5">
                        <div className="mb-2 flex items-center justify-between text-sm font-bold text-slate-600">
                          <span>Document Progress</span>
                          <span>{progress}%</span>
                        </div>

                        <div className="h-3 overflow-hidden rounded-full bg-white">
                          <div
                            className={`h-full rounded-full ${
                              isComplete ? 'bg-green-500' : 'bg-orange-500'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div>
                          <p className="mb-2 text-xs font-bold uppercase text-slate-500">
                            Verified Documents
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {verifiedDocuments.length > 0 ? (
                              verifiedDocuments.map((doc) => (
                                <span
                                  key={doc}
                                  className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700"
                                >
                                  {formatDocumentType(doc)}
                                </span>
                              ))
                            ) : (
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                                None verified
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="mb-2 text-xs font-bold uppercase text-slate-500">
                            Missing Documents
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {missingDocuments.length > 0 ? (
                              missingDocuments.map((doc) => (
                                <span
                                  key={doc}
                                  className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700"
                                >
                                  {formatDocumentType(doc)}
                                </span>
                              ))
                            ) : (
                              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                                None
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="mb-2 text-xs font-bold uppercase text-slate-500">
                            Pending Review
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {pendingDocuments.length > 0 ? (
                              pendingDocuments.map((doc) => (
                                <span
                                  key={doc}
                                  className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700"
                                >
                                  {formatDocumentType(doc)}
                                </span>
                              ))
                            ) : (
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                                None
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="mb-2 text-xs font-bold uppercase text-slate-500">
                            Rejected Documents
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {rejectedDocuments.length > 0 ? (
                              rejectedDocuments.map((doc) => (
                                <span
                                  key={doc}
                                  className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700"
                                >
                                  {formatDocumentType(doc)}
                                </span>
                              ))
                            ) : (
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                                None
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-2 xl:grid-cols-3">
                      {files.map((file) => (
                        <div
                          key={`${file.id}-${file.fileName}`}
                          className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white">
                              <FaFileAlt />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold uppercase tracking-wide text-orange-600">
                                {formatDocumentType(file.documentType)}
                              </p>

                              <h4 className="mt-1 truncate text-sm font-extrabold text-slate-900">
                                {file.fileName || 'No file name'}
                              </h4>

                              <p className="mt-1 text-xs text-slate-500">
                                Submitted: {file.submittedAt || 'N/A'}
                              </p>

                              <span
                                className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-extrabold ${getDocumentStatusStyle(
                                  file.documentStatus,
                                )}`}
                              >
                                {getDocumentStatusIcon(file.documentStatus)}
                                {getDocumentStatus(file)}
                              </span>

                              {file.remarks && (
                                <p className="mt-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                                  Remarks: {file.remarks}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => handlePreview(file)}
                              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-3 py-2 text-xs font-bold text-white hover:bg-blue-600"
                            >
                              <FaEye />
                              View
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDownload(file)}
                              className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-3 py-2 text-xs font-bold text-white hover:bg-green-600"
                            >
                              <FaDownload />
                              Download
                            </button>

                            <button
                              type="button"
                              onClick={() => updateDocumentStatus(file, 'verify')}
                              disabled={loading}
                              className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-3 py-2 text-xs font-bold text-white hover:bg-green-700 disabled:bg-green-300"
                            >
                              <FaCheckCircle />
                              Approve
                            </button>

                            <button
                              type="button"
                              onClick={() => updateDocumentStatus(file, 'reject')}
                              disabled={loading}
                              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:bg-red-300"
                            >
                              <FaExclamationTriangle />
                              Reject
                            </button>

                            <button
                              type="button"
                              onClick={() => updateDocumentStatus(file, 'pending')}
                              disabled={loading}
                              className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-3 py-2 text-xs font-bold text-white hover:bg-orange-600 disabled:bg-orange-300"
                            >
                              <FaSyncAlt />
                              Mark Pending
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              },
            )}

            {clientFolders.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
                <FaFolder className="mx-auto text-5xl text-slate-300" />

                <h3 className="mt-4 text-lg font-bold text-slate-900">
                  No client documents found
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Try searching another Unique ID, name, phone, source, loan details, or document type.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {previewFile && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-3 py-4 sm:px-4">
          <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:rounded-3xl">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4 sm:p-5">
              <div className="min-w-0">
                <h2 className="break-words text-xl font-black text-slate-900">
                  Client File Details
                </h2>
                <p className="break-words text-sm text-slate-500">
                  {previewFile.fileName || 'File Preview'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleClosePreview}
                className="shrink-0 rounded-xl bg-slate-100 p-3 text-slate-600 hover:bg-slate-200"
              >
                <FaTimes />
              </button>
            </div>

            <div className="overflow-y-auto bg-slate-100 p-3 sm:p-4">
              <div className="mb-4 rounded-2xl bg-white p-5">
                <h3 className="mb-4 text-lg font-black text-slate-900">
                  Client Information
                </h3>

                <div className="grid gap-3 md:grid-cols-2">
                  <InfoBox label="Unique ID" value={previewFile.uniqueId} />
                  <InfoBox
                    label="Source"
                    value={getClientSource(previewFile)}
                  />
                  <InfoBox label="Team Status" value={getStatus(previewFile)} />
                  <InfoBox label="Full Name" value={getFullName(previewFile)} />
                  <InfoBox label="Email" value={previewFile.email} />
                  <InfoBox label="Phone" value={previewFile.phone} />
                  <InfoBox
                    label="Document Type"
                    value={formatDocumentType(previewFile.documentType)}
                  />
                  <InfoBox label="Submitted" value={previewFile.submittedAt} />
                  <InfoBox
                    label="Document Review Status"
                    value={getDocumentStatus(previewFile)}
                  />
                  <InfoBox label="Verified By" value={previewFile.verifiedBy} />
                  <InfoBox label="Verified Date" value={previewFile.verifiedDate} />
                  <InfoBox label="Remarks" value={previewFile.remarks} />
                </div>
              </div>

              <div className="mb-4 rounded-2xl bg-white p-5">
                <h3 className="mb-4 text-lg font-black text-slate-900">
                  Submitted Loan Information
                </h3>

                <div className="grid gap-3 md:grid-cols-2">
                  <InfoBox
                    label="Classification Type"
                    value={previewFile.classificationType}
                  />
                  <InfoBox
                    label="Borrower Type"
                    value={previewFile.borrowerType}
                  />
                  <InfoBox label="Objective" value={previewFile.objective} />
                  <InfoBox label="Loan Type" value={previewFile.loanType} />
                  <InfoBox label="Purpose" value={previewFile.purpose} />
                  <InfoBox
                    label="Transaction Type"
                    value={previewFile.transactionType}
                  />
                  <InfoBox
                    label="With Borrowers / Guarantors?"
                    value={previewFile.withBorrowersGuarantors}
                  />
                  <InfoBox
                    label="Anticipated Settlement Date"
                    value={previewFile.anticipatedSettlementDate}
                  />
                </div>
              </div>

              {['Broker', 'Referral'].includes(getClientSource(previewFile)) && (
                <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 p-5">
                  <h3 className="mb-4 text-lg font-black text-slate-900">
                    {getDetailLabel(previewFile)} Details
                  </h3>

                  <div className="grid gap-3 md:grid-cols-3">
                    <InfoBox
                      label={`${getDetailLabel(previewFile)} Name`}
                      value={getReferrerName(previewFile)}
                    />
                    <InfoBox
                      label={`${getDetailLabel(previewFile)} Phone`}
                      value={getReferrerPhone(previewFile)}
                    />
                    <InfoBox
                      label={`${getDetailLabel(previewFile)} Email`}
                      value={getReferrerEmail(previewFile)}
                    />
                  </div>
                </div>
              )}

              <div className="mb-4 rounded-2xl bg-white p-5">
                <h3 className="mb-4 text-lg font-black text-slate-900">
                  Scenario Details
                </h3>

                <div className="grid gap-3 md:grid-cols-2">
                  <InfoBox label="Veda Issues" value={previewFile.vedaIssues} />
                  <InfoBox
                    label="Conduct Issues"
                    value={previewFile.conductIssues}
                  />
                  <InfoBox
                    label="Client Needs & Objectives"
                    value={previewFile.clientNeedsObjectives}
                  />
                  <InfoBox
                    label="Applicant Background"
                    value={previewFile.applicantBackground}
                  />
                  <InfoBox
                    label="Explanation of Income"
                    value={previewFile.explanationOfIncome}
                  />
                  <InfoBox label="Security" value={previewFile.security} />
                </div>
              </div>

              <div className="mb-4 rounded-2xl bg-white p-5">
                <h3 className="mb-4 text-lg font-black text-slate-900">
                  Loan Amount & Settlement
                </h3>

                <div className="grid gap-3 md:grid-cols-2">
                  <InfoBox label="Loan Amount" value={previewFile.loanAmount} />
                  <InfoBox
                    label="Security Value"
                    value={previewFile.securityValue}
                  />
                  <InfoBox label="LVR" value={previewFile.lvr} />
                  <InfoBox
                    label="Anticipated Settlement Date"
                    value={previewFile.anticipatedSettlementDate}
                  />
                  <InfoBox label="Special Notes" value={previewFile.specialNotes} />
                </div>
              </div>

              <div className="rounded-2xl bg-white p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4">
                  <div className="min-w-0">
                    <p className="break-all font-semibold text-slate-900">
                      {previewFile.fileName || 'No file selected'}
                    </p>
                    <p className="text-sm text-slate-500">
                      Submitted client file
                    </p>
                  </div>

                  <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => handleDownload(previewFile)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600"
                    >
                      <FaDownload />
                      Download
                    </button>

                    <button
                      type="button"
                      onClick={() => updateDocumentStatus(previewFile, 'verify')}
                      disabled={loading}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:bg-green-300"
                    >
                      <FaCheckCircle />
                      Approve
                    </button>

                    <button
                      type="button"
                      onClick={() => updateDocumentStatus(previewFile, 'reject')}
                      disabled={loading}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:bg-red-300"
                    >
                      <FaExclamationTriangle />
                      Reject
                    </button>
                  </div>
                </div>

                {previewLoading && (
                  <div className="flex h-[68vh] items-center justify-center rounded-2xl bg-white text-center text-slate-500 sm:h-[70vh]">
                    Loading secure preview...
                  </div>
                )}

                {!previewLoading && previewUrl && isImageFile && (
                  <img
                    src={previewUrl}
                    alt={previewFile.fileName || 'Preview'}
                    className="mx-auto max-h-[68vh] rounded-2xl bg-white object-contain sm:max-h-[70vh]"
                  />
                )}

                {!previewLoading && previewUrl && isPdfFile && (
                  <iframe
                    src={previewUrl}
                    title={previewFile.fileName}
                    className="h-[68vh] w-full rounded-2xl bg-white sm:h-[70vh]"
                  />
                )}

                {!previewLoading && previewUrl && !isImageFile && !isPdfFile && (
                  <div className="flex h-[68vh] flex-col items-center justify-center rounded-2xl bg-white px-4 text-center text-slate-500 sm:h-[70vh]">
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
                      className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-5 py-3 text-sm font-bold text-white hover:bg-green-600"
                    >
                      <FaDownload />
                      Open / Download
                    </button>
                  </div>
                )}

                {!previewLoading && !previewUrl && (
                  <div className="flex h-[68vh] items-center justify-center rounded-2xl bg-white text-center text-slate-500 sm:h-[70vh]">
                    No preview available.
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
