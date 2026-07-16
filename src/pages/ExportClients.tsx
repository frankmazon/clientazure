import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  FaBriefcase,
  FaCheckCircle,
  FaChevronDown,
  FaChevronRight,
  FaDownload,
  FaEnvelope,
  FaExclamationTriangle,
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
  'https://docsuploadpythonapi-flex.azurewebsites.net/api';

const CLIENTS_API = `${API_BASE}/clients`;
const FILE_URL_API = `${API_BASE}/file-url`;

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


const getApiValue = (
  record: Record<string, unknown>,
  keys: string[],
): string | number | undefined => {
  for (const key of keys) {
    const value = record[key];

    if (value !== undefined && value !== null && value !== '') {
      return value as string | number;
    }
  }

  return undefined;
};

const normalizeSourceValue = (source?: string | number | null) => {
  const raw = String(source || '').trim();

  if (!raw) return '';

  const value = raw.toLowerCase().replace(/_/g, '-');

  if (value === 'broker') return 'Broker';
  if (value === 'referral' || value === 'referrer') return 'Referral';
  if (value === 'direct-client' || value === 'direct client') return 'Direct Client';
  if (value === 'business-owner' || value === 'business owner') return 'Broker';

  return raw
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const normalizeClientFromApi = (client: Client): Client => {
  const record = client as unknown as Record<string, unknown>;

  const sourceValue =
    getApiValue(record, [
      'source',
      'Source',
      'applicationSource',
      'ApplicationSource',
      'application_source',
      'Application_Source',
      'leadSource',
      'LeadSource',
    ]) ?? getApiValue(record, ['leadType', 'LeadType', 'lead_type']);

  const leadTypeValue =
    getApiValue(record, ['leadType', 'LeadType', 'lead_type']) ?? sourceValue;

  const normalizedSource = normalizeSourceValue(sourceValue);
  const normalizedLeadType = normalizeSourceValue(leadTypeValue);

  const referrer = {
    firstName: String(
      getApiValue(record, [
        'referrerFirstName',
        'ReferrerFirstName',
        'brokerFirstName',
        'BrokerFirstName',
        'referralFirstName',
        'ReferralFirstName',
      ]) ??
        client.referrer?.firstName ??
        '',
    ),
    middleName: String(
      getApiValue(record, [
        'referrerMiddleName',
        'ReferrerMiddleName',
        'brokerMiddleName',
        'BrokerMiddleName',
        'referralMiddleName',
        'ReferralMiddleName',
      ]) ??
        client.referrer?.middleName ??
        '',
    ),
    lastName: String(
      getApiValue(record, [
        'referrerLastName',
        'ReferrerLastName',
        'brokerLastName',
        'BrokerLastName',
        'referralLastName',
        'ReferralLastName',
      ]) ??
        client.referrer?.lastName ??
        '',
    ),
    phone: String(
      getApiValue(record, [
        'referrerPhone',
        'ReferrerPhone',
        'referrerMobile',
        'ReferrerMobile',
        'brokerPhone',
        'BrokerPhone',
        'referralPhone',
        'ReferralPhone',
      ]) ??
        client.referrer?.phone ??
        '',
    ),
    email: String(
      getApiValue(record, [
        'referrerEmail',
        'ReferrerEmail',
        'brokerEmail',
        'BrokerEmail',
        'referralEmail',
        'ReferralEmail',
      ]) ??
        client.referrer?.email ??
        '',
    ),
  };

  return {
    ...client,
    firstName:
      (getApiValue(record, ['firstName', 'FirstName', 'first_name']) as string) ??
      client.firstName,
    middleName:
      (getApiValue(record, ['middleName', 'MiddleName', 'middle_name']) as string) ??
      client.middleName,
    lastName:
      (getApiValue(record, ['lastName', 'LastName', 'last_name']) as string) ??
      client.lastName,
    email: (getApiValue(record, ['email', 'Email']) as string) ?? client.email,
    phone: (getApiValue(record, ['phone', 'Phone', 'mobile', 'Mobile']) as string) ?? client.phone,
    leadType: normalizedLeadType || client.leadType,
    source: normalizedSource || normalizedLeadType || client.source,
    classificationType:
      (getApiValue(record, [
        'classificationType',
        'ClassificationType',
        'classification_type',
      ]) as string) ?? client.classificationType,
    borrowerType:
      (getApiValue(record, ['borrowerType', 'BorrowerType', 'borrower_type']) as string) ??
      client.borrowerType,
    objective:
      (getApiValue(record, ['objective', 'Objective']) as string) ?? client.objective,
    loanType:
      (getApiValue(record, ['loanType', 'LoanType', 'loan_type']) as string) ??
      client.loanType,
    purpose:
      (getApiValue(record, ['purpose', 'Purpose']) as string) ?? client.purpose,
    transactionType:
      (getApiValue(record, [
        'transactionType',
        'TransactionType',
        'transaction_type',
      ]) as string) ?? client.transactionType,
    withBorrowersGuarantors:
      (getApiValue(record, [
        'withBorrowersGuarantors',
        'WithBorrowersGuarantors',
        'with_borrowers_guarantors',
        'withBorrowers',
        'WithBorrowers',
      ]) as string) ?? client.withBorrowersGuarantors,
    vedaIssues:
      (getApiValue(record, ['vedaIssues', 'VedaIssues', 'veda_issues', 'veda', 'Veda']) as string) ??
      client.vedaIssues,
    conductIssues:
      (getApiValue(record, ['conductIssues', 'ConductIssues', 'conduct_issues', 'conduct', 'Conduct']) as string) ??
      client.conductIssues,
    clientNeedsObjectives:
      (getApiValue(record, [
        'clientNeedsObjectives',
        'ClientNeedsObjectives',
        'client_needs_objectives',
        'clientNeedsAndObjectives',
        'ClientNeedsAndObjectives',
        'client_needs_and_objectives',
      ]) as string) ?? client.clientNeedsObjectives,
    applicantBackground:
      (getApiValue(record, [
        'applicantBackground',
        'ApplicantBackground',
        'applicant_background',
        'background',
        'Background',
      ]) as string) ?? client.applicantBackground,
    explanationOfIncome:
      (getApiValue(record, [
        'explanationOfIncome',
        'ExplanationOfIncome',
        'explanation_of_income',
        'incomeExplanation',
        'IncomeExplanation',
        'income_explanation',
      ]) as string) ?? client.explanationOfIncome,
    security:
      (getApiValue(record, ['security', 'Security', 'securityDetails', 'SecurityDetails', 'security_details']) as string) ?? client.security,
    loanAmount:
      getApiValue(record, ['loanAmount', 'LoanAmount', 'loan_amount', 'amount', 'Amount']) ??
      client.loanAmount,
    securityValue:
      getApiValue(record, ['securityValue', 'SecurityValue', 'security_value', 'propertyValue', 'PropertyValue', 'property_value']) ??
      client.securityValue,
    lvr: getApiValue(record, ['lvr', 'Lvr', 'LVR', 'lvrPercentage', 'LvrPercentage', 'lvr_percentage']) ?? client.lvr,
    anticipatedSettlementDate:
      (getApiValue(record, [
        'anticipatedSettlementDate',
        'AnticipatedSettlementDate',
        'anticipated_settlement_date',
        'settlementDate',
        'SettlementDate',
      ]) as string) ?? client.anticipatedSettlementDate,
    specialNotes:
      (getApiValue(record, ['specialNotes', 'SpecialNotes', 'special_notes', 'notes', 'Notes']) as string) ??
      client.specialNotes,
    referrer,
  };
};
const pickClientValue = (
  current: string | number | undefined,
  next: string | number | undefined,
) => {
  if (current !== undefined && current !== null && String(current).trim() !== '') {
    return current;
  }

  if (next !== undefined && next !== null && String(next).trim() !== '') {
    return next;
  }

  return current;
};

const mergeClientRecords = (files: Client[]): Client => {
  const base = files[0] || ({} as Client);

  return files.reduce<Client>((merged, file) => {
    const normalized = normalizeClientFromApi(file);

    return {
      ...merged,
      ...normalized,
      firstName: pickClientValue(merged.firstName, normalized.firstName) as string,
      middleName: pickClientValue(merged.middleName, normalized.middleName) as string,
      lastName: pickClientValue(merged.lastName, normalized.lastName) as string,
      name: pickClientValue(merged.name, normalized.name) as string,
      email: pickClientValue(merged.email, normalized.email) as string,
      phone: pickClientValue(merged.phone, normalized.phone) as string,
      leadType: pickClientValue(merged.leadType, normalized.leadType) as string,
      source: pickClientValue(merged.source, normalized.source) as string,
      classificationType: pickClientValue(
        merged.classificationType,
        normalized.classificationType,
      ) as string,
      borrowerType: pickClientValue(
        merged.borrowerType,
        normalized.borrowerType,
      ) as string,
      objective: pickClientValue(merged.objective, normalized.objective) as string,
      loanType: pickClientValue(merged.loanType, normalized.loanType) as string,
      purpose: pickClientValue(merged.purpose, normalized.purpose) as string,
      transactionType: pickClientValue(
        merged.transactionType,
        normalized.transactionType,
      ) as string,
      withBorrowersGuarantors: pickClientValue(
        merged.withBorrowersGuarantors,
        normalized.withBorrowersGuarantors,
      ) as string,
      vedaIssues: pickClientValue(merged.vedaIssues, normalized.vedaIssues) as string,
      conductIssues: pickClientValue(
        merged.conductIssues,
        normalized.conductIssues,
      ) as string,
      clientNeedsObjectives: pickClientValue(
        merged.clientNeedsObjectives,
        normalized.clientNeedsObjectives,
      ) as string,
      applicantBackground: pickClientValue(
        merged.applicantBackground,
        normalized.applicantBackground,
      ) as string,
      explanationOfIncome: pickClientValue(
        merged.explanationOfIncome,
        normalized.explanationOfIncome,
      ) as string,
      security: pickClientValue(merged.security, normalized.security) as string,
      loanAmount: pickClientValue(merged.loanAmount, normalized.loanAmount),
      securityValue: pickClientValue(merged.securityValue, normalized.securityValue),
      lvr: pickClientValue(merged.lvr, normalized.lvr),
      anticipatedSettlementDate: pickClientValue(
        merged.anticipatedSettlementDate,
        normalized.anticipatedSettlementDate,
      ) as string,
      specialNotes: pickClientValue(merged.specialNotes, normalized.specialNotes) as string,
      referrer: {
        firstName: pickClientValue(
          merged.referrer?.firstName,
          normalized.referrer?.firstName,
        ) as string,
        middleName: pickClientValue(
          merged.referrer?.middleName,
          normalized.referrer?.middleName,
        ) as string,
        lastName: pickClientValue(
          merged.referrer?.lastName,
          normalized.referrer?.lastName,
        ) as string,
        phone: pickClientValue(
          merged.referrer?.phone,
          normalized.referrer?.phone,
        ) as string,
        email: pickClientValue(
          merged.referrer?.email,
          normalized.referrer?.email,
        ) as string,
      },
    };
  }, normalizeClientFromApi(base));
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

        setClients((result.clients || []).map(normalizeClientFromApi));
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
      `${client.firstName || ''} ${client.middleName || ''} ${
        client.lastName || ''
      }`
    )
      .replace(/\s+/g, ' ')
      .trim();

  const formatSource = (source?: string) => normalizeSourceValue(source) || 'N/A';

  const getStatus = (client: Client) => client.status || 'Pending Team Call';

  const getClientSource = (client: Client) =>
    formatSource(client.source || client.leadType);

  const shouldShowReferrerDetails = (client: Client) => {
    const source = getClientSource(client);
    return source === 'Broker' || source === 'Referral';
  };

  const getDetailLabel = (client: Client) =>
    getClientSource(client) === 'Broker' ? 'Broker' : 'Referrer';

  const displayValue = (value?: string | number | null) => {
    if (value === undefined || value === null) return 'N/A';

    const cleanValue = String(value).trim();
    return cleanValue ? cleanValue : 'N/A';
  };

  const clientFolders = useMemo<ClientFolder[]>(() => {
    const map = new Map<string, Client[]>();

    clients.forEach((client) => {
      const key = client.uniqueId || String(client.clientId || client.id);

      if (!map.has(key)) map.set(key, []);
      map.get(key)?.push(client);
    });

    return Array.from(map.entries()).map(([key, files]) => ({
      key,
      client: mergeClientRecords(files),
      files: files.map(normalizeClientFromApi),
    }));
  }, [clients]);

  const brokerCount = clientFolders.filter(
    (folder) => formatSource(folder.client.source || folder.client.leadType) === 'Broker',
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

  const InfoLine = ({
    label,
    value,
  }: {
    label: string;
    value?: string | number | null;
  }) => (
    <p>
      <span className="font-semibold text-slate-800">{label}:</span>{' '}
      {displayValue(value)}
    </p>
  );

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

  return (
    <DashboardLayout
      title={`${pageTitle} Folders`}
      subtitle={`Client folders containing ${pageTitle} submissions from Azure SQL`}
    >
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-extrabold text-slate-900">
            {pageTitle} Document Folders
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {loading
              ? 'Loading...'
              : `${clientFolders.length} client folder(s), ${clients.length} file(s) found`}
          </p>
        </div>

        {!loading && !error && (
          <div className="grid gap-4 md:grid-cols-5">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm font-bold text-slate-500">Folders</p>
              <p className="mt-2 text-3xl font-extrabold text-slate-900">
                {clientFolders.length}
              </p>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
              <p className="text-sm font-bold text-blue-700">Brokers</p>
              <p className="mt-2 text-3xl font-extrabold text-blue-700">
                {brokerCount}
              </p>
            </div>

            <div className="rounded-2xl border border-purple-200 bg-purple-50 p-5 shadow-sm">
              <p className="text-sm font-bold text-purple-700">Referrals</p>
              <p className="mt-2 text-3xl font-extrabold text-purple-700">
                {referralCount}
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm">
              <p className="text-sm font-bold text-cyan-700">Direct Clients</p>
              <p className="mt-2 text-3xl font-extrabold text-cyan-700">
                {directClientCount}
              </p>
            </div>

            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5 shadow-sm">
              <p className="text-sm font-bold text-orange-700">Files</p>
              <p className="mt-2 text-3xl font-extrabold text-orange-700">
                {clients.length}
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-sm font-bold text-slate-500">
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
              const sourceLabel = getClientSource(client);
              const isIdDocument =
                client.documentType === 'id' || client.documentType === 'ID';

              return (
                <div
                  key={key}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => toggleFolder(key)}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-slate-50"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                        {isOpen ? (
                          <FaFolderOpen className="text-2xl" />
                        ) : (
                          <FaFolder className="text-2xl" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-extrabold text-slate-900">
                          {fullName || 'Unnamed Client'}
                        </h3>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${
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

                          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
                            {getStatus(client)}
                          </span>

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                            {client.uniqueId || key}
                          </span>

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                            {files.length} file{files.length !== 1 ? 's' : ''}
                          </span>
                        </div>

                        <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                          <FaEnvelope className="text-xs" />
                          {client.email || 'No email'}
                        </p>

                        <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                          <FaPhone className="text-xs" />
                          {client.phone || 'No phone'}
                        </p>

                        <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                          <InfoLine
                            label="Classification"
                            value={client.classificationType}
                          />
                          <InfoLine label="Borrower" value={client.borrowerType} />
                          <InfoLine label="Objective" value={client.objective} />
                          <InfoLine label="Loan Type" value={client.loanType} />
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-slate-400">
                      {isOpen ? <FaChevronDown /> : <FaChevronRight />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="space-y-4 border-t border-slate-100 bg-slate-50 p-5">
                      <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <h4 className="mb-4 text-sm font-extrabold uppercase text-slate-900">
                          Submitted Loan Information
                        </h4>

                        <div className="grid gap-4 md:grid-cols-2">
                          <InfoBox
                            label="Source"
                            value={getClientSource(client)}
                          />
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

                        {shouldShowReferrerDetails(client) && (
                          <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5">
                            <h5 className="mb-3 text-sm font-extrabold text-slate-900">
                              {getDetailLabel(client)} Details
                            </h5>

                            <div className="grid gap-4 md:grid-cols-3">
                              <InfoBox
                                label={`${getDetailLabel(client)} Name`}
                                value={[
                                  client.referrer?.firstName,
                                  client.referrer?.middleName,
                                  client.referrer?.lastName,
                                ]
                                  .filter(Boolean)
                                  .join(' ')}
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
                          <InfoBox label="Veda Issues" value={client.vedaIssues} />
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
                          <InfoBox label="Loan Amount" value={client.loanAmount} />
                          <InfoBox
                            label="Security Value"
                            value={client.securityValue}
                          />
                          <InfoBox label="LVR" value={client.lvr} />
                          <InfoBox
                            label="Anticipated Settlement Date"
                            value={client.anticipatedSettlementDate}
                          />
                          <InfoBox label="Special Notes" value={client.specialNotes} />
                        </div>
                      </div>

                      {files.map((file) => (
                        <div
                          key={`${file.id}-${file.fileName}`}
                          className="rounded-2xl border border-slate-200 bg-white p-5"
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white">
                              <FaFileAlt />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold uppercase text-orange-600">
                                {pageTitle}
                              </p>

                              <h4 className="mt-1 truncate text-base font-bold text-slate-900">
                                {file.fileName || 'No file name'}
                              </h4>

                              <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                                <InfoLine
                                  label="Client ID"
                                  value={file.uniqueId || file.clientId || file.id}
                                />
                                <InfoLine label="Submitted" value={file.submittedAt} />
                                <InfoLine
                                  label="Source"
                                  value={getClientSource(file)}
                                />
                                <InfoLine label="Status" value={getStatus(file)} />
                                <InfoLine label="Document Type" value={pageTitle} />
                                <InfoLine label="Email" value={file.email} />
                                <InfoLine label="Phone" value={file.phone} />
                                <InfoLine
                                  label="Classification"
                                  value={file.classificationType}
                                />
                                <InfoLine label="Borrower" value={file.borrowerType} />
                                <InfoLine label="Objective" value={file.objective} />
                                <InfoLine label="Loan Type" value={file.loanType} />
                                <InfoLine label="Purpose" value={file.purpose} />
                              </div>

                              <div className="mt-5 flex flex-wrap gap-3">
                                <button
                                  type="button"
                                  onClick={() => handlePreview(file)}
                                  className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-sm font-bold text-white hover:bg-blue-600"
                                >
                                  <FaEye />
                                  View File
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDownload(file)}
                                  className="inline-flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2 text-sm font-bold text-white hover:bg-green-600"
                                >
                                  <FaDownload />
                                  Download
                                </button>
                              </div>

                              {isIdDocument && (
                                <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-4">
                                  <h5 className="mb-3 text-sm font-extrabold text-slate-900">
                                    ID Information
                                  </h5>

                                  <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                                    <InfoLine
                                      label="SSS Number"
                                      value={file.sssNumber}
                                    />
                                    <InfoLine
                                      label="HDMF / Pag-IBIG"
                                      value={file.hdmfNumber}
                                    />
                                    <InfoLine
                                      label="PhilHealth"
                                      value={file.philhealthNumber}
                                    />
                                    <InfoLine label="TIN" value={file.tinNumber} />
                                    <InfoLine
                                      label="License Number"
                                      value={file.licenseNumber}
                                    />
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
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
                <FaFolder className="mx-auto text-5xl text-slate-300" />

                <h3 className="mt-4 text-lg font-bold text-slate-900">
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  {previewFile.fileName || 'File Preview'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {getClientSource(previewFile)} •{' '}
                  {getStatus(previewFile)}
                </p>
              </div>

              <button
                type="button"
                onClick={handleClosePreview}
                className="rounded-xl bg-slate-100 p-3 text-slate-600 hover:bg-slate-200"
              >
                <FaTimes />
              </button>
            </div>

            <div className="max-h-[calc(90vh-80px)] overflow-y-auto bg-slate-100 p-4">
              <div className="mb-4 rounded-2xl bg-white p-5">
                <h3 className="mb-4 text-lg font-extrabold text-slate-900">
                  Submitted Information
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <InfoBox label="Unique ID" value={previewFile.uniqueId} />
                  <InfoBox
                    label="Source"
                    value={getClientSource(previewFile)}
                  />
                  <InfoBox label="Status" value={getStatus(previewFile)} />
                  <InfoBox label="Full Name" value={getFullName(previewFile)} />
                  <InfoBox label="Email" value={previewFile.email} />
                  <InfoBox label="Phone" value={previewFile.phone} />
                  <InfoBox
                    label="Classification Type"
                    value={previewFile.classificationType}
                  />
                  <InfoBox label="Borrower Type" value={previewFile.borrowerType} />
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
                </div>

                {shouldShowReferrerDetails(previewFile) && (
                  <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5">
                    <h4 className="mb-3 text-sm font-extrabold text-slate-900">
                      {getDetailLabel(previewFile)} Details
                    </h4>

                    <div className="grid gap-4 md:grid-cols-3">
                      <InfoBox
                        label={`${getDetailLabel(previewFile)} Name`}
                        value={[
                          previewFile.referrer?.firstName,
                          previewFile.referrer?.middleName,
                          previewFile.referrer?.lastName,
                        ]
                          .filter(Boolean)
                          .join(' ')}
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

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <InfoBox label="Veda Issues" value={previewFile.vedaIssues} />
                  <InfoBox label="Conduct Issues" value={previewFile.conductIssues} />
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
                  <InfoBox label="Security Value" value={previewFile.securityValue} />
                  <InfoBox label="LVR" value={previewFile.lvr} />
                  <InfoBox
                    label="Anticipated Settlement Date"
                    value={previewFile.anticipatedSettlementDate}
                  />
                  <InfoBox label="Special Notes" value={previewFile.specialNotes} />
                </div>
              </div>

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
    </DashboardLayout>
  );
}
