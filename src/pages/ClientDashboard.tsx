import { type ReactNode, useMemo, useState } from 'react';
import {
  FaBriefcase,
  FaCheckCircle,
  FaClock,
  FaCloudUploadAlt,
  FaDownload,
  FaCalendarAlt,
  FaEnvelope,
  FaExternalLinkAlt,
  FaExclamationTriangle,
  FaEye,
  FaEyeSlash,
  FaKey,
  FaFileAlt,
  FaFolderOpen,
  FaIdBadge,
  FaLock,
  FaPhoneAlt,
  FaSearch,
  FaSignOutAlt,
  FaTimes,
  FaUser,
  FaRedoAlt,
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
  documentStatus?: string;
  verifiedBy?: string;
  verifiedDate?: string;
  remarks?: string;
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
  mustChangePassword?: boolean;
};

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  'https://docsuploadpythonapi-flex.azurewebsites.net/api'
).replace(/\/$/, '');

const CLIENTS_API = `${API_BASE}/clients`;
const UPLOAD_API = `${API_BASE}/uploadclient`;
const FILE_URL_API = `${API_BASE}/file-url`;
const CLIENT_LOGIN_API = `${API_BASE}/client-login`;
const CLIENT_CHANGE_PASSWORD_API = `${API_BASE}/client-change-password`;

type DocumentOption = {
  label: string;
  value: string;
};

type NormalizedTransactionType = 'alt_doc' | 'full_doc';

const sharedDocumentTypes: DocumentOption[] = [
  {
    label: 'Last 6 Months Mortgage Statements',
    value: 'last-6-months-mortgage-statements',
  },
  { label: 'Council Rates Notice', value: 'council-rates-notice' },
];

const transactionDocumentTypes: Record<NormalizedTransactionType, DocumentOption[]> = {
  alt_doc: [
    { label: 'BAS from ATO Portal', value: 'bas-from-ato-portal' },
    {
      label: 'Business Banking Statements',
      value: 'business-banking-statements',
    },
    ...sharedDocumentTypes,
  ],
  full_doc: [
    { label: 'Payslip', value: 'payslip' },
    {
      label: 'Management Reports / Financial Statements',
      value: 'management-reports-financial-statements',
    },
    {
      label: 'Group Certificate / Payment Summary',
      value: 'group-certificate-payment-summary',
    },
    { label: 'Company Tax Returns', value: 'company-tax-returns' },
    { label: 'Individual Tax Returns', value: 'individual-tax-returns' },
    ...sharedDocumentTypes,
  ],
};

const allDocumentTypes = Object.values(transactionDocumentTypes).flat();

const normalizeTransactionType = (transactionType?: string): NormalizedTransactionType | '' => {
  const normalized = (transactionType || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (normalized === 'alt' || normalized === 'alt_doc' || normalized === 'altdoc') {
    return 'alt_doc';
  }

  if (normalized === 'full' || normalized === 'full_doc' || normalized === 'fulldoc') {
    return 'full_doc';
  }

  return '';
};

const getDocumentTypesForTransaction = (transactionType?: string): DocumentOption[] => {
  const normalizedTransactionType = normalizeTransactionType(transactionType);

  return normalizedTransactionType
    ? transactionDocumentTypes[normalizedTransactionType]
    : [];
};

const normalizeDocumentTypeValue = (documentType?: string) =>
  (documentType || '')
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/-+/g, '-');

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

type DocumentStatusType = 'Approved' | 'Rejected' | 'Pending' | 'Missing';

const approvedStatusValues = ['approved', 'verified', 'complete', 'completed'];
const rejectedStatusValues = ['rejected', 'declined', 'failed'];

const normalizeDocumentStatus = (status?: string | number | null): DocumentStatusType => {
  const normalized = toText(status).toLowerCase().replace(/_/g, '-').trim();

  if (approvedStatusValues.includes(normalized)) return 'Approved';
  if (rejectedStatusValues.includes(normalized)) return 'Rejected';
  if (!normalized || normalized === 'missing' || normalized === 'not-uploaded') return 'Missing';

  return 'Pending';
};

const getStatusStyles = (status: DocumentStatusType) => {
  if (status === 'Approved') {
    return 'border-[#6CBF51]/25 bg-[#6CBF51]/10 text-[#3f8430]';
  }

  if (status === 'Rejected') {
    return 'border-red-200 bg-red-50 text-red-700';
  }

  if (status === 'Pending') {
    return 'border-[#EE6521]/25 bg-[#EE6521]/10 text-[#c74f16]';
  }

  return 'border-slate-200 bg-slate-50 text-slate-500';
};

const getStatusIcon = (status: DocumentStatusType) => {
  if (status === 'Approved') return <FaCheckCircle />;
  if (status === 'Rejected') return <FaExclamationTriangle />;
  if (status === 'Pending') return <FaClock />;
  return <FaFileAlt />;
};

const isDocumentApproved = (status?: string | number | null) =>
  normalizeDocumentStatus(status) === 'Approved';

const isDocumentRejected = (status?: string | number | null) =>
  normalizeDocumentStatus(status) === 'Rejected';


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
    documentStatus: toText(
      getAliasValue(client, [
        'documentStatus',
        'DocumentStatus',
        'document_status',
        'verificationStatus',
        'VerificationStatus',
      ]),
    ) || 'Pending',
    verifiedBy: toText(getAliasValue(client, ['verifiedBy', 'VerifiedBy', 'verified_by'])),
    verifiedDate: toText(getAliasValue(client, ['verifiedDate', 'VerifiedDate', 'verified_date'])),
    remarks: toText(getAliasValue(client, ['remarks', 'Remarks', 'adminRemarks', 'AdminRemarks'])),
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
  const [showLoginPassword, setShowLoginPassword] = useState(false);
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

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const specialist = specialists[selectedSpecialist];

  const selectedClient =
    clientFiles.find((client) => client.uniqueId && client.classificationType) ||
    clientFiles.find((client) => client.uniqueId) ||
    null;

  const requiredDocumentTypes = useMemo(
    () => getDocumentTypesForTransaction(selectedClient?.transactionType),
    [selectedClient?.transactionType],
  );

  const requiredDocumentTypeValues = useMemo(
    () => requiredDocumentTypes.map((document) => document.value),
    [requiredDocumentTypes],
  );

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
    allDocumentTypes.find(
      (item) => item.value === normalizeDocumentTypeValue(type),
    )?.label ||
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

  const documentRowsByType = useMemo(() => {
    const map = new Map<string, Submission>();

    uploadedFileRows.forEach((file) => {
      const type = normalizeDocumentTypeValue(file.documentType);
      if (!type) return;

      if (!map.has(type)) {
        map.set(type, file);
        return;
      }

      const current = map.get(type);
      const currentStatus = normalizeDocumentStatus(current?.documentStatus);
      const nextStatus = normalizeDocumentStatus(file.documentStatus);

      const statusPriority: Record<DocumentStatusType, number> = {
        Approved: 4,
        Pending: 3,
        Rejected: 2,
        Missing: 1,
      };

      const currentPriority = statusPriority[currentStatus];
      const nextPriority = statusPriority[nextStatus];

      const currentId = Number(current?.id || 0);
      const nextId = Number(file.id || 0);

      if (
        nextPriority > currentPriority ||
        (nextPriority === currentPriority && nextId > currentId)
      ) {
        map.set(type, file);
      }
    });

    return map;
  }, [uploadedFileRows]);

  const uploadedDocumentTypes = useMemo(
    () => requiredDocumentTypeValues.filter((type) => documentRowsByType.has(type)),
    [documentRowsByType, requiredDocumentTypeValues],
  );

  const approvedDocumentTypes = useMemo(
    () =>
      requiredDocumentTypeValues.filter((type) =>
        isDocumentApproved(documentRowsByType.get(type)?.documentStatus),
      ),
    [documentRowsByType, requiredDocumentTypeValues],
  );

  const rejectedDocumentTypes = useMemo(
    () =>
      requiredDocumentTypeValues.filter((type) =>
        isDocumentRejected(documentRowsByType.get(type)?.documentStatus),
      ),
    [documentRowsByType, requiredDocumentTypeValues],
  );

  const pendingDocumentTypes = useMemo(
    () =>
      requiredDocumentTypeValues.filter(
        (type) =>
          normalizeDocumentStatus(documentRowsByType.get(type)?.documentStatus) === 'Pending',
      ),
    [documentRowsByType, requiredDocumentTypeValues],
  );

  const missingDocumentTypes = useMemo(
    () =>
      requiredDocumentTypeValues.filter(
        (type) => !approvedDocumentTypes.includes(type),
      ),
    [approvedDocumentTypes, requiredDocumentTypeValues],
  );

  const documentProgress = requiredDocumentTypes.length
    ? Math.round(
        (approvedDocumentTypes.length / requiredDocumentTypes.length) * 100,
      )
    : 0;

  const isComplete =
    requiredDocumentTypes.length > 0 &&
    approvedDocumentTypes.length === requiredDocumentTypes.length;

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
      const requiresPasswordChange = Boolean(
        result.mustChangePassword ||
          result.client?.mustChangePassword ||
          normalizedClient.mustChangePassword,
      );

      setLoggedClient(normalizedClient);
      setUniqueId(normalizedClient.uniqueId);
      setMustChangePassword(requiresPasswordChange);
      setShowChangePassword(requiresPasswordChange);
      setCurrentPassword(loginPassword.trim());
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
    setShowLoginPassword(false);
    setUniqueId('');
    setFileSearch('');
    setDocumentType('');
    setNewFiles(null);
    setClientFiles([]);
    setPreviewFile(null);
    setPreviewUrl('');
    setShowChangePassword(false);
    setMustChangePassword(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const resetPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const closeChangePasswordModal = () => {
    if (mustChangePassword || passwordLoading) return;
    resetPasswordForm();
    setShowChangePassword(false);
  };

  const handleChangePassword = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!loggedClient) {
      alert('Please log in again.');
      return;
    }

    if (!currentPassword.trim()) {
      alert('Please enter your current password.');
      return;
    }

    if (newPassword.length < 8) {
      alert('Your new password must contain at least 8 characters.');
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      alert('Your new password must contain at least one uppercase letter.');
      return;
    }

    if (!/[a-z]/.test(newPassword)) {
      alert('Your new password must contain at least one lowercase letter.');
      return;
    }

    if (!/\d/.test(newPassword)) {
      alert('Your new password must contain at least one number.');
      return;
    }

    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      alert('Your new password must contain at least one special character.');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('The new passwords do not match.');
      return;
    }

    if (currentPassword === newPassword) {
      alert('Your new password must be different from your current password.');
      return;
    }

    try {
      setPasswordLoading(true);

      const response = await fetch(CLIENT_CHANGE_PASSWORD_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uniqueId: loggedClient.uniqueId,
          currentPassword: currentPassword.trim(),
          newPassword,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Unable to change password.');
      }

      setMustChangePassword(false);
      setShowChangePassword(false);
      resetPasswordForm();

      alert(
        result.emailNotificationSent
          ? 'Password changed successfully. A confirmation email has been sent.'
          : 'Password changed successfully.',
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Unable to change password.',
      );
    } finally {
      setPasswordLoading(false);
    }
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

    const selectedDocumentType = normalizeDocumentTypeValue(documentType);

    if (!newFiles?.length) {
      alert('Please choose file/s.');
      return;
    }

    const currentDocument = documentRowsByType.get(selectedDocumentType);

    if (currentDocument && isDocumentApproved(currentDocument.documentStatus)) {
      alert('This document type is already approved. Please contact the admin if you need to replace it.');
      return;
    }

    const isRejectedReupload =
      currentDocument && isDocumentRejected(currentDocument.documentStatus);

    if (!clientRecord) {
      alert('Client information is still loading. Please click Refresh My Files, then upload again.');
      return;
    }

    const allowedDocumentTypes = getDocumentTypesForTransaction(
      clientRecord.transactionType,
    );

    if (allowedDocumentTypes.length === 0) {
      alert(
        'This client does not have a supported Transaction Type. Please contact the administrator before uploading.',
      );
      return;
    }

    if (
      !allowedDocumentTypes.some(
        (document) => document.value === selectedDocumentType,
      )
    ) {
      alert(
        `The selected document type is not valid for ${clientRecord.transactionType}. Please select a document from the current checklist.`,
      );
      setDocumentType('');
      setNewFiles(null);
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

        appendValue(formData, 'documentType', selectedDocumentType);
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

      alert(
        isRejectedReupload
          ? 'Rejected file replaced successfully. The new uploaded file is now Pending Review.'
          : 'File uploaded successfully to Azure.',
      );
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

  const handleStartReupload = (file: Submission) => {
    if (!file.documentType) {
      alert('Document type is missing for this rejected file.');
      return;
    }

    const selectedDocumentType = normalizeDocumentTypeValue(file.documentType);

    if (!requiredDocumentTypeValues.includes(selectedDocumentType)) {
      alert(
        'This document is not part of the current transaction checklist. Please refresh your files or contact the administrator.',
      );
      return;
    }

    if (!isDocumentRejected(file.documentStatus)) {
      alert('Only rejected documents can be re-uploaded here.');
      return;
    }

    setDocumentType(selectedDocumentType);

    window.setTimeout(() => {
      document
        .getElementById('client-upload-files-card')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
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

  const sectionClass =
    'rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.06)] sm:p-6';

  const fieldCardClass =
    'min-w-0 rounded-xl border border-slate-200 bg-slate-50/80 p-4 transition hover:border-[#259b8f]/25 hover:bg-white';

  const StatCard = ({
    label,
    value,
    className,
    icon,
  }: {
    label: string;
    value: string | number;
    className: string;
    icon?: ReactNode;
  }) => (
    <div
      className={`rounded-2xl border p-4 shadow-[0_14px_34px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(15,23,42,0.1)] ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-wide opacity-80">
          {label}
        </p>
        {icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/70 text-base shadow-sm">
            {icon}
          </span>
        )}
      </div>
      <p className="mt-4 break-words text-2xl font-black leading-none sm:text-3xl">
        {value}
      </p>
    </div>
  );

  if (!loggedClient) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#eef8f6] px-4 py-8 font-sans text-slate-900 sm:px-6">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(37,155,143,0.22),rgba(255,255,255,0.72)_42%,rgba(238,101,33,0.13)),radial-gradient(circle_at_18%_18%,rgba(37,155,143,0.24),transparent_30%),radial-gradient(circle_at_82%_78%,rgba(238,101,33,0.2),transparent_28%)]" />
        <div className="absolute inset-0 opacity-[0.24] [background-image:linear-gradient(rgba(15,23,42,0.09)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.09)_1px,transparent_1px)] [background-size:42px_42px]" />

        <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.18)] ring-1 ring-white/70 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="hidden bg-slate-950 p-8 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-3 shadow-lg">
                <img
                  src="/logo/logo.png"
                  alt="Company Logo"
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="mt-10">
                <p className="text-xs font-black uppercase tracking-[0.26em] text-[#6CBF51]">
                  Client Portal
                </p>
                <h1 className="mt-4 text-4xl font-black leading-tight">
                  Your documents, neatly in one place.
                </h1>
                <p className="mt-4 text-sm leading-6 text-slate-300">
                  Sign in to review your checklist, upload missing files, and track document status.
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                <p className="text-sm font-bold text-white">Secure upload access</p>
                <p className="mt-1 text-xs leading-5 text-slate-300">
                  Files are linked to your verified Client ID.
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                <p className="text-sm font-bold text-white">Password updates</p>
                <p className="mt-1 text-xs leading-5 text-slate-300">
                  Change your password after sign in from the dashboard header.
                </p>
              </div>
            </div>
          </div>

          <div className="px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
            <div className="mb-7 flex items-center gap-4 lg:hidden">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white p-2 shadow-md ring-1 ring-slate-200">
                <img
                  src="/logo/logo.png"
                  alt="Company Logo"
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#259b8f]">
                  Client Portal
                </p>
                <h1 className="text-2xl font-black text-slate-950">
                  Sign in
                </h1>
              </div>
            </div>

            <div className="hidden lg:block">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#259b8f]">
                Welcome Back
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">
                Sign in to continue
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Use your Client ID and password to open your document dashboard.
              </p>
            </div>

            <form onSubmit={handleClientLogin} className="mt-7 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Client ID
                </label>

                <div className="relative">
                  <FaIdBadge className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                  <input
                    value={loginUniqueId}
                    onChange={(event) => setLoginUniqueId(event.target.value)}
                    placeholder="Example: CL-81BE533A"
                    className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#259b8f] focus:ring-4 focus:ring-[#259b8f]/15"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Password
                </label>

                <div className="relative">
                  <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(event) => setLoginPassword(event.target.value)}
                    placeholder="Enter your password"
                    className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-12 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#259b8f] focus:ring-4 focus:ring-[#259b8f]/15"
                  />

                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-xl bg-[#259b8f] text-sm font-black text-white shadow-[0_14px_24px_rgba(37,155,143,0.24)] transition hover:bg-[#1f887d] disabled:bg-[#259b8f]/40"
              >
                {loading ? 'Signing in...' : 'Login'}
              </button>
            </form>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                First time signing in?
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Your temporary password is usually your last name. You can change it after login.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eef8f6] px-3 py-4 font-sans text-slate-900 sm:px-4 sm:py-8">
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(135deg,rgba(37,155,143,0.16),rgba(255,255,255,0.88)_38%,rgba(238,101,33,0.1)),radial-gradient(circle_at_12%_16%,rgba(37,155,143,0.22),transparent_28%),radial-gradient(circle_at_86%_12%,rgba(108,191,81,0.16),transparent_26%),radial-gradient(circle_at_72%_88%,rgba(238,101,33,0.14),transparent_30%)]" />
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="overflow-hidden rounded-3xl bg-slate-950 shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
          <div className="bg-[linear-gradient(135deg,rgba(37,155,143,0.92),rgba(15,23,42,0.98)_54%,rgba(238,101,33,0.88))] p-5 text-white sm:p-6 lg:p-7">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white p-3 shadow-[0_18px_40px_rgba(0,0,0,0.18)] sm:h-24 sm:w-24">
                  <img
                    src="/logo/logo.png"
                    alt="Company Logo"
                    className="h-full w-full object-contain"
                  />
                </div>

                <div className="min-w-0">
                  <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-white/70 sm:text-sm">
                    Client Portal
                  </p>

                  <h1 className="text-3xl font-black text-white sm:text-4xl">
                    Document Dashboard
                  </h1>

                  <p className="mt-3 break-words text-sm font-medium text-white/75 sm:text-base">
                    You are logged in as {getFullName(loggedClient) || uniqueId}.
                  </p>

                  <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                    <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-bold text-white ring-1 ring-white/15">
                      {currentSource}
                    </span>
                    <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-bold text-white ring-1 ring-white/15">
                      {approvedDocumentTypes.length}/{requiredDocumentTypes.length} approved
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${
                        isComplete
                          ? 'bg-[#6CBF51]/20 text-[#d9ffd1] ring-[#6CBF51]/30'
                          : 'bg-[#EE6521]/20 text-orange-100 ring-[#EE6521]/30'
                      }`}
                    >
                      {isComplete ? 'Complete' : 'Action needed'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setShowChangePassword(true);
                  }}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-slate-950 shadow-sm hover:bg-slate-100"
                >
                  <FaKey />
                  Change Password
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white/10 px-5 text-sm font-bold text-white ring-1 ring-white/15 hover:bg-white/15"
                >
                  <FaSignOutAlt />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-6">
          <StatCard
            label="Source"
            value={currentSource}
            className="border-cyan-200/80 bg-white text-cyan-700"
            icon={
              currentSource === 'Referral' ? <FaUserFriends /> : <FaBriefcase />
            }
          />
          <StatCard
            label="Approved Docs"
            value={approvedDocumentTypes.length}
            className="border-green-200/80 bg-white text-green-700"
            icon={<FaCheckCircle />}
          />
          <StatCard
            label="Pending Docs"
            value={pendingDocumentTypes.length}
            className="border-orange-200/80 bg-white text-orange-700"
            icon={<FaClock />}
          />
          <StatCard
            label="Rejected Docs"
            value={rejectedDocumentTypes.length}
            className="border-red-200/80 bg-white text-red-700"
            icon={<FaExclamationTriangle />}
          />
          <StatCard
            label="Required Docs"
            value={`${approvedDocumentTypes.length}/${requiredDocumentTypes.length}`}
            className="border-slate-200/80 bg-white text-slate-900"
            icon={<FaFileAlt />}
          />
          <StatCard
            label="Progress"
            value={`${documentProgress}%`}
            className="border-emerald-200/80 bg-white text-emerald-700"
            icon={<FaCheckCircle />}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <section className={sectionClass}>
              <div className="mb-5 flex items-start gap-3 sm:items-center">
                <div className="rounded-2xl bg-cyan-50 p-3 text-cyan-700 ring-1 ring-cyan-100">
                  <FaSearch />
                </div>

                <div className="min-w-0">
                  <h2 className="text-xl font-black text-slate-900">
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
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 font-semibold text-slate-700 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => loadClientFiles()}
                  disabled={loading}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 font-bold text-white shadow-sm hover:bg-slate-800 disabled:bg-slate-300 md:w-fit"
                >
                  <FaFolderOpen />
                  {loading ? 'Loading...' : 'Refresh My Files'}
                </button>
              </div>
            </section>

            <section className={sectionClass}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100 sm:h-16 sm:w-16">
                  <FaUser />
                </div>

                <div className="min-w-0">
                  <h2 className="break-words text-xl font-black text-slate-900">
                    {getFullName(selectedClient || loggedClient)}
                  </h2>

                  <p className="mt-1 break-words text-sm text-slate-500">
                    Client ID: {selectedClient?.uniqueId || loggedClient.uniqueId}
                  </p>

                  <p className="break-words text-sm text-slate-500">
                    Email: {selectedClient?.email || loggedClient.email || 'N/A'}
                  </p>

                  <p className="break-words text-sm text-slate-500">
                    Phone: {selectedClient?.phone || loggedClient.phone || 'N/A'}
                  </p>
                </div>
              </div>
            </section>

            {selectedClient && (
              <section className={sectionClass}>
                <h2 className="mb-5 text-xl font-black text-slate-900">
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
                      className={fieldCardClass}
                    >
                      <p className="text-xs font-bold uppercase text-slate-400">
                        {label}
                      </p>
                      <p className="mt-1 break-words font-bold text-slate-900">
                        {displayValue(value)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 border-t border-slate-200 pt-6">
                  <h3 className="mb-4 text-lg font-black uppercase tracking-wide text-slate-600">
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
                        className={fieldCardClass}
                      >
                        <p className="text-xs font-bold uppercase text-slate-400">
                          {label}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap break-words font-bold text-slate-900">
                          {displayValue(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-200 pt-6">
                  <h3 className="mb-4 text-lg font-black uppercase tracking-wide text-slate-600">
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
                        className={fieldCardClass}
                      >
                        <p className="text-xs font-bold uppercase text-slate-400">
                          {label}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap break-words font-bold text-slate-900">
                          {displayValue(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {showBrokerOrReferrer && (
                  <div className="mt-6 rounded-2xl border border-cyan-200 bg-cyan-50/80 p-5">
                    <h3 className="mb-4 text-lg font-black text-slate-900">
                      {detailLabel} Details
                    </h3>

                    <div className="grid gap-4 md:grid-cols-2">
                      <p className="break-words text-sm text-slate-700">
                        <strong>Name:</strong>{' '}
                        {[
                          selectedClient.referrer?.firstName,
                          selectedClient.referrer?.middleName,
                          selectedClient.referrer?.lastName,
                        ]
                          .filter(Boolean)
                          .join(' ') || 'N/A'}
                      </p>

                      <p className="break-words text-sm text-slate-700">
                        <strong>Phone:</strong>{' '}
                        {selectedClient.referrer?.phone || 'N/A'}
                      </p>

                      <p className="break-words text-sm text-slate-700 md:col-span-2">
                        <strong>Email:</strong>{' '}
                        {selectedClient.referrer?.email || 'N/A'}
                      </p>
                    </div>
                  </div>
                )}
              </section>
            )}

            <section className={sectionClass}>
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-xl font-black text-slate-900">
                    Document Checklist
                  </h2>
                  <p className="text-sm text-slate-500">
                    {selectedClient?.transactionType
                      ? `Required documents for ${selectedClient.transactionType}.`
                      : 'The checklist will appear after a Transaction Type is assigned.'}
                  </p>
                </div>

                <span
                  className={`w-fit rounded-full px-4 py-2 text-xs font-extrabold ${
                    isComplete
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {requiredDocumentTypes.length === 0
                    ? 'Unavailable'
                    : isComplete
                      ? 'Complete'
                      : 'Incomplete'}
                </span>
              </div>

              <div className="mb-5 h-3 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/80">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#259b8f,#6CBF51,#EE6521)]"
                  style={{ width: `${documentProgress}%` }}
                />
              </div>

              <div className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-3">
                <p className="rounded-xl bg-white px-3 py-2 text-sm font-black text-green-700 shadow-sm">
                  Approved: {approvedDocumentTypes.length}
                </p>
                <p className="rounded-xl bg-white px-3 py-2 text-sm font-black text-orange-700 shadow-sm">
                  Pending: {pendingDocumentTypes.length}
                </p>
                <p className="rounded-xl bg-white px-3 py-2 text-sm font-black text-red-700 shadow-sm">
                  Rejected: {rejectedDocumentTypes.length}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-orange-200 bg-orange-50/90 p-4">
                  <h3 className="mb-3 flex items-center gap-2 font-black text-orange-700">
                    <FaExclamationTriangle />
                    Outstanding Documents
                  </h3>

                  <div className="space-y-2">
                    {requiredDocumentTypes.length === 0 ? (
                      <p className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-red-700">
                        Transaction Type is missing or unsupported.
                      </p>
                    ) : missingDocumentTypes.length > 0 ? (
                      missingDocumentTypes.map((type) => (
                        <p
                          key={type}
                          className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-orange-700"
                        >
                          {formatDocumentType(type)}
                        </p>
                      ))
                    ) : (
                      <p className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-green-700">
                        No outstanding documents.
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-green-200 bg-green-50/90 p-4">
                  <h3 className="mb-3 flex items-center gap-2 font-black text-green-700">
                    <FaCheckCircle />
                    Submitted Documents
                  </h3>

                  <div className="space-y-2">
                    {uploadedDocumentTypes.length > 0 ? (
                      uploadedDocumentTypes.map((type) => (
                        <p
                          key={type}
                          className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-green-700"
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

                {rejectedDocumentTypes.length > 0 && (
                  <div className="rounded-2xl border border-red-200 bg-red-50/90 p-4 md:col-span-2">
                    <h3 className="mb-3 flex items-center gap-2 font-extrabold text-red-700">
                      <FaExclamationTriangle />
                      Rejected Documents - Re-upload Required
                    </h3>

                    <div className="space-y-2">
                      {rejectedDocumentTypes.map((type) => {
                        const rejectedFile = documentRowsByType.get(type);

                        return (
                          <div
                            key={type}
                            className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-red-700"
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <span>{formatDocumentType(type)}</span>

                              {rejectedFile && (
                                <button
                                  type="button"
                                  onClick={() => handleStartReupload(rejectedFile)}
                                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700"
                                >
                                  <FaRedoAlt />
                                  Re-upload
                                </button>
                              )}
                            </div>

                            {rejectedFile?.remarks && (
                              <p className="mt-2 whitespace-pre-wrap text-xs font-semibold text-red-600">
                                Remarks: {rejectedFile.remarks}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {clientFiles.length > 0 && (
              <section className={sectionClass}>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Search Files
                </label>

                <div className="relative">
                  <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={fileSearch}
                    onChange={(event) => setFileSearch(event.target.value)}
                    placeholder="Search by file name or document type"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-12 text-sm outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100"
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

            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-4 py-5 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-orange-50 p-3 text-orange-600 ring-1 ring-orange-100">
                    <FaFileAlt />
                  </div>

                  <div>
                    <h2 className="text-xl font-black text-slate-900">
                      My Files
                    </h2>
                    <p className="text-sm text-slate-500">
                      {filteredFiles.length} file
                      {filteredFiles.length !== 1 ? 's' : ''} found.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 md:overflow-x-auto md:p-0">
                <table className="block w-full md:table md:min-w-[980px]">
                  <thead className="hidden bg-slate-50/90 md:table-header-group">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-wide text-slate-600">
                        File Name
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-wide text-slate-600">
                        Document Type
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-wide text-slate-600">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-wide text-slate-600">
                        Submitted
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-black uppercase tracking-wide text-slate-600">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="block space-y-3 md:table-row-group md:space-y-0">
                    {filteredFiles.map((file) => (
                      <tr
                        key={`${file.id}-${file.fileName}`}
                        className="block rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:bg-slate-50 md:table-row md:rounded-none md:border-x-0 md:border-b-0 md:shadow-none"
                      >
                        <td className="block px-4 py-4 md:table-cell md:px-6">
                          <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-slate-100 p-3 text-slate-600 ring-1 ring-slate-200">
                              <FaFileAlt />
                            </div>

                            <div className="min-w-0">
                              <p className="break-words font-black text-slate-900">
                                {file.fileName || 'No file name'}
                              </p>
                              <p className="break-words text-xs text-slate-500">
                                ID: {file.uniqueId}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="block px-4 pb-3 md:table-cell md:px-6 md:py-4">
                          <span className="inline-flex rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold text-cyan-700">
                            {formatDocumentType(file.documentType)}
                          </span>
                        </td>

                        <td className="block px-4 pb-3 md:table-cell md:px-6 md:py-4">
                          {(() => {
                            const status = normalizeDocumentStatus(file.documentStatus);
                            return (
                              <div className="space-y-2">
                                <span
                                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-extrabold ${getStatusStyles(status)}`}
                                >
                                  {getStatusIcon(status)}
                                  {status === 'Pending' ? 'Pending Review' : status}
                                </span>

                                {file.remarks && (
                                  <p className="max-w-full whitespace-pre-wrap break-words text-xs font-semibold text-slate-500 md:max-w-[260px]">
                                    Remarks: {file.remarks}
                                  </p>
                                )}
                              </div>
                            );
                          })()}
                        </td>

                        <td className="block px-4 pb-3 text-sm text-slate-600 md:table-cell md:px-6 md:py-4">
                          {file.submittedAt || 'N/A'}
                        </td>

                        <td className="block px-4 pb-4 md:table-cell md:px-6 md:py-4">
                          <div className="grid gap-2 sm:grid-cols-2 md:flex md:justify-center">
                            <button
                              type="button"
                              onClick={() => handlePreview(file)}
                              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-3 py-2 text-xs font-bold text-white hover:bg-blue-600"
                            >
                              <FaEye />
                              View
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDownload(file)}
                              className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-3 py-2 text-xs font-bold text-white hover:bg-orange-600"
                            >
                              <FaDownload />
                              Download
                            </button>

                            {isDocumentRejected(file.documentStatus) && (
                              <button
                                type="button"
                                onClick={() => handleStartReupload(file)}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700 sm:col-span-2 md:col-span-1"
                              >
                                <FaRedoAlt />
                                Re-upload
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredFiles.length === 0 && (
                      <tr className="block md:table-row">
                        <td
                          colSpan={5}
                          className="block px-6 py-12 text-center text-sm text-slate-500 md:table-cell"
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

          <aside className="space-y-6 xl:sticky xl:top-8 xl:h-fit">
            <section className={sectionClass}>
              <div className="mb-5">
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#219688] sm:tracking-[0.25em]">
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
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100"
              >
                <option value="giulio">Giulio Avian</option>
                <option value="leo">Leo Iermano</option>
              </select>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
                <div className="mb-5 flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#259b8f,#0f172a)] text-xl font-black text-white shadow-sm">
                    {specialist.name
                      .split(' ')
                      .map((namePart) => namePart.charAt(0))
                      .join('')
                      .slice(0, 2)}
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-slate-900">
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
                    className="flex min-w-0 items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:text-cyan-700"
                  >
                    <FaPhoneAlt className="text-cyan-700" />
                    <span>{specialist.phone}</span>
                  </a>

                  <a
                    href={`mailto:${specialist.email}`}
                    className="flex min-w-0 items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:text-cyan-700"
                  >
                    <FaEnvelope className="text-green-600" />
                    <span className="break-all">{specialist.email}</span>
                  </a>

                  <a
                    href={specialist.booking}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-w-0 items-center justify-between gap-3 rounded-xl bg-[#EE6521] px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-600"
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

            <section id="client-upload-files-card" className={sectionClass}>
              <div className="mb-5 flex items-start gap-3 sm:items-center">
                <div className="rounded-2xl bg-cyan-50 p-3 text-cyan-700 ring-1 ring-cyan-100">
                  <FaCloudUploadAlt />
                </div>

                <div className="min-w-0">
                  <h2 className="text-xl font-black text-slate-900">
                    Upload Files
                  </h2>
                  <p className="text-sm text-slate-500">
                    Upload missing documents or replace rejected files under your Client ID.
                  </p>
                </div>
              </div>

              <div className="mb-4">
                {selectedClient?.transactionType ? (
                  <div className="mb-4 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-800">
                    Showing the required documents for{' '}
                    <strong>{selectedClient.transactionType}</strong>.
                  </div>
                ) : (
                  <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    Transaction Type is missing. Document uploads are unavailable until the client record is updated.
                  </div>
                )}

                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Document Type
                </label>

                <select
                  value={documentType}
                  onChange={(event) => setDocumentType(event.target.value)}
                  disabled={requiredDocumentTypes.length === 0}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100"
                >
                  <option value="">
                    {requiredDocumentTypes.length > 0
                      ? 'Select document type'
                      : 'No document types available'}
                  </option>
                  {requiredDocumentTypes.map((type) => {
                    const file = documentRowsByType.get(type.value);
                    const status = file ? normalizeDocumentStatus(file.documentStatus) : 'Missing';
                    const isApproved = status === 'Approved';

                    return (
                      <option key={type.value} value={type.value} disabled={isApproved}>
                        {type.label}
                        {isApproved
                          ? ' (Approved)'
                          : status === 'Rejected'
                            ? ' (Rejected - re-upload)'
                            : status === 'Pending'
                              ? ' (Pending Review)'
                              : ''}
                      </option>
                    );
                  })}
                </select>
                {documentType &&
                  isDocumentRejected(documentRowsByType.get(documentType)?.documentStatus) && (
                    <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
                      This document was rejected. Choose a new file below to re-upload it.
                    </p>
                  )}

                {documentType && documentRowsByType.get(documentType)?.remarks && (
                  <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
                    Admin remarks: {documentRowsByType.get(documentType)?.remarks}
                  </p>
                )}
              </div>

              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/80 p-6 text-center transition hover:border-orange-400 hover:bg-orange-50 sm:p-8">
                <FaCloudUploadAlt className="mb-3 text-3xl text-cyan-700 sm:text-4xl" />

                <span className="font-bold text-slate-800">Choose files</span>
                <span className="mt-1 text-sm text-slate-500">
                  PDF, JPG, PNG, DOCX
                </span>

                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  disabled={!documentType || requiredDocumentTypes.length === 0}
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
                disabled={
                  loading ||
                  requiredDocumentTypes.length === 0 ||
                  !documentType ||
                  !newFiles?.length
                }
                className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:bg-slate-300"
              >
                <FaCloudUploadAlt />
                {loading
                  ? 'Uploading...'
                  : documentType &&
                      isDocumentRejected(documentRowsByType.get(documentType)?.documentStatus)
                    ? 'Re-upload Rejected Document'
                    : 'Upload Documents'}
              </button>
            </section>
          </aside>
        </div>
      </div>

      {showChangePassword && loggedClient && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/70 px-3 py-4 sm:px-4">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-7">
              <div>
                <div className="mb-3 inline-flex rounded-2xl bg-[#259b8f]/10 p-3 text-[#259b8f]">
                  <FaKey />
                </div>
                <h2 className="text-2xl font-black text-slate-950">
                  {mustChangePassword
                    ? 'Create Your New Password'
                    : 'Change Password'}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {mustChangePassword
                    ? 'For your security, you must replace your temporary password before continuing.'
                    : 'Use a strong password that you do not use on another account.'}
                </p>
              </div>

              {!mustChangePassword && (
                <button
                  type="button"
                  onClick={closeChangePasswordModal}
                  disabled={passwordLoading}
                  className="rounded-xl bg-slate-100 p-3 text-slate-500 hover:bg-slate-200 disabled:opacity-50"
                  aria-label="Close change password"
                >
                  <FaTimes />
                </button>
              )}
            </div>

            <form onSubmit={handleChangePassword} className="space-y-5 px-5 py-6 sm:px-7">
              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Current Password
                </label>
                <div className="relative">
                  <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    autoComplete="current-password"
                    className="h-12 w-full rounded-xl border border-slate-300 pl-12 pr-12 outline-none transition focus:border-[#259b8f] focus:ring-4 focus:ring-[#259b8f]/15"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                  >
                    {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  New Password
                </label>
                <div className="relative">
                  <FaKey className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    autoComplete="new-password"
                    className="h-12 w-full rounded-xl border border-slate-300 pl-12 pr-12 outline-none transition focus:border-[#259b8f] focus:ring-4 focus:ring-[#259b8f]/15"
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Confirm New Password
                </label>
                <div className="relative">
                  <FaCheckCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    className="h-12 w-full rounded-xl border border-slate-300 pl-12 pr-12 outline-none transition focus:border-[#259b8f] focus:ring-4 focus:ring-[#259b8f]/15"
                    placeholder="Repeat your new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 text-xs font-semibold leading-6 text-slate-600">
                Use at least 8 characters with uppercase and lowercase letters,
                a number, and a special character.
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                {!mustChangePassword && (
                  <button
                    type="button"
                    onClick={closeChangePasswordModal}
                    disabled={passwordLoading}
                    className="h-12 rounded-xl border border-slate-300 px-5 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                )}

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#259b8f] px-6 font-black text-white shadow-sm hover:bg-[#1f887d] disabled:bg-[#259b8f]/40"
                >
                  <FaKey />
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewFile && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-3 py-4 sm:px-4">
          <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:rounded-3xl">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4 sm:p-5">
              <h2 className="min-w-0 break-words text-lg font-extrabold text-slate-900 sm:text-xl">
                {previewFile.fileName || 'File Preview'}
              </h2>

              <button
                type="button"
                onClick={handleClosePreview}
                className="shrink-0 rounded-xl bg-slate-100 p-3 text-slate-600 hover:bg-slate-200"
              >
                <FaTimes />
              </button>
            </div>

            <div className="bg-slate-100 p-3 sm:p-4">
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
                    className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-[#6CBF51] px-5 py-3 text-sm font-bold text-white hover:bg-[#5aa643]"
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
    </div>
  );
}