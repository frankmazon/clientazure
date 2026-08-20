import { type FormEvent, useEffect, useState } from "react";
import {
  FaCloudUploadAlt,
  FaEye,
  FaEyeSlash,
  FaFileAlt,
  FaIdBadge,
  FaKey,
  FaLock,
  FaSignOutAlt,
  FaTimes,
  FaUserFriends,
} from "react-icons/fa";

export type ReferrerPortalDocument = {
  id: number;
  documentType?: string;
  documentLabel?: string;
  fileName?: string;
  uploadedAt?: string;
  status?: string;
  fileUrl?: string;
  uploaderType?: string;
  uploadedByType?: string;
  uploadedByRole?: string;
  UploaderType?: string;
  UploadedByType?: string;
  uploadedBy?: string;
  submittedBy?: string;
  uploadSource?: string;
  remarks?: string;
};

export type ReferrerPortalClient = {
  clientId: number;
  uniqueId: string;
  name: string;
  status?: string;
  documents: ReferrerPortalDocument[];
  waivedDocuments?: string[] | string;
  waivedDocumentTypes?: string[] | string;
};

export type ReferrerPortalAccount = {
  uniqueId: string;
  referrerId?: string;
  referralCode?: string;
  profession?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  referredClients?: ReferrerPortalClient[];
};

type ReferrerPortalProps = {
  account: ReferrerPortalAccount;
  showChangePassword: boolean;
  mustChangePassword: boolean;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  passwordLoading: boolean;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onOpenChangePassword: () => void;
  onCloseChangePassword: () => void;
  onChangePassword: (event: FormEvent<HTMLFormElement>) => void;
  onLogout: () => void;
};

const formatDocumentType = (type?: string) =>
  (type || "Document")
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const normalizeDocumentType = (value: unknown) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-");

const getDocumentTypeFromValue = (value: unknown) => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    return normalizeDocumentType(
      record.documentType ||
        record.DocumentType ||
        record.document_type ||
        record.value ||
        record.type ||
        record.name ||
        record.label,
    );
  }

  return normalizeDocumentType(value);
};

const normalizeWaivedDocuments = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(value.map(getDocumentTypeFromValue).filter(Boolean)),
    );
  }

  if (typeof value !== "string" || !value.trim()) return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return normalizeWaivedDocuments(parsed);
  } catch {
    // Older responses may use comma- or line-separated values.
  }

  return Array.from(
    new Set(
      value
        .split(/[\n,]+/)
        .map(getDocumentTypeFromValue)
        .filter(Boolean),
    ),
  );
};

const getWaivedDocumentsFromRecord = (record: Record<string, unknown>) =>
  normalizeWaivedDocuments(
    getRecordValue(record, [
      "waivedDocuments",
      "WaivedDocuments",
      "waived_documents",
      "waivedDocumentTypes",
      "WaivedDocumentTypes",
    ]),
  );

const getDocumentUploader = (document: ReferrerPortalDocument) => {
  const uploader = String(
    document.uploaderType ||
      document.uploadedByType ||
      document.uploadedByRole ||
    document.UploaderType ||
      document.UploadedByType ||
      document.uploadedBy ||
      document.submittedBy ||
      document.uploadSource ||
      document.remarks ||
      "Client",
  )
    .trim()
    .toLowerCase();

  return uploader.includes("referr") ? "Referrer" : "Client";
};

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  "https://docsuploadpythonapi-flex.azurewebsites.net/api"
).replace(/\/$/, "");
const UPLOAD_API = `${API_BASE}/uploadclient`;
const CLIENTS_API = `${API_BASE}/clients`;
const DOCUMENTS_API = `${API_BASE}/documents`;

const sharedDocumentOptions = [
  ["ID", "id"],
  ["Passport", "passport"],
  ["Last 6 Months Mortgage Statements", "last-6-months-mortgage-statements"],
  ["Council Rates Notice", "council-rates-notice"],
] as const;

const documentOptionsByTransaction = {
  alt_doc: [
    ["BAS from ATO Portal", "bas-from-ato-portal"],
    ["Business Banking Statements", "business-banking-statements"],
    ...sharedDocumentOptions,
  ],
  full_doc: [
  ["Payslip", "payslip"],
  ["Management Reports / Financial Statements", "management-reports-financial-statements"],
  ["Group Certificate / Payment Summary", "group-certificate-payment-summary"],
  ["Company Tax Returns", "company-tax-returns"],
  ["Individual Tax Returns", "individual-tax-returns"],
    ...sharedDocumentOptions,
  ],
} as const;

const normalizeTransactionType = (value: unknown) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (["alt", "alt_doc", "altdoc"].includes(normalized)) return "alt_doc";
  if (["full", "full_doc", "fulldoc"].includes(normalized)) return "full_doc";
  return "";
};

const getRecordValue = (record: Record<string, unknown> | null, keys: string[]) => {
  if (!record) return "";
  for (const key of keys) {
    const value = record[key];
    if (value !== null && value !== undefined && String(value).trim()) return value;
  }
  return "";
};

export default function ReferrerPortal({
  account,
  showChangePassword,
  mustChangePassword,
  currentPassword,
  newPassword,
  confirmPassword,
  passwordLoading,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onOpenChangePassword,
  onCloseChangePassword,
  onChangePassword,
  onLogout,
}: ReferrerPortalProps) {
  const [referredClients, setReferredClients] = useState(
    account.referredClients || [],
  );
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [documentType, setDocumentType] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [documentMessage, setDocumentMessage] = useState("");
  const [waivedDocumentsByClient, setWaivedDocumentsByClient] = useState<
    Record<number, string[]>
  >({});
  const [selectedClientRecord, setSelectedClientRecord] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const totalDocuments = referredClients.reduce(
    (total, client) => total + (client.documents?.length || 0),
    0,
  );
  const fullName =
    account.name ||
    [account.firstName, account.middleName, account.lastName]
      .filter(Boolean)
      .join(" ");
  const sectionClass =
    "rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.06)] sm:p-6";
  const fieldClass =
    "min-w-0 rounded-xl border border-slate-200 bg-slate-50/80 p-4";

  const stats = [
    ["Referral Code", account.referralCode || "Not assigned", <FaIdBadge />],
    ["Referred Clients", referredClients.length, <FaUserFriends />],
    ["Uploaded Documents", totalDocuments, <FaFileAlt />],
  ];
  const selectedTransactionType = normalizeTransactionType(
    getRecordValue(selectedClientRecord, [
      "transactionType",
      "TransactionType",
      "transaction_type",
    ]),
  );
  const selectedDocumentOptions = selectedTransactionType
    ? documentOptionsByTransaction[selectedTransactionType]
    : [];
  const selectedClient =
    referredClients.find((client) => client.clientId === selectedClientId) ||
    null;
  const selectedWaivedDocuments = selectedClient
    ? waivedDocumentsByClient[selectedClient.clientId] || []
    : [];

  useEffect(() => {
    let cancelled = false;

    const loadWaivedDocuments = async () => {
      const entries = await Promise.all(
        referredClients.map(async (client) => {
          const savedWaivers = Array.from(
            new Set([
              ...normalizeWaivedDocuments(client.waivedDocuments),
              ...normalizeWaivedDocuments(client.waivedDocumentTypes),
            ]),
          );

          try {
            const response = await fetch(
              `${CLIENTS_API}?uniqueId=${encodeURIComponent(client.uniqueId)}`,
            );
            const result = await response.json().catch(() => ({}));
            if (!response.ok || !result.success) {
              return [client.clientId, savedWaivers] as const;
            }

            const waivers = Array.from(
              new Set([
                ...savedWaivers,
                ...(result.clients || []).flatMap(
                  (record: Record<string, unknown>) =>
                    getWaivedDocumentsFromRecord(record),
                ),
              ]),
            );
            return [client.clientId, waivers] as const;
          } catch {
            return [client.clientId, savedWaivers] as const;
          }
        }),
      );

      if (!cancelled) setWaivedDocumentsByClient(Object.fromEntries(entries));
    };

    void loadWaivedDocuments();
    return () => {
      cancelled = true;
    };
  }, [referredClients]);

  const selectClient = async (client: ReferrerPortalClient) => {
    setSelectedClientId(client.clientId);
    setSelectedClientRecord(null);
    setDocumentMessage("");
    setDocumentType("");
    setUploadFile(null);

    try {
      setDocumentLoading(true);
      const response = await fetch(
        `${CLIENTS_API}?uniqueId=${encodeURIComponent(client.uniqueId)}`,
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success || !result.clients?.[0]) {
        throw new Error(result.message || "Unable to load this client.");
      }
      setSelectedClientRecord(result.clients[0]);
    } catch (error) {
      setDocumentMessage(
        error instanceof Error ? error.message : "Unable to load this client.",
      );
    } finally {
      setDocumentLoading(false);
    }
  };

  const uploadDocument = async (client: ReferrerPortalClient) => {
    if (!documentType || !uploadFile) {
      setDocumentMessage("Select a document type and file first.");
      return;
    }

    if ((waivedDocumentsByClient[client.clientId] || []).includes(documentType)) {
      setDocumentMessage(
        "This document was waived by the administrator and does not need to be uploaded.",
      );
      setDocumentType("");
      setUploadFile(null);
      return;
    }

    try {
      setDocumentLoading(true);
      setDocumentMessage("");
      const clientResponse = await fetch(
        `${CLIENTS_API}?uniqueId=${encodeURIComponent(client.uniqueId)}`,
      );
      const clientResult = await clientResponse.json().catch(() => ({}));
      if (!clientResponse.ok || !clientResult.success) {
        throw new Error(
          clientResult.message || "Unable to load the client before uploading.",
        );
      }

      const clientRecord = clientResult.clients?.[0];
      if (!clientRecord) {
        throw new Error("The selected client record could not be found.");
      }

      const formData = new FormData();
      Object.entries(clientRecord).forEach(([key, value]) => {
        if (
          value !== null &&
          value !== undefined &&
          (typeof value === "string" || typeof value === "number") &&
          !["id", "documentId", "documentType", "fileName", "fileUrl"].includes(key)
        ) {
          formData.append(key, String(value));
        }
      });
      formData.set("uniqueId", client.uniqueId);
      formData.set("source", "Referral");
      formData.set("leadType", "Referral");
      formData.set("referralCode", account.referralCode || "");
      formData.set("documentType", documentType);
      formData.set("uploaderType", "Referrer");
      formData.set("uploadedByType", "Referrer");
      formData.set("uploadedByRole", "Referrer");
      formData.set("uploadedBy", "Referrer");
      formData.set("submittedBy", "Referrer");
      formData.set("uploadSource", "Referrer Portal");
      formData.set("uploadedByReferrerId", account.referrerId || account.uniqueId);
      formData.set(
        "remarks",
        `Uploaded by Referrer (${account.referrerId || account.uniqueId})`,
      );
      formData.set(
        "adminRemarks",
        `Uploaded by Referrer (${account.referrerId || account.uniqueId})`,
      );
      formData.set("file", uploadFile);

      const response = await fetch(UPLOAD_API, { method: "POST", body: formData });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Document upload failed.");
      }

      const attributionMarker = `Uploaded by Referrer (${account.referrerId || account.uniqueId})`;
      let uploadedDocumentId = Number(result.id || result.documentId || 0);

      if (!uploadedDocumentId) {
        const refreshedResponse = await fetch(
          `${CLIENTS_API}?uniqueId=${encodeURIComponent(client.uniqueId)}`,
        );
        const refreshedResult = await refreshedResponse.json().catch(() => ({}));
        if (refreshedResponse.ok && refreshedResult.success) {
          const matchingDocuments = (refreshedResult.clients || []).filter(
            (record: Record<string, unknown>) =>
              normalizeDocumentType(
                record.documentType || record.DocumentType,
              ) === documentType &&
              String(record.fileName || record.FileName || "") === uploadFile.name,
          );
          uploadedDocumentId = matchingDocuments.reduce(
            (latestId: number, record: Record<string, unknown>) =>
              Math.max(
                latestId,
                Number(
                  record.id ||
                    record.Id ||
                    record.documentId ||
                    record.DocumentId ||
                    0,
                ),
              ),
            0,
          );
        }
      }

      let attributionSaved = false;
      if (uploadedDocumentId) {
        const attributionResponse = await fetch(
          `${DOCUMENTS_API}/${uploadedDocumentId}/pending`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              verifiedBy: attributionMarker,
              remarks: attributionMarker,
              uploaderType: "Referrer",
              uploadedByType: "Referrer",
            }),
          },
        );
        const attributionResult = await attributionResponse
          .json()
          .catch(() => ({}));
        attributionSaved = Boolean(
          attributionResponse.ok && attributionResult.success,
        );
      }

      const newDocument: ReferrerPortalDocument = {
        id: uploadedDocumentId || Date.now(),
        documentType,
        documentLabel: formatDocumentType(documentType),
        fileName: uploadFile.name,
        uploadedAt: new Date().toISOString(),
        status: "Pending",
        fileUrl: result.blobUrl || result.fileUrl,
        uploaderType: "Referrer",
        uploadedBy: "Referrer",
        remarks: attributionMarker,
      };
      setReferredClients((clients) =>
        clients.map((item) =>
          item.clientId === client.clientId
            ? { ...item, documents: [...(item.documents || []), newDocument] }
            : item,
        ),
      );
      setDocumentType("");
      setUploadFile(null);
      setDocumentMessage(
        attributionSaved
          ? "Document uploaded by Referrer and is pending review."
          : "Document uploaded and is pending review, but its uploader tag could not be synchronized. Please contact the administrator.",
      );
    } catch (error) {
      setDocumentMessage(
        error instanceof Error ? error.message : "Document upload failed.",
      );
    } finally {
      setDocumentLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eef8f6] px-4 py-8 font-sans text-slate-900">
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(135deg,rgba(37,155,143,0.18),rgba(255,255,255,0.9)_42%,rgba(238,101,33,0.1))]" />
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#259b8f,#0f172a_58%,#EE6521)] p-6 text-white shadow-2xl sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-white/70">Referrer Portal</p>
              <h1 className="mt-3 text-3xl font-black sm:text-4xl">Welcome, {fullName || "Referrer"}</h1>
              <p className="mt-3 text-sm text-white/75">Review the clients who used your referral code and their submitted-document status.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={onOpenChangePassword} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-slate-950"><FaKey /> Change Password</button>
              <button type="button" onClick={onLogout} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white/10 px-5 text-sm font-bold text-white ring-1 ring-white/20"><FaSignOutAlt /> Logout</button>
            </div>
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map(([label, value, icon]) => (
            <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between text-[#259b8f]"><p className="text-xs font-black uppercase tracking-wide">{label}</p><span className="rounded-xl bg-[#259b8f]/10 p-2">{icon}</span></div>
              <p className="mt-4 break-words text-2xl font-black text-slate-950">{value}</p>
            </div>
          ))}
        </div>

        <section className={sectionClass}>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#259b8f]">Profile</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">Referrer details</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[["RF ID", account.referrerId || account.uniqueId], ["Profession", account.profession || "Not provided"], ["Email", account.email || "Not provided"], ["Phone", account.phone || "Not provided"]].map(([label, value]) => (
              <div key={label} className={fieldClass}><p className="text-xs font-black uppercase text-slate-400">{label}</p><p className="mt-2 break-words font-bold">{value}</p></div>
            ))}
          </div>
        </section>

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(440px,0.9fr)]">
          <section className={sectionClass}>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#259b8f]">Referrals</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Clients using your referral code</h2>
            <p className="mt-2 text-sm text-slate-500">
              You can see client names and document progress, but client files remain private.
            </p>

            {referredClients.length === 0 ? (
              <p className="mt-5 rounded-2xl bg-slate-50 px-5 py-8 text-center font-semibold text-slate-500">No clients have used this referral code yet.</p>
            ) : (
              <div className="mt-5 grid gap-4">
                {referredClients.map((client) => {
                  const documents = client.documents || [];
                  const waivedDocuments =
                    waivedDocumentsByClient[client.clientId] || [];
                  const verifiedDocuments = documents.filter((document) =>
                    ["approved", "verified", "complete", "completed"].includes(
                      (document.status || "").trim().toLowerCase(),
                    ),
                  );
                  const rejectedDocuments = documents.filter((document) =>
                    ["rejected", "declined", "failed"].includes(
                      (document.status || "").trim().toLowerCase(),
                    ),
                  );
                  const pendingDocuments = documents.filter(
                    (document) =>
                      !verifiedDocuments.includes(document) &&
                      !rejectedDocuments.includes(document),
                  );
                  const pendingCount = documents.filter(
                    (document) =>
                      !["approved", "verified", "rejected"].includes(
                        (document.status || "").trim().toLowerCase(),
                      ),
                  ).length;

                  return (
                    <article key={client.clientId} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="break-words text-lg font-black text-slate-900">{client.name || "Client"}</h3>
                          <p className="mt-1 text-sm font-semibold text-slate-500">
                            {documents.length} document{documents.length !== 1 ? "s" : ""} submitted
                          </p>
                        </div>
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#259b8f] ring-1 ring-slate-200">
                          <FaFileAlt />
                        </span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 ring-1 ring-slate-200">
                          {pendingCount} pending review
                        </span>
                        <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700 ring-1 ring-cyan-200">
                          Files private
                        </span>
                      </div>
                      {documents.length > 0 && (
                        <div className="mt-4 space-y-4 border-t border-slate-200 pt-4">
                          {verifiedDocuments.length > 0 && (
                            <div>
                              <p className="text-xs font-black uppercase tracking-wide text-green-700">Verified documents</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {verifiedDocuments.map((document) => (
                                  <span key={`verified-${document.id}`} className="inline-flex flex-wrap items-center gap-2 rounded-full bg-green-50 py-1 pl-3 pr-1.5 text-xs font-black text-green-700 ring-1 ring-green-200">
                                    {document.documentLabel || formatDocumentType(document.documentType)}
                                    <span className="rounded-full bg-white px-2 py-1 text-[10px] text-slate-600 ring-1 ring-slate-200">Uploaded by {getDocumentUploader(document)}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {pendingDocuments.length > 0 && (
                            <div>
                              <p className="text-xs font-black uppercase tracking-wide text-orange-700">Pending review</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {pendingDocuments.map((document) => (
                                  <span key={`pending-${document.id}`} className="inline-flex flex-wrap items-center gap-2 rounded-full bg-orange-50 py-1 pl-3 pr-1.5 text-xs font-black text-orange-700 ring-1 ring-orange-200">
                                    {document.documentLabel || formatDocumentType(document.documentType)}
                                    <span className="rounded-full bg-white px-2 py-1 text-[10px] text-slate-600 ring-1 ring-slate-200">Uploaded by {getDocumentUploader(document)}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {rejectedDocuments.length > 0 && (
                            <div>
                              <p className="text-xs font-black uppercase tracking-wide text-red-700">Rejected documents</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {rejectedDocuments.map((document) => (
                                  <span key={`rejected-${document.id}`} className="inline-flex flex-wrap items-center gap-2 rounded-full bg-red-50 py-1 pl-3 pr-1.5 text-xs font-black text-red-700 ring-1 ring-red-200">
                                    {document.documentLabel || formatDocumentType(document.documentType)}
                                    <span className="rounded-full bg-white px-2 py-1 text-[10px] text-slate-600 ring-1 ring-slate-200">Uploaded by {getDocumentUploader(document)}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {waivedDocuments.length > 0 && (
                        <div className="mt-4 border-t border-slate-200 pt-4">
                          <p className="text-xs font-black uppercase tracking-wide text-amber-700">
                            Waived by Admin
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {waivedDocuments.map((type) => (
                              <span
                                key={type}
                                className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-700 ring-1 ring-amber-200"
                              >
                                {formatDocumentType(type)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <aside className={`${sectionClass} xl:sticky xl:top-8`}>
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
                <FaCloudUploadAlt />
              </span>
              <div>
                <h2 className="text-xl font-black text-slate-900">Upload Files</h2>
                <p className="mt-1 text-sm text-slate-500">Upload a document for one of your referred clients.</p>
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">Referral Client</label>
                <select
                  value={selectedClientId || ""}
                  onChange={(event) => {
                    const client = referredClients.find(
                      (item) => item.clientId === Number(event.target.value),
                    );
                    if (client) {
                      void selectClient(client);
                    } else {
                      setSelectedClientId(null);
                      setSelectedClientRecord(null);
                      setDocumentType("");
                      setUploadFile(null);
                      setDocumentMessage("");
                    }
                  }}
                  disabled={referredClients.length === 0 || documentLoading}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[#259b8f] focus:bg-white focus:ring-4 focus:ring-[#259b8f]/10 disabled:opacity-60"
                >
                  <option value="">Select client name</option>
                  {referredClients.map((client) => (
                    <option key={client.clientId} value={client.clientId}>{client.name || "Client"}</option>
                  ))}
                </select>
              </div>

              {selectedClient && (
                <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3">
                  <p className="text-xs font-black uppercase tracking-wide text-cyan-700">Uploading for</p>
                  <p className="mt-1 break-words font-black text-slate-900">{selectedClient.name || "Client"}</p>
                </div>
              )}

              {selectedClientId && documentLoading && !selectedClientRecord ? (
                <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500">Loading document requirements...</p>
              ) : selectedClient && selectedTransactionType ? (
                <p className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-800">
                  Showing document types for <strong>{selectedTransactionType === "full_doc" ? "Full doc" : "Alt doc"}</strong>.
                </p>
              ) : selectedClient ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">This client has no supported transaction type.</p>
              ) : null}

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">Document Type</label>
                <select value={documentType} onChange={(event) => { setDocumentType(event.target.value); setUploadFile(null); }} disabled={!selectedClient || !selectedTransactionType || documentLoading} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-[#259b8f] focus:bg-white focus:ring-4 focus:ring-[#259b8f]/10 disabled:opacity-60">
                  <option value="">Select document type</option>
                  {selectedDocumentOptions.map(([label, value]) => {
                    const isWaived = selectedWaivedDocuments.includes(value);
                    return (
                      <option key={value} value={value} disabled={isWaived}>
                        {label}{isWaived ? " (Waived by Admin)" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              {selectedWaivedDocuments.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-xs font-black uppercase tracking-wide text-amber-700">Waived documents</p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-amber-800">
                    {selectedWaivedDocuments.map(formatDocumentType).join(", ")}
                  </p>
                </div>
              )}

              <label className={`flex min-h-44 flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${documentType ? "cursor-pointer border-slate-300 bg-slate-50 hover:border-[#259b8f] hover:bg-cyan-50" : "cursor-not-allowed border-slate-200 bg-slate-50/60 opacity-60"}`}>
                <FaCloudUploadAlt className="text-4xl text-cyan-700" />
                <span className="mt-3 font-black text-slate-800">{uploadFile?.name || "Choose file"}</span>
                <span className="mt-1 text-sm text-slate-500">PDF, JPG, PNG, DOCX</span>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" disabled={!documentType} onChange={(event) => setUploadFile(event.target.files?.[0] || null)} className="hidden" />
              </label>

              <button type="button" onClick={() => selectedClient && void uploadDocument(selectedClient)} disabled={documentLoading || !selectedClient || !documentType || !uploadFile} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#EE6521] px-4 text-sm font-black text-white shadow-sm transition hover:bg-orange-600 disabled:bg-slate-300">
                <FaCloudUploadAlt /> {documentLoading ? "Uploading..." : "Upload Document"}
              </button>
            </div>

            {documentMessage && <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600 ring-1 ring-slate-200">{documentMessage}</p>}
            <p className="mt-4 text-xs leading-5 text-slate-500">
              For client privacy, uploaded files cannot be viewed or downloaded from the Referrer Portal.
            </p>
          </aside>
        </div>

      </div>

      {showChangePassword && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/70 px-3 py-4 backdrop-blur-sm sm:px-4">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-7">
              <div>
                <div className="mb-3 inline-flex rounded-2xl bg-[#259b8f]/10 p-3 text-[#259b8f]"><FaKey /></div>
                <h2 className="text-2xl font-black text-slate-950">{mustChangePassword ? "Create Your New Password" : "Change Password"}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{mustChangePassword ? "For your security, replace your temporary password before continuing." : "Use a strong password that you do not use on another account."}</p>
              </div>
              {!mustChangePassword && (
                <button type="button" onClick={onCloseChangePassword} disabled={passwordLoading} className="shrink-0 rounded-xl bg-slate-100 p-3 text-slate-500 hover:bg-slate-200 disabled:opacity-50" aria-label="Close change password"><FaTimes /></button>
              )}
            </div>

            <form onSubmit={onChangePassword} className="space-y-5 px-5 py-6 sm:px-7">
              {[
                ["Current Password", currentPassword, onCurrentPasswordChange, showCurrentPassword, setShowCurrentPassword, "current-password", <FaLock key="current-icon" />],
                ["New Password", newPassword, onNewPasswordChange, showNewPassword, setShowNewPassword, "new-password", <FaKey key="new-icon" />],
                ["Confirm New Password", confirmPassword, onConfirmPasswordChange, showConfirmPassword, setShowConfirmPassword, "new-password", <FaKey key="confirm-icon" />],
              ].map(([label, value, onChange, visible, setVisible, autoComplete, icon]) => (
                <div key={String(label)}>
                  <label className="mb-2 block text-sm font-black text-slate-700">{label as string}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{icon as React.ReactNode}</span>
                    <input
                      type={visible ? "text" : "password"}
                      value={value as string}
                      onChange={(event) => (onChange as (nextValue: string) => void)(event.target.value)}
                      autoComplete={autoComplete as string}
                      className="h-12 w-full rounded-xl border border-slate-300 pl-12 pr-12 outline-none transition focus:border-[#259b8f] focus:ring-4 focus:ring-[#259b8f]/15"
                      placeholder={`Enter ${String(label).toLowerCase()}`}
                    />
                    <button type="button" onClick={() => (setVisible as (updater: (value: boolean) => boolean) => void)((current) => !current)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700" aria-label={visible ? "Hide password" : "Show password"}>{visible ? <FaEyeSlash /> : <FaEye />}</button>
                  </div>
                </div>
              ))}

              <div className="rounded-2xl bg-slate-50 p-4 text-xs font-semibold leading-6 text-slate-600">Use at least 8 characters with uppercase and lowercase letters, a number, and a special character.</div>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                {!mustChangePassword && <button type="button" onClick={onCloseChangePassword} disabled={passwordLoading} className="h-12 rounded-xl border border-slate-300 px-5 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>}
                <button type="submit" disabled={passwordLoading} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#259b8f] px-6 font-black text-white shadow-sm hover:bg-[#1f887d] disabled:bg-[#259b8f]/40"><FaKey />{passwordLoading ? "Updating..." : "Update Password"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
