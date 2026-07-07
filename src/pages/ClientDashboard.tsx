import { useMemo, useState } from 'react';
import {
  FaBriefcase,
  FaCheckCircle,
  FaCloudUploadAlt,
  FaDownload,
  FaCalendarAlt,
  FaEnvelope,
  FaExternalLinkAlt,
  FaExclamationTriangle,
  FaEye,
  FaFileAlt,
  FaFolderOpen,
  FaIdBadge,
  FaLock,
  FaPhoneAlt,
  FaSearch,
  FaSignOutAlt,
  FaTimes,
  FaUser,
  FaUserFriends,
} from 'react-icons/fa';

type Submission = {
  [key: string]: unknown;
  id: number;
  clientId?: number;
  uniqueId?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  name?: string;
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
  anticipatedSettlementDate?: string;

  vedaIssues?: string;
  conductIssues?: string;
  clientNeedsObjectives?: string;
  applicantBackground?: string;
  explanationOfIncome?: string;
  security?: string;
  loanAmount?: string | number;
  securityValue?: string | number;
  lvr?: string | number;
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
};

type ClientLoginUser = {
  [key: string]: unknown;
  id: number;
  uniqueId: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  leadType?: string;
  source?: string;
  status?: string;
};

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  'https://docsuploadpythonapi.azurewebsites.net/api'
).replace(/\/$/, '');

const CLIENTS_API = `${API_BASE}/clients`;
const UPLOAD_API = `${API_BASE}/uploadclient`;
const FILE_URL_API = `${API_BASE}/file-url`;
const CLIENT_LOGIN_API = `${API_BASE}/client-login`;

const documentTypes = [
  { label: 'ID', value: 'id' },
  { label: 'Property Documents', value: 'property-documents' },
  { label: 'Credit History', value: 'credit-history' },
  { label: 'Income Documents', value: 'income-documents' },
  { label: 'Other', value: 'other' },
];

const specialists = {
  giulio: {
    name: 'Giulio Avian',
    phone: '03 8696 6300',
    email: 'giulio@fundsnational.com',
    booking: 'https://calendly.com/giulio-4',
  },
  leo: {
    name: 'Leo Iermano',
    phone: '03 8696 6300',
    email: 'leo@sbrassist.com.au',
    booking: 'https://calendly.com/leo-sbrassist/',
  },
};

type SpecialistKey = keyof typeof specialists;

const getAliasValue = (
  record: Record<string, unknown> | null | undefined,
  aliases: string[],
) => {
  if (!record) return '';

  for (const key of aliases) {
    const value = record[key];

    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value;
    }
  }

  return '';
};

const toText = (value: unknown) => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

const normalizeNumberText = (value: unknown) => {
  const cleanValue = toText(value);
  return cleanValue;
};

const normalizeSourceValue = (value: unknown) => {
  const cleanValue = toText(value);

  if (!cleanValue) return '';

  const normalized = cleanValue.toLowerCase().replace(/_/g, '-').trim();

  if (normalized === 'broker') return 'Broker';
  if (normalized === 'referral' || normalized === 'referrer') return 'Referral';
  if (normalized === 'direct-client' || normalized === 'direct client' || normalized === 'directclient') {
    return 'Direct Client';
  }

  if (normalized === 'business-owner' || normalized === 'business owner') {
    return 'Broker';
  }

  return cleanValue
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const normalizeClientRecord = (client: Submission): Submission => {
  const source = normalizeSourceValue(
    getAliasValue(client, ['source', 'Source', 'applicationSource', 'ApplicationSource', 'leadType', 'LeadType']),
  );

  const referrer = (client.referrer || client.Referrer || {}) as Record<string, unknown>;

  return {
    ...client,
    id: Number(getAliasValue(client, ['id', 'Id', 'documentId', 'DocumentId', 'clientId', 'ClientId']) || client.id || 0),
    clientId: Number(getAliasValue(client, ['clientId', 'ClientId']) || client.clientId || client.id || 0),
    uniqueId: toText(getAliasValue(client, ['uniqueId', 'UniqueId'])),
    firstName: toText(getAliasValue(client, ['firstName', 'FirstName'])),
    middleName: toText(getAliasValue(client, ['middleName', 'MiddleName'])),
    lastName: toText(getAliasValue(client, ['lastName', 'LastName'])),
    name: toText(getAliasValue(client, ['name', 'Name', 'fullName', 'FullName'])),
    email: toText(getAliasValue(client, ['email', 'Email'])),
    phone: toText(getAliasValue(client, ['phone', 'Phone', 'mobile', 'Mobile'])),
    leadType: normalizeSourceValue(getAliasValue(client, ['leadType', 'LeadType', 'source', 'Source'])),
    source,
    status: toText(getAliasValue(client, ['status', 'Status'])) || 'Pending Team Call',

    classificationType: toText(getAliasValue(client, ['classificationType', 'ClassificationType', 'classification_type'])),
    borrowerType: toText(getAliasValue(client, ['borrowerType', 'BorrowerType', 'borrower_type'])),
    objective: toText(getAliasValue(client, ['objective', 'Objective'])),
    loanType: toText(getAliasValue(client, ['loanType', 'LoanType', 'loan_type'])),
    purpose: toText(getAliasValue(client, ['purpose', 'Purpose'])),
    transactionType: toText(getAliasValue(client, ['transactionType', 'TransactionType', 'transaction_type'])),
    withBorrowersGuarantors: toText(
      getAliasValue(client, [
        'withBorrowersGuarantors',
        'WithBorrowersGuarantors',
        'with_borrowers_guarantors',
        'with_borrowers__guarantors',
      ]),
    ),
    anticipatedSettlementDate: toText(
      getAliasValue(client, [
        'anticipatedSettlementDate',
        'AnticipatedSettlementDate',
        'anticipated_settlement_date',
        'settlementDate',
        'SettlementDate',
      ]),
    ),

    vedaIssues: toText(getAliasValue(client, ['vedaIssues', 'VedaIssues', 'veda_issues'])),
    conductIssues: toText(getAliasValue(client, ['conductIssues', 'ConductIssues', 'conduct_issues'])),
    clientNeedsObjectives: toText(
      getAliasValue(client, [
        'clientNeedsObjectives',
        'ClientNeedsObjectives',
        'client_needs_objectives',
        'clientNeedsAndObjectives',
      ]),
    ),
    applicantBackground: toText(getAliasValue(client, ['applicantBackground', 'ApplicantBackground', 'applicant_background'])),
    explanationOfIncome: toText(
      getAliasValue(client, ['explanationOfIncome', 'ExplanationOfIncome', 'explanation_of_income']),
    ),
    security: toText(getAliasValue(client, ['security', 'Security'])),
    loanAmount: normalizeNumberText(getAliasValue(client, ['loanAmount', 'LoanAmount', 'loan_amount'])),
    securityValue: normalizeNumberText(getAliasValue(client, ['securityValue', 'SecurityValue', 'security_value'])),
    lvr: normalizeNumberText(getAliasValue(client, ['lvr', 'Lvr', 'LVR'])),
    specialNotes: toText(getAliasValue(client, ['specialNotes', 'SpecialNotes', 'special_notes'])),

    referrer: {
      firstName: toText(getAliasValue(referrer, ['firstName', 'FirstName']) || getAliasValue(client, ['referrerFirstName', 'ReferrerFirstName'])),
      middleName: toText(getAliasValue(referrer, ['middleName', 'MiddleName']) || getAliasValue(client, ['referrerMiddleName', 'ReferrerMiddleName'])),
      lastName: toText(getAliasValue(referrer, ['lastName', 'LastName']) || getAliasValue(client, ['referrerLastName', 'ReferrerLastName'])),
      phone: toText(getAliasValue(referrer, ['phone', 'Phone']) || getAliasValue(client, ['referrerPhone', 'ReferrerPhone'])),
      email: toText(getAliasValue(referrer, ['email', 'Email']) || getAliasValue(client, ['referrerEmail', 'ReferrerEmail'])),
    },

    documentType: toText(getAliasValue(client, ['documentType', 'DocumentType'])),
    fileName: toText(getAliasValue(client, ['fileName', 'FileName'])),
    fileUrl: toText(getAliasValue(client, ['fileUrl', 'FileUrl', 'blobUrl', 'BlobUrl'])),
    submittedAt: toText(getAliasValue(client, ['submittedAt', 'SubmittedAt', 'uploadedAt', 'UploadedAt'])),
  };
};

const normalizeLoggedClient = (client: ClientLoginUser): ClientLoginUser => {
  const normalized = normalizeClientRecord({
    ...client,
    id: client.id,
  } as Submission);

  return {
    ...client,
    id: Number(normalized.clientId || normalized.id || client.id),
    uniqueId: normalized.uniqueId || client.uniqueId,
    firstName: normalized.firstName,
    middleName: normalized.middleName,
    lastName: normalized.lastName,
    name: normalized.name,
    email: normalized.email,
    phone: normalized.phone,
    leadType: normalized.leadType,
    source: normalized.source,
    status: normalized.status,
  };
};

export default function ClientDashboard() {
  const [loginUniqueId, setLoginUniqueId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loggedClient, setLoggedClient] = useState<ClientLoginUser | null>(null);

  const [uniqueId, setUniqueId] = useState('');
  const [fileSearch, setFileSearch] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [newFiles, setNewFiles] = useState<FileList | null>(null);
  const [clientFiles, setClientFiles] = useState<Submission[]>([]);
  const [previewFile, setPreviewFile] = useState<Submission | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedSpecialist, setSelectedSpecialist] = useState<SpecialistKey>('giulio');

  const specialist = specialists[selectedSpecialist];

  const selectedClient =
    clientFiles.find((client) => client.uniqueId && client.classificationType) ||
    clientFiles.find((client) => client.uniqueId) ||
    null;

  const uploadedFileRows = useMemo(
    () =>
      clientFiles.filter(
        (file) =>
          Boolean(file.fileUrl) ||
          Boolean(file.fileName) ||
          Boolean(file.documentType),
      ),
    [clientFiles],
  );

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

  const getFullName = (client: Submission | ClientLoginUser) =>
    (
      client.name ||
      `${client.firstName || ''} ${client.middleName || ''} ${client.lastName || ''}`
    )
      .replace(/\s+/g, ' ')
      .trim();

  const formatDocumentType = (type?: string) =>
    documentTypes.find((item) => item.value === type)?.label ||
    (type || 'document')
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  const formatLeadType = (type?: string | number | null) => normalizeSourceValue(type);

  const currentSource =
    formatLeadType(
      selectedClient?.source ||
        selectedClient?.leadType ||
        loggedClient?.source ||
        loggedClient?.leadType,
    ) || 'N/A';

  const showBrokerOrReferrer =
    currentSource === 'Broker' || currentSource === 'Referral';

  const detailLabel = currentSource === 'Broker' ? 'Broker' : 'Referrer';

  const displayValue = (value?: string | number | null) => {
    if (value === null || value === undefined || value === '') return 'N/A';
    return String(value);
  };

  const getClientStatus = () =>
    selectedClient?.status || loggedClient?.status || 'Pending Team Call';

  const uploadedDocumentTypes = useMemo(
    () =>
      Array.from(
        new Set(
          uploadedFileRows
            .map((file) => file.documentType?.toLowerCase())
            .filter(Boolean) as string[],
        ),
      ),
    [uploadedFileRows],
  );

  const missingDocumentTypes = useMemo(
    () =>
      documentTypes
        .map((item) => item.value)
        .filter((type) => !uploadedDocumentTypes.includes(type)),
    [uploadedDocumentTypes],
  );

  const documentProgress = Math.round(
    (uploadedDocumentTypes.length / documentTypes.length) * 100,
  );

  const isComplete = missingDocumentTypes.length === 0;

  const loadClientFiles = async (idValue = uniqueId) => {
    if (!idValue.trim()) {
      alert('Please enter your Client ID.');
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

      setClientFiles((result.clients || []).map(normalizeClientRecord));
      setFileSearch('');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to load files.');
    } finally {
      setLoading(false);
    }
  };

  const handleClientLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!loginUniqueId.trim()) {
      alert('Please enter your Client ID.');
      return;
    }

    if (!loginPassword.trim()) {
      alert('Please enter your password.');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(CLIENT_LOGIN_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uniqueId: loginUniqueId.trim(),
          password: loginPassword.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Invalid Client ID or password.');
      }

      const normalizedClient = normalizeLoggedClient(result.client);
      setLoggedClient(normalizedClient);
      setUniqueId(normalizedClient.uniqueId);
      await loadClientFiles(normalizedClient.uniqueId);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Client login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setLoggedClient(null);
    setLoginUniqueId('');
    setLoginPassword('');
    setUniqueId('');
    setFileSearch('');
    setDocumentType('');
    setNewFiles(null);
    setClientFiles([]);
    setPreviewFile(null);
    setPreviewUrl('');
  };

  const appendValue = (
    formData: FormData,
    key: string,
    value: string | number | undefined | null,
  ) => {
    formData.append(key, value === undefined || value === null ? '' : String(value));
  };

  const handleUpload = async () => {
    const cleanUniqueId = uniqueId.trim();
    const clientRecord = selectedClient;

    if (!loggedClient) {
      alert('Please login first.');
      return;
    }

    if (!cleanUniqueId) {
      alert('Client ID is missing.');
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

    if (!clientRecord) {
      alert('Client information is still loading. Please click Refresh My Files, then upload again.');
      return;
    }

    const requiredIntakeValues = [
      ['Phone', clientRecord.phone || loggedClient.phone],
      ['Source', clientRecord.source || clientRecord.leadType || loggedClient.source || loggedClient.leadType],
      ['Classification Type', clientRecord.classificationType],
      ['Borrower Type', clientRecord.borrowerType],
      ['Objective', clientRecord.objective],
      ['Loan Type', clientRecord.loanType],
      ['Purpose', clientRecord.purpose],
      ['Transaction Type', clientRecord.transactionType],
      ['Anticipated Settlement Date', clientRecord.anticipatedSettlementDate],
    ];

    const missingIntakeValues = requiredIntakeValues
      .filter(([, value]) => !toText(value))
      .map(([label]) => label);

    if (missingIntakeValues.length > 0) {
      alert(
        `Cannot upload yet because this client record is missing: ${missingIntakeValues.join(
          ', ',
        )}. Please refresh the page or check the original client submission.`,
      );
      return;
    }

    try {
      setLoading(true);

      for (const file of Array.from(newFiles)) {
        const formData = new FormData();

        appendValue(formData, 'uniqueId', cleanUniqueId);
        appendValue(
          formData,
          'leadType',
          clientRecord.leadType || loggedClient.leadType || currentSource,
        );
        appendValue(
          formData,
          'source',
          clientRecord.source || loggedClient.source || currentSource,
        );
        appendValue(formData, 'phone', clientRecord.phone || loggedClient.phone || '');
        appendValue(formData, 'firstName', clientRecord.firstName || loggedClient.firstName || '');
        appendValue(formData, 'middleName', clientRecord.middleName || loggedClient.middleName || '');
        appendValue(formData, 'lastName', clientRecord.lastName || loggedClient.lastName || '');
        appendValue(formData, 'email', clientRecord.email || loggedClient.email || '');

        appendValue(formData, 'classificationType', clientRecord.classificationType);
        appendValue(formData, 'borrowerType', clientRecord.borrowerType);
        appendValue(formData, 'objective', clientRecord.objective);
        appendValue(formData, 'loanType', clientRecord.loanType);
        appendValue(formData, 'purpose', clientRecord.purpose);
        appendValue(formData, 'transactionType', clientRecord.transactionType);
        appendValue(formData, 'withBorrowersGuarantors', clientRecord.withBorrowersGuarantors);
        appendValue(formData, 'anticipatedSettlementDate', clientRecord.anticipatedSettlementDate);

        appendValue(formData, 'vedaIssues', clientRecord.vedaIssues);
        appendValue(formData, 'conductIssues', clientRecord.conductIssues);
        appendValue(formData, 'clientNeedsObjectives', clientRecord.clientNeedsObjectives);
        appendValue(formData, 'applicantBackground', clientRecord.applicantBackground);
        appendValue(formData, 'explanationOfIncome', clientRecord.explanationOfIncome);
        appendValue(formData, 'security', clientRecord.security);
        appendValue(formData, 'loanAmount', clientRecord.loanAmount);
        appendValue(formData, 'securityValue', clientRecord.securityValue);
        appendValue(formData, 'lvr', clientRecord.lvr);
        appendValue(formData, 'specialNotes', clientRecord.specialNotes);

        appendValue(formData, 'referrerFirstName', clientRecord.referrer?.firstName);
        appendValue(formData, 'referrerMiddleName', clientRecord.referrer?.middleName);
        appendValue(formData, 'referrerLastName', clientRecord.referrer?.lastName);
        appendValue(formData, 'referrerPhone', clientRecord.referrer?.phone);
        appendValue(formData, 'referrerEmail', clientRecord.referrer?.email);

        appendValue(formData, 'documentType', documentType);
        formData.append('file', file);

        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 90000);

        try {
          const response = await fetch(UPLOAD_API, {
            method: 'POST',
            body: formData,
            signal: controller.signal,
          });

          const result = await response.json().catch(() => ({}));

          if (!response.ok || !result.success) {
            throw new Error(result.message || 'Upload failed.');
          }
        } finally {
          window.clearTimeout(timeout);
        }
      }

      setNewFiles(null);
      setDocumentType('');

      const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
      if (fileInput) fileInput.value = '';

      await loadClientFiles(cleanUniqueId);

      alert('File uploaded successfully to Azure.');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        alert('Upload timed out. Please check Azure/SQL if the file was saved, then try Refresh My Files.');
      } else {
        alert(error instanceof Error ? error.message : 'Upload failed.');
      }
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

  const filteredFiles = uploadedFileRows.filter((file) => {
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

  if (!loggedClient) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#219688]/10 via-[#6CBF51]/10 to-[#EE6521]/10 px-4 py-8 font-sans">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-3xl bg-white p-3 shadow-xl ring-1 ring-[#219688]/15">
              <img
                src="/logo/logo.png"
                alt="Company Logo"
                className="h-full w-full object-contain"
              />
            </div>

            <h1 className="text-3xl font-extrabold text-[#219688]">
              Client Portal Login
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Use your Client ID as username and your last name as password.
            </p>
          </div>

          <form onSubmit={handleClientLogin} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Client ID
              </label>

              <div className="relative">
                <FaIdBadge className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                <input
                  value={loginUniqueId}
                  onChange={(event) => setLoginUniqueId(event.target.value)}
                  placeholder="Example: CL-81BE533A"
                  className="h-12 w-full rounded-xl border border-slate-300 pl-12 pr-4 outline-none focus:border-[#219688] focus:ring-2 focus:ring-[#219688]/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Password
              </label>

              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                <input
                  type="password"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  placeholder="Enter your last name"
                  className="h-12 w-full rounded-xl border border-slate-300 pl-12 pr-4 outline-none focus:border-[#219688] focus:ring-2 focus:ring-[#219688]/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-xl bg-[#219688] font-bold text-white shadow-md hover:bg-[#176d63] disabled:bg-[#219688]/40"
            >
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            Example password: client last name only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#219688]/10 via-[#6CBF51]/10 to-[#EE6521]/10 px-4 py-8 font-sans">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-3xl bg-gradient-to-r from-[#219688] via-[#6CBF51] to-[#EE6521] p-8 text-white shadow-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-white p-3 shadow-xl">
                <img
                  src="/logo/logo.png"
                  alt="Company Logo"
                  className="h-full w-full object-contain"
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-bold uppercase tracking-[0.4em]">
                  Client Portal
                </p>

                <h1 className="text-4xl font-extrabold">Document Dashboard</h1>

                <p className="mt-4 text-white/90">
                  You are logged in as {getFullName(loggedClient) || uniqueId}.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white/20 px-5 text-sm font-bold text-white hover:bg-white/30"
            >
              <FaSignOutAlt />
              Logout
            </button>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-lg">
            <p className="text-xs font-bold uppercase text-slate-400">Source</p>
            <div className="mt-3 flex items-center gap-2 text-lg font-extrabold text-slate-900">
              {currentSource === 'Referral' ? (
                <FaUserFriends className="text-purple-600" />
              ) : (
                <FaBriefcase className="text-[#219688]" />
              )}
              {currentSource}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-lg">
            <p className="text-xs font-bold uppercase text-slate-400">Status</p>
            <p className="mt-3 rounded-full bg-[#EE6521]/10 px-3 py-1 text-sm font-extrabold text-[#c74f16]">
              {getClientStatus()}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-lg">
            <p className="text-xs font-bold uppercase text-slate-400">Documents</p>
            <p className="mt-3 text-2xl font-extrabold text-slate-900">
              {uploadedDocumentTypes.length}/{documentTypes.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-lg">
            <p className="text-xs font-bold uppercase text-slate-400">Progress</p>
            <p className="mt-3 text-2xl font-extrabold text-slate-900">
              {documentProgress}%
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <section className="rounded-3xl bg-white p-6 shadow-lg">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-[#219688]/10 p-3 text-[#219688]">
                  <FaSearch />
                </div>

                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">
                    Find Your Files
                  </h2>
                  <p className="text-sm text-slate-500">
                    Your files are loaded using your verified Client ID.
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Client ID
                  </label>

                  <div className="relative">
                    <FaIdBadge className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={uniqueId}
                      readOnly
                      className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 pl-12 pr-4 font-semibold text-slate-700 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => loadClientFiles()}
                  disabled={loading}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#219688] px-6 font-bold text-white shadow-md hover:bg-[#176d63] disabled:bg-[#219688]/40 md:w-fit"
                >
                  <FaFolderOpen />
                  {loading ? 'Loading...' : 'Refresh My Files'}
                </button>
              </div>
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-lg">
              <div className="flex items-center gap-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#219688]/10 text-[#176d63]">
                  <FaUser />
                </div>

                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">
                    {getFullName(selectedClient || loggedClient)}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Client ID: {selectedClient?.uniqueId || loggedClient.uniqueId}
                  </p>

                  <p className="text-sm text-slate-500">
                    Email: {selectedClient?.email || loggedClient.email || 'N/A'}
                  </p>

                  <p className="text-sm text-slate-500">
                    Phone: {selectedClient?.phone || loggedClient.phone || 'N/A'}
                  </p>
                </div>
              </div>
            </section>

            {selectedClient && (
              <section className="rounded-3xl bg-white p-6 shadow-lg">
                <h2 className="mb-5 text-xl font-extrabold text-slate-900">
                  Submitted Loan Information
                </h2>

                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    ['Source', currentSource],
                    ['Classification Type', selectedClient.classificationType],
                    ['Borrower Type', selectedClient.borrowerType],
                    ['Objective', selectedClient.objective],
                    ['Loan Type', selectedClient.loanType],
                    ['Purpose', selectedClient.purpose],
                    ['Transaction Type', selectedClient.transactionType],
                    [
                      'With borrowers / guarantors?',
                      selectedClient.withBorrowersGuarantors,
                    ],
                    [
                      'Anticipated Settlement Date',
                      selectedClient.anticipatedSettlementDate,
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <p className="text-xs font-bold uppercase text-slate-400">
                        {label}
                      </p>
                      <p className="mt-1 font-extrabold text-slate-900">
                        {displayValue(value)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 border-t border-slate-200 pt-6">
                  <h3 className="mb-4 text-lg font-extrabold uppercase tracking-wide text-slate-600">
                    Scenario Details
                  </h3>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {[
                      ['Veda Issues', selectedClient.vedaIssues],
                      ['Conduct Issues', selectedClient.conductIssues],
                      [
                        'Client Needs & Objectives',
                        selectedClient.clientNeedsObjectives,
                      ],
                      ['Applicant Background', selectedClient.applicantBackground],
                      [
                        'Explanation of Income',
                        selectedClient.explanationOfIncome,
                      ],
                      ['Security', selectedClient.security],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <p className="text-xs font-bold uppercase text-slate-400">
                          {label}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap font-extrabold text-slate-900">
                          {displayValue(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-200 pt-6">
                  <h3 className="mb-4 text-lg font-extrabold uppercase tracking-wide text-slate-600">
                    Loan Amount & Settlement
                  </h3>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[
                      ['Loan Amount', selectedClient.loanAmount],
                      ['Security Value', selectedClient.securityValue],
                      ['LVR', selectedClient.lvr],
                      [
                        'Anticipated Settlement Date',
                        selectedClient.anticipatedSettlementDate,
                      ],
                      ['Special Notes', selectedClient.specialNotes],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <p className="text-xs font-bold uppercase text-slate-400">
                          {label}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap font-extrabold text-slate-900">
                          {displayValue(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {showBrokerOrReferrer && (
                  <div className="mt-6 rounded-2xl border border-[#219688]/20 bg-[#219688]/5 p-5">
                    <h3 className="mb-4 text-lg font-extrabold text-slate-900">
                      {detailLabel} Details
                    </h3>

                    <div className="grid gap-4 md:grid-cols-2">
                      <p className="text-sm text-slate-700">
                        <strong>Name:</strong>{' '}
                        {[
                          selectedClient.referrer?.firstName,
                          selectedClient.referrer?.middleName,
                          selectedClient.referrer?.lastName,
                        ]
                          .filter(Boolean)
                          .join(' ') || 'N/A'}
                      </p>

                      <p className="text-sm text-slate-700">
                        <strong>Phone:</strong>{' '}
                        {selectedClient.referrer?.phone || 'N/A'}
                      </p>

                      <p className="text-sm text-slate-700 md:col-span-2">
                        <strong>Email:</strong>{' '}
                        {selectedClient.referrer?.email || 'N/A'}
                      </p>
                    </div>
                  </div>
                )}
              </section>
            )}

            <section className="rounded-3xl bg-white p-6 shadow-lg">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">
                    Document Checklist
                  </h2>
                  <p className="text-sm text-slate-500">
                    Outstanding and submitted documents for your portal.
                  </p>
                </div>

                <span
                  className={`rounded-full px-4 py-2 text-xs font-extrabold ${
                    isComplete
                      ? 'bg-[#6CBF51]/10 text-[#4f9a39]'
                      : 'bg-[#EE6521]/10 text-[#c74f16]'
                  }`}
                >
                  {isComplete ? 'Complete' : 'Incomplete'}
                </span>
              </div>

              <div className="mb-5 h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#219688]"
                  style={{ width: `${documentProgress}%` }}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-[#EE6521]/20 bg-[#EE6521]/5 p-4">
                  <h3 className="mb-3 flex items-center gap-2 font-extrabold text-[#c74f16]">
                    <FaExclamationTriangle />
                    Outstanding Documents
                  </h3>

                  <div className="space-y-2">
                    {missingDocumentTypes.length > 0 ? (
                      missingDocumentTypes.map((type) => (
                        <p
                          key={type}
                          className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#c74f16]"
                        >
                          {formatDocumentType(type)}
                        </p>
                      ))
                    ) : (
                      <p className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#4f9a39]">
                        No outstanding documents.
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-[#6CBF51]/20 bg-[#6CBF51]/5 p-4">
                  <h3 className="mb-3 flex items-center gap-2 font-extrabold text-[#4f9a39]">
                    <FaCheckCircle />
                    Submitted Documents
                  </h3>

                  <div className="space-y-2">
                    {uploadedDocumentTypes.length > 0 ? (
                      uploadedDocumentTypes.map((type) => (
                        <p
                          key={type}
                          className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#4f9a39]"
                        >
                          {formatDocumentType(type)}
                        </p>
                      ))
                    ) : (
                      <p className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-500">
                        No documents submitted yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>

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
                    className="h-12 w-full rounded-xl border border-slate-300 pl-12 pr-12 outline-none focus:border-[#219688] focus:ring-2 focus:ring-[#219688]/20"
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
                  <div className="rounded-2xl bg-[#EE6521]/10 p-3 text-[#EE6521]">
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
                          <span className="rounded-full bg-[#219688]/10 px-3 py-1 text-xs font-bold text-[#176d63]">
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
                              className="inline-flex items-center gap-2 rounded-lg bg-[#219688]/50 px-3 py-2 text-xs font-bold text-white hover:bg-[#219688]"
                            >
                              <FaEye />
                              View
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDownload(file)}
                              className="inline-flex items-center gap-2 rounded-lg bg-[#EE6521] px-3 py-2 text-xs font-bold text-white hover:bg-[#d95518]"
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
                          No files found for this Client ID.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-8 lg:h-fit">
            <section className="rounded-3xl bg-white p-6 shadow-lg">
              <div className="mb-5">
                <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-[#219688]">
                  Chat with Your Specialist
                </p>
                <h2 className="mt-2 text-xl font-extrabold text-slate-900">
                  Need Help?
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Choose a specialist below to call, email, or book a meeting.
                </p>
              </div>

              <label className="mb-2 block text-sm font-bold text-slate-700">
                Select Specialist
              </label>

              <select
                value={selectedSpecialist}
                onChange={(event) =>
                  setSelectedSpecialist(event.target.value as SpecialistKey)
                }
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#219688] focus:ring-2 focus:ring-[#219688]/20"
              >
                <option value="giulio">Giulio Avian</option>
                <option value="leo">Leo Iermano</option>
              </select>

              <div className="mt-5 rounded-2xl border border-[#219688]/15 bg-gradient-to-br from-[#219688]/10 via-[#6CBF51]/10 to-[#EE6521]/10 p-5">
                <div className="mb-5 flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#219688] text-xl font-extrabold text-white shadow-lg">
                    {specialist.name
                      .split(' ')
                      .map((namePart) => namePart.charAt(0))
                      .join('')
                      .slice(0, 2)}
                  </div>

                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">
                      {specialist.name}
                    </h3>
                    <p className="text-sm font-semibold text-slate-500">
                      Client Specialist
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <a
                    href={`tel:${specialist.phone.replace(/\s+/g, '')}`}
                    className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm hover:text-[#219688]"
                  >
                    <FaPhoneAlt className="text-[#219688]" />
                    <span>{specialist.phone}</span>
                  </a>

                  <a
                    href={`mailto:${specialist.email}`}
                    className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm hover:text-[#219688]"
                  >
                    <FaEnvelope className="text-[#6CBF51]" />
                    <span className="break-all">{specialist.email}</span>
                  </a>

                  <a
                    href={specialist.booking}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 rounded-xl bg-[#EE6521] px-4 py-3 text-sm font-extrabold text-white shadow-md hover:bg-[#d95518]"
                  >
                    <span className="inline-flex items-center gap-3">
                      <FaCalendarAlt />
                      Book a time
                    </span>
                    <FaExternalLinkAlt className="text-xs" />
                  </a>
                </div>
              </div>
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-lg">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-[#219688]/10 p-3 text-[#219688]">
                <FaCloudUploadAlt />
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Upload Files
                </h2>
                <p className="text-sm text-slate-500">
                  Upload additional files under your Client ID.
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
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-[#219688] focus:ring-2 focus:ring-[#219688]/20"
              >
                <option value="">Select document type</option>
                {documentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center hover:border-[#219688] hover:bg-[#219688]/5">
              <FaCloudUploadAlt className="mb-3 text-4xl text-[#219688]" />

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
              className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#219688] font-bold text-white shadow-md hover:bg-[#176d63] disabled:bg-[#219688]/40"
            >
              <FaCloudUploadAlt />
              {loading ? 'Uploading...' : 'Upload Documents'}
            </button>
            </section>
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
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#6CBF51] px-5 py-3 text-sm font-bold text-white hover:bg-[#5aa643]"
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