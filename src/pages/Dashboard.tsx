import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  FaBriefcase,
  FaCheckCircle,
  FaDownload,
  FaExclamationTriangle,
  FaEye,
  FaFileAlt,
  FaPhone,
  FaSearch,
  FaTimes,
  FaUserFriends,
} from "react-icons/fa";
import DashboardLayout from "../components/layout/layout";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  "https://docsuploadpythonapi.azurewebsites.net/api"
).replace(/\/+$/, "");
const CLIENTS_API = `${API_BASE}/clients`;
const FILE_URL_API = `${API_BASE}/file-url`;

type DocumentOption = {
  label: string;
  value: string;
};

type NormalizedTransactionType = "alt_doc" | "full_doc";
type DocumentReviewStatus = "Approved" | "Pending" | "Rejected";

const sharedDocumentTypes: DocumentOption[] = [
  {
    label: "Last 6 Months Mortgage Statements",
    value: "last-6-months-mortgage-statements",
  },
  { label: "Council Rates Notice", value: "council-rates-notice" },
];

const transactionDocumentTypes: Record<NormalizedTransactionType, DocumentOption[]> = {
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

const documentLabels = Object.fromEntries(
  allDocumentTypes.map((document) => [document.value, document.label]),
) as Record<string, string>;

const normalizeTransactionType = (transactionType?: string): NormalizedTransactionType | "" => {
  const normalized = (transactionType || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (normalized === "alt" || normalized === "alt_doc" || normalized === "altdoc") {
    return "alt_doc";
  }

  if (normalized === "full" || normalized === "full_doc" || normalized === "fulldoc") {
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
    documentLabels[normalizedType] ||
    documentType
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
};

const panelClass =
  "overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.07)]";

type Client = {
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

  vedaIssues?: string;
  conductIssues?: string;
  clientNeedsObjectives?: string;
  applicantBackground?: string;
  explanationOfIncome?: string;
  security?: string;

  loanAmount?: string | number | null;
  securityValue?: string | number | null;
  lvr?: string | number | null;
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
  documentStatus?: string;
  verifiedBy?: string;
  verifiedDate?: string;
  remarks?: string;
};

type RawClient = Record<string, unknown>;

const getFirstValue = (source: RawClient, keys: string[]) => {
  for (const key of keys) {
    const value = source[key];

    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }

  return undefined;
};

const toOptionalString = (value: unknown): string | undefined => {
  if (value === undefined || value === null) return undefined;

  const text = String(value).trim();
  return text || undefined;
};

const normalizeClientFromApi = (client: RawClient): Client => {
  const referrerSource =
    client.referrer && typeof client.referrer === "object"
      ? (client.referrer as RawClient)
      : {};

  const normalized: Client = {
    id: Number(
      getFirstValue(client, ["id", "Id", "documentId", "DocumentId"]) || 0,
    ),
    clientId: Number(
      getFirstValue(client, ["clientId", "ClientId", "clientID", "ClientID"]) ||
        0,
    ),
    uniqueId: toOptionalString(
      getFirstValue(client, ["uniqueId", "UniqueId", "unique_id", "UNIQUE_ID"]),
    ),
    firstName: toOptionalString(
      getFirstValue(client, [
        "firstName",
        "FirstName",
        "first_name",
        "FIRST_NAME",
      ]),
    ),
    middleName: toOptionalString(
      getFirstValue(client, [
        "middleName",
        "MiddleName",
        "middle_name",
        "MIDDLE_NAME",
      ]),
    ),
    lastName: toOptionalString(
      getFirstValue(client, ["lastName", "LastName", "last_name", "LAST_NAME"]),
    ),
    name: toOptionalString(
      getFirstValue(client, [
        "name",
        "Name",
        "fullName",
        "FullName",
        "full_name",
        "FULL_NAME",
      ]),
    ),
    email: toOptionalString(getFirstValue(client, ["email", "Email", "EMAIL"])),
    phone: toOptionalString(
      getFirstValue(client, [
        "phone",
        "Phone",
        "mobile",
        "Mobile",
        "PHONE",
        "MOBILE",
      ]),
    ),
    leadType: toOptionalString(
      getFirstValue(client, ["leadType", "LeadType", "lead_type", "LEAD_TYPE"]),
    ),
    source: toOptionalString(
      getFirstValue(client, [
        "source",
        "Source",
        "SOURCE",
        "applicationSource",
        "ApplicationSource",
        "application_source",
        "Application_Source",
      ]),
    ),
    status: toOptionalString(getFirstValue(client, ["status", "Status"])),

    classificationType: toOptionalString(
      getFirstValue(client, [
        "classificationType",
        "ClassificationType",
        "classification_type",
        "Classification_Type",
      ]),
    ),
    borrowerType: toOptionalString(
      getFirstValue(client, [
        "borrowerType",
        "BorrowerType",
        "borrower_type",
        "Borrower_Type",
      ]),
    ),
    objective: toOptionalString(
      getFirstValue(client, ["objective", "Objective", "OBJECTIVE"]),
    ),
    loanType: toOptionalString(
      getFirstValue(client, ["loanType", "LoanType", "loan_type", "Loan_Type"]),
    ),
    purpose: toOptionalString(
      getFirstValue(client, ["purpose", "Purpose", "PURPOSE"]),
    ),
    transactionType: toOptionalString(
      getFirstValue(client, [
        "transactionType",
        "TransactionType",
        "transaction_type",
        "Transaction_Type",
      ]),
    ),
    withBorrowersGuarantors: toOptionalString(
      getFirstValue(client, [
        "withBorrowersGuarantors",
        "WithBorrowersGuarantors",
        "with_borrowers_guarantors",
        "with_borrowers__guarantors",
        "WithBorrowers_Guarantors",
      ]),
    ),

    vedaIssues: toOptionalString(
      getFirstValue(client, [
        "vedaIssues",
        "VedaIssues",
        "veda_issues",
        "Veda_Issues",
      ]),
    ),
    conductIssues: toOptionalString(
      getFirstValue(client, [
        "conductIssues",
        "ConductIssues",
        "conduct_issues",
        "Conduct_Issues",
      ]),
    ),
    clientNeedsObjectives: toOptionalString(
      getFirstValue(client, [
        "clientNeedsObjectives",
        "ClientNeedsObjectives",
        "client_needs_objectives",
        "Client_Needs_Objectives",
      ]),
    ),
    applicantBackground: toOptionalString(
      getFirstValue(client, [
        "applicantBackground",
        "ApplicantBackground",
        "applicant_background",
        "Applicant_Background",
      ]),
    ),
    explanationOfIncome: toOptionalString(
      getFirstValue(client, [
        "explanationOfIncome",
        "ExplanationOfIncome",
        "explanation_of_income",
        "Explanation_Of_Income",
      ]),
    ),
    security: toOptionalString(
      getFirstValue(client, ["security", "Security", "SECURITY"]),
    ),
    loanAmount:
      toOptionalString(
        getFirstValue(client, [
          "loanAmount",
          "LoanAmount",
          "loan_amount",
          "Loan_Amount",
        ]),
      ) || null,
    securityValue:
      toOptionalString(
        getFirstValue(client, [
          "securityValue",
          "SecurityValue",
          "security_value",
          "Security_Value",
        ]),
      ) || null,
    lvr: toOptionalString(getFirstValue(client, ["lvr", "Lvr", "LVR"])) || null,
    anticipatedSettlementDate: toOptionalString(
      getFirstValue(client, [
        "anticipatedSettlementDate",
        "AnticipatedSettlementDate",
        "anticipated_settlement_date",
        "Anticipated_Settlement_Date",
        "settlementDate",
        "SettlementDate",
        "settlement_date",
        "Settlement_Date",
      ]),
    ),
    specialNotes: toOptionalString(
      getFirstValue(client, [
        "specialNotes",
        "SpecialNotes",
        "special_notes",
        "Special_Notes",
      ]),
    ),

    referrer: {
      firstName: toOptionalString(
        getFirstValue(referrerSource, ["firstName", "FirstName"]) ||
          getFirstValue(client, [
            "referrerFirstName",
            "ReferrerFirstName",
            "referrer_first_name",
            "Referrer_First_Name",
          ]),
      ),
      middleName: toOptionalString(
        getFirstValue(referrerSource, ["middleName", "MiddleName"]) ||
          getFirstValue(client, [
            "referrerMiddleName",
            "ReferrerMiddleName",
            "referrer_middle_name",
            "Referrer_Middle_Name",
          ]),
      ),
      lastName: toOptionalString(
        getFirstValue(referrerSource, ["lastName", "LastName"]) ||
          getFirstValue(client, [
            "referrerLastName",
            "ReferrerLastName",
            "referrer_last_name",
            "Referrer_Last_Name",
          ]),
      ),
      phone: toOptionalString(
        getFirstValue(referrerSource, ["phone", "Phone", "mobile", "Mobile"]) ||
          getFirstValue(client, [
            "referrerPhone",
            "ReferrerPhone",
            "referrer_phone",
            "Referrer_Phone",
            "referrerMobile",
            "ReferrerMobile",
            "referrer_mobile",
            "Referrer_Mobile",
          ]),
      ),
      email: toOptionalString(
        getFirstValue(referrerSource, ["email", "Email"]) ||
          getFirstValue(client, [
            "referrerEmail",
            "ReferrerEmail",
            "referrer_email",
            "Referrer_Email",
          ]),
      ),
    },

    documentType: toOptionalString(
      getFirstValue(client, [
        "documentType",
        "DocumentType",
        "document_type",
        "Document_Type",
      ]),
    ),
    fileName: toOptionalString(
      getFirstValue(client, ["fileName", "FileName", "file_name", "File_Name"]),
    ),
    fileUrl: toOptionalString(
      getFirstValue(client, [
        "fileUrl",
        "FileUrl",
        "file_url",
        "File_Url",
        "blobUrl",
        "BlobUrl",
        "blob_url",
        "Blob_Url",
      ]),
    ),
    submittedAt: toOptionalString(
      getFirstValue(client, [
        "submittedAt",
        "SubmittedAt",
        "submitted_at",
        "Submitted_At",
        "uploadedAt",
        "UploadedAt",
        "uploaded_at",
        "Uploaded_At",
      ]),
    ),
    documentStatus:
      toOptionalString(
        getFirstValue(client, [
          "documentStatus",
          "DocumentStatus",
          "document_status",
          "Document_Status",
          "status",
          "Status",
        ]),
      ) || "Pending",
    verifiedBy: toOptionalString(
      getFirstValue(client, [
        "verifiedBy",
        "VerifiedBy",
        "verified_by",
        "Verified_By",
      ]),
    ),
    verifiedDate: toOptionalString(
      getFirstValue(client, [
        "verifiedDate",
        "VerifiedDate",
        "verified_date",
        "Verified_Date",
      ]),
    ),
    remarks: toOptionalString(
      getFirstValue(client, [
        "remarks",
        "Remarks",
        "adminRemarks",
        "AdminRemarks",
        "admin_remarks",
      ]),
    ),
  };

  return normalized;
};

type ClientGroup = {
  key: string;
  client: Client;
  files: Client[];
  requiredDocuments: string[];
  uploadedDocuments: string[];
  missingDocuments: string[];
  approvedDocuments: string[];
  rejectedDocuments: string[];
  pendingDocuments: string[];
  hasSupportedTransaction: boolean;
  isComplete: boolean;
  progress: number;
};

export default function Clients() {
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [loading, setLoading] = useState(true);
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

  const loadClients = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(CLIENTS_API);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load clients.");
      }

      setClients(
        (result.clients || []).map((client: RawClient) =>
          normalizeClientFromApi(client),
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load clients.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const getFullName = (client: Client) =>
    (
      client.name ||
      `${client.firstName || ""} ${client.middleName || ""} ${
        client.lastName || ""
      }`
    )
      .replace(/\s+/g, " ")
      .trim();

  const normalizeSource = (type?: string) =>
    (type || "").trim().toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");

  const formatSource = (type?: string) => {
    const value = normalizeSource(type);

    if (value === "broker" || value === "business_owner") return "Broker";
    if (value === "referral" || value === "referrer") return "Referral";
    if (value === "direct_client" || value === "directclient")
      return "Direct Client";

    return type || "-";
  };

  const getStatus = (client: Client) => client.status || "Pending Team Call";

  const getDocumentStatus = (client: Client): DocumentReviewStatus => {
    const value = (client.documentStatus || "Pending").trim();
    const normalized = value.toLowerCase();

    if (["approved", "verified", "complete"].includes(normalized))
      return "Approved";
    if (["rejected", "declined"].includes(normalized)) return "Rejected";
    return "Pending";
  };

  const getDocumentStatusClass = (status?: string) => {
    const normalized = (status || "").toLowerCase();

    if (normalized === "approved") return "bg-green-100 text-green-700";
    if (normalized === "rejected") return "bg-red-100 text-red-700";
    return "bg-orange-100 text-orange-700";
  };

  const getDocumentStatusIcon = (status?: string) => {
    const normalized = (status || "").toLowerCase();

    if (normalized === "approved") return <FaCheckCircle />;
    if (normalized === "rejected") return <FaExclamationTriangle />;
    return <FaFileAlt />;
  };

  const getDetailLabel = (client: Client) =>
    formatSource(client.source || client.leadType) === "Broker"
      ? "Broker"
      : "Referral";

  const displayValue = (value?: string | number | null) =>
    value === undefined || value === null || String(value).trim() === ""
      ? "-"
      : value;

  const hasValue = (value: unknown) =>
    value !== undefined && value !== null && String(value).trim() !== "";

  const mergeClientRows = (rows: Client[]) => {
    const merged = { ...rows[0] };

    rows.forEach((row) => {
      (Object.keys(row) as Array<keyof Client>).forEach((key) => {
        const value = row[key];

        if (key === "referrer" && value && typeof value === "object") {
          const currentReferrer = merged.referrer || {};
          const nextReferrer = value as Client["referrer"];

          merged.referrer = {
            ...currentReferrer,
            ...(hasValue(nextReferrer?.firstName)
              ? { firstName: nextReferrer?.firstName }
              : {}),
            ...(hasValue(nextReferrer?.middleName)
              ? { middleName: nextReferrer?.middleName }
              : {}),
            ...(hasValue(nextReferrer?.lastName)
              ? { lastName: nextReferrer?.lastName }
              : {}),
            ...(hasValue(nextReferrer?.phone)
              ? { phone: nextReferrer?.phone }
              : {}),
            ...(hasValue(nextReferrer?.email)
              ? { email: nextReferrer?.email }
              : {}),
          };
          return;
        }

        if (hasValue(value)) {
          (merged as Record<string, unknown>)[key as string] = value;
        }
      });
    });

    return merged;
  };

  const clientGroups = useMemo<ClientGroup[]>(() => {
    const map = new Map<string, Client[]>();

    clients.forEach((client) => {
      const key = client.uniqueId || String(client.clientId || client.id);
      if (!map.has(key)) map.set(key, []);
      map.get(key)?.push(client);
    });

    return Array.from(map.entries()).map(([key, clientRows]) => {
      const mergedClient = mergeClientRows(clientRows);
      const documentRows = clientRows.filter(
        (row) => Boolean(row.documentType || row.fileName || row.fileUrl),
      );
      const mergedFiles = documentRows.map((file) =>
        mergeClientRows([mergedClient, file]),
      );
      const requiredDocuments = getRequiredDocuments(
        mergedClient.transactionType,
      );
      const hasSupportedTransaction = requiredDocuments.length > 0;
      const statusByDocument = new Map<string, DocumentReviewStatus>();
      const statusPriority: Record<DocumentReviewStatus, number> = {
        Approved: 3,
        Pending: 2,
        Rejected: 1,
      };

      mergedFiles.forEach((file) => {
        const documentType = normalizeDocumentTypeValue(file.documentType);
        if (!documentType || !requiredDocuments.includes(documentType)) return;

        const nextStatus = getDocumentStatus(file);
        const currentStatus = statusByDocument.get(documentType);

        if (
          !currentStatus ||
          statusPriority[nextStatus] > statusPriority[currentStatus]
        ) {
          statusByDocument.set(documentType, nextStatus);
        }
      });

      const uploadedDocuments = requiredDocuments.filter((document) =>
        statusByDocument.has(document),
      );
      const approvedDocuments = requiredDocuments.filter(
        (document) => statusByDocument.get(document) === "Approved",
      );
      const rejectedDocuments = requiredDocuments.filter(
        (document) => statusByDocument.get(document) === "Rejected",
      );
      const pendingDocuments = requiredDocuments.filter(
        (document) => statusByDocument.get(document) === "Pending",
      );
      const missingDocuments = requiredDocuments.filter(
        (document) => !statusByDocument.has(document),
      );
      const progress = hasSupportedTransaction
        ? Math.round(
            (approvedDocuments.length / requiredDocuments.length) * 100,
          )
        : 0;

      return {
        key,
        client: mergedClient,
        files: mergedFiles,
        requiredDocuments,
        uploadedDocuments,
        missingDocuments,
        approvedDocuments,
        rejectedDocuments,
        pendingDocuments,
        hasSupportedTransaction,
        isComplete:
          hasSupportedTransaction &&
          approvedDocuments.length === requiredDocuments.length,
        progress,
      };
    });
  }, [clients]);

  const filteredGroups = useMemo(() => {
    const searchValue = search.toLowerCase().trim();

    return clientGroups.filter((group) => {
      const client = group.client;
      const fullName = getFullName(client).toLowerCase();
      const source = formatSource(
        client.source || client.leadType,
      ).toLowerCase();
      const status = getStatus(client).toLowerCase();

      return (
        !searchValue ||
        fullName.includes(searchValue) ||
        (client.email || "").toLowerCase().includes(searchValue) ||
        (client.phone || "").toLowerCase().includes(searchValue) ||
        (client.uniqueId || "").toLowerCase().includes(searchValue) ||
        source.includes(searchValue) ||
        status.includes(searchValue) ||
        (client.classificationType || "").toLowerCase().includes(searchValue) ||
        (client.borrowerType || "").toLowerCase().includes(searchValue) ||
        (client.objective || "").toLowerCase().includes(searchValue) ||
        (client.loanType || "").toLowerCase().includes(searchValue) ||
        (client.purpose || "").toLowerCase().includes(searchValue) ||
        (client.transactionType || "").toLowerCase().includes(searchValue) ||
        group.files.some((file) =>
          (file.fileName || "").toLowerCase().includes(searchValue),
        )
      );
    });
  }, [clientGroups, search]);

  const completeCount = clientGroups.filter((group) => group.isComplete).length;
  const incompleteCount = clientGroups.filter(
    (group) => group.hasSupportedTransaction && !group.isComplete,
  ).length;
  const unavailableChecklistCount = clientGroups.filter(
    (group) => !group.hasSupportedTransaction,
  ).length;
  const approvedDocumentCount = clientGroups.reduce(
    (total, group) => total + group.approvedDocuments.length,
    0,
  );
  const rejectedDocumentCount = clientGroups.reduce(
    (total, group) => total + group.rejectedDocuments.length,
    0,
  );
  const pendingDocumentCount = clientGroups.reduce(
    (total, group) => total + group.pendingDocuments.length,
    0,
  );

  const brokerCount = clientGroups.filter(
    (group) =>
      formatSource(group.client.source || group.client.leadType) === "Broker",
  ).length;

  const referralCount = clientGroups.filter(
    (group) =>
      formatSource(group.client.source || group.client.leadType) === "Referral",
  ).length;

  const directClientCount = clientGroups.filter(
    (group) =>
      formatSource(group.client.source || group.client.leadType) ===
      "Direct Client",
  ).length;

  const handlePreview = async (client: Client) => {
    try {
      setSelectedClient(client);
      setPreviewUrl("");
      setPreviewLoading(true);

      const secureUrl = await getSecureFileUrl(client.fileUrl);
      setPreviewUrl(secureUrl);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to open file.");
      setSelectedClient(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = async (client: Client) => {
    try {
      const secureUrl = await getSecureFileUrl(client.fileUrl);
      window.open(secureUrl, "_blank");
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Failed to download file.",
      );
    }
  };

  const handleClosePreview = () => {
    setSelectedClient(null);
    setPreviewUrl("");
  };

  const isImageFile = selectedClient?.fileName
    ?.toLowerCase()
    .match(/\.(jpg|jpeg|png|gif|webp)$/);

  const isPdfFile = selectedClient?.fileName?.toLowerCase().endsWith(".pdf");

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
      title="Clients"
      subtitle="View submitted clients, source, loan details, and document verification status."
    >
      <div className="mx-auto max-w-[1800px] space-y-6">
        <div className={panelClass}>
          <div className="bg-[linear-gradient(135deg,rgba(37,155,143,0.94),rgba(15,23,42,0.98)_56%,rgba(238,101,33,0.88))] p-5 text-white sm:p-6">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/65">
              Client Dashboard
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">
              Client Submission Overview
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-white/75">
              Search by unique ID, borrower details, source, team status, loan fields, or uploaded file name.
            </p>
          </div>

          <div className="p-5 sm:p-6">
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search unique ID, name, email, phone, source, loan details, status, or file..."
                className="h-14 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#259b8f] focus:bg-white focus:ring-4 focus:ring-[#259b8f]/15"
              />
            </div>
          </div>
        </div>

        {loading && (
          <div className={`${panelClass} p-10 text-center font-bold text-slate-500`}>
            Loading clients from Azure...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
              <StatCard
                label="Clients"
                value={clientGroups.length}
                icon={<FaFileAlt />}
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
                icon={<FaFileAlt />}
                className="border-cyan-200 bg-cyan-50 text-cyan-700"
              />
              <StatCard
                label="Complete"
                value={completeCount}
                icon={<FaCheckCircle />}
                className="border-green-200 bg-green-50 text-green-700"
              />
              <StatCard
                label="Incomplete"
                value={incompleteCount}
                icon={<FaExclamationTriangle />}
                className="border-red-200 bg-red-50 text-red-700"
              />
              <StatCard
                label="Checklist Unavailable"
                value={unavailableChecklistCount}
                icon={<FaExclamationTriangle />}
                className="border-slate-200 bg-slate-50 text-slate-700"
              />
              <StatCard
                label="Approved Docs"
                value={approvedDocumentCount}
                icon={<FaCheckCircle />}
                className="border-emerald-200 bg-emerald-50 text-emerald-700"
              />
              <StatCard
                label="Pending Docs"
                value={pendingDocumentCount}
                icon={<FaFileAlt />}
                className="border-orange-200 bg-orange-50 text-orange-700"
              />
              <StatCard
                label="Rejected Docs"
                value={rejectedDocumentCount}
                icon={<FaExclamationTriangle />}
                className="border-rose-200 bg-rose-50 text-rose-700"
              />
            </div>

            <div className="space-y-4 lg:hidden">
              {filteredGroups.map((group) => {
                const sourceLabel = formatSource(
                  group.client.source || group.client.leadType,
                );

                return (
                  <div
                    key={group.key}
                    className={`${panelClass} p-5`}
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase text-slate-400">
                          {group.client.uniqueId || "-"}
                        </p>
                        <h3 className="mt-1 break-words text-xl font-black text-slate-900">
                          {getFullName(group.client) || "-"}
                        </h3>

                        <p className="mt-1 break-words text-sm text-slate-500">
                          {group.client.email || "No email"}
                        </p>

                        <p className="mt-1 flex items-center gap-2 break-words text-xs text-slate-400">
                          <FaPhone />
                          {group.client.phone || "No phone"}
                        </p>
                      </div>

                      <span
                        className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-black ${
                          !group.hasSupportedTransaction
                            ? "bg-slate-200 text-slate-700"
                            : group.isComplete
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {!group.hasSupportedTransaction
                          ? "Checklist unavailable"
                          : group.isComplete
                            ? "Complete"
                            : "Incomplete"}
                      </span>
                    </div>

                    <div className="mb-4 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black ${
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

                      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700 ring-1 ring-orange-200">
                        {getStatus(group.client)}
                      </span>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                        {group.files.length} file
                        {group.files.length !== 1 ? "s" : ""}
                      </span>

                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-700">
                        Approved: {group.approvedDocuments.length}
                      </span>

                      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700">
                        Pending: {group.pendingDocuments.length}
                      </span>

                      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">
                        Rejected: {group.rejectedDocuments.length}
                      </span>
                    </div>

                    <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm leading-6 text-slate-600">
                      <p>
                        <strong className="text-slate-700">Classification:</strong>{" "}
                        {group.client.classificationType || "-"}
                      </p>
                      <p>
                        <strong className="text-slate-700">Borrower:</strong>{" "}
                        {group.client.borrowerType || "-"}
                      </p>
                      <p>
                        <strong className="text-slate-700">Objective:</strong>{" "}
                        {group.client.objective || "-"}
                      </p>
                      <p>
                        <strong className="text-slate-700">Loan Type:</strong>{" "}
                        {group.client.loanType || "-"}
                      </p>
                    </div>

                    <div className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4">
                      <div className="grid grid-cols-3 gap-2 text-xs font-black">
                        <p className="rounded-lg bg-green-50 px-2 py-2 text-center text-green-700">
                          Approved {group.approvedDocuments.length}
                        </p>
                        <p className="rounded-lg bg-orange-50 px-2 py-2 text-center text-orange-700">
                          Pending {group.pendingDocuments.length}
                        </p>
                        <p className="rounded-lg bg-red-50 px-2 py-2 text-center text-red-700">
                          Rejected {group.rejectedDocuments.length}
                        </p>
                      </div>

                      <div>
                        <div className="mb-2 flex justify-between text-sm font-black text-slate-500">
                          <span>Document Progress</span>
                          <span>{group.progress}%</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-[linear-gradient(90deg,#259b8f,#EE6521)]"
                            style={{ width: `${group.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 text-sm">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-bold uppercase text-slate-400">
                          Unique ID
                        </p>
                        <p className="mt-1 font-semibold text-slate-800">
                          {group.client.uniqueId || "-"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-bold uppercase text-slate-400">
                          Uploaded
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {group.uploadedDocuments.length > 0 ? (
                            group.uploadedDocuments.map((doc) => (
                              <span
                                key={doc}
                                className="rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-700"
                              >
                                {formatDocumentType(doc)}
                              </span>
                            ))
                          ) : (
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500">
                              None
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-bold uppercase text-slate-400">
                          Missing
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {!group.hasSupportedTransaction ? (
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                              Transaction Type missing or unsupported
                            </span>
                          ) : group.missingDocuments.length > 0 ? (
                            group.missingDocuments.map((doc) => (
                              <span
                                key={doc}
                                className="rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-700"
                              >
                                {formatDocumentType(doc)}
                              </span>
                            ))
                          ) : (
                            <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-700">
                              None
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {group.files.slice(0, 1).map((file) => (
                        <div
                          key={`${file.id}-${file.fileName}`}
                          className="contents"
                        >
                          <span
                            className={`col-span-2 inline-flex h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-black ${getDocumentStatusClass(
                              getDocumentStatus(file),
                            )}`}
                          >
                            {getDocumentStatusIcon(getDocumentStatus(file))}
                            {getDocumentStatus(file)}
                          </span>

                          <button
                            type="button"
                            onClick={() => handlePreview(file)}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 text-sm font-bold text-white hover:bg-slate-800"
                          >
                            <FaEye />
                            View
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownload(file)}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#EE6521] text-sm font-bold text-white hover:bg-orange-600"
                          >
                            <FaDownload />
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={`${panelClass} hidden lg:block`}>
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-5">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    Client List
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {filteredGroups.length} client
                    {filteredGroups.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <FaFileAlt className="text-2xl text-[#EE6521]" />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1720px] table-fixed">
                  <colgroup>
                    <col className="w-[8%]" />
                    <col className="w-[8%]" />
                    <col className="w-[10%]" />
                    <col className="w-[13%]" />
                    <col className="w-[14%]" />
                    <col className="w-[8%]" />
                    <col className="w-[8%]" />
                    <col className="w-[8%]" />
                    <col className="w-[7%]" />
                    <col className="w-[8%]" />
                    <col className="w-[8%]" />
                    <col className="w-[4%]" />
                    <col className="w-[12%]" />
                  </colgroup>
                  <thead className="bg-slate-50/90">
                    <tr>
                      {[
                        "Unique ID",
                        "Source",
                        "Name",
                        "Email / Phone",
                        "Loan Details",
                        "Team Status",
                        "Docs Status",
                        "Verification",
                        "Progress",
                        "Uploaded",
                        "Missing",
                        "Files",
                        "Action",
                      ].map((header) => (
                        <th
                          key={header}
                          className={`px-4 py-4 text-xs font-black uppercase tracking-wide text-slate-500 ${
                            header === "Action" ? "text-center" : "text-left"
                          }`}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {filteredGroups.map((group) => {
                      const sourceLabel = formatSource(
                        group.client.source || group.client.leadType,
                      );

                      return (
                        <tr key={group.key} className="align-middle transition hover:bg-slate-50">
                          <td className="px-4 py-6 text-sm font-bold leading-tight text-slate-700">
                            {group.client.uniqueId || "-"}
                          </td>

                          <td className="px-4 py-6">
                            <span
                              className={`inline-flex max-w-full items-center gap-2 rounded-full px-3 py-2 text-xs font-black leading-tight ${
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
                          </td>

                          <td className="px-4 py-6">
                            <p className="break-words text-base font-black leading-snug text-slate-900">
                              {getFullName(group.client) || "-"}
                            </p>
                          </td>

                          <td className="px-4 py-6 text-sm text-slate-600">
                            <p className="break-words font-semibold">{group.client.email || "-"}</p>
                            <p className="mt-2 flex items-center gap-2 break-words text-xs font-semibold text-slate-400">
                              <FaPhone />
                              {group.client.phone || "No phone"}
                            </p>
                          </td>

                          <td className="px-4 py-6 text-sm leading-6 text-slate-600">
                            <p>
                              <span className="font-black text-slate-700">Class:</span>{" "}
                              {group.client.classificationType || "-"}
                            </p>
                            <p>
                              <span className="font-black text-slate-700">Borrower:</span>{" "}
                              {group.client.borrowerType || "-"}
                            </p>
                            <p>
                              <span className="font-black text-slate-700">Objective:</span>{" "}
                              {group.client.objective || "-"}
                            </p>
                            <p>
                              <span className="font-black text-slate-700">Loan:</span>{" "}
                              {group.client.loanType || "-"}
                            </p>
                          </td>

                          <td className="px-4 py-6">
                            <span className="inline-flex max-w-full rounded-full bg-orange-100 px-3 py-2 text-xs font-black leading-snug text-orange-700 ring-1 ring-orange-200">
                              {getStatus(group.client)}
                            </span>
                          </td>

                          <td className="px-4 py-6">
                            <span
                              className={`inline-flex max-w-full items-center gap-2 rounded-full px-3 py-2 text-xs font-black ${
                                !group.hasSupportedTransaction
                                  ? "bg-slate-200 text-slate-700"
                                  : group.isComplete
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {group.isComplete ? (
                                <FaCheckCircle />
                              ) : (
                                <FaExclamationTriangle />
                              )}
                              {!group.hasSupportedTransaction
                                ? "Checklist unavailable"
                                : group.isComplete
                                  ? "Complete"
                                  : "Incomplete"}
                            </span>
                          </td>

                          <td className="px-4 py-6">
                            <div className="grid gap-1 text-[11px] font-black">
                              <span className="rounded-lg bg-green-50 px-2 py-1 text-green-700">
                                A {group.approvedDocuments.length}
                              </span>
                              <span className="rounded-lg bg-orange-50 px-2 py-1 text-orange-700">
                                P {group.pendingDocuments.length}
                              </span>
                              <span className="rounded-lg bg-red-50 px-2 py-1 text-red-700">
                                R {group.rejectedDocuments.length}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-6">
                            <div>
                              <p className="mb-2 text-xs font-black text-slate-500">
                                {group.progress}%
                              </p>
                              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className="h-full rounded-full bg-[linear-gradient(90deg,#259b8f,#EE6521)]"
                                  style={{ width: `${group.progress}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-6">
                            <div className="flex flex-wrap gap-2">
                              {group.uploadedDocuments.length > 0 ? (
                                group.uploadedDocuments.map((doc) => (
                                  <span
                                    key={doc}
                                    className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700"
                                  >
                                    {formatDocumentType(doc)}
                                  </span>
                                ))
                              ) : (
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                                  None
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-6">
                            <div className="flex flex-wrap gap-2">
                              {!group.hasSupportedTransaction ? (
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                                  Transaction Type missing or unsupported
                                </span>
                              ) : group.missingDocuments.length > 0 ? (
                                group.missingDocuments.map((doc) => (
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
                          </td>

                          <td className="px-4 py-6 text-sm font-black text-slate-700">
                            {group.files.length}
                          </td>

                          <td className="px-4 py-6">
                            <div className="flex flex-wrap justify-center gap-2">
                              {group.files.slice(0, 1).map((file) => (
                                <div
                                  key={`${file.id}-${file.fileName}`}
                                  className="contents"
                                >
                                  <span
                                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-black ${getDocumentStatusClass(
                                      getDocumentStatus(file),
                                    )}`}
                                  >
                                    {getDocumentStatusIcon(
                                      getDocumentStatus(file),
                                    )}
                                    {getDocumentStatus(file)}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() => handlePreview(file)}
                                    className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800"
                                  >
                                    <FaEye />
                                    View
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDownload(file)}
                                    className="inline-flex items-center gap-2 rounded-lg bg-[#EE6521] px-3 py-2 text-xs font-bold text-white hover:bg-orange-600"
                                  >
                                    <FaDownload />
                                    Download
                                  </button>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredGroups.length === 0 && (
                      <tr>
                        <td
                          colSpan={13}
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
          </>
        )}
      </div>

      {selectedClient && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 px-3 py-4 sm:px-4">
          <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:rounded-3xl">
            <div className="flex items-center justify-between gap-3 bg-[linear-gradient(135deg,#259b8f,#0f172a)] px-4 py-4 text-white sm:px-6">
              <div className="min-w-0">
                <h2 className="break-words text-xl font-black text-white">
                  Client File Details
                </h2>
                <p className="mt-1 text-sm text-white/70">
                  View submitted client information and uploaded file.
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
                  Client Information
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <InfoBox label="Unique ID" value={selectedClient.uniqueId} />
                  <InfoBox
                    label="Source"
                    value={formatSource(
                      selectedClient.source || selectedClient.leadType,
                    )}
                  />
                  <InfoBox
                    label="Team Status"
                    value={getStatus(selectedClient)}
                  />
                  <InfoBox
                    label="Full Name"
                    value={getFullName(selectedClient)}
                  />
                  <InfoBox label="Email" value={selectedClient.email} />
                  <InfoBox label="Phone" value={selectedClient.phone} />
                  <InfoBox
                    label="Document Type"
                    value={formatDocumentType(selectedClient.documentType)}
                  />
                  <InfoBox
                    label="Verification Status"
                    value={getDocumentStatus(selectedClient)}
                  />
                  <InfoBox
                    label="Verified By"
                    value={selectedClient.verifiedBy}
                  />
                  <InfoBox
                    label="Verified Date"
                    value={selectedClient.verifiedDate}
                  />
                  <InfoBox label="Remarks" value={selectedClient.remarks} />
                  <InfoBox label="File Name" value={selectedClient.fileName} />
                  <InfoBox
                    label="Submitted"
                    value={selectedClient.submittedAt}
                  />
                </div>
              </div>

              <div className="mb-4 rounded-2xl bg-white p-5">
                <h3 className="mb-4 text-lg font-black text-slate-900">
                  Submitted Loan Information
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <InfoBox
                    label="Classification Type"
                    value={selectedClient.classificationType}
                  />
                  <InfoBox
                    label="Borrower Type"
                    value={selectedClient.borrowerType}
                  />
                  <InfoBox label="Objective" value={selectedClient.objective} />
                  <InfoBox label="Loan Type" value={selectedClient.loanType} />
                  <InfoBox label="Purpose" value={selectedClient.purpose} />
                  <InfoBox
                    label="Transaction Type"
                    value={selectedClient.transactionType}
                  />
                  <InfoBox
                    label="With Borrowers / Guarantors?"
                    value={selectedClient.withBorrowersGuarantors}
                  />
                </div>
              </div>

              {formatSource(
                selectedClient.source || selectedClient.leadType,
              ) !== "Direct Client" && (
                <div className="mb-4 rounded-2xl border border-[#259b8f]/20 bg-[#259b8f]/10 p-5">
                  <h3 className="mb-4 text-lg font-black text-slate-900">
                    {getDetailLabel(selectedClient)} Details
                  </h3>

                  <div className="grid gap-4 md:grid-cols-2">
                    <InfoBox
                      label={`${getDetailLabel(selectedClient)} Name`}
                      value={[
                        selectedClient.referrer?.firstName,
                        selectedClient.referrer?.middleName,
                        selectedClient.referrer?.lastName,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    />
                    <InfoBox
                      label={`${getDetailLabel(selectedClient)} Phone`}
                      value={selectedClient.referrer?.phone}
                    />
                    <InfoBox
                      label={`${getDetailLabel(selectedClient)} Email`}
                      value={selectedClient.referrer?.email}
                    />
                  </div>
                </div>
              )}

              <div className="mb-4 rounded-2xl bg-white p-5">
                <h3 className="mb-4 text-lg font-black text-slate-900">
                  Scenario Details
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <InfoBox
                    label="Veda Issues"
                    value={selectedClient.vedaIssues}
                  />
                  <InfoBox
                    label="Conduct Issues"
                    value={selectedClient.conductIssues}
                  />
                  <InfoBox
                    label="Client Needs & Objectives"
                    value={selectedClient.clientNeedsObjectives}
                  />
                  <InfoBox
                    label="Applicant Background"
                    value={selectedClient.applicantBackground}
                  />
                  <InfoBox
                    label="Explanation of Income"
                    value={selectedClient.explanationOfIncome}
                  />
                  <InfoBox label="Security" value={selectedClient.security} />
                </div>
              </div>

              <div className="mb-4 rounded-2xl bg-white p-5">
                <h3 className="mb-4 text-lg font-black text-slate-900">
                  Loan Amount & Settlement
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <InfoBox
                    label="Loan Amount"
                    value={selectedClient.loanAmount}
                  />
                  <InfoBox
                    label="Security Value"
                    value={selectedClient.securityValue}
                  />
                  <InfoBox label="LVR" value={selectedClient.lvr} />
                  <InfoBox
                    label="Anticipated Settlement Date"
                    value={selectedClient.anticipatedSettlementDate}
                  />
                  <InfoBox
                    label="Special Notes"
                    value={selectedClient.specialNotes}
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-white p-4">
                <p className="mb-3 text-sm font-black text-slate-700">
                  File Preview
                </p>

                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4">
                  <div className="min-w-0">
                    <p className="break-all font-bold text-slate-900">
                      {selectedClient.fileName || "No file selected"}
                    </p>
                    <p className="text-sm text-slate-500">
                      Submitted client file
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold ${getDocumentStatusClass(
                        getDocumentStatus(selectedClient),
                      )}`}
                    >
                      {getDocumentStatusIcon(getDocumentStatus(selectedClient))}
                      {getDocumentStatus(selectedClient)}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDownload(selectedClient)}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#EE6521] px-4 py-2 text-sm font-bold text-white hover:bg-orange-600"
                    >
                      <FaDownload />
                      Download
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
                    alt={selectedClient.fileName || "Preview"}
                    className="mx-auto max-h-[68vh] rounded-2xl bg-white object-contain sm:max-h-[70vh]"
                  />
                )}

                {!previewLoading && previewUrl && isPdfFile && (
                  <iframe
                    src={previewUrl}
                    title="Client File Preview"
                    className="h-[68vh] w-full rounded-2xl bg-white sm:h-[70vh]"
                  />
                )}

                {!previewLoading &&
                  previewUrl &&
                  !isImageFile &&
                  !isPdfFile && (
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
                        onClick={() => window.open(previewUrl, "_blank")}
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#259b8f] px-5 py-3 text-sm font-bold text-white hover:bg-[#1f8178]"
                      >
                        <FaDownload />
                        Open / Download
                      </button>
                    </div>
                  )}

                {!previewLoading && !previewUrl && (
                  <div className="rounded-xl bg-slate-100 p-6 text-center text-sm text-slate-500">
                    No preview available. Filename: {selectedClient.fileName}
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