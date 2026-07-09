import { useEffect, useMemo, useState } from "react";
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

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://docsuploadpythonapi.azurewebsites.net/api";
const CLIENTS_API = `${API_BASE}/clients`;
const FILE_URL_API = `${API_BASE}/file-url`;

const requiredDocuments = [
  "id",
  "property-documents",
  "credit-history",
  "income-documents",
  "other",
];

const documentLabels: Record<string, string> = {
  id: "ID",
  "property-documents": "Property Documents",
  "credit-history": "Credit History",
  "income-documents": "Income Documents",
  other: "Other",
};

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
  uploadedDocuments: string[];
  missingDocuments: string[];
  approvedDocuments: string[];
  rejectedDocuments: string[];
  pendingDocuments: string[];
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

  const formatDocumentType = (type?: string) =>
    documentLabels[type || ""] ||
    (type || "document")
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

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

  const getDocumentStatus = (client: Client) => {
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

    return Array.from(map.entries()).map(([key, files]) => {
      const mergedClient = mergeClientRows(files);

      const mergedFiles = files.map((file) =>
        mergeClientRows([mergedClient, file]),
      );

      const uploadedDocuments = Array.from(
        new Set(
          mergedFiles
            .map((file) => file.documentType?.toLowerCase())
            .filter(Boolean) as string[],
        ),
      );

      const approvedDocuments = Array.from(
        new Set(
          mergedFiles
            .filter((file) => getDocumentStatus(file) === "Approved")
            .map((file) => file.documentType?.toLowerCase())
            .filter(Boolean) as string[],
        ),
      );

      const rejectedDocuments = Array.from(
        new Set(
          mergedFiles
            .filter((file) => getDocumentStatus(file) === "Rejected")
            .map((file) => file.documentType?.toLowerCase())
            .filter(Boolean) as string[],
        ),
      );

      const pendingDocuments = Array.from(
        new Set(
          mergedFiles
            .filter((file) => getDocumentStatus(file) === "Pending")
            .map((file) => file.documentType?.toLowerCase())
            .filter(Boolean) as string[],
        ),
      );

      const missingDocuments = requiredDocuments.filter(
        (doc) => !uploadedDocuments.includes(doc),
      );

      return {
        key,
        client: mergedClient,
        files: mergedFiles,
        uploadedDocuments,
        missingDocuments,
        approvedDocuments,
        rejectedDocuments,
        pendingDocuments,
        isComplete: approvedDocuments.length === requiredDocuments.length,
        progress: Math.round(
          (approvedDocuments.length / requiredDocuments.length) * 100,
        ),
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
    (group) => !group.isComplete,
  ).length;
  const approvedDocumentCount = clients.filter(
    (client) => getDocumentStatus(client) === "Approved",
  ).length;
  const rejectedDocumentCount = clients.filter(
    (client) => getDocumentStatus(client) === "Rejected",
  ).length;
  const pendingDocumentCount = clients.filter(
    (client) => getDocumentStatus(client) === "Pending",
  ).length;

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
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
      <p className="mt-1 break-words font-semibold text-slate-900">
        {displayValue(value)}
      </p>
    </div>
  );

  return (
    <DashboardLayout
      title="Clients"
      subtitle="View submitted clients, source, loan details, and document verification status."
    >
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search unique ID, name, email, phone, source, loan details, status, or file..."
              className="h-12 w-full rounded-xl border border-slate-300 pl-12 pr-4 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>
        </div>

        {loading && (
          <div className="rounded-2xl bg-white p-10 text-center font-bold text-slate-500 shadow-sm ring-1 ring-slate-200">
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
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-9">
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <p className="text-sm font-bold text-slate-500">Clients</p>
                <p className="mt-2 text-3xl font-extrabold text-slate-900">
                  {clientGroups.length}
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
                <p className="text-sm font-bold text-cyan-700">
                  Direct Clients
                </p>
                <p className="mt-2 text-3xl font-extrabold text-cyan-700">
                  {directClientCount}
                </p>
              </div>

              <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
                <p className="text-sm font-bold text-green-700">Complete</p>
                <p className="mt-2 text-3xl font-extrabold text-green-700">
                  {completeCount}
                </p>
              </div>

              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
                <p className="text-sm font-bold text-red-700">Incomplete</p>
                <p className="mt-2 text-3xl font-extrabold text-red-700">
                  {incompleteCount}
                </p>
              </div>

              <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
                <p className="text-sm font-bold text-green-700">
                  Approved Docs
                </p>
                <p className="mt-2 text-3xl font-extrabold text-green-700">
                  {approvedDocumentCount}
                </p>
              </div>

              <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5 shadow-sm">
                <p className="text-sm font-bold text-orange-700">
                  Pending Docs
                </p>
                <p className="mt-2 text-3xl font-extrabold text-orange-700">
                  {pendingDocumentCount}
                </p>
              </div>

              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
                <p className="text-sm font-bold text-red-700">Rejected Docs</p>
                <p className="mt-2 text-3xl font-extrabold text-red-700">
                  {rejectedDocumentCount}
                </p>
              </div>
            </div>

            <div className="space-y-4 lg:hidden">
              {filteredGroups.map((group) => {
                const sourceLabel = formatSource(
                  group.client.source || group.client.leadType,
                );

                return (
                  <div
                    key={group.key}
                    className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ${
                      group.isComplete ? "ring-green-200" : "ring-red-200"
                    }`}
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-extrabold text-slate-900">
                          {getFullName(group.client) || "-"}
                        </h3>

                        <p className="truncate text-sm text-slate-500">
                          {group.client.email || "No email"}
                        </p>

                        <p className="mt-1 flex items-center gap-2 truncate text-xs text-slate-400">
                          <FaPhone />
                          {group.client.phone || "No phone"}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                          group.isComplete
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {group.isComplete ? "Complete" : "Incomplete"}
                      </span>
                    </div>

                    <div className="mb-4 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${
                          sourceLabel === "Referral"
                            ? "bg-purple-100 text-purple-700"
                            : sourceLabel === "Direct Client"
                              ? "bg-cyan-100 text-cyan-700"
                              : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {sourceLabel === "Referral" ? (
                          <FaUserFriends />
                        ) : (
                          <FaBriefcase />
                        )}
                        {sourceLabel}
                      </span>

                      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
                        {getStatus(group.client)}
                      </span>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                        {group.files.length} file
                        {group.files.length !== 1 ? "s" : ""}
                      </span>

                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                        Approved: {group.approvedDocuments.length}
                      </span>

                      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
                        Pending: {group.pendingDocuments.length}
                      </span>

                      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                        Rejected: {group.rejectedDocuments.length}
                      </span>
                    </div>

                    <div className="mb-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                      <p>
                        <strong>Classification:</strong>{" "}
                        {group.client.classificationType || "-"}
                      </p>
                      <p>
                        <strong>Borrower:</strong>{" "}
                        {group.client.borrowerType || "-"}
                      </p>
                      <p>
                        <strong>Objective:</strong>{" "}
                        {group.client.objective || "-"}
                      </p>
                      <p>
                        <strong>Loan Type:</strong>{" "}
                        {group.client.loanType || "-"}
                      </p>
                    </div>

                    <div className="mb-4">
                      <div className="mb-2 flex justify-between text-xs font-bold text-slate-500">
                        <span>Document Progress</span>
                        <span>{group.progress}%</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${
                            group.isComplete ? "bg-green-500" : "bg-orange-500"
                          }`}
                          style={{ width: `${group.progress}%` }}
                        />
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
                          {group.missingDocuments.length > 0 ? (
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
                            className={`col-span-2 inline-flex h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold ${getDocumentStatusClass(
                              getDocumentStatus(file),
                            )}`}
                          >
                            {getDocumentStatusIcon(getDocumentStatus(file))}
                            {getDocumentStatus(file)}
                          </span>

                          <button
                            type="button"
                            onClick={() => handlePreview(file)}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-500 text-sm font-bold text-white hover:bg-blue-600"
                          >
                            <FaEye />
                            View
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownload(file)}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 text-sm font-bold text-white hover:bg-orange-600"
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

            <div className="hidden overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 lg:block">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Client List
                  </h2>
                  <p className="text-sm text-slate-500">
                    {filteredGroups.length} client
                    {filteredGroups.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <FaFileAlt className="text-2xl text-orange-500" />
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[1750px] w-full">
                  <thead className="bg-slate-50">
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
                          className={`px-6 py-4 text-sm font-extrabold uppercase tracking-wide text-slate-600 ${
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
                        <tr key={group.key} className="hover:bg-slate-50">
                          <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                            {group.client.uniqueId || "-"}
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${
                                sourceLabel === "Referral"
                                  ? "bg-purple-100 text-purple-700"
                                  : sourceLabel === "Direct Client"
                                    ? "bg-cyan-100 text-cyan-700"
                                    : "bg-blue-100 text-blue-700"
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

                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-900">
                              {getFullName(group.client) || "-"}
                            </p>
                          </td>

                          <td className="px-6 py-4 text-sm text-slate-600">
                            <p>{group.client.email || "-"}</p>
                            <p className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                              <FaPhone />
                              {group.client.phone || "No phone"}
                            </p>
                          </td>

                          <td className="px-6 py-4 text-sm text-slate-600">
                            <p>
                              <span className="font-bold">Class:</span>{" "}
                              {group.client.classificationType || "-"}
                            </p>
                            <p>
                              <span className="font-bold">Borrower:</span>{" "}
                              {group.client.borrowerType || "-"}
                            </p>
                            <p>
                              <span className="font-bold">Objective:</span>{" "}
                              {group.client.objective || "-"}
                            </p>
                            <p>
                              <span className="font-bold">Loan:</span>{" "}
                              {group.client.loanType || "-"}
                            </p>
                          </td>

                          <td className="px-6 py-4">
                            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
                              {getStatus(group.client)}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${
                                group.isComplete
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {group.isComplete ? (
                                <FaCheckCircle />
                              ) : (
                                <FaExclamationTriangle />
                              )}
                              {group.isComplete ? "Complete" : "Incomplete"}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-2">
                              <span className="text-xs font-bold text-green-700">
                                Approved: {group.approvedDocuments.length}
                              </span>
                              <span className="text-xs font-bold text-orange-700">
                                Pending: {group.pendingDocuments.length}
                              </span>
                              <span className="text-xs font-bold text-red-700">
                                Rejected: {group.rejectedDocuments.length}
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="w-32">
                              <div className="mb-1 flex justify-between text-xs font-bold text-slate-500">
                                <span>{group.progress}%</span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className={`h-full rounded-full ${
                                    group.isComplete
                                      ? "bg-green-500"
                                      : "bg-orange-500"
                                  }`}
                                  style={{ width: `${group.progress}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-2">
                              {group.uploadedDocuments.map((doc) => (
                                <span
                                  key={doc}
                                  className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700"
                                >
                                  {formatDocumentType(doc)}
                                </span>
                              ))}
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-2">
                              {group.missingDocuments.length > 0 ? (
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

                          <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                            {group.files.length}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex justify-center gap-2">
                              {group.files.slice(0, 1).map((file) => (
                                <div
                                  key={`${file.id}-${file.fileName}`}
                                  className="contents"
                                >
                                  <span
                                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${getDocumentStatusClass(
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
                                    className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-3 py-2 text-xs font-bold text-white hover:bg-blue-600"
                                  >
                                    <FaEye />
                                    View
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDownload(file)}
                                    className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-3 py-2 text-xs font-bold text-white hover:bg-orange-600"
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Client File Details
                </h2>
                <p className="text-sm text-slate-500">
                  View submitted client information and uploaded file.
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

            <div className="max-h-[calc(90vh-80px)] overflow-y-auto p-6">
              <div className="mb-6">
                <h3 className="mb-4 text-lg font-extrabold text-slate-900">
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

              <div className="mb-6">
                <h3 className="mb-4 text-lg font-extrabold text-slate-900">
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
                <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
                  <h3 className="mb-4 text-lg font-extrabold text-slate-900">
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

              <div className="mb-6">
                <h3 className="mb-4 text-lg font-extrabold text-slate-900">
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

              <div className="mb-6">
                <h3 className="mb-4 text-lg font-extrabold text-slate-900">
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

              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="mb-3 text-sm font-bold text-slate-700">
                  File Preview
                </p>

                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4">
                  <div>
                    <p className="break-all font-semibold text-slate-900">
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
                      className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                    >
                      <FaDownload />
                      Download
                    </button>
                  </div>
                </div>

                {previewLoading && (
                  <div className="flex h-[500px] items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500">
                    Loading secure preview...
                  </div>
                )}

                {!previewLoading && previewUrl && isImageFile && (
                  <img
                    src={previewUrl}
                    alt={selectedClient.fileName || "Preview"}
                    className="mx-auto max-h-[500px] rounded-xl border border-slate-200 bg-white object-contain"
                  />
                )}

                {!previewLoading && previewUrl && isPdfFile && (
                  <iframe
                    src={previewUrl}
                    title="Client File Preview"
                    className="h-[500px] w-full rounded-xl border border-slate-200"
                  />
                )}

                {!previewLoading &&
                  previewUrl &&
                  !isImageFile &&
                  !isPdfFile && (
                    <div className="flex h-[500px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-white text-center text-slate-500">
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
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-green-500 px-5 py-3 text-sm font-bold text-white hover:bg-green-600"
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
