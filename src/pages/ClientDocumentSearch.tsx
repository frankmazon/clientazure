import {
  type ChangeEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  FaBriefcase,
  FaChevronDown,
  FaChevronUp,
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
} from "react-icons/fa";
import DashboardLayout from "../components/layout/layout";

const DEFAULT_API_BASE = import.meta.env.DEV
  ? "http://localhost:7071/api"
  : "https://docsuploadpythonapi.azurewebsites.net/api";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE
).replace(/\/$/, "");

const CLIENTS_API = `${API_BASE}/clients`;
const FILE_URL_API = `${API_BASE}/file-url`;
const FILE_PREVIEW_API = `${API_BASE}/file-preview`;
const DOCUMENTS_API = `${API_BASE}/documents`;

type AdminReferenceFile = {
  id: number;
  clientId: number;
  documentType: string;
  fileName: string;
  blobUrl: string;
  uploadedBy?: string;
  uploadedAt?: string;
  previewUrl: string;
};

type DocumentComparisonResult = {
  id: number;
  documentId: number;
  adminReferenceDocumentId: number;
  result: "Matched" | "NotMatched" | "NeedsReview";
  confidence: number;
  confidencePercent: number;
  exactMatch: boolean;
  textSimilarity: number;
  keywordScore: number;
  layoutSimilarity: number;
  predictedDocumentType?: string | null;
  classifierConfidence?: number | null;
  matchedKeywords: string[];
  reasons: string[];
  requiresHumanReview: boolean;
  comparedAt?: string;
};

type DocumentOption = {
  label: string;
  value: string;
};

type NormalizedTransactionType = "alt_doc" | "full_doc";

const sharedDocumentTypes: DocumentOption[] = [
  { label: "ID", value: "id" },
  { label: "Passport", value: "passport" },
  {
    label: "Last 6 Months Mortgage Statements",
    value: "last-6-months-mortgage-statements",
  },
  { label: "Council Rates Notice", value: "council-rates-notice" },
];

const transactionDocumentTypes: Record<
  NormalizedTransactionType,
  DocumentOption[]
> = {
  alt_doc: [
    { label: "BAS from ATO Portal", value: "bas-from-ato-portal" },
    {
      label: "Business Banking Statements",
      value: "business-banking-statements",
    },
    ...sharedDocumentTypes,
  ],
  full_doc: [
    { label: "Payslip", value: "payslip" },
    {
      label: "Management Reports / Financial Statements",
      value: "management-reports-financial-statements",
    },
    {
      label: "Group Certificate / Payment Summary",
      value: "group-certificate-payment-summary",
    },
    { label: "Company Tax Returns", value: "company-tax-returns" },
    { label: "Individual Tax Returns", value: "individual-tax-returns" },
    ...sharedDocumentTypes,
  ],
};

const allDocumentTypes = Object.values(transactionDocumentTypes).flat();

const documentTypeLabels = Object.fromEntries(
  allDocumentTypes.map((document) => [document.value, document.label]),
) as Record<string, string>;

const normalizeTransactionType = (
  transactionType?: string,
): NormalizedTransactionType | "" => {
  const normalized = (transactionType || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (
    normalized === "alt" ||
    normalized === "alt_doc" ||
    normalized === "altdoc"
  ) {
    return "alt_doc";
  }

  if (
    normalized === "full" ||
    normalized === "full_doc" ||
    normalized === "fulldoc"
  ) {
    return "full_doc";
  }

  return "";
};

const getRequiredDocuments = (transactionType?: string): string[] => {
  const normalizedTransactionType = normalizeTransactionType(transactionType);

  return normalizedTransactionType
    ? transactionDocumentTypes[normalizedTransactionType].map(
        (document) => document.value,
      )
    : [];
};

const normalizeDocumentTypeValue = (documentType?: string) =>
  (documentType || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-");

const formatDocumentType = (documentType?: string) => {
  if (!documentType) return "Document";

  const normalizedType = normalizeDocumentTypeValue(documentType);

  return (
    documentTypeLabels[normalizedType] ||
    documentType
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
};

type CoBorrower = {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  phoneCountryCode?: string;
  phone?: string;
  email?: string;
};

const normalizeCoBorrowers = (value: unknown): CoBorrower[] => {
  let entries: unknown[] = [];

  if (Array.isArray(value)) {
    entries = value;
  } else if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      entries = Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  } else if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const nested =
      record.coBorrowers ||
      record.CoBorrowers ||
      record.co_borrowers ||
      record.additionalCoBorrowers;

    if (nested !== value) return normalizeCoBorrowers(nested);
  }

  const readValue = (record: Record<string, unknown>, aliases: string[]) => {
    const normalizedRecord = Object.entries(record).reduce<
      Record<string, unknown>
    >((result, [key, item]) => {
      result[key.replace(/[^a-zA-Z0-9]+/g, "").toLowerCase()] = item;
      return result;
    }, {});

    for (const alias of aliases) {
      const item =
        record[alias] ||
        normalizedRecord[alias.replace(/[^a-zA-Z0-9]+/g, "").toLowerCase()];
      if (item !== undefined && item !== null && String(item).trim()) {
        return String(item).trim();
      }
    }

    return "";
  };

  return entries
    .filter(
      (entry): entry is Record<string, unknown> =>
        Boolean(entry) && typeof entry === "object",
    )
    .map((entry) => ({
      firstName: readValue(entry, ["firstName", "FirstName", "first_name"]),
      middleName: readValue(entry, ["middleName", "MiddleName", "middle_name"]),
      lastName: readValue(entry, ["lastName", "LastName", "last_name"]),
      phoneCountryCode: readValue(entry, [
        "phoneCountryCode",
        "PhoneCountryCode",
        "phone_country_code",
      ]),
      phone: readValue(entry, ["phone", "Phone", "mobile", "Mobile"]),
      email: readValue(entry, ["email", "Email"]),
    }))
    .filter(
      (coBorrower) =>
        coBorrower.firstName ||
        coBorrower.lastName ||
        coBorrower.phone ||
        coBorrower.email,
    );
};

const getCoBorrowerKey = (coBorrower: CoBorrower) =>
  [
    coBorrower.email?.toLowerCase(),
    coBorrower.phone?.replace(/\D/g, ""),
    coBorrower.firstName?.toLowerCase(),
    coBorrower.middleName?.toLowerCase(),
    coBorrower.lastName?.toLowerCase(),
  ]
    .filter(Boolean)
    .join("|");

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
  coBorrowers?: CoBorrower[];

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
  requiredDocuments?: string[];
  waivedDocuments?: string[];
};

type ClientFolder = {
  uniqueId: string;
  client: Client;
  files: Client[];
  requiredDocuments: string[];
  uploadedDocuments: string[];
  verifiedDocuments: string[];
  rejectedDocuments: string[];
  pendingDocuments: string[];
  missingDocuments: string[];
  waivedDocuments: string[];
  hasSupportedTransaction: boolean;
  isComplete: boolean;
  progress: number;
};

const normalizeDocumentStatus = (status?: string) => {
  const value = (status || "Pending").trim().toLowerCase();

  if (value === "verified" || value === "approved" || value === "approve") {
    return "Verified";
  }

  if (value === "rejected" || value === "reject") {
    return "Rejected";
  }

  return "Pending";
};

const normalizeDocumentList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .map((item) => normalizeDocumentTypeValue(String(item || "")))
          .filter(Boolean),
      ),
    );
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return normalizeDocumentList(parsed);
    } catch {
      // Fall back to comma/new-line separated values.
    }

    return Array.from(
      new Set(
        trimmed
          .split(/[,\n]/)
          .map((item) => normalizeDocumentTypeValue(item))
          .filter(Boolean),
      ),
    );
  }

  return [];
};

const getDocumentStatusStyle = (status?: string) => {
  const normalized = normalizeDocumentStatus(status);

  if (normalized === "Verified") {
    return "bg-green-100 text-green-700 border-green-200";
  }

  if (normalized === "Rejected") {
    return "bg-red-100 text-red-700 border-red-200";
  }

  return "bg-orange-100 text-orange-700 border-orange-200";
};

const getDocumentStatusIcon = (status?: string) => {
  const normalized = normalizeDocumentStatus(status);

  if (normalized === "Verified") return <FaCheckCircle />;
  if (normalized === "Rejected") return <FaExclamationTriangle />;
  return <FaSyncAlt />;
};

export default function ClientDocumentSearch() {
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [previewFile, setPreviewFile] = useState<Client | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [adminReferenceFile, setAdminReferenceFile] =
    useState<AdminReferenceFile | null>(null);
  const [adminReferenceLoading, setAdminReferenceLoading] = useState(false);
  const [adminReferenceUploading, setAdminReferenceUploading] = useState(false);
  const [adminReferenceError, setAdminReferenceError] = useState("");
  const [documentComparison, setDocumentComparison] =
    useState<DocumentComparisonResult | null>(null);
  const [documentComparisonLoading, setDocumentComparisonLoading] =
    useState(false);
  const [documentComparisonError, setDocumentComparisonError] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [completionFilter, setCompletionFilter] = useState<
    "all" | "complete" | "incomplete"
  >("all");
  const [expandedFolderKey, setExpandedFolderKey] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getSecureFileUrl = async (fileUrl?: string) => {
    if (!fileUrl) throw new Error("No file URL available.");

    const response = await fetch(
      `${FILE_URL_API}?blobUrl=${encodeURIComponent(fileUrl)}`,
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to generate secure file URL.");
    }

    return result.url as string;
  };

  const loadClients = async (keyword = "") => {
    try {
      setLoading(true);
      setError("");

      const url = keyword.trim()
        ? `${CLIENTS_API}?search=${encodeURIComponent(keyword.trim())}`
        : CLIENTS_API;

      const response = await fetch(url);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load clients.");
      }

      setClients((result.clients || []).map(normalizeClient));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load clients.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const normalizeKey = (key: string) =>
    key.replace(/[^a-zA-Z0-9]+/g, "").toLowerCase();

  const pickValue = (
    source: Record<string, unknown>,
    keys: string[],
  ): string | number | undefined => {
    for (const key of keys) {
      const value = source[key];
      if (value !== undefined && value !== null && value !== "") {
        return value as string | number;
      }
    }

    const normalizedSource = Object.entries(source).reduce<
      Record<string, unknown>
    >((acc, [key, value]) => {
      acc[normalizeKey(key)] = value;
      return acc;
    }, {});

    for (const key of keys) {
      const value = normalizedSource[normalizeKey(key)];
      if (value !== undefined && value !== null && value !== "") {
        return value as string | number;
      }
    }

    return undefined;
  };

  const normalizeClient = (
    rawClient: Client & Record<string, unknown>,
  ): Client => {
    const referrer =
      typeof rawClient.referrer === "object" && rawClient.referrer !== null
        ? (rawClient.referrer as Client["referrer"])
        : undefined;

    const normalizedSource = pickValue(rawClient, [
      "applicationSource",
      "ApplicationSource",
      "application_source",
      "Application Source",
      "application source",
      "contact.application_source",
      "source",
      "Source",
      "leadType",
      "LeadType",
      "lead_type",
    ]) as string | undefined;

    return {
      ...rawClient,
      id: Number(
        pickValue(rawClient, ["id", "Id", "DocumentId", "documentId"]) ||
          rawClient.id,
      ),
      clientId: Number(
        pickValue(rawClient, ["clientId", "ClientId", "Id"]) ||
          rawClient.clientId ||
          rawClient.id,
      ),
      uniqueId: pickValue(rawClient, ["uniqueId", "UniqueId", "uniqueID"]) as
        | string
        | undefined,
      name: pickValue(rawClient, ["name", "Name", "fullName", "FullName"]) as
        | string
        | undefined,
      firstName: pickValue(rawClient, ["firstName", "FirstName"]) as
        | string
        | undefined,
      middleName: pickValue(rawClient, ["middleName", "MiddleName"]) as
        | string
        | undefined,
      lastName: pickValue(rawClient, ["lastName", "LastName"]) as
        | string
        | undefined,
      email: pickValue(rawClient, ["email", "Email"]) as string | undefined,
      phone: pickValue(rawClient, ["phone", "Phone", "mobile", "Mobile"]) as
        | string
        | undefined,
      leadType: pickValue(rawClient, ["leadType", "LeadType", "lead_type"]) as
        | string
        | undefined,
      source: normalizedSource,
      applicationSource: normalizedSource,
      status: pickValue(rawClient, ["status", "Status"]) as string | undefined,

      classificationType: pickValue(rawClient, [
        "classificationType",
        "ClassificationType",
        "classification_type",
      ]) as string | undefined,
      borrowerType: pickValue(rawClient, [
        "borrowerType",
        "BorrowerType",
        "borrower_type",
      ]) as string | undefined,
      objective: pickValue(rawClient, ["objective", "Objective"]) as
        | string
        | undefined,
      loanType: pickValue(rawClient, ["loanType", "LoanType", "loan_type"]) as
        | string
        | undefined,
      purpose: pickValue(rawClient, ["purpose", "Purpose"]) as
        | string
        | undefined,
      transactionType: pickValue(rawClient, [
        "transactionType",
        "TransactionType",
        "transaction_type",
      ]) as string | undefined,
      withBorrowersGuarantors: pickValue(rawClient, [
        "withBorrowersGuarantors",
        "WithBorrowersGuarantors",
        "with_borrowers_guarantors",
        "withBorrowers",
      ]) as string | undefined,
      coBorrowers: normalizeCoBorrowers(
        pickValue(rawClient, [
          "coBorrowers",
          "CoBorrowers",
          "co_borrowers",
          "coBorrowersJson",
          "CoBorrowersJson",
          "additionalCoBorrowers",
          "AdditionalCoBorrowers",
          "additional_co_borrowers",
        ]) as unknown,
      ),

      vedaIssues: pickValue(rawClient, [
        "vedaIssues",
        "VedaIssues",
        "veda_issues",
        "veda issues",
        "Veda Issues",
      ]) as string | undefined,
      conductIssues: pickValue(rawClient, [
        "conductIssues",
        "ConductIssues",
        "conduct_issues",
        "conduct issues",
        "Conduct Issues",
      ]) as string | undefined,
      clientNeedsObjectives: pickValue(rawClient, [
        "clientNeedsObjectives",
        "ClientNeedsObjectives",
        "client_needs_objectives",
        "client needs objectives",
        "Client Needs Objectives",
        "Client Needs & Objectives",
      ]) as string | undefined,
      applicantBackground: pickValue(rawClient, [
        "applicantBackground",
        "ApplicantBackground",
        "applicant_background",
        "applicant background",
        "Applicant Background",
      ]) as string | undefined,
      explanationOfIncome: pickValue(rawClient, [
        "explanationOfIncome",
        "ExplanationOfIncome",
        "explanation_of_income",
        "explanation of income",
        "Explanation Of Income",
      ]) as string | undefined,
      security: pickValue(rawClient, ["security", "Security"]) as
        | string
        | undefined,

      loanAmount: pickValue(rawClient, [
        "loanAmount",
        "LoanAmount",
        "loan_amount",
        "loan amount",
        "Loan Amount",
      ]),
      securityValue: pickValue(rawClient, [
        "securityValue",
        "SecurityValue",
        "security_value",
        "security value",
        "Security Value",
      ]),
      lvr: pickValue(rawClient, [
        "lvr",
        "Lvr",
        "LVR",
        "LvrPercent",
        "lvr_percent",
      ]),
      anticipatedSettlementDate: pickValue(rawClient, [
        "anticipatedSettlementDate",
        "AnticipatedSettlementDate",
        "anticipated_settlement_date",
      ]) as string | undefined,
      specialNotes: pickValue(rawClient, [
        "specialNotes",
        "SpecialNotes",
        "special_notes",
        "special notes",
        "Special Notes",
      ]) as string | undefined,

      referrer: {
        firstName:
          referrer?.firstName ||
          (pickValue(rawClient, [
            "referrerFirstName",
            "ReferrerFirstName",
            "brokerFirstName",
            "BrokerFirstName",
          ]) as string | undefined),
        middleName:
          referrer?.middleName ||
          (pickValue(rawClient, [
            "referrerMiddleName",
            "ReferrerMiddleName",
            "brokerMiddleName",
            "BrokerMiddleName",
          ]) as string | undefined),
        lastName:
          referrer?.lastName ||
          (pickValue(rawClient, [
            "referrerLastName",
            "ReferrerLastName",
            "brokerLastName",
            "BrokerLastName",
          ]) as string | undefined),
        phone:
          referrer?.phone ||
          (pickValue(rawClient, [
            "referrerPhone",
            "ReferrerPhone",
            "brokerPhone",
            "BrokerPhone",
          ]) as string | undefined),
        email:
          referrer?.email ||
          (pickValue(rawClient, [
            "referrerEmail",
            "ReferrerEmail",
            "brokerEmail",
            "BrokerEmail",
          ]) as string | undefined),
      },

      documentType: pickValue(rawClient, ["documentType", "DocumentType"]) as
        | string
        | undefined,
      fileName: pickValue(rawClient, ["fileName", "FileName"]) as
        | string
        | undefined,
      fileUrl: pickValue(rawClient, [
        "fileUrl",
        "FileUrl",
        "blobUrl",
        "BlobUrl",
      ]) as string | undefined,
      submittedAt: pickValue(rawClient, [
        "submittedAt",
        "SubmittedAt",
        "UploadedAt",
        "uploadedAt",
      ]) as string | undefined,
      documentStatus: normalizeDocumentStatus(
        pickValue(rawClient, [
          "documentStatus",
          "DocumentStatus",
          "document_status",
        ]) as string | undefined,
      ),
      verifiedBy: pickValue(rawClient, [
        "verifiedBy",
        "VerifiedBy",
        "verified_by",
      ]) as string | undefined,
      verifiedDate: pickValue(rawClient, [
        "verifiedDate",
        "VerifiedDate",
        "verified_date",
      ]) as string | undefined,
      remarks: pickValue(rawClient, [
        "remarks",
        "Remarks",
        "adminRemarks",
        "AdminRemarks",
      ]) as string | undefined,
      progress: Number(pickValue(rawClient, ["progress", "Progress"]) || 0),
      completedDate: pickValue(rawClient, [
        "completedDate",
        "CompletedDate",
        "completed_date",
      ]) as string | undefined,
      reminderSent: Boolean(
        pickValue(rawClient, ["reminderSent", "ReminderSent", "reminder_sent"]),
      ),
      lastReminderDate: pickValue(rawClient, [
        "lastReminderDate",
        "LastReminderDate",
        "last_reminder_date",
      ]) as string | undefined,
      assignedSpecialist: pickValue(rawClient, [
        "assignedSpecialist",
        "AssignedSpecialist",
        "assigned_specialist",
      ]) as string | undefined,
      requiredDocuments: normalizeDocumentList(
        pickValue(rawClient, [
          "requiredDocuments",
          "RequiredDocuments",
          "required_documents",
        ]),
      ),
      waivedDocuments: normalizeDocumentList(
        pickValue(rawClient, [
          "waivedDocuments",
          "WaivedDocuments",
          "waived_documents",
        ]),
      ),
    };
  };

  const getFullName = (client: Client) =>
    (
      client.name ||
      `${client.firstName || ""} ${client.middleName || ""} ${client.lastName || ""}`
    )
      .replace(/\s+/g, " ")
      .trim();

  const formatSource = (type?: string) => {
    const rawValue = (type || "").trim();
    const value = rawValue.toLowerCase().replace(/[_\s]+/g, "-");

    if (!value) return "-";
    if (value === "broker" || value === "business-owner") return "Broker";
    if (value === "referral" || value === "referrer") return "Referral";
    if (value === "direct-client" || value === "directclient")
      return "Direct Client";

    return (
      rawValue
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        )
        .join(" ") || "-"
    );
  };

  const getClientSource = (client: Client) =>
    formatSource(client.applicationSource || client.source || client.leadType);

  const getStatus = (client: Client) => client.status || "Pending Team Call";

  const getDetailLabel = (client: Client) =>
    getClientSource(client) === "Broker" ? "Broker" : "Referrer";

  const displayValue = (value?: string | number | null) => {
    if (value === null || value === undefined || value === "") return "-";
    return value;
  };

  const getReferrerName = (client: Client) =>
    [
      client.referrer?.firstName ||
        client.referrerFirstName ||
        client.brokerFirstName,
      client.referrer?.middleName ||
        client.referrerMiddleName ||
        client.brokerMiddleName,
      client.referrer?.lastName ||
        client.referrerLastName ||
        client.brokerLastName,
    ]
      .filter(Boolean)
      .join(" ");

  const getReferrerPhone = (client: Client) =>
    client.referrer?.phone || client.referrerPhone || client.brokerPhone;

  const getReferrerEmail = (client: Client) =>
    client.referrer?.email || client.referrerEmail || client.brokerEmail;

  const getDocumentStatus = (file: Client) =>
    normalizeDocumentStatus(file.documentStatus);

  const updateDocumentStatus = async (
    file: Client,
    action: "verify" | "reject" | "pending",
  ) => {
    if (!file.id) {
      alert("Document ID is missing. Please refresh and try again.");
      return;
    }

    const label =
      action === "verify"
        ? "verify"
        : action === "reject"
          ? "reject"
          : "mark as pending";

    const remarks = window.prompt(
      action === "reject"
        ? "Add rejection remarks for the client:"
        : "Add remarks for this document (optional):",
      file.remarks || "",
    );

    if (remarks === null) return;

    const adminName =
      localStorage.getItem("adminName") ||
      localStorage.getItem("username") ||
      "Admin";

    try {
      setLoading(true);

      const response = await fetch(`${DOCUMENTS_API}/${file.id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      alert(
        err instanceof Error ? err.message : `Failed to ${label} document.`,
      );
    } finally {
      setLoading(false);
    }
  };

  const waiveDocumentRequirement = async (
    client: Client,
    documentType: string,
  ) => {
    const clientId = Number(client.clientId || client.id);

    if (!clientId) {
      alert("Client ID is missing. Please refresh and try again.");
      return;
    }

    const remarks = window.prompt(
      `Why is ${formatDocumentType(documentType)} being waived?`,
      "",
    );

    if (remarks === null) return;

    const waivedBy =
      localStorage.getItem("adminName") ||
      localStorage.getItem("username") ||
      "Admin";

    try {
      setLoading(true);

      const response = await fetch(
        `${CLIENTS_API}/${clientId}/documents/${encodeURIComponent(
          documentType,
        )}/waive`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ waivedBy, remarks }),
        },
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to waive document.");
      }

      await loadClients(search);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to waive document.");
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
        (client.uniqueId || "").toLowerCase().includes(keyword) ||
        (client.email || "").toLowerCase().includes(keyword) ||
        (client.phone || "").toLowerCase().includes(keyword) ||
        (client.applicationSource || "").toLowerCase().includes(keyword) ||
        source.toLowerCase().includes(keyword) ||
        status.toLowerCase().includes(keyword) ||
        (client.fileName || "").toLowerCase().includes(keyword) ||
        (client.documentType || "").toLowerCase().includes(keyword) ||
        (client.classificationType || "").toLowerCase().includes(keyword) ||
        (client.borrowerType || "").toLowerCase().includes(keyword) ||
        (client.objective || "").toLowerCase().includes(keyword) ||
        (client.loanType || "").toLowerCase().includes(keyword) ||
        (client.purpose || "").toLowerCase().includes(keyword) ||
        (client.transactionType || "").toLowerCase().includes(keyword) ||
        (client.withBorrowersGuarantors || "")
          .toLowerCase()
          .includes(keyword) ||
        (client.coBorrowers || []).some((coBorrower) =>
          [
            coBorrower.firstName,
            coBorrower.middleName,
            coBorrower.lastName,
            coBorrower.phone,
            coBorrower.email,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(keyword),
        ) ||
        (client.anticipatedSettlementDate || "")
          .toLowerCase()
          .includes(keyword) ||
        (client.vedaIssues || "").toLowerCase().includes(keyword) ||
        (client.conductIssues || "").toLowerCase().includes(keyword) ||
        (client.clientNeedsObjectives || "").toLowerCase().includes(keyword) ||
        (client.applicantBackground || "").toLowerCase().includes(keyword) ||
        (client.explanationOfIncome || "").toLowerCase().includes(keyword) ||
        (client.security || "").toLowerCase().includes(keyword) ||
        (client.specialNotes || "").toLowerCase().includes(keyword) ||
        getReferrerName(client).toLowerCase().includes(keyword) ||
        (getReferrerEmail(client) || "").toLowerCase().includes(keyword) ||
        (getReferrerPhone(client) || "").toLowerCase().includes(keyword);

      const matchesType =
        selectedType === "all" ||
        normalizeDocumentTypeValue(client.documentType) === selectedType;

      const matchesSource =
        selectedSource === "all" || source === selectedSource;

      const matchesStatus =
        selectedStatus === "all" ||
        status === selectedStatus ||
        normalizeDocumentStatus(client.documentStatus) === selectedStatus;

      return matchesSearch && matchesType && matchesSource && matchesStatus;
    });
  }, [clients, search, selectedType, selectedSource, selectedStatus]);

  const documentTypes = useMemo(() => {
    return Array.from(
      new Set([
        ...allDocumentTypes.map((document) => document.value),
        ...clients
          .map((client) => normalizeDocumentTypeValue(client.documentType))
          .filter(Boolean),
      ]),
    ).sort((first, second) =>
      formatDocumentType(first).localeCompare(formatDocumentType(second)),
    );
  }, [clients]);

  const statuses = useMemo(() => {
    return Array.from(
      new Set(
        [
          ...clients.map((client) => getStatus(client)),
          ...clients.map((client) =>
            normalizeDocumentStatus(client.documentStatus),
          ),
        ].filter(Boolean),
      ),
    );
  }, [clients]);

  const clientFolders = useMemo<ClientFolder[]>(() => {
    const map = new Map<string, Client[]>();
    const matchingClientKeys = new Set(
      filteredClients.map(
        (client) => client.uniqueId || String(client.clientId || client.id),
      ),
    );

    clients.forEach((client) => {
      const key = client.uniqueId || String(client.clientId || client.id);

      if (!matchingClientKeys.has(key)) return;
      if (!map.has(key)) map.set(key, []);
      map.get(key)?.push(client);
    });

    return Array.from(map.entries()).map(([uniqueId, clientRows]) => {
      const baseClient =
        clientRows.find(
          (row) => row.classificationType || row.transactionType,
        ) || clientRows[0];

      const uniqueCoBorrowers = new Map<string, CoBorrower>();
      clientRows
        .flatMap((row) => row.coBorrowers || [])
        .forEach((coBorrower, index) => {
          const key = getCoBorrowerKey(coBorrower) || `co-borrower-${index}`;
          if (!uniqueCoBorrowers.has(key)) {
            uniqueCoBorrowers.set(key, coBorrower);
          }
        });

      const client: Client = {
        ...baseClient,
        coBorrowers: Array.from(uniqueCoBorrowers.values()),
      };

      const files = clientRows.filter((row) =>
        Boolean(row.documentType || row.fileName || row.fileUrl),
      );

      const requiredDocuments = Array.from(
        new Set([
          ...getRequiredDocuments(client.transactionType),
          ...clientRows.flatMap((row) => row.requiredDocuments || []),
        ]),
      );
      const hasSupportedTransaction = requiredDocuments.length > 0;
      const waivedDocuments = Array.from(
        new Set(
          clientRows
            .flatMap((row) => row.waivedDocuments || [])
            .filter((document) => requiredDocuments.includes(document)),
        ),
      );
      const statusByDocument = new Map<string, string>();
      const statusPriority: Record<string, number> = {
        Verified: 3,
        Pending: 2,
        Rejected: 1,
      };

      files.forEach((file) => {
        const documentType = normalizeDocumentTypeValue(file.documentType);
        if (!documentType || !requiredDocuments.includes(documentType)) return;

        const nextStatus = getDocumentStatus(file);
        const currentStatus = statusByDocument.get(documentType);

        if (
          !currentStatus ||
          (statusPriority[nextStatus] || 0) >
            (statusPriority[currentStatus] || 0)
        ) {
          statusByDocument.set(documentType, nextStatus);
        }
      });

      const uploadedDocuments = requiredDocuments.filter((document) =>
        statusByDocument.has(document),
      );

      const verifiedDocuments = requiredDocuments.filter(
        (document) => statusByDocument.get(document) === "Verified",
      );

      const rejectedDocuments = requiredDocuments.filter(
        (document) => statusByDocument.get(document) === "Rejected",
      );

      const pendingDocuments = requiredDocuments.filter(
        (document) => statusByDocument.get(document) === "Pending",
      );

      const missingDocuments = requiredDocuments.filter(
        (document) =>
          !statusByDocument.has(document) &&
          !waivedDocuments.includes(document),
      );

      const isComplete =
        hasSupportedTransaction &&
        requiredDocuments.every(
          (document) =>
            verifiedDocuments.includes(document) ||
            waivedDocuments.includes(document),
        );

      return {
        uniqueId,
        client,
        files,
        requiredDocuments,
        uploadedDocuments,
        verifiedDocuments,
        rejectedDocuments,
        pendingDocuments,
        missingDocuments,
        waivedDocuments,
        hasSupportedTransaction,
        isComplete,
        progress: hasSupportedTransaction
          ? Math.round(
              ((verifiedDocuments.length + waivedDocuments.length) /
                requiredDocuments.length) *
                100,
            )
          : 0,
      };
    });
  }, [clients, filteredClients]);

  const incompleteCount = clientFolders.filter(
    (folder) => !folder.isComplete,
  ).length;
  const completeCount = clientFolders.filter(
    (folder) => folder.isComplete,
  ).length;

  const visibleClientFolders = useMemo(
    () =>
      clientFolders.filter((folder) => {
        if (completionFilter === "complete") return folder.isComplete;
        if (completionFilter === "incomplete") return !folder.isComplete;
        return true;
      }),
    [clientFolders, completionFilter],
  );

  const handleSearch = () => {
    loadClients(search);
  };

  const releasePreviewUrl = (url: string) => {
    if (url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  };

  const getFilePreviewUrl = async (fileName?: string, fileUrl?: string) => {
    if (!fileUrl) throw new Error("No file URL available.");

    const normalizedFileName = (fileName || "").toLowerCase();
    const secureUrl = await getSecureFileUrl(fileUrl);

    if (normalizedFileName.endsWith(".pdf")) {
      return `${FILE_PREVIEW_API}?blobUrl=${encodeURIComponent(fileUrl)}`;
    }

    if (/\.(doc|docx|xls|xlsx|ppt|pptx)$/.test(normalizedFileName)) {
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
        secureUrl,
      )}`;
    }

    return secureUrl;
  };

  const getAdminReferenceEndpoint = (file: Client) => {
    const clientId = Number(file.clientId);
    const documentType = normalizeDocumentTypeValue(file.documentType);

    if (!clientId || !documentType) {
      throw new Error(
        "Client ID or document type is missing from the selected file.",
      );
    }

    return `${CLIENTS_API}/${clientId}/admin-reference-documents/${encodeURIComponent(
      documentType,
    )}`;
  };

  const loadAdminReference = async (
    file: Client,
  ): Promise<AdminReferenceFile | null> => {
    try {
      setAdminReferenceLoading(true);
      setAdminReferenceError("");
      setAdminReferenceFile(null);

      const response = await fetch(getAdminReferenceEndpoint(file));
      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to load the admin reference document.",
        );
      }

      const reference = result.referenceDocument;

      if (!reference) return null;

      const referencePreviewUrl = await getFilePreviewUrl(
        reference.fileName,
        reference.blobUrl,
      );

      const normalizedReference: AdminReferenceFile = {
        id: Number(reference.id),
        clientId: Number(reference.clientId),
        documentType: normalizeDocumentTypeValue(reference.documentType),
        fileName: String(reference.fileName || "Admin reference document"),
        blobUrl: String(reference.blobUrl || ""),
        uploadedBy: reference.uploadedBy,
        uploadedAt: reference.uploadedAt,
        previewUrl: referencePreviewUrl,
      };

      setAdminReferenceFile(normalizedReference);
      return normalizedReference;
    } catch (err) {
      setAdminReferenceError(
        err instanceof Error
          ? err.message
          : "Failed to load the admin reference document.",
      );
      return null;
    } finally {
      setAdminReferenceLoading(false);
    }
  };

  const runAutomaticComparison = async (file: Client, force = false) => {
    if (!file.id) {
      setDocumentComparisonError("The client document ID is missing.");
      return;
    }

    const adminName =
      localStorage.getItem("adminName") ||
      localStorage.getItem("username") ||
      "Admin";

    try {
      setDocumentComparisonLoading(true);
      setDocumentComparisonError("");
      setDocumentComparison(null);

      const response = await fetch(`${DOCUMENTS_API}/${file.id}/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comparedBy: adminName, force }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success || !result.comparison) {
        throw new Error(
          result.message || "Automatic document comparison failed.",
        );
      }

      setDocumentComparison(result.comparison as DocumentComparisonResult);
    } catch (err) {
      setDocumentComparisonError(
        err instanceof Error
          ? err.message
          : "Automatic document comparison failed.",
      );
    } finally {
      setDocumentComparisonLoading(false);
    }
  };

  const handlePreview = async (file: Client) => {
    try {
      releasePreviewUrl(previewUrl);
      setPreviewFile(file);
      setPreviewUrl("");
      setAdminReferenceFile(null);
      setAdminReferenceError("");
      setDocumentComparison(null);
      setDocumentComparisonError("");
      setPreviewLoading(true);

      const clientPreviewUrl = await getFilePreviewUrl(
        file.fileName,
        file.fileUrl,
      );
      setPreviewUrl(clientPreviewUrl);
      const reference = await loadAdminReference(file);

      if (reference) {
        await runAutomaticComparison(file);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to open file.");
      setPreviewFile(null);
      setPreviewUrl("");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = async (file: Client) => {
    try {
      const secureUrl = await getSecureFileUrl(file.fileUrl);
      window.open(secureUrl, "_blank");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to download file.");
    }
  };

  const handleClosePreview = () => {
    releasePreviewUrl(previewUrl);
    setPreviewFile(null);
    setPreviewUrl("");
    setAdminReferenceFile(null);
    setAdminReferenceError("");
    setDocumentComparison(null);
    setDocumentComparisonError("");
  };

  const handleAdminReferenceUpload = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";

    if (!selectedFile || !previewFile) return;

    const uploadedBy =
      localStorage.getItem("adminName") ||
      localStorage.getItem("username") ||
      "Admin";
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("uploadedBy", uploadedBy);

    try {
      setAdminReferenceUploading(true);
      setAdminReferenceError("");

      const response = await fetch(getAdminReferenceEndpoint(previewFile), {
        method: "POST",
        body: formData,
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to upload the admin reference document.",
        );
      }

      const reference = await loadAdminReference(previewFile);

      if (reference) {
        await runAutomaticComparison(previewFile, true);
      }
      alert(result.message || "Admin reference document uploaded.");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to upload the admin reference document.";
      setAdminReferenceError(message);
      alert(message);
    } finally {
      setAdminReferenceUploading(false);
    }
  };

  const handleRemoveAdminReference = async () => {
    if (!previewFile || !adminReferenceFile) return;

    const confirmed = window.confirm(
      "Remove this admin reference document? The file will also be deleted from Azure Blob Storage.",
    );

    if (!confirmed) return;

    try {
      setAdminReferenceUploading(true);
      setAdminReferenceError("");

      const response = await fetch(getAdminReferenceEndpoint(previewFile), {
        method: "DELETE",
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to remove the admin reference document.",
        );
      }

      setAdminReferenceFile(null);
      setDocumentComparison(null);
      setDocumentComparisonError("");
      alert(result.message || "Admin reference document removed.");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to remove the admin reference document.";
      setAdminReferenceError(message);
      alert(message);
    } finally {
      setAdminReferenceUploading(false);
    }
  };

  const previewFileName = previewFile?.fileName?.toLowerCase() || "";

  const adminReferenceFileName =
    adminReferenceFile?.fileName.toLowerCase() || "";

  const isImageFile = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/.test(
    previewFileName,
  );

  const isPdfFile = previewFileName.endsWith(".pdf");

  const isOfficeFile = /\.(doc|docx|xls|xlsx|ppt|pptx)$/.test(previewFileName);

  const isAdminReferenceImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/.test(
    adminReferenceFileName,
  );

  const isAdminReferencePdf = adminReferenceFileName.endsWith(".pdf");

  const panelClass =
    "rounded-2xl border border-slate-200/80 bg-white/95 shadow-[0_18px_45px_rgba(15,23,42,0.06)]";

  const sectionTitleClass =
    "mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500";

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
    className,
    icon,
    onClick,
    active = false,
  }: {
    label: string;
    value: number;
    className: string;
    icon?: ReactNode;
    onClick?: () => void;
    active?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`w-full rounded-2xl border p-4 text-left shadow-[0_14px_34px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(15,23,42,0.1)] ${
        active ? "ring-2 ring-slate-900/15" : ""
      } ${className}`}
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
      <p className="mt-4 text-2xl font-black leading-none sm:text-3xl">
        {value}
      </p>
    </button>
  );

  return (
    <DashboardLayout
      title="Client Document Search"
      subtitle="Search client files, source, phone number, team status, loan details, and missing documents."
    >
      <div className="mx-auto max-w-[1800px] space-y-6">
        <section className={`${panelClass} overflow-hidden`}>
          <div className="bg-[linear-gradient(135deg,rgba(37,155,143,0.94),rgba(15,23,42,0.98)_56%,rgba(238,101,33,0.88))] p-5 text-white sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-white/65">
                  Document Control
                </p>
                <h2 className="mt-2 text-2xl font-black text-white">
                  Search Client Documents
                </h2>
                <p className="mt-2 max-w-4xl text-sm leading-6 text-white/75">
                  Search by Unique ID, name, email, phone, source, status, loan
                  details, document type, or file name.
                </p>
              </div>

              <button
                type="button"
                onClick={() => loadClients()}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-slate-950 shadow-sm hover:bg-slate-100"
              >
                <FaSyncAlt />
                Refresh
              </button>
            </div>
          </div>

          <div className="grid gap-4 p-5 sm:p-6 xl:grid-cols-[minmax(280px,1fr)_200px_180px_180px_auto]">
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleSearch();
                }}
                placeholder="Search Unique ID, name, email, phone, source, loan details, status, or file..."
                className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-[#259b8f] focus:bg-white focus:ring-4 focus:ring-[#259b8f]/15"
              />
            </div>

            <select
              value={selectedType}
              onChange={(event) => setSelectedType(event.target.value)}
              className="h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none transition focus:border-[#259b8f] focus:bg-white focus:ring-4 focus:ring-[#259b8f]/15"
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
              className="h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none transition focus:border-[#259b8f] focus:bg-white focus:ring-4 focus:ring-[#259b8f]/15"
            >
              <option value="all">All Sources</option>
              <option value="Broker">Broker</option>
              <option value="Referral">Referral</option>
              <option value="Direct Client">Direct Client</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
              className="h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none transition focus:border-[#259b8f] focus:bg-white focus:ring-4 focus:ring-[#259b8f]/15"
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
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#EE6521] px-6 text-sm font-black text-white shadow-[0_14px_24px_rgba(238,101,33,0.22)] hover:bg-orange-600"
            >
              <FaSearch />
              Search
            </button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Total Records"
            value={clients.length}
            className="border-slate-200/80 bg-white text-slate-900"
            icon={<FaFileAlt />}
            onClick={() => setCompletionFilter("all")}
            active={completionFilter === "all"}
          />
          <StatCard
            label="Complete"
            value={completeCount}
            className="border-green-200/80 bg-white text-green-700"
            icon={<FaCheckCircle />}
            onClick={() => setCompletionFilter("complete")}
            active={completionFilter === "complete"}
          />
          <StatCard
            label="Incomplete"
            value={incompleteCount}
            className="border-red-200/80 bg-white text-red-700"
            icon={<FaExclamationTriangle />}
            onClick={() => setCompletionFilter("incomplete")}
            active={completionFilter === "incomplete"}
          />
        </section>

        {loading && (
          <div
            className={`${panelClass} p-10 text-center text-sm font-bold text-slate-500`}
          >
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
            {visibleClientFolders.map(
              ({
                uniqueId,
                client,
                files,
                verifiedDocuments,
                rejectedDocuments,
                pendingDocuments,
                missingDocuments,
                waivedDocuments,
                hasSupportedTransaction,
                isComplete,
                progress,
              }) => {
                const sourceLabel = getClientSource(client);
                const isExpanded = expandedFolderKey === uniqueId;

                return (
                  <div
                    key={uniqueId}
                    className={`${panelClass} overflow-hidden`}
                  >
                    <div className="flex flex-col gap-4 border-b border-slate-200/80 bg-slate-50/80 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-center gap-4">
                        <div
                          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
                            isComplete
                              ? "bg-green-100 text-green-600 ring-1 ring-green-200"
                              : "bg-red-100 text-red-600 ring-1 ring-red-200"
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
                            {getFullName(client) || "Unnamed Client"}
                          </h3>

                          <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-500">
                            <span className="inline-flex min-w-0 items-center gap-2 break-all rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
                              <FaIdBadge className="text-xs" />
                              {client.uniqueId || uniqueId}
                            </span>

                            <span className="inline-flex min-w-0 items-center gap-2 break-all rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
                              <FaUser className="text-xs" />
                              {client.email || "No email"}
                            </span>

                            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
                              <FaPhone className="text-xs" />
                              {client.phone || "No phone"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black sm:px-4 sm:text-sm ${
                            sourceLabel === "Referral"
                              ? "bg-[#259b8f]/10 text-[#1f8178] ring-1 ring-[#259b8f]/20"
                              : sourceLabel === "Direct Client"
                                ? "bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200"
                                : "bg-sky-100 text-sky-700 ring-1 ring-sky-200"
                          }`}
                        >
                          {sourceLabel === "Referral" ? (
                            <FaUserFriends />
                          ) : (
                            <FaBriefcase />
                          )}
                          {sourceLabel}
                        </span>

                        <span className="rounded-full bg-orange-100 px-3 py-2 text-xs font-black text-orange-700 ring-1 ring-orange-200 sm:px-4 sm:text-sm">
                          {getStatus(client)}
                        </span>

                        <span
                          className={`rounded-full px-3 py-2 text-xs font-black sm:px-4 sm:text-sm ${
                            !hasSupportedTransaction
                              ? "bg-slate-200 text-slate-700 ring-1 ring-slate-300"
                              : isComplete
                                ? "bg-green-100 text-green-700 ring-1 ring-green-200"
                                : "bg-red-100 text-red-700 ring-1 ring-red-200"
                          }`}
                        >
                          {!hasSupportedTransaction
                            ? "Checklist unavailable"
                            : isComplete
                              ? "Complete"
                              : "Incomplete"}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedFolderKey(isExpanded ? null : uniqueId)
                          }
                          aria-expanded={isExpanded}
                          aria-label={
                            isExpanded
                              ? "Hide client details"
                              : "Show client details"
                          }
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100"
                        >
                          {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <>
                        <div className="border-b border-slate-100 bg-white p-4 sm:p-5">
                          <p className={sectionTitleClass}>
                            Submitted Loan Information
                          </p>

                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            <InfoBox
                              label="Classification Type"
                              value={client.classificationType}
                            />
                            <InfoBox
                              label="Borrower Type"
                              value={client.borrowerType}
                            />
                            <InfoBox
                              label="Objective"
                              value={client.objective}
                            />
                            <InfoBox
                              label="Loan Type"
                              value={client.loanType}
                            />
                            <InfoBox label="Purpose" value={client.purpose} />
                            <InfoBox
                              label="Transaction Type"
                              value={client.transactionType}
                            />
                            <InfoBox
                              label="With Co-Borrowers?"
                              value={client.withBorrowersGuarantors}
                            />
                            <InfoBox
                              label="Anticipated Settlement Date"
                              value={client.anticipatedSettlementDate}
                            />
                          </div>

                          {((client.coBorrowers?.length || 0) > 0 ||
                            client.withBorrowersGuarantors
                              ?.trim()
                              .toLowerCase() === "yes") && (
                            <div className="mt-4 rounded-2xl border border-cyan-200 bg-cyan-50/80 p-4">
                              <div className="mb-3 flex items-center gap-2">
                                <FaUserFriends className="text-cyan-700" />
                                <p className="text-sm font-extrabold text-slate-900">
                                  Additional Co-Borrowers
                                </p>
                              </div>

                              {client.coBorrowers?.length ? (
                                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                  {client.coBorrowers.map(
                                    (coBorrower, index) => (
                                      <div
                                        key={
                                          getCoBorrowerKey(coBorrower) || index
                                        }
                                        className="rounded-xl border border-cyan-100 bg-white p-4 shadow-sm"
                                      >
                                        <p className="text-xs font-black uppercase tracking-wide text-cyan-700">
                                          Co-Borrower {index + 1}
                                        </p>
                                        <div className="mt-3 grid gap-3">
                                          <InfoBox
                                            label="Name"
                                            value={[
                                              coBorrower.firstName,
                                              coBorrower.middleName,
                                              coBorrower.lastName,
                                            ]
                                              .filter(Boolean)
                                              .join(" ")}
                                          />
                                          <InfoBox
                                            label="Phone"
                                            value={coBorrower.phone}
                                          />
                                          <InfoBox
                                            label="Email"
                                            value={coBorrower.email}
                                          />
                                        </div>
                                      </div>
                                    ),
                                  )}
                                </div>
                              ) : (
                                <p className="rounded-xl border border-dashed border-cyan-200 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-600">
                                  No co-borrower details are available yet.
                                </p>
                              )}
                            </div>
                          )}

                          {["Broker", "Referral"].includes(sourceLabel) && (
                            <div className="mt-4 rounded-2xl border border-cyan-200 bg-cyan-50/80 p-4">
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
                          <p className={sectionTitleClass}>Scenario Details</p>

                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
                          </div>
                        </div>

                        <div className="border-b border-slate-100 bg-white p-4 sm:p-5">
                          <p className={sectionTitleClass}>
                            Loan Amount & Settlement
                          </p>

                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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

                        <div className="border-b border-slate-100 bg-slate-50/80 p-4 sm:p-5">
                          <div className="mb-5">
                            <div className="mb-2 flex items-center justify-between text-sm font-bold text-slate-600">
                              <span>Document Progress</span>
                              <span>{progress}%</span>
                            </div>

                            <div className="h-3 overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
                              <div
                                className={`h-full rounded-full ${
                                  isComplete
                                    ? "bg-[linear-gradient(90deg,#259b8f,#6CBF51)]"
                                    : "bg-[linear-gradient(90deg,#EE6521,#f59e0b)]"
                                }`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                              <p className="mb-2 text-xs font-bold uppercase text-slate-500">
                                Verified Documents
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {verifiedDocuments.length > 0 &&
                                  verifiedDocuments.map((doc) => (
                                    <span
                                      key={doc}
                                      className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700"
                                    >
                                      {formatDocumentType(doc)}
                                    </span>
                                  ))}

                                {waivedDocuments.length > 0 &&
                                  waivedDocuments.map((doc) => (
                                    <span
                                      key={`waived-${doc}`}
                                      className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-200"
                                    >
                                      {formatDocumentType(doc)} — Waived
                                    </span>
                                  ))}

                                {verifiedDocuments.length === 0 &&
                                waivedDocuments.length === 0 ? (
                                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                                    None verified
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                              <p className="mb-2 text-xs font-bold uppercase text-slate-500">
                                Missing Documents
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {!hasSupportedTransaction ? (
                                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                                    Transaction Type missing or unsupported
                                  </span>
                                ) : missingDocuments.length > 0 ? (
                                  missingDocuments.map((doc) => (
                                    <div
                                      key={doc}
                                      className="inline-flex items-center gap-2 rounded-full bg-red-100 py-1 pl-3 pr-1 text-xs font-bold text-red-700"
                                    >
                                      <span>{formatDocumentType(doc)}</span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          waiveDocumentRequirement(client, doc)
                                        }
                                        disabled={loading}
                                        className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-orange-700 ring-1 ring-orange-200 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        Waive
                                      </button>
                                    </div>
                                  ))
                                ) : (
                                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                                    None
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
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

                            <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
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

                        <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-2 2xl:grid-cols-3">
                          {files.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-bold text-slate-500 md:col-span-2 2xl:col-span-3">
                              No documents have been uploaded for this client
                              yet.
                            </div>
                          ) : (
                            files.map((file) => (
                              <div
                                key={`${file.id}-${file.fileName}`}
                                className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EE6521] text-white shadow-sm">
                                    <FaFileAlt />
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold uppercase tracking-wide text-orange-600">
                                      {formatDocumentType(file.documentType)}
                                    </p>

                                    <h4 className="mt-1 break-words text-sm font-extrabold leading-5 text-slate-900">
                                      {file.fileName || "No file name"}
                                    </h4>

                                    <p className="mt-1 text-xs text-slate-500">
                                      Submitted: {file.submittedAt || "N/A"}
                                    </p>

                                    <span
                                      className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-extrabold ${getDocumentStatusStyle(
                                        file.documentStatus,
                                      )}`}
                                    >
                                      {getDocumentStatusIcon(
                                        file.documentStatus,
                                      )}
                                      {getDocumentStatus(file)}
                                    </span>

                                    {file.remarks && (
                                      <p className="mt-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                                        Remarks: {file.remarks}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                                  <button
                                    type="button"
                                    onClick={() => handlePreview(file)}
                                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700"
                                  >
                                    <FaEye />
                                    View & Compare
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDownload(file)}
                                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#259b8f] px-3 py-2 text-xs font-bold text-white hover:bg-[#1f8178]"
                                  >
                                    <FaDownload />
                                    Download
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateDocumentStatus(file, "verify")
                                    }
                                    disabled={loading}
                                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-green-600 px-3 py-2 text-xs font-bold text-white hover:bg-green-700 disabled:bg-green-300"
                                  >
                                    <FaCheckCircle />
                                    Approve
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateDocumentStatus(file, "reject")
                                    }
                                    disabled={loading}
                                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:bg-red-300"
                                  >
                                    <FaExclamationTriangle />
                                    Reject
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateDocumentStatus(file, "pending")
                                    }
                                    disabled={loading}
                                    className="col-span-2 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#EE6521] px-3 py-2 text-xs font-bold text-white hover:bg-orange-600 disabled:bg-orange-300 sm:col-span-1"
                                  >
                                    <FaSyncAlt />
                                    Mark Pending
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              },
            )}

            {visibleClientFolders.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white/95 p-12 text-center shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
                <FaFolder className="mx-auto text-5xl text-slate-300" />

                <h3 className="mt-4 text-lg font-bold text-slate-900">
                  No client documents found
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Try searching another Unique ID, name, phone, source, loan
                  details, or document type.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {previewFile && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 p-2 sm:p-4">
          <div className="flex h-[96vh] w-full max-w-[1900px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:h-[94vh] sm:rounded-3xl">
            <div className="relative flex shrink-0 flex-col gap-3 border-b border-slate-200 bg-[linear-gradient(135deg,#259b8f,#0f172a)] px-4 py-4 pr-16 text-white sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:pr-5">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                  Document Comparison
                </p>
                <h2 className="mt-1 break-words text-lg font-black text-white sm:text-xl">
                  {previewFile.fileName || "Uploaded Document"}
                </h2>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold text-white/75">
                  <span className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15">
                    {formatDocumentType(previewFile.documentType)}
                  </span>

                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 ${getDocumentStatusStyle(
                      previewFile.documentStatus,
                    )}`}
                  >
                    {getDocumentStatusIcon(previewFile.documentStatus)}
                    {getDocumentStatus(previewFile)}
                  </span>

                  <span className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15">
                    Submitted: {previewFile.submittedAt || "N/A"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClosePreview}
                aria-label="Close file preview"
                className="absolute right-4 top-4 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/15 transition hover:bg-white/20 sm:static"
              >
                <FaTimes />
              </button>
            </div>

            <div className="min-h-0 flex-1 bg-slate-100 p-2 sm:p-4">
              <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="min-h-0 flex-1 overflow-auto bg-slate-200/70 p-2 sm:p-4">
                  <div
                    className={`mb-4 rounded-2xl border px-4 py-3 shadow-sm ${
                      documentComparisonLoading
                        ? "border-cyan-200 bg-cyan-50"
                        : documentComparison?.result === "Matched"
                          ? "border-green-200 bg-green-50"
                          : documentComparison?.result === "NotMatched"
                            ? "border-red-200 bg-red-50"
                            : documentComparison?.result === "NeedsReview"
                              ? "border-amber-200 bg-amber-50"
                              : documentComparisonError
                                ? "border-red-200 bg-red-50"
                                : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        {documentComparisonLoading ? (
                          <FaSyncAlt className="animate-spin text-xl text-cyan-600" />
                        ) : documentComparison?.result === "Matched" ? (
                          <FaCheckCircle className="text-xl text-green-600" />
                        ) : documentComparison?.result === "NotMatched" ? (
                          <FaExclamationTriangle className="text-xl text-red-600" />
                        ) : documentComparison?.result === "NeedsReview" ? (
                          <FaSyncAlt className="text-xl text-amber-600" />
                        ) : documentComparisonError ? (
                          <FaExclamationTriangle className="text-xl text-red-600" />
                        ) : (
                          <FaFileAlt className="text-xl text-slate-400" />
                        )}

                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                            Automatic AI Comparison
                          </p>
                          <p className="mt-1 text-sm font-black text-slate-900">
                            {documentComparisonLoading
                              ? "Comparing both documents..."
                              : documentComparison?.result === "Matched"
                                ? `Likely Match — ${documentComparison.confidencePercent}% confidence`
                                : documentComparison?.result === "NotMatched"
                                  ? `Likely Not a Match — ${documentComparison.confidencePercent}% confidence`
                                  : documentComparison?.result === "NeedsReview"
                                    ? `Needs Admin Review — ${documentComparison.confidencePercent}% confidence`
                                    : documentComparisonError
                                      ? documentComparisonError
                                      : adminReferenceFile
                                        ? "Waiting to run comparison..."
                                        : "Upload an admin reference document to compare."}
                          </p>
                        </div>
                      </div>

                      {adminReferenceFile && !documentComparisonLoading && (
                        <button
                          type="button"
                          onClick={() =>
                            runAutomaticComparison(previewFile, true)
                          }
                          className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-black text-white transition hover:bg-slate-700"
                        >
                          <FaSyncAlt />
                          Run Again
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid min-h-full gap-4 lg:grid-cols-2">
                    <section className="flex min-h-[560px] min-w-0 flex-col overflow-hidden rounded-2xl border border-cyan-200 bg-white shadow-sm">
                      <div className="shrink-0 border-b border-cyan-100 bg-cyan-50 px-4 py-3">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">
                          Client Submitted Document
                        </p>
                        <p className="mt-1 break-all text-sm font-bold text-slate-900">
                          {previewFile.fileName || "Uploaded document"}
                        </p>
                      </div>

                      <div className="min-h-0 flex-1 overflow-auto bg-slate-100 p-2">
                        {previewLoading && (
                          <div className="flex h-full min-h-[420px] items-center justify-center rounded-xl bg-white text-center text-sm font-bold text-slate-500">
                            Loading secure preview...
                          </div>
                        )}

                        {!previewLoading && previewUrl && isImageFile && (
                          <div className="flex h-full min-h-[420px] items-center justify-center rounded-xl bg-white p-2 sm:p-4">
                            <img
                              src={previewUrl}
                              alt={previewFile.fileName || "Preview"}
                              className="max-h-full max-w-full rounded-xl object-contain"
                            />
                          </div>
                        )}

                        {!previewLoading && previewUrl && isPdfFile && (
                          <iframe
                            src={previewUrl}
                            title={previewFile.fileName || "PDF preview"}
                            className="h-full min-h-[520px] w-full rounded-xl bg-white"
                          />
                        )}

                        {!previewLoading && previewUrl && isOfficeFile && (
                          <iframe
                            src={previewUrl}
                            title={
                              previewFile.fileName || "Office document preview"
                            }
                            className="h-full min-h-[520px] w-full rounded-xl bg-white"
                            allowFullScreen
                          />
                        )}

                        {!previewLoading &&
                          previewUrl &&
                          !isImageFile &&
                          !isPdfFile &&
                          !isOfficeFile && (
                            <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-xl bg-white px-4 text-center text-slate-500">
                              <FaFileAlt className="mb-4 text-5xl text-slate-300" />
                              <p className="font-black text-slate-700">
                                Preview is not available for this file type.
                              </p>
                              <p className="mt-2 max-w-md text-sm leading-6">
                                Download or open the file in a new tab to review
                                it.
                              </p>
                              <button
                                type="button"
                                onClick={() =>
                                  window.open(previewUrl, "_blank")
                                }
                                className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-[#259b8f] px-5 py-3 text-sm font-black text-white transition hover:bg-[#1f8178]"
                              >
                                <FaDownload />
                                Open File
                              </button>
                            </div>
                          )}

                        {!previewLoading && !previewUrl && (
                          <div className="flex h-full min-h-[420px] items-center justify-center rounded-xl bg-white text-center text-sm font-bold text-slate-500">
                            No preview available.
                          </div>
                        )}
                      </div>
                    </section>

                    <section className="flex min-h-[560px] min-w-0 flex-col overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
                      <div className="flex shrink-0 flex-col gap-3 border-b border-amber-100 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
                            Admin Reference Document
                          </p>
                          <p className="mt-1 break-all text-sm font-bold text-slate-900">
                            {adminReferenceFile?.fileName ||
                              "No reference file uploaded"}
                          </p>
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-2">
                          <label
                            className={`inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-xs font-black text-white transition hover:bg-amber-700 ${
                              adminReferenceUploading
                                ? "pointer-events-none opacity-60"
                                : ""
                            }`}
                          >
                            <FaFileAlt />
                            {adminReferenceUploading
                              ? "Uploading..."
                              : adminReferenceFile
                                ? "Replace Reference"
                                : "Upload Reference"}
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                              onChange={handleAdminReferenceUpload}
                              disabled={adminReferenceUploading}
                              className="hidden"
                            />
                          </label>

                          {adminReferenceFile && (
                            <button
                              type="button"
                              onClick={handleRemoveAdminReference}
                              disabled={adminReferenceUploading}
                              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-black text-red-700 ring-1 ring-red-200 transition hover:bg-red-50 disabled:opacity-50"
                            >
                              <FaTimes />
                              Remove
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="min-h-0 flex-1 overflow-auto bg-slate-100 p-2">
                        {adminReferenceLoading && (
                          <div className="flex h-full min-h-[420px] items-center justify-center rounded-xl bg-white text-center text-sm font-bold text-slate-500">
                            Loading admin reference...
                          </div>
                        )}

                        {!adminReferenceLoading && adminReferenceError && (
                          <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-red-200 bg-red-50 px-6 text-center">
                            <FaExclamationTriangle className="mb-4 text-5xl text-red-300" />
                            <p className="font-black text-red-800">
                              Unable to load the admin reference.
                            </p>
                            <p className="mt-2 max-w-lg break-words text-sm leading-6 text-red-600">
                              {adminReferenceError}
                            </p>
                          </div>
                        )}

                        {!adminReferenceLoading &&
                          !adminReferenceError &&
                          adminReferenceFile &&
                          isAdminReferenceImage && (
                            <div className="flex h-full min-h-[420px] items-center justify-center rounded-xl bg-white p-2 sm:p-4">
                              <img
                                src={adminReferenceFile.previewUrl}
                                alt={adminReferenceFile.fileName}
                                className="max-h-full max-w-full rounded-xl object-contain"
                              />
                            </div>
                          )}

                        {!adminReferenceLoading &&
                          !adminReferenceError &&
                          adminReferenceFile &&
                          isAdminReferencePdf && (
                            <iframe
                              src={adminReferenceFile.previewUrl}
                              title={`${adminReferenceFile.fileName} admin reference`}
                              className="h-full min-h-[520px] w-full rounded-xl bg-white"
                            />
                          )}

                        {!adminReferenceLoading &&
                          !adminReferenceError &&
                          adminReferenceFile &&
                          !isAdminReferenceImage &&
                          !isAdminReferencePdf && (
                            <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-xl bg-white px-4 text-center text-slate-500">
                              <FaFileAlt className="mb-4 text-5xl text-slate-300" />
                              <p className="font-black text-slate-700">
                                Preview is not available for this reference
                                file.
                              </p>
                              <button
                                type="button"
                                onClick={() =>
                                  window.open(
                                    adminReferenceFile.previewUrl,
                                    "_blank",
                                  )
                                }
                                className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 py-3 text-sm font-black text-white transition hover:bg-amber-700"
                              >
                                <FaEye />
                                Open Reference File
                              </button>
                            </div>
                          )}

                        {!adminReferenceLoading &&
                          !adminReferenceError &&
                          !adminReferenceFile && (
                            <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-amber-200 bg-amber-50/60 px-6 text-center">
                              <FaFileAlt className="mb-4 text-5xl text-amber-300" />
                              <p className="font-black text-slate-800">
                                No admin reference for this document type.
                              </p>
                              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                                Use Upload Reference above. The file will be
                                saved privately for this client and document
                                type.
                              </p>
                            </div>
                          )}
                      </div>
                    </section>
                  </div>

                  <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                          Automatic AI Comparison
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-600">
                          Document Intelligence checks type signals, text, and
                          layout. An administrator still makes the final
                          approval decision.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          runAutomaticComparison(previewFile, true)
                        }
                        disabled={
                          documentComparisonLoading ||
                          adminReferenceLoading ||
                          !adminReferenceFile
                        }
                        className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-black text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        <FaSyncAlt
                          className={
                            documentComparisonLoading ? "animate-spin" : ""
                          }
                        />
                        {documentComparisonLoading
                          ? "Comparing..."
                          : "Run Comparison"}
                      </button>
                    </div>

                    <div className="p-4">
                      {documentComparisonLoading && (
                        <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-4 text-sm font-bold text-cyan-800">
                          Extracting and comparing both documents. This can take
                          several seconds.
                        </div>
                      )}

                      {!documentComparisonLoading &&
                        documentComparisonError && (
                          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-semibold text-red-700">
                            {documentComparisonError}
                          </div>
                        )}

                      {!documentComparisonLoading && documentComparison && (
                        <div
                          className={`rounded-xl border px-4 py-4 ${
                            documentComparison.result === "Matched"
                              ? "border-green-200 bg-green-50"
                              : documentComparison.result === "NotMatched"
                                ? "border-red-200 bg-red-50"
                                : "border-amber-200 bg-amber-50"
                          }`}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                              {documentComparison.result === "Matched" ? (
                                <FaCheckCircle className="text-2xl text-green-600" />
                              ) : documentComparison.result === "NotMatched" ? (
                                <FaExclamationTriangle className="text-2xl text-red-600" />
                              ) : (
                                <FaSyncAlt className="text-2xl text-amber-600" />
                              )}

                              <div>
                                <p className="text-base font-black text-slate-900">
                                  {documentComparison.result === "Matched"
                                    ? "Likely Match"
                                    : documentComparison.result === "NotMatched"
                                      ? "Likely Not a Match"
                                      : "Needs Admin Review"}
                                </p>
                                <p className="text-sm font-semibold text-slate-600">
                                  Confidence:{" "}
                                  {documentComparison.confidencePercent}%
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                              <div className="rounded-lg bg-white/80 px-3 py-2 ring-1 ring-slate-200">
                                <p className="font-black text-slate-900">
                                  {Math.round(
                                    documentComparison.keywordScore * 100,
                                  )}
                                  %
                                </p>
                                <p className="font-semibold text-slate-500">
                                  Type
                                </p>
                              </div>
                              <div className="rounded-lg bg-white/80 px-3 py-2 ring-1 ring-slate-200">
                                <p className="font-black text-slate-900">
                                  {Math.round(
                                    documentComparison.textSimilarity * 100,
                                  )}
                                  %
                                </p>
                                <p className="font-semibold text-slate-500">
                                  Text
                                </p>
                              </div>
                              <div className="rounded-lg bg-white/80 px-3 py-2 ring-1 ring-slate-200">
                                <p className="font-black text-slate-900">
                                  {Math.round(
                                    documentComparison.layoutSimilarity * 100,
                                  )}
                                  %
                                </p>
                                <p className="font-semibold text-slate-500">
                                  Layout
                                </p>
                              </div>
                            </div>
                          </div>

                          {documentComparison.reasons.length > 0 && (
                            <ul className="mt-4 space-y-1 text-sm font-semibold leading-6 text-slate-700">
                              {documentComparison.reasons.map(
                                (reason, index) => (
                                  <li key={`${reason}-${index}`}>• {reason}</li>
                                ),
                              )}
                            </ul>
                          )}
                        </div>
                      )}

                      {!documentComparisonLoading &&
                        !documentComparisonError &&
                        !documentComparison && (
                          <p className="text-sm font-semibold text-slate-500">
                            {adminReferenceFile
                              ? "The automatic comparison will run when both files are loaded."
                              : "Upload an admin reference document to enable automatic comparison."}
                          </p>
                        )}
                    </div>
                  </section>
                </div>

                <div className="shrink-0 border-t border-slate-200 bg-white p-3 sm:p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <p className="break-all text-sm font-black text-slate-900">
                        {previewFile.fileName || "No file selected"}
                      </p>

                      {previewFile.remarks && (
                        <p className="mt-1 break-words text-xs font-semibold leading-5 text-slate-500">
                          Remarks: {previewFile.remarks}
                        </p>
                      )}
                    </div>

                    <div className="grid w-full gap-2 sm:grid-cols-2 lg:w-auto lg:grid-cols-4">
                      <button
                        type="button"
                        onClick={() => handleDownload(previewFile)}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#259b8f] px-4 py-2 text-sm font-black text-white transition hover:bg-[#1f8178]"
                      >
                        <FaDownload />
                        Download
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          updateDocumentStatus(previewFile, "verify")
                        }
                        disabled={
                          loading ||
                          adminReferenceLoading ||
                          !adminReferenceFile
                        }
                        title={
                          adminReferenceFile
                            ? "Mark the client document as matched and verified"
                            : "Upload an admin reference before marking the documents as matched"
                        }
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-black text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-300"
                      >
                        <FaCheckCircle />
                        Documents Match
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          updateDocumentStatus(previewFile, "reject")
                        }
                        disabled={loading}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                      >
                        <FaExclamationTriangle />
                        Does Not Match
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          updateDocumentStatus(previewFile, "pending")
                        }
                        disabled={loading}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#EE6521] px-4 py-2 text-sm font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
                      >
                        <FaSyncAlt />
                        Pending
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}