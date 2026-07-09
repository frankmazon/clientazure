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

type DocumentStatus = "approved" | "pending" | "rejected";

const approvedStatusValues = ["approved", "verified", "complete", "completed"];
const rejectedStatusValues = ["rejected", "declined", "failed"];

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
  applicationSource?: string;
  application_source?: string;

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

  referrerFirstName?: string;
  referrerMiddleName?: string;
  referrerLastName?: string;
  referrerPhone?: string;
  referrerEmail?: string;

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
  verificationStatus?: string;
  remarks?: string;
  [key: string]: unknown;
};

type ClientGroup = {
  key: string;
  client: Client;
  files: Client[];
  uploadedDocuments: string[];
  missingDocuments: string[];
  statusCounts: Record<DocumentStatus, number>;
  progress: number;
  isComplete: boolean;
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

  useEffect(() => {
    const loadClients = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(CLIENTS_API);
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to load clients.");
        }

        setClients(result.clients || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load clients.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, []);

  const getFullName = (client: Client) =>
    (
      client.name ||
      `${client.firstName || ""} ${client.middleName || ""} ${client.lastName || ""}`
    )
      .replace(/\s+/g, " ")
      .trim();

  const formatDocumentType = (type?: string) =>
    documentLabels[type || ""] ||
    (type || "document")
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const normalizeDocumentStatus = (
    status?: string | number | null,
  ): DocumentStatus => {
    const normalized = String(status || "")
      .trim()
      .toLowerCase()
      .replace(/_/g, "-");

    if (approvedStatusValues.includes(normalized)) return "approved";
    if (rejectedStatusValues.includes(normalized)) return "rejected";

    return "pending";
  };

  const hasValue = (value: unknown) =>
    value !== undefined && value !== null && String(value).trim() !== "";

  const getStringValue = (
    client: Client | null | undefined,
    keys: string[],
  ) => {
    if (!client) return "";

    for (const key of keys) {
      const value = (client as Record<string, unknown>)[key];

      if (hasValue(value)) {
        return String(value).trim();
      }
    }

    return "";
  };

  const normalizeSource = (type?: string) =>
    (type || "").trim().toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");

  const formatSource = (type?: string) => {
    const value = normalizeSource(type);

    if (
      value === "broker" ||
      value === "business_owner" ||
      value === "businessowner"
    ) {
      return "Broker";
    }

    if (value === "referral" || value === "referrer") {
      return "Referral";
    }

    if (value === "direct_client" || value === "directclient") {
      return "Direct Client";
    }

    return type || "-";
  };

  const getSourceValue = (client: Client | null | undefined) =>
    getStringValue(client, [
      "source",
      "Source",
      "applicationSource",
      "ApplicationSource",
      "application_source",
      "applicationSourceLabel",
      "application_source_label",
      "leadSource",
      "LeadSource",
      "lead_source",
      "contactSource",
      "ContactSource",
      "contact_source",
      "leadType",
      "LeadType",
      "lead_type",
    ]);

  const getSourceLabel = (client: Client | null | undefined) =>
    formatSource(getSourceValue(client));

  const getStatus = (client: Client) =>
    getStringValue(client, ["status", "teamStatus", "team_status"]) ||
    "Pending Team Call";

  const getDocumentStatus = (client: Client) =>
    normalizeDocumentStatus(
      getStringValue(client, [
        "documentStatus",
        "DocumentStatus",
        "document_status",
        "verificationStatus",
        "VerificationStatus",
        "verification_status",
      ]),
    );

  const getDetailLabel = (client: Client) =>
    getSourceLabel(client) === "Referral" ? "Referral" : "Broker";

  const getLoanValue = (client: Client | null | undefined, keys: string[]) =>
    getStringValue(client, keys) || "-";

  const getReferrerValue = (
    client: Client | null | undefined,
    keys: string[],
  ) => {
    const directValue = getStringValue(client, keys);
    if (directValue) return directValue;

    if (!client?.referrer) return "";

    const referrer = client.referrer as Record<string, unknown>;
    for (const key of keys) {
      const cleanKey = key.replace(/^referrer/, "");
      const lowerKey = cleanKey.charAt(0).toLowerCase() + cleanKey.slice(1);
      const value = referrer[lowerKey] || referrer[key];

      if (hasValue(value)) return String(value).trim();
    }

    return "";
  };

  const getReferrerName = (client: Client | null | undefined) =>
    [
      getReferrerValue(client, [
        "referrerFirstName",
        "ReferrerFirstName",
        "brokerFirstName",
        "BrokerFirstName",
        "referralFirstName",
        "ReferralFirstName",
      ]),
      getReferrerValue(client, [
        "referrerMiddleName",
        "ReferrerMiddleName",
        "brokerMiddleName",
        "BrokerMiddleName",
        "referralMiddleName",
        "ReferralMiddleName",
      ]),
      getReferrerValue(client, [
        "referrerLastName",
        "ReferrerLastName",
        "brokerLastName",
        "BrokerLastName",
        "referralLastName",
        "ReferralLastName",
      ]),
    ]
      .filter(Boolean)
      .join(" ");

  const preferExistingKeys = new Set([
    "source",
    "applicationSource",
    "application_source",
    "leadType",
    "lead_type",
    "classificationType",
    "classification_type",
    "borrowerType",
    "borrower_type",
    "objective",
    "loanType",
    "loan_type",
    "purpose",
    "transactionType",
    "transaction_type",
    "withBorrowersGuarantors",
    "with_borrowers_guarantors",
    "anticipatedSettlementDate",
    "anticipated_settlement_date",
    "vedaIssues",
    "veda_issues",
    "conductIssues",
    "conduct_issues",
    "clientNeedsObjectives",
    "client_needs_objectives",
    "applicantBackground",
    "applicant_background",
    "explanationOfIncome",
    "explanation_of_income",
    "security",
    "loanAmount",
    "loan_amount",
    "securityValue",
    "security_value",
    "lvr",
    "specialNotes",
    "special_notes",
  ]);

  const mergeClientRows = (rows: Client[]) => {
    const merged = { ...rows[0] };

    rows.forEach((row) => {
      (Object.keys(row) as Array<keyof Client>).forEach((key) => {
        const value = row[key];
        const keyName = key as string;

        if (key === "referrer" && value && typeof value === "object") {
          merged.referrer = {
            ...(merged.referrer || {}),
            ...(value as Client["referrer"]),
          };
          return;
        }

        if (!hasValue(value)) return;

        const currentValue = (merged as Record<string, unknown>)[keyName];

        if (preferExistingKeys.has(keyName) && hasValue(currentValue)) {
          return;
        }

        (merged as Record<string, unknown>)[keyName] = value;
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
      const documentMap = new Map<string, Client>();

      files.forEach((file) => {
        const documentType = file.documentType?.toLowerCase();
        if (!documentType) return;

        const current = documentMap.get(documentType);
        const currentId = Number(current?.id || 0);
        const nextId = Number(file.id || 0);

        if (!current || nextId >= currentId) {
          documentMap.set(documentType, file);
        }
      });

      const uploadedDocuments = Array.from(documentMap.keys());
      const approvedDocuments = uploadedDocuments.filter(
        (doc) => getDocumentStatus(documentMap.get(doc) as Client) === "approved",
      );
      const missingDocuments = requiredDocuments.filter(
        (doc) => !approvedDocuments.includes(doc),
      );
      const statusCounts = Array.from(documentMap.values()).reduce<
        Record<DocumentStatus, number>
      >(
        (counts, file) => {
          counts[getDocumentStatus(file)] += 1;
          return counts;
        },
        { approved: 0, pending: 0, rejected: 0 },
      );
      const progress = Math.round(
        (approvedDocuments.length / requiredDocuments.length) * 100,
      );

      return {
        key,
        client: mergeClientRows(files),
        files,
        uploadedDocuments,
        missingDocuments,
        statusCounts,
        progress,
        isComplete: approvedDocuments.length === requiredDocuments.length,
      };
    });
  }, [clients]);

  const filteredGroups = useMemo(() => {
    const searchValue = search.toLowerCase().trim();

    return clientGroups.filter((group) => {
      const client = group.client;
      const fullName = getFullName(client).toLowerCase();

      return (
        !searchValue ||
        fullName.includes(searchValue) ||
        (client.email || "").toLowerCase().includes(searchValue) ||
        (client.phone || "").toLowerCase().includes(searchValue) ||
        (client.uniqueId || "").toLowerCase().includes(searchValue) ||
        getSourceLabel(client).toLowerCase().includes(searchValue) ||
        getLoanValue(client, [
          "classificationType",
          "ClassificationType",
          "classification_type",
        ])
          .toLowerCase()
          .includes(searchValue) ||
        getLoanValue(client, ["borrowerType", "BorrowerType", "borrower_type"])
          .toLowerCase()
          .includes(searchValue) ||
        getLoanValue(client, ["objective", "Objective"])
          .toLowerCase()
          .includes(searchValue) ||
        getLoanValue(client, ["loanType", "LoanType", "loan_type"])
          .toLowerCase()
          .includes(searchValue) ||
        getLoanValue(client, ["purpose", "Purpose"])
          .toLowerCase()
          .includes(searchValue) ||
        getLoanValue(client, [
          "transactionType",
          "TransactionType",
          "transaction_type",
        ])
          .toLowerCase()
          .includes(searchValue) ||
        getStatus(client).toLowerCase().includes(searchValue) ||
        group.files.some((file) =>
          (file.fileName || "").toLowerCase().includes(searchValue),
        )
      );
    });
  }, [clientGroups, search]);

  const brokerCount = clientGroups.filter(
    (group) => getSourceLabel(group.client) === "Broker",
  ).length;

  const referralCount = clientGroups.filter(
    (group) => getSourceLabel(group.client) === "Referral",
  ).length;

  const directClientCount = clientGroups.filter(
    (group) => getSourceLabel(group.client) === "Direct Client",
  ).length;

  const approvedDocsCount = clientGroups.reduce(
    (total, group) => total + group.statusCounts.approved,
    0,
  );

  const pendingDocsCount = clientGroups.reduce(
    (total, group) => total + group.statusCounts.pending,
    0,
  );

  const rejectedDocsCount = clientGroups.reduce(
    (total, group) => total + group.statusCounts.rejected,
    0,
  );

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

  const InfoCard = ({
    label,
    value,
  }: {
    label: string;
    value?: string | number | null;
  }) => (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase text-slate-400">{label}</p>

      <p className="mt-1 break-words font-semibold text-slate-900">
        {hasValue(value) ? value : "-"}
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
      <p className="text-sm font-extrabold leading-snug">{label}</p>
      <p className="mt-4 text-4xl font-black leading-none">{value}</p>
    </div>
  );

  return (
    <DashboardLayout
      title="Clients"
      subtitle="View submitted clients, source, loan details, team call status, and document completion."
    >
      <div className="mx-auto max-w-[1800px] space-y-6">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search unique ID, name, email, phone, source, loan details, status, or file..."
              className="h-16 w-full rounded-2xl border border-slate-300 pl-12 pr-4 text-base font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
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
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-9">
              <StatCard
                label="Clients"
                value={clientGroups.length}
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
                value={clientGroups.filter((group) => group.isComplete).length}
                className="border-green-200 bg-green-50 text-green-700"
              />
              <StatCard
                label="Incomplete"
                value={clientGroups.filter((group) => !group.isComplete).length}
                className="border-red-200 bg-red-50 text-red-700"
              />
              <StatCard
                label="Approved Docs"
                value={approvedDocsCount}
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
            </div>

            <div className="hidden overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 lg:block">
              <div className="flex min-h-28 items-center justify-between border-b border-slate-200 px-8 py-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">
                    Client List
                  </h2>
                  <p className="mt-1 text-lg text-slate-500">
                    {filteredGroups.length} client
                    {filteredGroups.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <FaFileAlt className="text-3xl text-orange-500" />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1540px]">
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
                      ].map((header) => (
                        <th
                          key={header}
                          className="px-8 py-7 text-left text-base font-black uppercase tracking-wide text-slate-600"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {filteredGroups.map((group) => {
                      const sourceLabel = getSourceLabel(group.client);

                      return (
                        <tr
                          key={group.key}
                          className="align-middle transition hover:bg-slate-50"
                        >
                          <td className="max-w-[150px] px-8 py-12 text-lg font-bold leading-tight text-slate-700">
                            <span className="break-words">
                              {group.client.uniqueId || "-"}
                            </span>
                          </td>

                          <td className="px-8 py-12">
                            <span
                              className={`inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-black leading-tight ${
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

                          <td className="max-w-[180px] px-8 py-12">
                            <p className="break-words text-xl font-black leading-snug text-slate-900">
                              {getFullName(group.client) || "-"}
                            </p>
                          </td>

                          <td className="max-w-[250px] px-8 py-12 text-lg text-slate-600">
                            <p className="break-words">
                              {group.client.email || "-"}
                            </p>
                            <p className="mt-2 flex items-center gap-2 text-base text-slate-400">
                              <FaPhone />
                              {group.client.phone || "No phone"}
                            </p>
                          </td>

                          <td className="max-w-[220px] px-8 py-12 text-lg leading-snug text-slate-600">
                            <p>
                              <span className="font-black text-slate-700">Class:</span>{" "}
                              {getLoanValue(group.client, [
                                "classificationType",
                                "classification_type",
                              ])}
                            </p>
                            <p>
                              <span className="font-black text-slate-700">Borrower:</span>{" "}
                              {getLoanValue(group.client, [
                                "borrowerType",
                                "borrower_type",
                              ])}
                            </p>
                            <p>
                              <span className="font-black text-slate-700">Objective:</span>{" "}
                              {getLoanValue(group.client, [
                                "objective",
                                "Objective",
                              ])}
                            </p>
                            <p>
                              <span className="font-black text-slate-700">Loan:</span>{" "}
                              {getLoanValue(group.client, [
                                "loanType",
                                "loan_type",
                              ])}
                            </p>
                          </td>

                          <td className="px-8 py-12">
                            <span className="inline-flex max-w-[110px] flex-wrap rounded-full bg-orange-100 px-4 py-2 text-sm font-black leading-snug text-orange-700">
                              {getStatus(group.client)}
                            </span>
                          </td>

                          <td className="px-8 py-12">
                            <span
                              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black ${
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

                          <td className="px-8 py-12">
                            <div className="space-y-2 text-base font-black">
                              <p className="text-green-700">
                                Approved: {group.statusCounts.approved}
                              </p>
                              <p className="text-orange-700">
                                Pending: {group.statusCounts.pending}
                              </p>
                              <p className="text-red-700">
                                Rejected: {group.statusCounts.rejected}
                              </p>
                            </div>
                          </td>

                          <td className="px-8 py-12">
                            <div className="w-44">
                              <p className="mb-2 text-base font-black text-slate-500">
                                {group.progress}%
                              </p>
                              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className="h-full rounded-full bg-orange-500"
                                  style={{ width: `${group.progress}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredGroups.length === 0 && (
                      <tr>
                        <td
                          colSpan={9}
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

            <div className="space-y-4 lg:hidden">
              {filteredGroups.map((group) => {
                const sourceLabel = getSourceLabel(group.client);

                return (
                  <div
                    key={group.key}
                    className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
                  >
                    <div className="mb-5 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase text-slate-400">
                          {group.client.uniqueId || "-"}
                        </p>
                        <h3 className="mt-1 break-words text-xl font-black text-slate-900">
                          {getFullName(group.client) || "-"}
                        </h3>
                        <p className="mt-1 break-words text-sm text-slate-500">
                          {group.client.email || "-"}
                        </p>
                        <p className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                          <FaPhone />
                          {group.client.phone || "No phone"}
                        </p>
                      </div>

                      <span
                        className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-black ${
                          sourceLabel === "Referral"
                            ? "bg-purple-100 text-purple-700"
                            : sourceLabel === "Direct Client"
                              ? "bg-cyan-100 text-cyan-700"
                              : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {sourceLabel}
                      </span>
                    </div>

                    <div className="mb-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                      <p>
                        <strong className="text-slate-700">Classification:</strong>{" "}
                        {getLoanValue(group.client, [
                          "classificationType",
                          "classification_type",
                        ])}
                      </p>
                      <p>
                        <strong className="text-slate-700">Borrower:</strong>{" "}
                        {getLoanValue(group.client, [
                          "borrowerType",
                          "borrower_type",
                        ])}
                      </p>
                      <p>
                        <strong className="text-slate-700">Objective:</strong>{" "}
                        {getLoanValue(group.client, ["objective", "Objective"])}
                      </p>
                      <p>
                        <strong className="text-slate-700">Loan Type:</strong>{" "}
                        {getLoanValue(group.client, [
                          "loanType",
                          "LoanType",
                          "loan_type",
                        ])}
                      </p>
                      <p>
                        <strong className="text-slate-700">Purpose:</strong>{" "}
                        {getLoanValue(group.client, ["purpose", "Purpose"])}
                      </p>
                      <p>
                        <strong className="text-slate-700">Transaction:</strong>{" "}
                        {getLoanValue(group.client, [
                          "transactionType",
                          "transaction_type",
                        ])}
                      </p>
                    </div>

                    <div className="mb-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700">
                        {getStatus(group.client)}
                      </span>

                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black ${
                          group.isComplete
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {group.isComplete ? "Complete" : "Incomplete"}
                      </span>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                        {group.files.length} file
                        {group.files.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="mb-4 grid gap-3 rounded-2xl border border-slate-200 p-4">
                      <div className="grid grid-cols-3 gap-2 text-sm font-black">
                        <p className="text-green-700">
                          Approved: {group.statusCounts.approved}
                        </p>
                        <p className="text-orange-700">
                          Pending: {group.statusCounts.pending}
                        </p>
                        <p className="text-red-700">
                          Rejected: {group.statusCounts.rejected}
                        </p>
                      </div>

                      <div>
                        <div className="mb-2 flex items-center justify-between text-sm font-black text-slate-500">
                          <span>Progress</span>
                          <span>{group.progress}%</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-orange-500"
                            style={{ width: `${group.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mb-4 grid gap-3">
                      <div>
                        <p className="mb-2 text-xs font-bold uppercase text-slate-400">
                          Uploaded
                        </p>
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
                      </div>

                      <div>
                        <p className="mb-2 text-xs font-bold uppercase text-slate-400">
                          Missing
                        </p>
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
                      </div>
                    </div>

                    {group.files.slice(0, 1).map((file) => (
                      <div
                        key={`${file.id}-${file.fileName}`}
                        className="flex gap-2"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            handlePreview(mergeClientRows([group.client, file]))
                          }
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-500 px-3 py-2 text-xs font-bold text-white hover:bg-blue-600"
                        >
                          <FaEye />
                          View
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownload(file)}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-orange-500 px-3 py-2 text-xs font-bold text-white hover:bg-orange-600"
                        >
                          <FaDownload />
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })}

              {filteredGroups.length === 0 && (
                <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
                  No clients found.
                </div>
              )}
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
                  <InfoCard label="Unique ID" value={selectedClient.uniqueId} />
                  <InfoCard
                    label="Source"
                    value={getSourceLabel(selectedClient)}
                  />
                  <InfoCard
                    label="Team Status"
                    value={getStatus(selectedClient)}
                  />
                  <InfoCard
                    label="Full Name"
                    value={getFullName(selectedClient)}
                  />
                  <InfoCard label="Email" value={selectedClient.email} />
                  <InfoCard label="Phone" value={selectedClient.phone} />
                  <InfoCard
                    label="Document Type"
                    value={formatDocumentType(selectedClient.documentType)}
                  />
                  <InfoCard label="File Name" value={selectedClient.fileName} />
                  <InfoCard
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
                  <InfoCard
                    label="Classification Type"
                    value={getLoanValue(selectedClient, [
                      "classificationType",
                      "classification_type",
                    ])}
                  />
                  <InfoCard
                    label="Borrower Type"
                    value={getLoanValue(selectedClient, [
                      "borrowerType",
                      "borrower_type",
                    ])}
                  />
                  <InfoCard
                    label="Objective"
                    value={getLoanValue(selectedClient, [
                      "objective",
                      "Objective",
                    ])}
                  />
                  <InfoCard
                    label="Loan Type"
                    value={getLoanValue(selectedClient, [
                      "loanType",
                      "loan_type",
                    ])}
                  />
                  <InfoCard
                    label="Purpose"
                    value={getLoanValue(selectedClient, ["purpose", "Purpose"])}
                  />
                  <InfoCard
                    label="Transaction Type"
                    value={getLoanValue(selectedClient, [
                      "transactionType",
                      "transaction_type",
                    ])}
                  />
                  <InfoCard
                    label="With borrowers / guarantors?"
                    value={getLoanValue(selectedClient, [
                      "withBorrowersGuarantors",
                      "with_borrowers_guarantors",
                      "with_borrowers__guarantors",
                    ])}
                  />
                </div>
              </div>

              {getSourceLabel(selectedClient) !== "Direct Client" && (
                <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
                  <h3 className="mb-4 text-lg font-extrabold text-slate-900">
                    {getDetailLabel(selectedClient)} Details
                  </h3>

                  <div className="grid gap-4 md:grid-cols-2">
                    <InfoCard
                      label={`${getDetailLabel(selectedClient)} Name`}
                      value={getReferrerName(selectedClient)}
                    />
                    <InfoCard
                      label={`${getDetailLabel(selectedClient)} Phone`}
                      value={getReferrerValue(selectedClient, [
                        "referrerPhone",
                        "ReferrerPhone",
                        "brokerPhone",
                        "BrokerPhone",
                        "referralPhone",
                        "ReferralPhone",
                      ])}
                    />
                    <InfoCard
                      label={`${getDetailLabel(selectedClient)} Email`}
                      value={getReferrerValue(selectedClient, [
                        "referrerEmail",
                        "ReferrerEmail",
                        "brokerEmail",
                        "BrokerEmail",
                        "referralEmail",
                        "ReferralEmail",
                      ])}
                    />
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className="mb-4 text-lg font-extrabold text-slate-900">
                  Scenario Details
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <InfoCard
                    label="Veda Issues"
                    value={getLoanValue(selectedClient, [
                      "vedaIssues",
                      "veda_issues",
                    ])}
                  />
                  <InfoCard
                    label="Conduct Issues"
                    value={getLoanValue(selectedClient, [
                      "conductIssues",
                      "conduct_issues",
                    ])}
                  />
                  <InfoCard
                    label="Client Needs & Objectives"
                    value={getLoanValue(selectedClient, [
                      "clientNeedsObjectives",
                      "client_needs_objectives",
                    ])}
                  />
                  <InfoCard
                    label="Applicant Background"
                    value={getLoanValue(selectedClient, [
                      "applicantBackground",
                      "applicant_background",
                    ])}
                  />
                  <InfoCard
                    label="Explanation of Income"
                    value={getLoanValue(selectedClient, [
                      "explanationOfIncome",
                      "explanation_of_income",
                    ])}
                  />
                  <InfoCard
                    label="Security"
                    value={getLoanValue(selectedClient, [
                      "security",
                      "Security",
                    ])}
                  />
                </div>
              </div>

              <div className="mb-6">
                <h3 className="mb-4 text-lg font-extrabold text-slate-900">
                  Loan Amount & Settlement
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <InfoCard
                    label="Loan Amount"
                    value={getLoanValue(selectedClient, [
                      "loanAmount",
                      "loan_amount",
                    ])}
                  />
                  <InfoCard
                    label="Security Value"
                    value={getLoanValue(selectedClient, [
                      "securityValue",
                      "security_value",
                    ])}
                  />
                  <InfoCard
                    label="LVR"
                    value={getLoanValue(selectedClient, ["lvr", "Lvr", "LVR"])}
                  />
                  <InfoCard
                    label="Anticipated Settlement Date"
                    value={getLoanValue(selectedClient, [
                      "anticipatedSettlementDate",
                      "anticipated_settlement_date",
                    ])}
                  />
                  <InfoCard
                    label="Special Notes"
                    value={getLoanValue(selectedClient, [
                      "specialNotes",
                      "special_notes",
                    ])}
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

                  <button
                    type="button"
                    onClick={() => handleDownload(selectedClient)}
                    className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                  >
                    <FaDownload />
                    Download
                  </button>
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
