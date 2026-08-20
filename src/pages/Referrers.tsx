import { useEffect, useMemo, useState } from "react";
import {
  FaChevronDown,
  FaChevronUp,
  FaCheck,
  FaCopy,
  FaFileAlt,
  FaIdBadge,
  FaSearch,
  FaSyncAlt,
  FaUserFriends,
  FaUserTie,
} from "react-icons/fa";
import DashboardLayout from "../components/layout/layout";

const DEFAULT_API_BASE = import.meta.env.DEV
  ? "http://localhost:7071/api"
  : "https://docsuploadpythonapi-flex.azurewebsites.net/api";
const API_BASE = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE).replace(
  /\/$/,
  "",
);
const REFERRERS_API = `${API_BASE}/referrers`;

type ReferredClient = {
  clientId: number;
  uniqueId: string;
  name: string;
  status?: string;
  uploadedDocumentCount?: number;
  waivedDocumentCount?: number;
  documentCount: number;
  source?: string;
  leadType?: string;
  applicationSource?: string;
};

type Referrer = {
  id: number;
  referrerId: string;
  referralCode: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  name: string;
  email?: string;
  phone?: string;
  profession?: string;
  isActive: boolean;
  createdAt?: string;
  referredClients: ReferredClient[];
};

export default function Referrers() {
  const [referrers, setReferrers] = useState<Referrer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [copiedValue, setCopiedValue] = useState("");

  const copyToClipboard = async (value: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = value;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const copied = document.execCommand("copy");
        textArea.remove();

        if (!copied) throw new Error("Copy command failed.");
      }

      setCopiedValue(value);
      window.setTimeout(() => {
        setCopiedValue((currentValue) =>
          currentValue === value ? "" : currentValue,
        );
      }, 2000);
    } catch {
      setError("Unable to copy the ID. Please copy it manually.");
    }
  };

  const loadReferrers = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(REFERRERS_API);
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load referrers.");
      }
      setReferrers(
        (result.referrers || []).map((referrer: Referrer) => ({
          ...referrer,
          referredClients: referrer.referredClients || [],
        })),
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load referrers.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReferrers();
  }, []);

  const filteredReferrers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return referrers;

    return referrers.filter((referrer) =>
      [
        referrer.name,
        referrer.referrerId,
        referrer.referralCode,
        referrer.email,
        referrer.phone,
        referrer.profession,
        ...referrer.referredClients.flatMap((client) => [
          client.name,
          client.uniqueId,
        ]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [referrers, search]);

  const totalClients = referrers.reduce(
    (total, referrer) => total + referrer.referredClients.length,
    0,
  );
  const totalDocuments = referrers.reduce(
    (total, referrer) =>
      total +
      referrer.referredClients.reduce(
        (clientTotal, client) => clientTotal + client.documentCount,
        0,
      ),
    0,
  );

  return (
    <DashboardLayout
      title="Referrers"
      subtitle="View and manage referral and broker code owners and their linked clients"
    >
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="rounded-3xl bg-[linear-gradient(135deg,#259b8f,#0f172a_62%,#EE6521)] p-6 text-white shadow-xl sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/70">
              Dashboard
            </p>
            <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-3xl font-black sm:text-4xl">Referrers &amp; Brokers</h1>
                <p className="mt-2 text-sm text-white/75">
                  View every RF account, its type, and the clients linked to its code.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void loadReferrers()}
                disabled={loading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-slate-900 disabled:opacity-60"
              >
                <FaSyncAlt className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </header>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Code Owners", referrers.length, <FaUserTie />],
              ["Linked Clients", totalClients, <FaUserFriends />],
              ["Client Documents", totalDocuments, <FaFileAlt />],
            ].map(([label, value, icon]) => (
              <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between text-[#259b8f]">
                  <p className="text-xs font-black uppercase tracking-wide">{label}</p>
                  <span className="rounded-xl bg-[#259b8f]/10 p-2">{icon}</span>
                </div>
                <p className="mt-4 text-3xl font-black text-slate-950">{value}</p>
              </div>
            ))}
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="mb-2 block text-sm font-black text-slate-700">Search Referrers or Clients</label>
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search RF ID, referral code, name, email, profession or client ID"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-[#259b8f] focus:ring-4 focus:ring-[#259b8f]/10"
              />
            </div>
          </section>

          {error && <p className="rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-700">{error}</p>}

          <section className="space-y-4">
            {loading && referrers.length === 0 ? (
              <p className="rounded-2xl bg-white p-10 text-center font-bold text-slate-500">Loading referrers...</p>
            ) : filteredReferrers.length === 0 ? (
              <p className="rounded-2xl bg-white p-10 text-center font-bold text-slate-500">No referrers found.</p>
            ) : (
              filteredReferrers.map((referrer) => {
                const expanded = expandedId === referrer.id;
                const accountType =
                  referrer.profession?.trim().toLowerCase() === "broker"
                    ? "Broker"
                    : "Referral";
                const documentCount = referrer.referredClients.reduce(
                  (total, client) => total + client.documentCount,
                  0,
                );

                return (
                  <article key={referrer.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div
                      className="flex w-full flex-col gap-4 p-5 text-left sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-xl font-black text-slate-950">{referrer.name || "Unnamed Referrer"}</h2>
                          <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${
                            accountType === "Broker"
                              ? "bg-sky-50 text-sky-700 ring-sky-200"
                              : "bg-cyan-50 text-cyan-700 ring-cyan-200"
                          }`}>
                            {accountType}
                          </span>
                          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700 ring-1 ring-green-200">{referrer.profession || "Referrer"}</span>
                        </div>
                        <p className="mt-2 text-sm text-slate-500">{referrer.email || "No email"} Â· {referrer.phone || "No phone"}</p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
                          <button
                            type="button"
                            onClick={() => void copyToClipboard(referrer.referrerId)}
                            className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-3 py-1 text-cyan-700 transition hover:bg-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                            title="Copy referrer ID"
                          >
                            <FaIdBadge />
                            <span className="select-all">{referrer.referrerId}</span>
                            {copiedValue === referrer.referrerId ? <FaCheck aria-label="Copied" /> : <FaCopy aria-label="Copy" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => void copyToClipboard(referrer.referralCode)}
                            className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-orange-700 transition hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
                            title="Copy referral code"
                          >
                            <span className="select-all">{referrer.referralCode}</span>
                            {copiedValue === referrer.referralCode ? <FaCheck aria-label="Copied" /> : <FaCopy aria-label="Copy" />}
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setExpandedId(expanded ? null : referrer.id)}
                        className="flex items-center gap-4 rounded-xl p-2 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#259b8f]"
                        aria-expanded={expanded}
                        aria-label={`${expanded ? "Collapse" : "Expand"} clients for ${referrer.name || referrer.referrerId}`}
                      >
                        <div className="text-right text-sm">
                          <p className="font-black text-slate-900">{referrer.referredClients.length} clients</p>
                          <p className="text-slate-500">{documentCount} documents</p>
                        </div>
                        {expanded ? <FaChevronUp /> : <FaChevronDown />}
                      </button>
                    </div>

                    {expanded && (
                      <div className="border-t border-slate-200 bg-slate-50 p-5">
                        <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">Clients linked to {referrer.name || referrer.referrerId}</h3>
                        {referrer.referredClients.length === 0 ? (
                          <p className="rounded-xl bg-white p-4 text-sm font-semibold text-slate-500">No clients have used this referral code yet.</p>
                        ) : (
                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {referrer.referredClients.map((client) => {
                              const clientSource = (
                                client.source ||
                                client.applicationSource ||
                                client.leadType ||
                                accountType
                              ).trim().toLowerCase();
                              const clientType =
                                clientSource === "broker" ||
                                clientSource === "business-owner"
                                  ? "Broker"
                                  : "Referral";

                              return (
                              <div key={client.clientId} className="rounded-xl border border-slate-200 bg-white p-4">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <div>
                                    <p className="font-black text-slate-900">{client.name || "Client"}</p>
                                    <p className="mt-1 text-xs font-bold text-cyan-700">{client.uniqueId}</p>
                                  </div>
                                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ring-1 ${
                                    clientType === "Broker"
                                      ? "bg-sky-50 text-sky-700 ring-sky-200"
                                      : "bg-cyan-50 text-cyan-700 ring-cyan-200"
                                  }`}>
                                    {clientType}
                                  </span>
                                </div>
                                <div className="mt-3 flex items-center justify-between gap-2 text-xs">
                                  <span className="rounded-full bg-slate-100 px-2 py-1 font-bold text-slate-600">{client.status || "Pending Team Call"}</span>
                                  <span className="text-right font-black text-orange-700">
                                    {client.documentCount} docs
                                    {(client.waivedDocumentCount || 0) > 0 && (
                                      <span className="block text-[10px] text-amber-700">
                                        {client.waivedDocumentCount} waived
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
