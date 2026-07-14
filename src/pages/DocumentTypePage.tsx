import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  FaBriefcase,
  FaChevronDown,
  FaChevronRight,
  FaDownload,
  FaEnvelope,
  FaEye,
  FaFileAlt,
  FaFolder,
  FaFolderOpen,
  FaPhone,
  FaTimes,
  FaUserFriends,
} from 'react-icons/fa';
import DashboardLayout from '../components/layout/layout';

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  'https://docsuploadpythonapi.azurewebsites.net/api';

const CLIENTS_API = `${API_BASE}/clients`;
const FILE_URL_API = `${API_BASE}/file-url`;

type Client = {
  [key: string]: unknown;
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

type ClientFolder = {
  key: string;
  client: Client;
  files: Client[];
};

const documentTypeLabels: Record<string, string> = {
  id: 'ID',
  ID: 'ID',
  'property-documents': 'Property Documents',
  'credit-history': 'Credit History',
  'income-documents': 'Income Documents',
  other: 'Other',
};

const panelClass =
  'overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.07)]';

const getAnyValue = (
  data: Record<string, unknown> | undefined | null,
  keys: string[],
) => {
  if (!data) return undefined;

  for (const key of keys) {
    const value = data[key];

    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }

  return undefined;
};

const getStringValue = (
  data: Record<string, unknown> | undefined | null,
  keys: string[],
) => {
  const value = getAnyValue(data, keys);

  if (value === undefined || value === null) return '';

  return String(value);
};

const getNumberOrStringValue = (
  data: Record<string, unknown> | undefined | null,
  keys: string[],
) => {
  const value = getAnyValue(data, keys);

  if (value === undefined || value === null || value === '') return undefined;

  return value as string | number;
};

const normalizeSourceLabel = (source?: string) => {
  const value = (source || '').trim().toLowerCase().replace(/_/g, '-');

  if (!value) return 'N/A';
  if (value === 'broker') return 'Broker';
  if (value === 'referral' || value === 'referrer') return 'Referral';
  if (value === 'direct-client' || value === 'direct client' || value === 'directclient') {
    return 'Direct Client';
  }
  if (value === 'business-owner' || value === 'business owner') return 'Broker';

  return source || 'N/A';
};

const normalizeClient = (rawClient: Client): Client => {
  const raw = rawClient as Record<string, unknown>;
  const referrerRaw =
    (raw.referrer as Record<string, unknown> | undefined) ||
    (raw.Referrer as Record<string, unknown> | undefined) ||
    {};

  const sourceValue = getStringValue(raw, [
    'source',
    'Source',
    'applicationSource',
    'ApplicationSource',
    'application_source',
    'leadType',
    'LeadType',
  ]);

  return {
    ...rawClient,
    id: Number(getAnyValue(raw, ['id', 'Id', 'documentId', 'DocumentId', 'clientId', 'ClientId']) || rawClient.id),
    clientId: Number(getAnyValue(raw, ['clientId', 'ClientId']) || rawClient.clientId || rawClient.id),
    uniqueId: getStringValue(raw, ['uniqueId', 'UniqueId', 'unique_id']),
    firstName: getStringValue(raw, ['firstName', 'FirstName', 'first_name']),
    middleName: getStringValue(raw, ['middleName', 'MiddleName', 'middle_name']),
    lastName: getStringValue(raw, ['lastName', 'LastName', 'last_name']),
    name: getStringValue(raw, ['name', 'Name', 'fullName', 'FullName', 'full_name']),
    email: getStringValue(raw, ['email', 'Email']),
    phone: getStringValue(raw, ['phone', 'Phone', 'mobile', 'Mobile']),
    leadType: getStringValue(raw, ['leadType', 'LeadType', 'lead_type']),
    source: normalizeSourceLabel(sourceValue),

    classificationType: getStringValue(raw, ['classificationType', 'ClassificationType', 'classification_type']),
    borrowerType: getStringValue(raw, ['borrowerType', 'BorrowerType', 'borrower_type']),
    objective: getStringValue(raw, ['objective', 'Objective']),
    loanType: getStringValue(raw, ['loanType', 'LoanType', 'loan_type']),
    purpose: getStringValue(raw, ['purpose', 'Purpose']),
    transactionType: getStringValue(raw, ['transactionType', 'TransactionType', 'transaction_type']),
    withBorrowersGuarantors: getStringValue(raw, [
      'withBorrowersGuarantors',
      'WithBorrowersGuarantors',
      'with_borrowers_guarantors',
      'withBorrowers',
      'WithBorrowers',
      'with_borrowers',
    ]),

    vedaIssues: getStringValue(raw, ['vedaIssues', 'VedaIssues', 'veda_issues']),
    conductIssues: getStringValue(raw, ['conductIssues', 'ConductIssues', 'conduct_issues']),
    clientNeedsObjectives: getStringValue(raw, [
      'clientNeedsObjectives',
      'ClientNeedsObjectives',
      'client_needs_objectives',
    ]),
    applicantBackground: getStringValue(raw, [
      'applicantBackground',
      'ApplicantBackground',
      'applicant_background',
    ]),
    explanationOfIncome: getStringValue(raw, [
      'explanationOfIncome',
      'ExplanationOfIncome',
      'explanation_of_income',
    ]),
    security: getStringValue(raw, ['security', 'Security']),
    loanAmount: getNumberOrStringValue(raw, ['loanAmount', 'LoanAmount', 'loan_amount']),
    securityValue: getNumberOrStringValue(raw, ['securityValue', 'SecurityValue', 'security_value']),
    lvr: getNumberOrStringValue(raw, ['lvr', 'Lvr', 'LVR']),
    anticipatedSettlementDate: getStringValue(raw, [
      'anticipatedSettlementDate',
      'AnticipatedSettlementDate',
      'anticipated_settlement_date',
      'settlementDate',
      'SettlementDate',
    ]),
    specialNotes: getStringValue(raw, ['specialNotes', 'SpecialNotes', 'special_notes']),

    referrer: {
      firstName: getStringValue(referrerRaw, ['firstName', 'FirstName', 'first_name']) ||
        getStringValue(raw, ['referrerFirstName', 'ReferrerFirstName', 'referrer_first_name']),
      middleName: getStringValue(referrerRaw, ['middleName', 'MiddleName', 'middle_name']) ||
        getStringValue(raw, ['referrerMiddleName', 'ReferrerMiddleName', 'referrer_middle_name']),
      lastName: getStringValue(referrerRaw, ['lastName', 'LastName', 'last_name']) ||
        getStringValue(raw, ['referrerLastName', 'ReferrerLastName', 'referrer_last_name']),
      phone: getStringValue(referrerRaw, ['phone', 'Phone', 'mobile', 'Mobile']) ||
        getStringValue(raw, ['referrerPhone', 'ReferrerPhone', 'referrer_phone', 'referrerMobile', 'ReferrerMobile']),
      email: getStringValue(referrerRaw, ['email', 'Email']) ||
        getStringValue(raw, ['referrerEmail', 'ReferrerEmail', 'referrer_email']),
    },

    documentType: getStringValue(raw, ['documentType', 'DocumentType', 'document_type']),
    fileName: getStringValue(raw, ['fileName', 'FileName', 'file_name']),
    fileUrl: getStringValue(raw, ['fileUrl', 'FileUrl', 'file_url', 'blobUrl', 'BlobUrl']),
    submittedAt: getStringValue(raw, ['submittedAt', 'SubmittedAt', 'submitted_at', 'uploadedAt', 'UploadedAt']),

    sssNumber: getStringValue(raw, ['sssNumber', 'SSSNumber', 'SssNumber', 'sss_number']),
    hdmfNumber: getStringValue(raw, ['hdmfNumber', 'HDMFNumber', 'HdmfNumber', 'hdmf_number']),
    philhealthNumber: getStringValue(raw, ['philhealthNumber', 'PhilhealthNumber', 'PhilHealthNumber', 'philhealth_number']),
    tinNumber: getStringValue(raw, ['tinNumber', 'TINNumber', 'TinNumber', 'tin_number']),
    licenseNumber: getStringValue(raw, ['licenseNumber', 'LicenseNumber', 'license_number']),
  };
};


export default function DocumentTypePage() {
  const { type } = useParams();
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [clients, setClients] = useState<Client[]>([]);
  const [previewFile, setPreviewFile] = useState<Client | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const pageTitle =
    documentTypeLabels[type || ''] ||
    type
      ?.split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') ||
    'Documents';

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

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(
          `${CLIENTS_API}?documentType=${encodeURIComponent(type || '')}`,
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Failed to load documents.');
        }

        setClients((result.clients || []).map(normalizeClient));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load documents.',
        );
        setClients([]);
      } finally {
        setLoading(false);
      }
    };

    if (type) loadDocuments();
  }, [type]);

  const getFullName = (client: Client) =>
    (
      client.name ||
      `${client.firstName || ''} ${client.middleName || ''} ${client.lastName || ''}`
    )
      .replace(/\s+/g, ' ')
      .trim();

  const formatSource = (source?: string) => normalizeSourceLabel(source);

  const getDetailLabel = (client: Client) => {
    const sourceLabel = formatSource(client.source || client.leadType);

    if (sourceLabel === 'Broker') return 'Broker';
    if (sourceLabel === 'Referral') return 'Referrer';

    return 'Source';
  };

  const getStatus = (client: Client) => client.status || 'Pending Team Call';

  const displayValue = (value?: string | number | null) =>
    value !== undefined && value !== null && value !== '' ? value : 'N/A';

  const getReferrerName = (client: Client) =>
    [
      client.referrer?.firstName,
      client.referrer?.middleName,
      client.referrer?.lastName,
    ]
      .filter(Boolean)
      .join(' ') || 'N/A';

  const clientFolders = useMemo<ClientFolder[]>(() => {
    const map = new Map<string, Client[]>();

    clients.forEach((client) => {
      const key = client.uniqueId || String(client.clientId || client.id);

      if (!map.has(key)) map.set(key, []);
      map.get(key)?.push(client);
    });

    return Array.from(map.entries()).map(([key, files]) => ({
      key,
      client: files[0],
      files,
    }));
  }, [clients]);

  const brokerCount = clientFolders.filter(
    (folder) =>
      formatSource(folder.client.source || folder.client.leadType) === 'Broker',
  ).length;

  const referralCount = clientFolders.filter(
    (folder) =>
      formatSource(folder.client.source || folder.client.leadType) === 'Referral',
  ).length;

  const directClientCount = clientFolders.filter(
    (folder) =>
      formatSource(folder.client.source || folder.client.leadType) ===
      'Direct Client',
  ).length;

  const toggleFolder = (folderKey: string) => {
    setOpenFolders((prev) => ({
      ...prev,
      [folderKey]: !prev[folderKey],
    }));
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
    <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/80 p-4 transition hover:border-[#259b8f]/25 hover:bg-white">
      <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-bold leading-6 text-slate-900">
        {displayValue(value)}
      </p>
    </div>
  );

  const StatCard = ({
    label,
    value,
    icon,
    className,
  }: {
    label: string;
    value: number;
    icon?: ReactNode;
    className: string;
  }) => (
    <div
      className={`rounded-2xl border p-4 shadow-[0_14px_34px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(15,23,42,0.1)] ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide opacity-70">{label}</p>
          <p className="mt-3 text-3xl font-black leading-none">{value}</p>
        </div>

        {icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/70 text-base shadow-sm ring-1 ring-black/5">
            {icon}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <DashboardLayout
      title={`${pageTitle} Folders`}
      subtitle={`Client folders containing ${pageTitle} submissions from Azure SQL`}
    >
      <div className="mx-auto max-w-[1800px] space-y-6">
        <div className={panelClass}>
          <div className="bg-[linear-gradient(135deg,rgba(37,155,143,0.94),rgba(15,23,42,0.98)_56%,rgba(238,101,33,0.88))] p-5 text-white sm:p-6">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/65">
              Document Type
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">
              {pageTitle} Document Folders
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-white/75">
              {loading
                ? 'Loading folders from Azure SQL...'
                : `${clientFolders.length} client folder(s), ${clients.length} file(s) found`}
            </p>
          </div>
        </div>

        {!loading && !error && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
            <StatCard
              label="Folders"
              value={clientFolders.length}
              icon={<FaFolder />}
              className="border-slate-200 bg-white text-slate-900"
            />
            <StatCard
              label="Brokers"
              value={brokerCount}
              icon={<FaBriefcase />}
              className="border-sky-200 bg-sky-50 text-sky-700"
            />
            <StatCard
              label="Referrals"
              value={referralCount}
              icon={<FaUserFriends />}
              className="border-[#259b8f]/25 bg-[#259b8f]/10 text-[#1f8178]"
            />
            <StatCard
              label="Direct Clients"
              value={directClientCount}
              icon={<FaFolderOpen />}
              className="border-cyan-200 bg-cyan-50 text-cyan-700"
            />
            <StatCard
              label="Files"
              value={clients.length}
              icon={<FaFileAlt />}
              className="border-orange-200 bg-orange-50 text-orange-700"
            />
          </div>
        )}

        {loading && (
          <div className={`${panelClass} p-12 text-center text-sm font-bold text-slate-500`}>
            Loading {pageTitle} documents from Azure...
          </div>
        )}

        {error && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid gap-4">
            {clientFolders.map(({ key, client, files }) => {
              const isOpen = openFolders[key];
              const fullName = getFullName(client);
              const sourceLabel = formatSource(client.source || client.leadType);
              const isIdDocument =
                client.documentType === 'id' || client.documentType === 'ID';

              return (
                <div
                  key={key}
                  className={panelClass}
                >
                  <button
                    type="button"
                    onClick={() => toggleFolder(key)}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-slate-50"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-[#EE6521]">
                        {isOpen ? (
                          <FaFolderOpen className="text-2xl" />
                        ) : (
                          <FaFolder className="text-2xl" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="break-words text-lg font-black text-slate-900">
                          {fullName || 'Unnamed Client'}
                        </h3>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${
                              sourceLabel === 'Referral'
                                ? 'bg-[#259b8f]/10 text-[#1f8178] ring-1 ring-[#259b8f]/20'
                                : sourceLabel === 'Direct Client'
                                  ? 'bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200'
                                  : 'bg-sky-100 text-sky-700 ring-1 ring-sky-200'
                            }`}
                          >
                            {sourceLabel === 'Referral' ? (
                              <FaUserFriends />
                            ) : (
                              <FaBriefcase />
                            )}
                            {sourceLabel}
                          </span>

                          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700 ring-1 ring-orange-200">
                            {getStatus(client)}
                          </span>

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                            {client.uniqueId || key}
                          </span>

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                            {files.length} file{files.length !== 1 ? 's' : ''}
                          </span>
                        </div>

                        <div className="mt-3 grid gap-1 text-sm text-slate-500 sm:grid-cols-2">
                          <p className="flex items-center gap-2">
                            <FaEnvelope className="text-xs" />
                            {client.email || 'No email'}
                          </p>

                          <p className="flex items-center gap-2">
                            <FaPhone className="text-xs" />
                            {client.phone || 'No phone'}
                          </p>

                          <p>
                            <span className="font-semibold text-slate-700">
                              Classification:
                            </span>{' '}
                            {client.classificationType || 'N/A'}
                          </p>

                          <p>
                            <span className="font-semibold text-slate-700">
                              Objective:
                            </span>{' '}
                            {client.objective || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 rounded-xl bg-slate-100 p-3 text-slate-500">
                      {isOpen ? <FaChevronDown /> : <FaChevronRight />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="space-y-4 border-t border-slate-100 bg-slate-100 p-4 sm:p-5">
                      <div className="rounded-2xl bg-white p-5">
                        <h4 className="mb-4 text-base font-black text-slate-900">
                          Submitted Loan Information
                        </h4>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          <InfoBox label="Source" value={sourceLabel} />
                          <InfoBox
                            label="Classification Type"
                            value={client.classificationType}
                          />
                          <InfoBox
                            label="Borrower Type"
                            value={client.borrowerType}
                          />
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
                        </div>

                        {sourceLabel !== 'Direct Client' && (
                          <div className="mt-5 rounded-2xl border border-[#259b8f]/20 bg-[#259b8f]/10 p-5">
                            <h5 className="mb-3 text-sm font-black text-slate-900">
                              {getDetailLabel(client)} Details
                            </h5>

                            <div className="grid gap-4 md:grid-cols-3">
                              <InfoBox
                                label={`${getDetailLabel(client)} Name`}
                                value={getReferrerName(client)}
                              />
                              <InfoBox
                                label={`${getDetailLabel(client)} Phone`}
                                value={client.referrer?.phone}
                              />
                              <InfoBox
                                label={`${getDetailLabel(client)} Email`}
                                value={client.referrer?.email}
                              />
                            </div>
                          </div>
                        )}

                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                          <InfoBox
                            label="Veda Issues"
                            value={client.vedaIssues}
                          />
                          <InfoBox
                            label="Conduct Issues"
                            value={client.conductIssues}
                          />
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
                          <InfoBox
                            label="Loan Amount"
                            value={client.loanAmount}
                          />
                          <InfoBox
                            label="Security Value"
                            value={client.securityValue}
                          />
                          <InfoBox label="LVR" value={client.lvr} />
                          <InfoBox
                            label="Anticipated Settlement Date"
                            value={client.anticipatedSettlementDate}
                          />
                          <InfoBox
                            label="Special Notes"
                            value={client.specialNotes}
                          />
                        </div>
                      </div>

                      {files.map((file) => (
                        <div
                          key={`${file.id}-${file.fileName}`}
                          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#EE6521] text-white">
                              <FaFileAlt />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-black uppercase tracking-wide text-[#EE6521]">
                                {pageTitle}
                              </p>

                              <h4 className="mt-1 break-words text-base font-black text-slate-900">
                                {file.fileName || 'No file name'}
                              </h4>

                              <div className="mt-3 grid gap-3 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-3">
                                <p className="rounded-xl bg-slate-50 p-3">
                                  <span className="font-bold text-slate-800">
                                    Client ID:
                                  </span>{' '}
                                  {file.uniqueId || file.clientId || file.id}
                                </p>

                                <p className="rounded-xl bg-slate-50 p-3">
                                  <span className="font-bold text-slate-800">
                                    Submitted:
                                  </span>{' '}
                                  {file.submittedAt || 'N/A'}
                                </p>

                                <p className="rounded-xl bg-slate-50 p-3">
                                  <span className="font-bold text-slate-800">
                                    Source:
                                  </span>{' '}
                                  {formatSource(file.source || file.leadType)}
                                </p>

                                <p className="rounded-xl bg-slate-50 p-3">
                                  <span className="font-bold text-slate-800">
                                    Status:
                                  </span>{' '}
                                  {getStatus(file)}
                                </p>

                                <p className="rounded-xl bg-slate-50 p-3">
                                  <span className="font-bold text-slate-800">
                                    Document Type:
                                  </span>{' '}
                                  {pageTitle}
                                </p>

                                <p className="rounded-xl bg-slate-50 p-3">
                                  <span className="font-bold text-slate-800">
                                    Email:
                                  </span>{' '}
                                  {file.email || 'N/A'}
                                </p>

                                <p className="rounded-xl bg-slate-50 p-3">
                                  <span className="font-bold text-slate-800">
                                    Phone:
                                  </span>{' '}
                                  {file.phone || 'N/A'}
                                </p>

                                <p className="rounded-xl bg-slate-50 p-3">
                                  <span className="font-bold text-slate-800">
                                    Loan Type:
                                  </span>{' '}
                                  {file.loanType || 'N/A'}
                                </p>

                                <p className="rounded-xl bg-slate-50 p-3">
                                  <span className="font-bold text-slate-800">
                                    Objective:
                                  </span>{' '}
                                  {file.objective || 'N/A'}
                                </p>
                              </div>

                              <div className="mt-5 flex flex-wrap gap-3">
                                <button
                                  type="button"
                                  onClick={() => handlePreview(file)}
                                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
                                >
                                  <FaEye />
                                  View File
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDownload(file)}
                                  className="inline-flex items-center gap-2 rounded-xl bg-[#EE6521] px-4 py-2 text-sm font-bold text-white hover:bg-orange-600"
                                >
                                  <FaDownload />
                                  Download
                                </button>
                              </div>

                              {isIdDocument && (
                                <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-4">
                                  <h5 className="mb-3 text-sm font-black text-slate-900">
                                    ID Information
                                  </h5>

                                  <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                                    <p>
                                      <span className="font-semibold text-slate-800">
                                        SSS Number:
                                      </span>{' '}
                                      {file.sssNumber || 'N/A'}
                                    </p>

                                    <p>
                                      <span className="font-semibold text-slate-800">
                                        HDMF / Pag-IBIG:
                                      </span>{' '}
                                      {file.hdmfNumber || 'N/A'}
                                    </p>

                                    <p>
                                      <span className="font-semibold text-slate-800">
                                        PhilHealth:
                                      </span>{' '}
                                      {file.philhealthNumber || 'N/A'}
                                    </p>

                                    <p>
                                      <span className="font-semibold text-slate-800">
                                        TIN:
                                      </span>{' '}
                                      {file.tinNumber || 'N/A'}
                                    </p>

                                    <p>
                                      <span className="font-semibold text-slate-800">
                                        License Number:
                                      </span>{' '}
                                      {file.licenseNumber || 'N/A'}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {clientFolders.length === 0 && (
              <div className={`${panelClass} border-dashed p-12 text-center`}>
                <FaFolder className="mx-auto text-5xl text-slate-300" />

                <h3 className="mt-4 text-lg font-black text-slate-900">
                  No folders found
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  No client has submitted {pageTitle} yet.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {previewFile && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 px-3 py-4 sm:px-4">
          <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:rounded-3xl">
            <div className="flex items-center justify-between gap-3 bg-[linear-gradient(135deg,#259b8f,#0f172a)] px-4 py-4 text-white sm:px-6">
              <div className="min-w-0">
                <h2 className="break-words text-xl font-black text-white">
                  {previewFile.fileName || 'File Preview'}
                </h2>
                <p className="mt-1 text-sm text-white/70">
                  {formatSource(previewFile.source || previewFile.leadType)} -{' '}
                  {getStatus(previewFile)}
                </p>
              </div>

              <button
                type="button"
                onClick={handleClosePreview}
                className="shrink-0 rounded-xl bg-white/10 p-3 text-white hover:bg-white/20"
              >
                <FaTimes />
              </button>
            </div>

            <div className="overflow-y-auto bg-slate-100 p-3 sm:p-4">
              <div className="mb-4 rounded-2xl bg-white p-5">
                <h3 className="mb-4 text-lg font-black text-slate-900">
                  Client & Loan Information
                </h3>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <InfoBox label="Unique ID" value={previewFile.uniqueId} />
                  <InfoBox
                    label="Source"
                    value={formatSource(previewFile.source || previewFile.leadType)}
                  />
                  <InfoBox label="Status" value={getStatus(previewFile)} />
                  <InfoBox label="Full Name" value={getFullName(previewFile)} />
                  <InfoBox label="Email" value={previewFile.email} />
                  <InfoBox label="Phone" value={previewFile.phone} />
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

                {formatSource(previewFile.source || previewFile.leadType) !==
                  'Direct Client' && (
                  <div className="mt-5 rounded-2xl border border-[#259b8f]/20 bg-[#259b8f]/10 p-5">
                    <h4 className="mb-3 text-base font-black text-slate-900">
                      {getDetailLabel(previewFile)} Details
                    </h4>

                    <div className="grid gap-4 md:grid-cols-3">
                      <InfoBox
                        label={`${getDetailLabel(previewFile)} Name`}
                        value={getReferrerName(previewFile)}
                      />
                      <InfoBox
                        label={`${getDetailLabel(previewFile)} Phone`}
                        value={previewFile.referrer?.phone}
                      />
                      <InfoBox
                        label={`${getDetailLabel(previewFile)} Email`}
                        value={previewFile.referrer?.email}
                      />
                    </div>
                  </div>
                )}
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
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#259b8f] px-5 py-3 text-sm font-bold text-white hover:bg-[#1f8178]"
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
      )}
    </DashboardLayout>
  );
}
