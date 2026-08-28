import { useEffect, useState } from "react";

const ENV_API_BASE = import.meta.env.VITE_API_BASE_URL?.trim().replace(
  /\/+$/,
  "",
);
const LOCAL_API_BASE = "http://localhost:7071/api";
const PRODUCTION_API_BASE =
  "https://docsuploadpythonapi-flex.azurewebsites.net/api";

const isLocalDevelopment =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

const API_BASE =
  ENV_API_BASE || (isLocalDevelopment ? LOCAL_API_BASE : PRODUCTION_API_BASE);

const API_URL = `${API_BASE}/uploadclient`;
const REFERRER_LOOKUP_API = `${API_BASE}/referrer-lookup`;
const REFERRERS_API = `${API_BASE}/referrers`;

// Temporarily hidden while these intake fields are out of scope.
const SHOW_ADVANCED_LOAN_FIELDS = false;
const SHOW_SUBMISSION_DOCUMENT_UPLOADS = false;

type GhlOperationResult = {
  success?: boolean;
  skipped?: boolean;
  statusCode?: number;
  message?: string;
  body?: unknown;
};

type UploadClientResponse = {
  success: boolean;
  message: string;
  clientId: number;
  uniqueId: string;
  blobUrl: string;
  leadType?: string;
  source?: string;
  status?: string;
  ghlSync?: GhlOperationResult;
  ghlSubmissionTrigger?: GhlOperationResult;
  referrerAccount?: {
    referrerId: string;
    referralCode: string;
    created: boolean;
  } | null;
  referrerNotification?: GhlOperationResult;
  coBorrowerNotifications?: GhlOperationResult[];
};

type ReferrerLookupResponse = {
  success: boolean;
  message?: string;
  referrer?: {
    referralCode: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    email: string;
    phone?: string;
    profession?: string;
  };
};

type ReferrerListResponse = {
  success: boolean;
  referrers?: Array<{
    name?: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    email?: string;
    referrerId?: string;
    referralCode?: string;
  }>;
};

type DocumentOption = {
  label: string;
  value: string;
};

type CoBorrower = {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  phoneCountryCode: string;
  phone: string;
  email: string;
};

type SubmissionSuccess = {
  uniqueId: string;
  source: string;
  status: string;
  missingRequirements: string[];
  referrerAccount?: {
    referrerId: string;
    referralCode: string;
    created: boolean;
  } | null;
};

const createEmptyCoBorrower = (): CoBorrower => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  firstName: "",
  middleName: "",
  lastName: "",
  phoneCountryCode: "AU:+61",
  phone: "",
  email: "",
});

const sharedDocumentOptions: DocumentOption[] = [
  { label: "ID", value: "id" },
  { label: "Passport", value: "passport" },
  {
    label: "Last 6 Months Mortgage Statements",
    value: "last-6-months-mortgage-statements",
  },
  { label: "Council Rates Notice", value: "council-rates-notice" },
];

const transactionDocumentOptions: Record<string, DocumentOption[]> = {
  "Alt doc": [
    { label: "BAS from ATO Portal", value: "bas-from-ato-portal" },
    {
      label: "Business Banking Statements",
      value: "business-banking-statements",
    },
    ...sharedDocumentOptions,
  ],
  "Full doc": [
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
    ...sharedDocumentOptions,
  ],
};

const allDocumentOptions = Object.values(transactionDocumentOptions).flat();

const getDocumentOptionsForTransaction = (
  transactionType?: string,
): DocumentOption[] => transactionDocumentOptions[transactionType || ""] || [];

const sourceOptions = [
  { label: "Broker", value: "broker" },
  { label: "Referral", value: "referral" },
  { label: "Direct Client", value: "direct-client" },
];
const applicationAudienceOptions = [
  { label: "Direct Client", value: "direct-client" },
  { label: "Referral", value: "referral" },
];

const classificationOptions = ["Residential", "Commercial"];
const borrowerOptions = ["Individual", "Company"];
const directClientBorrowerOptions = ["Business", "Personal"];
const referralBorrowerOptions = ["Business", "Personal", "Do not know"];
const referrerProfessionOptions = [
  "Broker",
  "Accountant",
  "Lawyer",
  "Financial Planner",
  "Mortgage Broker",
  "Bookkeeper",
  "Other",
];

const objectiveOptions = [
  "Purchase",
  "Refinance",
  "Asset finance",
  "Construction",
  "Development",
  "Personal loan",
  "Business loan",
];

const loanTypeOptions = ["Commercial", "Residential"];
const purposeOptions = ["Investment", "Owner occupied"];
const yesNoOptions = ["Yes", "No"];
const countryCodeOptions = [
  {
    flag: "\u{1F1E6}\u{1F1FA}",
    label: "AU +61",
    country: "Australia",
    value: "AU:+61",
    dialCode: "+61",
  },
  {
    flag: "\u{1F1F5}\u{1F1ED}",
    label: "PH +63",
    country: "Philippines",
    value: "PH:+63",
    dialCode: "+63",
  },
  {
    flag: "\u{1F1FA}\u{1F1F8}",
    label: "US +1",
    country: "United States",
    value: "US:+1",
    dialCode: "+1",
  },
  {
    flag: "\u{1F1EC}\u{1F1E7}",
    label: "UK +44",
    country: "United Kingdom",
    value: "UK:+44",
    dialCode: "+44",
  },
  {
    flag: "\u{1F1F3}\u{1F1FF}",
    label: "NZ +64",
    country: "New Zealand",
    value: "NZ:+64",
    dialCode: "+64",
  },
  {
    flag: "\u{1F1F8}\u{1F1EC}",
    label: "SG +65",
    country: "Singapore",
    value: "SG:+65",
    dialCode: "+65",
  },
  {
    flag: "\u{1F1E8}\u{1F1E6}",
    label: "CA +1",
    country: "Canada",
    value: "CA:+1",
    dialCode: "+1",
  },
];

const inputClass =
  "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#259b8f] focus:ring-4 focus:ring-[#259b8f]/15";

const selectClass =
  "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-[#259b8f] focus:ring-4 focus:ring-[#259b8f]/15";

const textAreaClass =
  "w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#259b8f] focus:ring-4 focus:ring-[#259b8f]/15";

const sectionClass =
  "rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]";

const errorFieldClass =
  "border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500/15";

const initialFormData = {
  leadType: "direct-client",
  source: "direct-client",

  firstName: "",
  middleName: "",
  lastName: "",
  email: "",
  phoneCountryCode: "AU:+61",
  phone: "",

  classificationType: "",
  borrowerType: "",
  objective: "",
  loanType: "",
  purpose: "",
  transactionType: "",
  withBorrowersGuarantors: "",

  referrerFirstName: "",
  referrerMiddleName: "",
  referrerLastName: "",
  referrerPhoneCountryCode: "AU:+61",
  referrerPhone: "",
  referrerEmail: "",
  referrerProfession: "",
  uniqueReferrerCode: "",

  hasProperty: "",
  propertyType: "",
  hasMultipleProperties: "",
  isSelfEmployed: "",
  hasTaxReturn: "",
  dpnIssues: "",
  dpnDetails: "",
  isClientCompliant: "",
  painPoint: "",
  heardAboutUs: "",
  sbrFundingAccountManager: "",

  vedaIssues: "No",
  conductIssues: "No",
  clientNeedsObjectives: "",
  applicantBackground: "",
  explanationOfIncome: "",
  security: "",

  loanAmount: "",
  securityValue: "",
  lvr: "",
  anticipatedSettlementDate: "",
  specialNotes: "",

  documentTypes: [] as string[],
  documentFiles: {} as Record<string, File | null>,

  sssNumber: "",
  hdmfNumber: "",
  philhealthNumber: "",
  tinNumber: "",
  licenseNumber: "",
};

type FormFieldName = keyof typeof initialFormData;
type FormFieldErrors = Partial<Record<FormFieldName, string>>;
type CoBorrowerFieldName = "firstName" | "lastName" | "phone" | "email";
type CoBorrowerFieldErrors = Partial<Record<CoBorrowerFieldName, string>>;

const normalizeSource = (source?: string) =>
  (source || "broker")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");

const canonicalSource = (source?: string) => {
  const normalized = normalizeSource(source);

  if (normalized === "direct_client" || normalized === "directclient") {
    return "direct-client";
  }

  if (normalized === "referral" || normalized === "referal") {
    return "referral";
  }

  return "broker";
};

const isDirectClientSource = (source?: string) =>
  canonicalSource(source) === "direct-client";

const isReferralSource = (source?: string) =>
  canonicalSource(source) === "referral";

const isBrokerSource = (source?: string) =>
  canonicalSource(source) === "broker";

const appendFormAliases = (
  formData: FormData,
  fieldNames: string[],
  value?: string | number | null,
) => {
  const safeValue = value === undefined || value === null ? "" : String(value);

  fieldNames.forEach((fieldName) => {
    formData.append(fieldName, safeValue);
  });
};

const formatPhoneNumber = (countryCode: string, phone: string) => {
  const cleanPhone = phone.trim();

  if (!cleanPhone) return "";
  if (cleanPhone.startsWith("+")) return cleanPhone;

  const selectedCountry = countryCodeOptions.find(
    (country) => country.value === countryCode,
  );
  const dialCode =
    selectedCountry?.dialCode || countryCode.split(":").pop() || countryCode;

  return `${dialCode} ${cleanPhone}`;
};

const splitStoredPhoneNumber = (phone?: string) => {
  const normalized = (phone || "").trim();
  const selectedCountry = countryCodeOptions.find((country) =>
    normalized.startsWith(country.dialCode),
  ) || countryCodeOptions[0];
  const localNumber = normalized
    .replace(selectedCountry.dialCode, "")
    .replace(/\D/g, "");

  return {
    countryCode: selectedCountry.value,
    localNumber,
  };
};

const calculateLvr = (loanAmount: string, securityValue: string) => {
  const loanAmountValue = Number(loanAmount);
  const securityValueValue = Number(securityValue);

  if (!loanAmountValue || !securityValueValue) return "";

  return ((loanAmountValue / securityValueValue) * 100).toFixed(2);
};

export default function HomePage() {
  console.info("Client Submission API:", API_URL);

  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coBorrowers, setCoBorrowers] = useState<CoBorrower[]>([]);
  const [coBorrowerDraft, setCoBorrowerDraft] = useState<CoBorrower>(
    createEmptyCoBorrower,
  );
  const [isCoBorrowerModalOpen, setIsCoBorrowerModalOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});
  const [coBorrowerErrors, setCoBorrowerErrors] =
    useState<CoBorrowerFieldErrors>({});
  const [documentErrors, setDocumentErrors] = useState<Record<string, string>>(
    {},
  );
  const [formErrorMessage, setFormErrorMessage] = useState("");
  const [referrerLookupStatus, setReferrerLookupStatus] = useState<
    "idle" | "loading" | "found" | "error"
  >("idle");
  const [referrerLookupMessage, setReferrerLookupMessage] = useState("");
  const [isReferrerResolved, setIsReferrerResolved] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] =
    useState<SubmissionSuccess | null>(null);

  const showReferrerDetails =
    isBrokerSource(formData.source) || isReferralSource(formData.source);

  const detailLabel = isBrokerSource(formData.source) ? "Broker" : "Referral";
  const isReferral = isReferralSource(formData.source);
  const isDirectClient = isDirectClientSource(formData.source);
  const usesSimplifiedIntake = isReferral || isDirectClient;
  const fullPhone = formatPhoneNumber(
    formData.phoneCountryCode,
    formData.phone,
  );
  const fullReferrerPhone = formatPhoneNumber(
    formData.referrerPhoneCountryCode,
    formData.referrerPhone,
  );

  const activeDocumentOptions = getDocumentOptionsForTransaction(
    formData.transactionType,
  );
  const selectedCoBorrowerCountry =
    countryCodeOptions.find(
      (country) => country.value === coBorrowerDraft.phoneCountryCode,
    ) || countryCodeOptions[0];

  useEffect(() => {
    const referralCode = formData.uniqueReferrerCode.trim().toUpperCase();

    if (!referralCode) {
      setReferrerLookupStatus("idle");
      setReferrerLookupMessage("");
      setIsReferrerResolved(false);
      return;
    }

    if (!referralCode.startsWith("REF-")) {
      setReferrerLookupStatus("error");
      setReferrerLookupMessage("Referral codes must start with REF-.");
      setIsReferrerResolved(false);
      return;
    }

    const controller = new AbortController();
    const lookupTimer = window.setTimeout(async () => {
      try {
        setReferrerLookupStatus("loading");
        setReferrerLookupMessage("Checking referral code...");

        const response = await fetch(
          `${REFERRER_LOOKUP_API}?code=${encodeURIComponent(referralCode)}`,
          { signal: controller.signal },
        );
        const result = (await response.json()) as ReferrerLookupResponse;

        if (!response.ok || !result.success || !result.referrer) {
          throw new Error(result.message || "Referrer code not found.");
        }

        const phoneParts = splitStoredPhoneNumber(result.referrer.phone);
        setFormData((previous) => ({
          ...previous,
          uniqueReferrerCode: result.referrer!.referralCode,
          referrerFirstName: result.referrer!.firstName || "",
          referrerMiddleName: result.referrer!.middleName || "",
          referrerLastName: result.referrer!.lastName || "",
          referrerEmail: result.referrer!.email || "",
          referrerPhoneCountryCode: phoneParts.countryCode,
          referrerPhone: phoneParts.localNumber,
          referrerProfession: result.referrer!.profession || previous.referrerProfession,
          source:
            result.referrer!.profession === "Broker" ? "broker" : "referral",
          leadType:
            result.referrer!.profession === "Broker" ? "broker" : "referral",
        }));
        setFieldErrors((previous) => {
          const next = { ...previous };
          delete next.uniqueReferrerCode;
          delete next.referrerFirstName;
          delete next.referrerLastName;
          delete next.referrerEmail;
          delete next.referrerProfession;
          return next;
        });
        setIsReferrerResolved(true);
        setReferrerLookupStatus("found");
        setReferrerLookupMessage("Referrer verified. Saved details were filled automatically.");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setIsReferrerResolved(false);
        setReferrerLookupStatus("error");
        setReferrerLookupMessage(
          error instanceof Error ? error.message : "Referrer code not found.",
        );
      }
    }, 500);

    return () => {
      window.clearTimeout(lookupTimer);
      controller.abort();
    };
  }, [formData.uniqueReferrerCode]);

  const clearFieldError = (name: string) => {
    setFieldErrors((prev) => {
      if (!(name in prev)) return prev;

      const next = { ...prev };
      delete next[name as FormFieldName];
      return next;
    });
    setFormErrorMessage("");
  };

  const scrollToFirstError = () => {
    window.requestAnimationFrame(() => {
      document
        .querySelector<HTMLElement>('[data-field-error="true"]')
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = event.target;
    const cleanValue =
      name === "phone" || name === "referrerPhone"
        ? value.replace(/\D/g, "")
        : value;

    clearFieldError(name);

    if (name === "uniqueReferrerCode" && isReferrerResolved) {
      setIsReferrerResolved(false);
      setReferrerLookupStatus("idle");
      setReferrerLookupMessage("");
      setFormData((previous) => ({
        ...previous,
        referrerFirstName: "",
        referrerMiddleName: "",
        referrerLastName: "",
        referrerPhoneCountryCode: "AU:+61",
        referrerPhone: "",
        referrerEmail: "",
      }));
    }

    if (name === "transactionType") {
      setDocumentErrors({});
    }

    if (name === "withBorrowersGuarantors") {
      setFormData((prev) => ({
        ...prev,
        withBorrowersGuarantors: cleanValue,
      }));

      if (cleanValue === "Yes") {
        setCoBorrowerDraft(createEmptyCoBorrower());
        setCoBorrowerErrors({});
        setIsCoBorrowerModalOpen(true);
      } else {
        setCoBorrowers([]);
        setCoBorrowerDraft(createEmptyCoBorrower());
        setCoBorrowerErrors({});
        setIsCoBorrowerModalOpen(false);
      }

      return;
    }

    setFormData((prev) => {
      const nextData = {
        ...prev,
        [name]: cleanValue,
      };

      if (name === "transactionType") {
        return {
          ...nextData,
          documentTypes: [],
          documentFiles: {},
        };
      }

      if (name === "loanAmount" || name === "securityValue") {
        return {
          ...nextData,
          lvr: calculateLvr(nextData.loanAmount, nextData.securityValue),
        };
      }

      return nextData;
    });
  };

  const handleSourceChange = (source: string) => {
    const selectedSource = canonicalSource(source);

    setFormData((prev) => ({
      ...prev,
      source: selectedSource,
      leadType: selectedSource,
      ...(isReferralSource(selectedSource) || isDirectClientSource(selectedSource)
        ? { documentTypes: [], documentFiles: {} }
        : {}),
      ...(isDirectClientSource(selectedSource)
        ? {
            referrerFirstName: "",
            referrerMiddleName: "",
            referrerLastName: "",
            referrerPhoneCountryCode: "AU:+61",
            referrerPhone: "",
            referrerEmail: "",
          }
        : {}),
    }));
  };

  const handleAudienceChange = (audience: string) => {
    if (audience === "direct-client") {
      handleSourceChange("direct-client");
      return;
    }

    const selectedReferrerType = formData.referrerProfession;
    handleSourceChange(selectedReferrerType === "Broker" ? "broker" : "referral");
  };

  const handleReferrerTypeChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const referrerType = event.target.value;
    clearFieldError("referrerProfession");
    setFormData((prev) => ({
      ...prev,
      referrerProfession: referrerType,
      source: referrerType === "Broker" ? "broker" : "referral",
      leadType: referrerType === "Broker" ? "broker" : "referral",
      uniqueReferrerCode:
        referrerType === "Broker" ? "" : prev.uniqueReferrerCode,
      documentTypes: referrerType === "Broker" ? prev.documentTypes : [],
      documentFiles: referrerType === "Broker" ? prev.documentFiles : {},
    }));
    if (referrerType === "Broker") {
      setIsReferrerResolved(false);
      setReferrerLookupStatus("idle");
      setReferrerLookupMessage("");
    }
  };

  const handleCoBorrowerDraftChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    const cleanValue = name === "phone" ? value.replace(/\D/g, "") : value;

    setCoBorrowerErrors((prev) => {
      const next = { ...prev };
      delete next[name as CoBorrowerFieldName];
      return next;
    });

    setCoBorrowerDraft((prev) => ({
      ...prev,
      [name]: cleanValue,
    }));
  };

  const openCoBorrowerModal = () => {
    setCoBorrowerDraft(createEmptyCoBorrower());
    setCoBorrowerErrors({});
    setIsCoBorrowerModalOpen(true);
  };

  const saveCoBorrowerDraft = (closeAfterSave = false) => {
    const firstName = coBorrowerDraft.firstName.trim();
    const middleName = coBorrowerDraft.middleName.trim();
    const lastName = coBorrowerDraft.lastName.trim();
    const phone = coBorrowerDraft.phone.trim();
    const email = coBorrowerDraft.email.trim();

    const nextErrors: CoBorrowerFieldErrors = {};

    if (!firstName) nextErrors.firstName = "First name is required.";
    if (!lastName) nextErrors.lastName = "Last name is required.";
    if (!phone) nextErrors.phone = "Phone number is required.";

    if (!email) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setCoBorrowerErrors(nextErrors);
      return false;
    }

    setCoBorrowers((prev) => [
      ...prev,
      {
        ...coBorrowerDraft,
        firstName,
        middleName,
        lastName,
        phone,
        email,
      },
    ]);

    setCoBorrowerDraft(createEmptyCoBorrower());
    setCoBorrowerErrors({});

    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.withBorrowersGuarantors;
      return next;
    });

    setFormErrorMessage("");

    if (closeAfterSave) {
      setIsCoBorrowerModalOpen(false);
    }

    return true;
  };

  const handleAddCoBorrower = () => {
    saveCoBorrowerDraft(false);
  };

  const handleDoneCoBorrower = () => {
    const hasDraftData =
      coBorrowerDraft.firstName.trim() ||
      coBorrowerDraft.middleName.trim() ||
      coBorrowerDraft.lastName.trim() ||
      coBorrowerDraft.phone.trim() ||
      coBorrowerDraft.email.trim();

    if (!hasDraftData) {
      setCoBorrowerErrors({});
      setIsCoBorrowerModalOpen(false);
      return;
    }

    saveCoBorrowerDraft(true);
  };

  const handleRemoveCoBorrower = (id: string) => {
    setCoBorrowers((prev) => prev.filter((coBorrower) => coBorrower.id !== id));
  };

  const handleDocumentTypeToggle = (type: string) => {
    setDocumentErrors((prev) => {
      const next = { ...prev };
      delete next[type];
      return next;
    });

    setFormData((prev) => {
      const isSelected = prev.documentTypes.includes(type);
      const updatedFiles = { ...prev.documentFiles };

      if (isSelected) {
        delete updatedFiles[type];
      } else {
        updatedFiles[type] = null;
      }

      return {
        ...prev,
        documentTypes: isSelected
          ? prev.documentTypes.filter((item) => item !== type)
          : [...prev.documentTypes, type],
        documentFiles: updatedFiles,
      };
    });
  };

  const handleDocumentFileChange = (
    type: string,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0] || null;

    if (file) {
      setDocumentErrors((prev) => {
        const next = { ...prev };
        delete next[type];
        return next;
      });
      setFormErrorMessage("");
    }

    setFormData((prev) => ({
      ...prev,
      documentFiles: {
        ...prev.documentFiles,
        [type]: file,
      },
    }));
  };

  const formatDocumentType = (type: string) =>
    allDocumentOptions.find((item) => item.value === type)?.label ||
    type
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const formatSource = (source: string) => {
    const canonical = canonicalSource(source);
    return (
      sourceOptions.find((item) => item.value === canonical)?.label || "Broker"
    );
  };

  const getMissingRequirements = (data: typeof initialFormData) => {
    if (isReferralSource(data.source) || isDirectClientSource(data.source)) {
      // Referral/direct-client submissions may be created without selecting a
      // document checklist, but they must not be reported as "complete" in
      // notifications when no document was submitted at all.
      return data.documentTypes.length > 0 ? [] : ["at least one document"];
    }

    const requiredDocuments = getDocumentOptionsForTransaction(
      data.transactionType,
    );

    return requiredDocuments
      .filter((item) => !data.documentTypes.includes(item.value))
      .map((item) => `${item.label} document`);
  };

  const uploadToAzure = async (
    documentType = "",
    file?: File | null,
    existingUniqueId?: string,
  ) => {
    const azureFormData = new FormData();

    if (existingUniqueId) {
      azureFormData.append("uniqueId", existingUniqueId);
    }

    const selectedSource = canonicalSource(formData.source);
    const compatibilityClassification =
      formData.classificationType ||
      (usesSimplifiedIntake
        ? isReferral
          ? "Referral"
          : "Direct Client"
        : "To be confirmed");
    const compatibilityObjective =
      formData.objective ||
      formData.clientNeedsObjectives ||
      "To be confirmed";
    const compatibilityLoanType =
      formData.loanType || "To be confirmed";
    const compatibilityPurpose =
      formData.purpose ||
      formData.painPoint ||
      formData.clientNeedsObjectives ||
      "To be confirmed";
    const compatibilitySecurity =
      formData.security || "To be confirmed";

    appendFormAliases(
      azureFormData,
      ["leadType", "LeadType", "lead_type"],
      selectedSource,
    );
    appendFormAliases(azureFormData, ["source", "Source"], selectedSource);

    appendFormAliases(
      azureFormData,
      ["firstName", "FirstName", "first_name"],
      formData.firstName,
    );
    appendFormAliases(
      azureFormData,
      ["middleName", "MiddleName", "middle_name"],
      formData.middleName,
    );
    appendFormAliases(
      azureFormData,
      ["lastName", "LastName", "last_name"],
      formData.lastName,
    );
    appendFormAliases(azureFormData, ["email", "Email"], formData.email);
    appendFormAliases(azureFormData, ["phone", "Phone"], fullPhone);

    appendFormAliases(
      azureFormData,
      ["classificationType", "ClassificationType", "classification_type"],
      compatibilityClassification,
    );
    appendFormAliases(
      azureFormData,
      ["borrowerType", "BorrowerType", "borrower_type"],
      formData.borrowerType,
    );
    appendFormAliases(
      azureFormData,
      ["objective", "Objective"],
      compatibilityObjective,
    );
    appendFormAliases(
      azureFormData,
      ["loanType", "LoanType", "loan_type"],
      compatibilityLoanType,
    );
    appendFormAliases(
      azureFormData,
      ["purpose", "Purpose"],
      compatibilityPurpose,
    );
    appendFormAliases(
      azureFormData,
      ["transactionType", "TransactionType", "transaction_type"],
      formData.transactionType,
    );
    appendFormAliases(
      azureFormData,
      [
        "withBorrowersGuarantors",
        "WithBorrowersGuarantors",
        "with_borrowers_guarantors",
        "withBorrowers",
      ],
      formData.withBorrowersGuarantors,
    );

    const serializedCoBorrowers = coBorrowers.map((coBorrower) => ({
      firstName: coBorrower.firstName,
      middleName: coBorrower.middleName,
      lastName: coBorrower.lastName,
      phoneCountryCode: coBorrower.phoneCountryCode,
      phone: formatPhoneNumber(coBorrower.phoneCountryCode, coBorrower.phone),
      email: coBorrower.email,
    }));

    appendFormAliases(
      azureFormData,
      ["coBorrowers", "CoBorrowers", "co_borrowers"],
      JSON.stringify(serializedCoBorrowers),
    );
    appendFormAliases(
      azureFormData,
      ["coBorrowerCount", "CoBorrowerCount", "co_borrower_count"],
      serializedCoBorrowers.length,
    );

    appendFormAliases(
      azureFormData,
      ["referrerFirstName", "ReferrerFirstName", "referrer_first_name"],
      formData.referrerFirstName,
    );
    appendFormAliases(
      azureFormData,
      ["referrerMiddleName", "ReferrerMiddleName", "referrer_middle_name"],
      formData.referrerMiddleName,
    );
    appendFormAliases(
      azureFormData,
      ["referrerLastName", "ReferrerLastName", "referrer_last_name"],
      formData.referrerLastName,
    );
    appendFormAliases(
      azureFormData,
      ["referrerPhone", "ReferrerPhone", "referrer_phone"],
      fullReferrerPhone,
    );
    appendFormAliases(
      azureFormData,
      ["referrerEmail", "ReferrerEmail", "referrer_email"],
      formData.referrerEmail,
    );
    const referralFields: Array<[string[], string]> = [
      [["referrerProfession", "ReferrerProfession", "referrer_profession"], formData.referrerProfession],
      [["uniqueReferrerCode", "UniqueReferrerCode", "unique_referrer_code"], formData.uniqueReferrerCode],
      [["hasProperty", "HasProperty", "has_property"], formData.hasProperty],
      [["propertyType", "PropertyType", "property_type"], formData.propertyType],
      [["hasMultipleProperties", "HasMultipleProperties", "has_multiple_properties"], formData.hasMultipleProperties],
      [["isSelfEmployed", "IsSelfEmployed", "is_self_employed"], formData.isSelfEmployed],
      [["hasTaxReturn", "HasTaxReturn", "has_tax_return"], formData.hasTaxReturn],
      [["dpnIssues", "DpnIssues", "dpn_issues"], formData.dpnIssues],
      [["dpnDetails", "DpnDetails", "dpn_details"], formData.dpnDetails],
      [["isClientCompliant", "IsClientCompliant", "is_client_compliant"], formData.isClientCompliant],
      [["painPoint", "PainPoint", "pain_point"], formData.painPoint],
      [["heardAboutUs", "HeardAboutUs", "heard_about_us"], formData.heardAboutUs],
      [["sbrFundingAccountManager", "SbrFundingAccountManager", "sbr_funding_account_manager"], formData.sbrFundingAccountManager],
    ];
    referralFields.forEach(([aliases, value]) =>
      appendFormAliases(azureFormData, aliases, value),
    );
    appendFormAliases(
      azureFormData,
      [
        "createReferrerPortal",
        "CreateReferrerPortal",
        "create_referrer_portal",
        "createReferrerAccount",
        "CreateReferrerAccount",
      ],
      isReferral ? "true" : "false",
    );

    appendFormAliases(
      azureFormData,
      ["vedaIssues", "VedaIssues", "veda_issues"],
      formData.vedaIssues,
    );
    appendFormAliases(
      azureFormData,
      ["conductIssues", "ConductIssues", "conduct_issues"],
      formData.conductIssues,
    );
    appendFormAliases(
      azureFormData,
      [
        "clientNeedsObjectives",
        "ClientNeedsObjectives",
        "client_needs_objectives",
      ],
      formData.clientNeedsObjectives,
    );
    appendFormAliases(
      azureFormData,
      ["applicantBackground", "ApplicantBackground", "applicant_background"],
      formData.applicantBackground,
    );
    appendFormAliases(
      azureFormData,
      ["explanationOfIncome", "ExplanationOfIncome", "explanation_of_income"],
      formData.explanationOfIncome,
    );
    appendFormAliases(
      azureFormData,
      ["security", "Security"],
      compatibilitySecurity,
    );

    appendFormAliases(
      azureFormData,
      ["loanAmount", "LoanAmount", "loan_amount"],
      formData.loanAmount || "0",
    );
    appendFormAliases(
      azureFormData,
      ["securityValue", "SecurityValue", "security_value"],
      SHOW_ADVANCED_LOAN_FIELDS ? formData.securityValue : "0",
    );
    appendFormAliases(
      azureFormData,
      ["lvr", "Lvr", "LVR"],
      SHOW_ADVANCED_LOAN_FIELDS ? formData.lvr : "0",
    );
    appendFormAliases(
      azureFormData,
      [
        "anticipatedSettlementDate",
        "AnticipatedSettlementDate",
        "anticipated_settlement_date",
      ],
      SHOW_ADVANCED_LOAN_FIELDS
        ? formData.anticipatedSettlementDate
        : "1900-01-01",
    );
    appendFormAliases(
      azureFormData,
      ["specialNotes", "SpecialNotes", "special_notes"],
      formData.specialNotes,
    );

    azureFormData.append("documentType", documentType);
    appendFormAliases(
      azureFormData,
      ["submissionOnly", "SubmissionOnly", "submission_only"],
      file ? "false" : "true",
    );
    appendFormAliases(
      azureFormData,
      ["hasDocument", "HasDocument", "has_document"],
      file ? "true" : "false",
    );

    if (file) {
      azureFormData.append("file", file);
    }

    const response = await fetch(API_URL, {
      method: "POST",
      body: azureFormData,
    });

    let result: UploadClientResponse;

    try {
      result = (await response.json()) as UploadClientResponse;
    } catch {
      throw new Error(
        `The server returned an invalid response (${response.status}).`,
      );
    }

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Azure upload failed.");
    }

    console.info("GHL contact sync:", result.ghlSync);
    console.info(
      "GHL submission workflow trigger:",
      result.ghlSubmissionTrigger,
    );

    return result;
  };

  const validateRequiredFields = (): FormFieldErrors => {
    const nextErrors: FormFieldErrors = {};
    const requiredFields: Array<[FormFieldName, string]> = [
      ["firstName", "First name"],
      ["lastName", "Last name"],
      ["email", "Email address"],
      ["phone", "Phone number"],
      ["borrowerType", "Borrower type"],
      ["transactionType", "Financial statements availability"],
      ["withBorrowersGuarantors", "Co-borrower selection"],
    ];

    if (showReferrerDetails) {
      requiredFields.push(
        ["referrerProfession", "Referrer profession"],
        ["referrerFirstName", "Referrer first name"],
        ["referrerLastName", "Referrer last name"],
        ["referrerEmail", "Referrer email"],
      );
    }

    if (isReferral) {
      requiredFields.push(
        ["clientNeedsObjectives", "Objective / Tell us your story"],
        ["hasProperty", "Property ownership"],
        ["isSelfEmployed", "Self-employment status"],
        ["hasTaxReturn", "Tax return availability"],
        ["dpnIssues", "DPN issues"],
        ["isClientCompliant", "Client compliance"],
      );
      if (formData.hasProperty === "Yes") {
        requiredFields.push(["propertyType", "Property type"]);
      }
    } else if (isDirectClient) {
      requiredFields.push(
        ["clientNeedsObjectives", "Objective / Tell us your story"],
        ["hasProperty", "Property ownership"],
        ["isSelfEmployed", "Self-employment status"],
        ["hasTaxReturn", "Tax return availability"],
        ["heardAboutUs", "How you heard about us"],
      );
      if (formData.hasProperty === "Yes") {
        requiredFields.push(["propertyType", "Property type"]);
      }
    } else {
      requiredFields.push(["objective", "Objective"]);
      requiredFields.push(
        ["classificationType", "Classification type"],
        ["loanType", "Loan type"],
        ["purpose", "Purpose"],
      );
    }

    requiredFields.forEach(([name, label]) => {
      const value = formData[name];

      if (typeof value !== "string" || !value.trim()) {
        nextErrors[name] = `${label} is required.`;
      }
    });

    if (
      formData.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
    ) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (
      showReferrerDetails &&
      formData.referrerEmail.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.referrerEmail.trim())
    ) {
      nextErrors.referrerEmail = "Enter a valid referrer email address.";
    }

    if (
      formData.uniqueReferrerCode.trim() &&
      !isReferrerResolved
    ) {
      nextErrors.uniqueReferrerCode =
        referrerLookupStatus === "loading"
          ? "Please wait while the referral code is checked."
          : "Enter a valid saved referral code or clear the field to create a new referrer.";
    }

    if (
      formData.withBorrowersGuarantors === "Yes" &&
      coBorrowers.length === 0
    ) {
      nextErrors.withBorrowersGuarantors =
        "Add at least one co-borrower before submitting.";
    }

    return nextErrors;
  };

  const findExistingReferrerByEmail = async () => {
    if (!isReferral || isReferrerResolved || !formData.referrerEmail.trim()) {
      return null;
    }

    try {
      const response = await fetch(REFERRERS_API);
      const result = (await response.json()) as ReferrerListResponse;

      if (!response.ok || !result.success) return null;

      const email = formData.referrerEmail.trim().toLowerCase();
      return (
        result.referrers?.find(
          (referrer) => referrer.email?.trim().toLowerCase() === email,
        ) || null
      );
    } catch {
      // The upload API remains the final authority if this safety check is unavailable.
      return null;
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submissionDocumentTypes = SHOW_SUBMISSION_DOCUMENT_UPLOADS
      ? formData.documentTypes
      : [];

    const nextFieldErrors = validateRequiredFields();

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setFormErrorMessage(
        "Some required information has not been completed yet. Please complete the fields outlined in red.",
      );

      if (
        nextFieldErrors.withBorrowersGuarantors &&
        formData.withBorrowersGuarantors === "Yes"
      ) {
        openCoBorrowerModal();
      } else {
        scrollToFirstError();
      }

      return;
    }

    const missingFiles = submissionDocumentTypes.filter(
      (type) => !formData.documentFiles[type],
    );

    if (missingFiles.length > 0) {
      const nextDocumentErrors = missingFiles.reduce<Record<string, string>>(
        (errors, type) => ({
          ...errors,
          [type]:
            "Please upload this document or remove it from the selection.",
        }),
        {},
      );

      setDocumentErrors(nextDocumentErrors);
      setFormErrorMessage(
        "Some selected documents have not been uploaded yet. Please complete the boxes outlined in red.",
      );
      scrollToFirstError();
      return;
    }

    setFieldErrors({});
    setDocumentErrors({});
    setFormErrorMessage("");

    try {
      setIsSubmitting(true);

      const existingReferrer = await findExistingReferrerByEmail();

      if (existingReferrer) {
        const existingName =
          existingReferrer.name ||
          [
            existingReferrer.firstName,
            existingReferrer.middleName,
            existingReferrer.lastName,
          ]
            .filter(Boolean)
            .join(" ") ||
          "an existing referrer";

        setFieldErrors((previous) => ({
          ...previous,
          referrerEmail:
            `This email already belongs to ${existingName}. Use their referral code ` +
            `(${existingReferrer.referralCode || "existing code"}) or enter a unique email for the new referrer.`,
        }));
        setFormErrorMessage(
          "This referral cannot be created because its email is already assigned to another RF account.",
        );
        scrollToFirstError();
        return;
      }

      const existingNotifications = JSON.parse(
        localStorage.getItem("notifications") || "[]",
      );

      const fullName =
        `${formData.firstName} ${formData.middleName} ${formData.lastName}`
          .replace(/\s+/g, " ")
          .trim();

      const submittedAt = new Date().toLocaleString();
      const uploadResults = [];
      let sharedUniqueId = "";

      if (submissionDocumentTypes.length === 0) {
        const result = await uploadToAzure("", null, sharedUniqueId);
        sharedUniqueId = result.uniqueId;

        uploadResults.push({
          ...result,
          documentType: "",
          fileName: "",
        });
      } else {
        for (const selectedDocumentType of submissionDocumentTypes) {
          const file = formData.documentFiles[selectedDocumentType];

          if (!file) continue;

          const result = await uploadToAzure(
            selectedDocumentType,
            file,
            sharedUniqueId,
          );

          if (!sharedUniqueId) {
            sharedUniqueId = result.uniqueId;
          }

          uploadResults.push({
            ...result,
            documentType: selectedDocumentType,
            fileName: file.name,
          });
        }
      }

      const uniqueId = sharedUniqueId || uploadResults[0]?.uniqueId;

      if (!uniqueId) {
        throw new Error("No submission result returned from Azure.");
      }

      const initialSubmissionResult = uploadResults[0];

      const ghlTriggerResult = initialSubmissionResult?.ghlSubmissionTrigger;

      if (!ghlTriggerResult) {
        console.warn(
          "The backend response does not include ghlSubmissionTrigger. " +
            "The backend may still be the older deployed version.",
        );
      } else if (ghlTriggerResult.success !== true) {
        console.warn(
          "The application was saved, but the GHL confirmation workflow was not triggered:",
          ghlTriggerResult,
        );
      } else {
        console.info("GHL confirmation workflow triggered successfully.");
      }

      const selectedDocumentLabels = submissionDocumentTypes.length
        ? submissionDocumentTypes.map(formatDocumentType).join(", ")
        : "loan application details";

      const missingRequirements = getMissingRequirements(formData);
      const isIncomplete = missingRequirements.length > 0;
      const sourceLabel = formatSource(canonicalSource(formData.source));
      const referrerAccount = isReferral
        ? initialSubmissionResult?.referrerAccount
        : null;

      const newNotification = {
        id: Date.now(),
        clientId: uploadResults[0]?.clientId,
        title: isIncomplete
          ? "Incomplete Client Submission"
          : "New Complete Document Submission",
        message: isIncomplete
          ? `${fullName} submitted ${selectedDocumentLabels}. Missing: ${missingRequirements.join(
              ", ",
            )}.`
          : `${fullName} submitted all required documents.`,
        time: submittedAt,
        unread: true,
        type: isIncomplete ? "incomplete" : "submission",
        leadType: sourceLabel,
        source: sourceLabel,
        status: "Pending Team Call",
        documentType: submissionDocumentTypes[0],
        redirectTo: "/dashboard",
      };

      localStorage.setItem(
        "notifications",
        JSON.stringify([newNotification, ...existingNotifications]),
      );

      setSubmissionSuccess({
        uniqueId,
        source: sourceLabel,
        status: "Pending Team Call",
        missingRequirements,
        referrerAccount,
      });

      setFormData({ ...initialFormData });
      setCoBorrowers([]);
      setCoBorrowerDraft(createEmptyCoBorrower());
      setIsCoBorrowerModalOpen(false);
      setFieldErrors({});
      setCoBorrowerErrors({});
      setDocumentErrors({});
      setFormErrorMessage("");

      document
        .querySelectorAll<HTMLInputElement>('input[type="file"]')
        .forEach((input) => {
          input.value = "";
        });
    } catch (error) {
      console.error("Submit error:", error);
      alert(
        error instanceof Error ? error.message : "Document submission failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPhoneField = ({
    countryCodeName,
    phoneName,
    label,
    placeholder,
    required = false,
    disabled = false,
  }: {
    countryCodeName: "phoneCountryCode" | "referrerPhoneCountryCode";
    phoneName: "phone" | "referrerPhone";
    label: string;
    placeholder: string;
    required?: boolean;
    disabled?: boolean;
  }) => {
    const selectedCountry =
      countryCodeOptions.find(
        (country) => country.value === formData[countryCodeName],
      ) || countryCodeOptions[0];
    const phonePlaceholder = `${selectedCountry.country} phone number`;

    return (
      <div data-field-error={fieldErrors[phoneName] ? "true" : undefined}>
        <label className="mb-2 block text-sm font-bold text-slate-700">
          {label}
        </label>

        <div className="grid grid-cols-[142px_minmax(0,1fr)] gap-2">
          <div>
            <select
              name={countryCodeName}
              value={formData[countryCodeName]}
              onChange={handleChange}
              disabled={disabled}
              className={`${selectClass} px-3`}
            >
              {countryCodeOptions.map((country) => (
                <option
                  key={`${country.label}-${country.value}`}
                  value={country.value}
                >
                  {country.flag} {country.label}
                </option>
              ))}
            </select>
          </div>

          <input
            type="tel"
            name={phoneName}
            value={formData[phoneName]}
            onChange={handleChange}
            disabled={disabled}
            placeholder={phonePlaceholder || placeholder}
            inputMode="tel"
            autoComplete="tel"
            pattern="[0-9]*"
            className={`${inputClass} ${fieldErrors[phoneName] ? errorFieldClass : ""}`}
            required={required}
          />
        </div>

        {fieldErrors[phoneName] && (
          <p className="mt-2 text-xs font-bold text-red-600">
            {fieldErrors[phoneName]}
          </p>
        )}

        <p className="mt-2 text-xs font-medium text-slate-500">
          {selectedCountry.flag} {selectedCountry.country} selected. Enter the
          local phone number; it will be saved with {selectedCountry.dialCode}.
        </p>
      </div>
    );
  };

  const renderSelectField = ({
    name,
    label,
    options,
    required = true,
  }: {
    name: keyof typeof initialFormData;
    label: string;
    options: string[];
    required?: boolean;
  }) => (
    <div data-field-error={fieldErrors[name] ? "true" : undefined}>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <select
        name={name}
        value={formData[name] as string}
        onChange={handleChange}
        required={required}
        className={`${selectClass} ${fieldErrors[name] ? errorFieldClass : ""}`}
      >
        <option value="">Select {label}</option>

        {options.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>

      {fieldErrors[name] && (
        <p className="mt-2 text-xs font-bold text-red-600">
          {fieldErrors[name]}
        </p>
      )}
    </div>
  );

  const renderTextAreaField = ({
    name,
    label,
    placeholder = "Type here...",
  }: {
    name: keyof typeof initialFormData;
    label: string;
    placeholder?: string;
  }) => (
    <div data-field-error={fieldErrors[name] ? "true" : undefined}>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <textarea
        name={name}
        value={formData[name] as string}
        onChange={handleChange}
        placeholder={placeholder}
        rows={4}
        className={`${textAreaClass} ${fieldErrors[name] ? errorFieldClass : ""}`}
      />
      {fieldErrors[name] && (
        <p className="mt-2 text-xs font-bold text-red-600">
          {fieldErrors[name]}
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#eef8f6] font-sans text-slate-900">
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(135deg,rgba(37,155,143,0.16),rgba(255,255,255,0.9)_42%,rgba(238,101,33,0.12)),radial-gradient(circle_at_12%_12%,rgba(37,155,143,0.22),transparent_28%),radial-gradient(circle_at_86%_18%,rgba(108,191,81,0.14),transparent_26%),radial-gradient(circle_at_78%_88%,rgba(238,101,33,0.14),transparent_30%)]" />
      <main className="px-4 py-8 sm:px-6 lg:py-10">
        <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-3xl bg-white/95 shadow-[0_24px_70px_rgba(15,23,42,0.15)] ring-1 ring-white/70">
          <div className="bg-[linear-gradient(135deg,rgba(37,155,143,0.94),rgba(15,23,42,0.98)_56%,rgba(238,101,33,0.88))] px-6 py-8 text-white sm:px-8 lg:px-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white p-3 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
                  <img
                    src="/logo/logo.png"
                    alt="Company Logo"
                    className="h-full w-full object-contain"
                  />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-white/70">
                    New Client
                  </p>
                  <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">
                    Client Submission
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">
                    Tell us your situation and our specialists will find a
                    funding solution that fits.
                  </p>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:w-[360px]">
                {applicationAudienceOptions.map((source) => (
                  <span
                    key={source.value}
                    className="rounded-full bg-white/12 px-3 py-2 text-center text-xs font-bold text-white ring-1 ring-white/15"
                  >
                    {source.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="space-y-6 p-5 sm:p-8 lg:p-10"
          >
            {formErrorMessage && (
              <div
                role="alert"
                className="rounded-2xl border border-red-300 bg-red-50 px-5 py-4 text-sm font-bold text-red-700 shadow-sm"
              >
                {formErrorMessage}
              </div>
            )}

            <div className={sectionClass}>
              <div className="mb-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#259b8f]">
                  Application Source
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-950">
                  Are you a direct client or a referrer?
                </h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {applicationAudienceOptions.map((source) => {
                  const isSelected = source.value === "direct-client"
                    ? isDirectClient
                    : !isDirectClient;

                  return (
                    <button
                      key={source.value}
                      type="button"
                      onClick={() => handleAudienceChange(source.value)}
                      className={`rounded-2xl border p-4 text-center transition hover:-translate-y-0.5 ${
                        isSelected
                          ? "border-[#259b8f] bg-[#259b8f]/10 ring-4 ring-[#259b8f]/10"
                          : "border-slate-200 bg-white hover:border-[#259b8f]/40"
                      }`}
                    >
                      <span className="text-sm font-bold text-slate-800">
                        {source.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {!isDirectClient && (
                <div
                  className="mt-5"
                  data-field-error={fieldErrors.referrerProfession ? "true" : undefined}
                >
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Referrer type
                  </label>
                  <select
                    name="referrerProfession"
                    value={formData.referrerProfession}
                    onChange={handleReferrerTypeChange}
                    disabled={isReferrerResolved}
                    className={`${selectClass} ${fieldErrors.referrerProfession ? errorFieldClass : ""}`}
                    required
                  >
                    <option value="">Select referrer type</option>
                    {referrerProfessionOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {fieldErrors.referrerProfession && (
                    <p className="mt-2 text-xs font-bold text-red-600">
                      {fieldErrors.referrerProfession}
                    </p>
                  )}
                </div>
              )}
            </div>

            {showReferrerDetails && (
              <div className="rounded-2xl border border-cyan-200 bg-cyan-50/80 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
                <h3 className="mb-4 text-lg font-black text-slate-900">
                  {detailLabel} Details
                </h3>

                <div className="grid gap-4 md:grid-cols-3">
                  <div data-field-error={fieldErrors.referrerFirstName ? "true" : undefined}>
                    <input
                      type="text"
                      name="referrerFirstName"
                      value={formData.referrerFirstName}
                      onChange={handleChange}
                      readOnly={isReferrerResolved}
                      placeholder={`${detailLabel} First Name`}
                      className={`${inputClass} ${fieldErrors.referrerFirstName ? errorFieldClass : ""}`}
                    />
                    {fieldErrors.referrerFirstName && <p className="mt-2 text-xs font-bold text-red-600">{fieldErrors.referrerFirstName}</p>}
                  </div>

                  <input
                    type="text"
                    name="referrerMiddleName"
                    value={formData.referrerMiddleName}
                    onChange={handleChange}
                    readOnly={isReferrerResolved}
                    placeholder={`${detailLabel} Middle Name`}
                    className={inputClass}
                  />

                  <div data-field-error={fieldErrors.referrerLastName ? "true" : undefined}>
                    <input
                      type="text"
                      name="referrerLastName"
                      value={formData.referrerLastName}
                      onChange={handleChange}
                      readOnly={isReferrerResolved}
                      placeholder={`${detailLabel} Last Name`}
                      className={`${inputClass} ${fieldErrors.referrerLastName ? errorFieldClass : ""}`}
                    />
                    {fieldErrors.referrerLastName && <p className="mt-2 text-xs font-bold text-red-600">{fieldErrors.referrerLastName}</p>}
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {renderPhoneField({
                    countryCodeName: "referrerPhoneCountryCode",
                    phoneName: "referrerPhone",
                    label: `${detailLabel} Phone`,
                    placeholder: `${detailLabel} Phone`,
                    disabled: isReferrerResolved,
                  })}

                  <div data-field-error={fieldErrors.referrerEmail ? "true" : undefined}>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      {detailLabel} Email
                    </label>
                    <input
                      type="email"
                      name="referrerEmail"
                      value={formData.referrerEmail}
                      onChange={handleChange}
                      readOnly={isReferrerResolved}
                      placeholder={`${detailLabel} Email`}
                      className={`${inputClass} ${fieldErrors.referrerEmail ? errorFieldClass : ""}`}
                    />
                    {fieldErrors.referrerEmail && <p className="mt-2 text-xs font-bold text-red-600">{fieldErrors.referrerEmail}</p>}
                  </div>
                </div>

                {showReferrerDetails && (
                  <div className="mt-4">
                    <div data-field-error={fieldErrors.uniqueReferrerCode ? "true" : undefined}>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Unique Referrer Code
                      </label>
                      <input
                        type="text"
                        name="uniqueReferrerCode"
                        value={formData.uniqueReferrerCode}
                        onChange={handleChange}
                        placeholder="Enter saved code, or leave blank if new"
                        className={`${inputClass} ${fieldErrors.uniqueReferrerCode ? errorFieldClass : ""}`}
                      />
                      <p className="mt-2 text-xs font-medium text-slate-500">
                        Existing referrers can enter their saved code. If left blank, a new RF account and reusable referral code will be created automatically.
                      </p>
                      {referrerLookupMessage && (
                        <p className={`mt-2 text-xs font-bold ${
                          referrerLookupStatus === "found"
                            ? "text-green-700"
                            : referrerLookupStatus === "error"
                              ? "text-red-600"
                              : "text-cyan-700"
                        }`}>
                          {referrerLookupMessage}
                        </p>
                      )}
                      {fieldErrors.uniqueReferrerCode && (
                        <p className="mt-2 text-xs font-bold text-red-600">
                          {fieldErrors.uniqueReferrerCode}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className={sectionClass}>
              <h3 className="mb-4 text-lg font-black text-slate-900">
                Primary Borrower Details
              </h3>

              <div className="grid gap-5 md:grid-cols-3">
                <div
                  data-field-error={fieldErrors.firstName ? "true" : undefined}
                >
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="First Name"
                    className={`${inputClass} ${fieldErrors.firstName ? errorFieldClass : ""}`}
                    required
                  />
                  {fieldErrors.firstName && (
                    <p className="mt-2 text-xs font-bold text-red-600">
                      {fieldErrors.firstName}
                    </p>
                  )}
                </div>

                <input
                  type="text"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleChange}
                  placeholder="Middle Name"
                  className={inputClass}
                />

                <div
                  data-field-error={fieldErrors.lastName ? "true" : undefined}
                >
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Last Name"
                    className={`${inputClass} ${fieldErrors.lastName ? errorFieldClass : ""}`}
                    required
                  />
                  {fieldErrors.lastName && (
                    <p className="mt-2 text-xs font-bold text-red-600">
                      {fieldErrors.lastName}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div data-field-error={fieldErrors.email ? "true" : undefined}>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email Address"
                    className={`${inputClass} ${fieldErrors.email ? errorFieldClass : ""}`}
                    required
                  />
                  {fieldErrors.email && (
                    <p className="mt-2 text-xs font-bold text-red-600">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                {renderPhoneField({
                  countryCodeName: "phoneCountryCode",
                  phoneName: "phone",
                  label: "Phone Number",
                  placeholder: "Phone Number",
                  required: true,
                })}
              </div>
            </div>

            <div className={sectionClass}>
              <h3 className="mb-4 text-lg font-black text-slate-900">
                Loan Details
              </h3>

              <div className="grid gap-5 md:grid-cols-2">
                {!usesSimplifiedIntake && renderSelectField({
                  name: "classificationType",
                  label: "Classification Type",
                  options: classificationOptions,
                })}

                {renderSelectField({
                  name: "borrowerType",
                  label: usesSimplifiedIntake ? "Who is the borrower?" : "Borrower Type",
                  options: isReferral
                    ? referralBorrowerOptions
                    : isDirectClient
                      ? directClientBorrowerOptions
                      : borrowerOptions,
                })}

                {!usesSimplifiedIntake && renderSelectField({
                  name: "objective",
                  label: "Objective",
                  options: objectiveOptions,
                })}

                {!usesSimplifiedIntake && renderSelectField({
                  name: "loanType",
                  label: "Loan Type",
                  options: loanTypeOptions,
                })}

                {!usesSimplifiedIntake && renderSelectField({
                  name: "purpose",
                  label: "Purpose",
                  options: purposeOptions,
                })}

                {usesSimplifiedIntake && renderSelectField({
                  name: "hasProperty",
                  label: "Do you have a property?",
                  options: yesNoOptions,
                })}

                {usesSimplifiedIntake && formData.hasProperty === "Yes" && renderSelectField({
                  name: "propertyType",
                  label: "Property type",
                  options: ["Residential", "Commercial", "Both"],
                })}

                {usesSimplifiedIntake && formData.hasProperty === "Yes" && renderSelectField({
                  name: "hasMultipleProperties",
                  label: "Do you have more than one property?",
                  options: yesNoOptions,
                  required: false,
                })}

                <div
                  data-field-error={
                    fieldErrors.transactionType ? "true" : undefined
                  }
                >
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Are Financial Statements Available?
                  </label>

                  <select
                    name="transactionType"
                    value={formData.transactionType}
                    onChange={handleChange}
                    required
                    className={`${selectClass} ${fieldErrors.transactionType ? errorFieldClass : ""}`}
                  >
                    <option value="">Select Yes or No</option>
                    <option value="Full doc">Yes</option>
                    <option value="Alt doc">No</option>
                  </select>
                  {fieldErrors.transactionType && (
                    <p className="mt-2 text-xs font-bold text-red-600">
                      {fieldErrors.transactionType}
                    </p>
                  )}
                </div>

                {usesSimplifiedIntake && renderSelectField({
                  name: "isSelfEmployed",
                  label: "Self-employed?",
                  options: yesNoOptions,
                })}

                {usesSimplifiedIntake && renderSelectField({
                  name: "hasTaxReturn",
                  label: "Tax return available?",
                  options: yesNoOptions,
                })}

                {renderSelectField({
                  name: "withBorrowersGuarantors",
                  label: "With Co-Borrowers?",
                  options: yesNoOptions,
                })}
              </div>

              {formData.withBorrowersGuarantors === "Yes" && (
                <div className="mt-5 rounded-2xl border border-[#259b8f]/25 bg-[#259b8f]/5 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-900">
                        Co-Borrowers
                      </h4>
                      <p className="mt-1 text-xs text-slate-500">
                        Add the contact details for every co-borrower included
                        in this application.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={openCoBorrowerModal}
                      className="rounded-xl bg-[#259b8f] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#1f847a]"
                    >
                      {coBorrowers.length > 0
                        ? "+ Add Another Co-Borrower"
                        : "+ Add Co-Borrower"}
                    </button>
                  </div>

                  {coBorrowers.length > 0 ? (
                    <div className="mt-4 space-y-3">
                      {coBorrowers.map((coBorrower, index) => (
                        <div
                          key={coBorrower.id}
                          className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="text-sm font-black text-slate-900">
                              {index + 1}.{" "}
                              {[
                                coBorrower.firstName,
                                coBorrower.middleName,
                                coBorrower.lastName,
                              ]
                                .filter(Boolean)
                                .join(" ")}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {formatPhoneNumber(
                                coBorrower.phoneCountryCode,
                                coBorrower.phone,
                              )}{" "}
                              • {coBorrower.email}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveCoBorrower(coBorrower.id)
                            }
                            className="self-start rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 sm:self-auto"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 rounded-xl border border-dashed border-[#259b8f]/30 bg-white/70 px-4 py-3 text-sm font-medium text-slate-600">
                      No co-borrower has been added yet.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className={sectionClass}>
              <h3 className="mb-4 text-lg font-black text-slate-900">
                Scenario Details
              </h3>

              <div className="grid gap-5 md:grid-cols-2">
                {renderSelectField({
                  name: "vedaIssues",
                  label: usesSimplifiedIntake ? "Credit issues?" : "Veda Issues",
                  options: yesNoOptions,
                  required: false,
                })}

                {renderSelectField({
                  name: "conductIssues",
                  label: usesSimplifiedIntake
                    ? "Have you been making your loan payments?"
                    : "Conduct Issues",
                  options: yesNoOptions,
                  required: false,
                })}

                {isReferral && renderSelectField({
                  name: "dpnIssues",
                  label: "DPN issues?",
                  options: yesNoOptions,
                })}

                {isReferral && renderSelectField({
                  name: "isClientCompliant",
                  label: "Is the client compliant?",
                  options: yesNoOptions,
                })}
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                {renderTextAreaField({
                  name: "clientNeedsObjectives",
                  label: usesSimplifiedIntake
                    ? "Objective / Tell us your story"
                    : "Client Needs & Objectives",
                  placeholder: usesSimplifiedIntake
                    ? "Describe what you want to achieve and the key context behind your request."
                    : "Type here...",
                })}

                {!isDirectClient && renderTextAreaField({
                  name: "applicantBackground",
                  label: isReferral ? "Referrer Background" : "Applicant Background",
                  placeholder: isReferral
                    ? "Add critical context about the client from the referrer."
                    : "Type here...",
                })}

                {renderTextAreaField({
                  name: "explanationOfIncome",
                  label: usesSimplifiedIntake
                    ? "Income stream and performance"
                    : "Explanation of Income",
                })}

                {!usesSimplifiedIntake && renderTextAreaField({ name: "security", label: "Security" })}

                {isReferral && formData.dpnIssues === "Yes" && renderTextAreaField({
                  name: "dpnDetails",
                  label: "DPN issue details",
                  placeholder: "Include relevant dates, amounts, and professional or technical context.",
                })}

                {usesSimplifiedIntake && renderTextAreaField({
                  name: "painPoint",
                  label: "Pain Point / Key Issue",
                  placeholder: "What is the client's core problem?",
                })}

                {isDirectClient && renderSelectField({
                  name: "heardAboutUs",
                  label: "How did you hear from us?",
                  options: ["Google / Search", "Social Media", "Referral", "Event", "Existing Client", "Other"],
                })}

                {isDirectClient && (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      SBR Funding account manager
                    </label>
                    <input
                      type="text"
                      name="sbrFundingAccountManager"
                      value={formData.sbrFundingAccountManager}
                      onChange={handleChange}
                      placeholder="Enter account manager (if known)"
                      className={inputClass}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className={sectionClass}>
              <h3 className="mb-4 text-lg font-black text-slate-900">
                {usesSimplifiedIntake ? "Funds Required & Notes" : "Loan Amount & Notes"}
              </h3>

              <div className="grid gap-5 md:grid-cols-2">
                <input
                  type="number"
                  step="0.01"
                  name="loanAmount"
                  value={formData.loanAmount}
                  onChange={handleChange}
                  placeholder={usesSimplifiedIntake ? "Funds required" : "Loan Amount"}
                  className={inputClass}
                />

                {SHOW_ADVANCED_LOAN_FIELDS && !usesSimplifiedIntake && <input
                  type="number"
                  step="0.01"
                  name="securityValue"
                  value={formData.securityValue}
                  onChange={handleChange}
                  placeholder="Security Value"
                  className={inputClass}
                />}

                {SHOW_ADVANCED_LOAN_FIELDS && !usesSimplifiedIntake && <div>
                  <input
                    type="number"
                    step="0.01"
                    name="lvr"
                    value={formData.lvr}
                    placeholder="LVR (%)"
                    className={`${inputClass} bg-slate-50`}
                    readOnly
                  />
                  <p className="mt-2 text-xs font-medium text-slate-500">
                    Auto-calculated: loan amount / security value x 100.
                  </p>
                </div>}

                {SHOW_ADVANCED_LOAN_FIELDS && !usesSimplifiedIntake && <input
                  type="date"
                  name="anticipatedSettlementDate"
                  value={formData.anticipatedSettlementDate}
                  onChange={handleChange}
                  className={inputClass}
                />}
              </div>

              <div className="mt-5">
                {renderTextAreaField({
                  name: "specialNotes",
                  label: "Special Notes",
                })}
              </div>
            </div>

            {SHOW_SUBMISSION_DOCUMENT_UPLOADS && !usesSimplifiedIntake && <div className={sectionClass}>
              <div className="mb-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#EE6521]">
                  Documents
                </p>
                <h3 className="mt-1 text-lg font-black text-slate-900">
                  Please Upload the Following Documents
                </h3>
              </div>

              {!formData.transactionType ? (
                <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/70 p-6 text-center">
                  <p className="text-sm font-bold text-slate-800">
                    Select whether financial statements are available first.
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    The document checklist will appear automatically based on
                    your answer.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {activeDocumentOptions.map((type) => {
                    const isSelected = formData.documentTypes.includes(
                      type.value,
                    );

                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => handleDocumentTypeToggle(type.value)}
                        className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${
                          isSelected
                            ? "border-[#EE6521] bg-orange-50 ring-4 ring-orange-100"
                            : "border-slate-200 bg-white hover:border-orange-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded border ${
                              isSelected
                                ? "border-orange-500 bg-orange-500"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {isSelected && (
                              <span className="h-2 w-2 rounded-full bg-white" />
                            )}
                          </span>

                          <span className="text-sm font-bold text-slate-800">
                            {type.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>}

            {SHOW_SUBMISSION_DOCUMENT_UPLOADS && !usesSimplifiedIntake && formData.documentTypes.length > 0 && (
              <div className={sectionClass}>
                <h3 className="mb-4 text-lg font-black text-slate-900">
                  Upload Documents
                </h3>

                {formData.documentTypes.map((type) => (
                  <div
                    key={type}
                    data-field-error={documentErrors[type] ? "true" : undefined}
                    className={`mb-4 rounded-2xl border p-4 last:mb-0 ${
                      documentErrors[type]
                        ? "border-red-500 bg-red-50"
                        : "border-slate-200 bg-slate-50/80"
                    }`}
                  >
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      {formatDocumentType(type)} File
                    </label>

                    <input
                      type="file"
                      onChange={(event) =>
                        handleDocumentFileChange(type, event)
                      }
                      className={`block w-full rounded-xl border border-dashed bg-white px-4 py-4 text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-[#EE6521] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-orange-600 ${
                        documentErrors[type]
                          ? "border-red-500"
                          : "border-slate-300"
                      }`}
                      required
                    />

                    {documentErrors[type] && (
                      <p className="mt-2 text-xs font-bold text-red-600">
                        {documentErrors[type]}
                      </p>
                    )}

                    {formData.documentFiles[type] && (
                      <p className="mt-2 text-sm text-slate-500">
                        Selected: {formData.documentFiles[type]?.name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-14 w-full rounded-xl bg-[#EE6521] text-sm font-black text-white shadow-[0_14px_24px_rgba(238,101,33,0.24)] transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </form>
        </div>
      </main>

      {submissionSuccess && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/60 px-4 py-8 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="submission-success-title"
        >
          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-[0_24px_80px_rgba(15,23,42,0.35)]">
            <div className="bg-[linear-gradient(135deg,#259b8f,#16766e)] px-6 py-7 text-white sm:px-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-3xl ring-1 ring-white/30">
                ✓
              </div>
              <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-white/70">
                Submission complete
              </p>
              <h2
                id="submission-success-title"
                className="mt-1 text-2xl font-black sm:text-3xl"
              >
                Application submitted successfully!
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/80">
                Your application has been received. Keep the unique ID below
                for future reference.
              </p>
            </div>

            <div className="space-y-5 p-6 sm:p-8">
              <div className="rounded-2xl border border-[#259b8f]/20 bg-[#259b8f]/5 p-4 text-center">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#16766e]">
                  Unique ID
                </p>
                <p className="mt-1 break-all text-2xl font-black tracking-wide text-slate-950">
                  {submissionSuccess.uniqueId}
                </p>
              </div>

              <dl className="divide-y divide-slate-100 rounded-2xl border border-slate-200 px-4">
                <div className="flex items-center justify-between gap-4 py-3">
                  <dt className="text-sm font-semibold text-slate-500">Source</dt>
                  <dd className="text-sm font-black text-slate-900">{submissionSuccess.source}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-3">
                  <dt className="text-sm font-semibold text-slate-500">Status</dt>
                  <dd className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-700">
                    {submissionSuccess.status}
                  </dd>
                </div>
                {submissionSuccess.referrerAccount && (
                  <>
                    <div className="flex items-center justify-between gap-4 py-3">
                      <dt className="text-sm font-semibold text-slate-500">Referrer ID</dt>
                      <dd className="text-sm font-black text-slate-900">{submissionSuccess.referrerAccount.referrerId}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 py-3">
                      <dt className="text-sm font-semibold text-slate-500">Referral code</dt>
                      <dd className="text-sm font-black text-slate-900">{submissionSuccess.referrerAccount.referralCode}</dd>
                    </div>
                  </>
                )}
              </dl>

              {submissionSuccess.missingRequirements.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-black text-amber-900">Still required</p>
                  <p className="mt-1 text-sm leading-6 text-amber-800">
                    {submissionSuccess.missingRequirements.join(", ")}
                  </p>
                </div>
              )}

              {submissionSuccess.referrerAccount?.created && (
                <p className="rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                  The new referrer account details will be emailed to the referrer.
                </p>
              )}

              <button
                type="button"
                onClick={() => setSubmissionSuccess(null)}
                className="h-12 w-full rounded-xl bg-[#EE6521] text-sm font-black text-white shadow-[0_12px_24px_rgba(238,101,33,0.22)] transition hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-200"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {isCoBorrowerModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 px-4 py-8 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="co-borrower-modal-title"
        >
          <div className="w-full max-w-3xl rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#259b8f]">
                  Co-Borrower Details
                </p>
                <h2
                  id="co-borrower-modal-title"
                  className="mt-1 text-2xl font-black text-slate-950"
                >
                  Add Co-Borrowers
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Enter one co-borrower, select + Add Co-Borrower, then repeat
                  for the next person.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCoBorrowerModalOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xl font-bold text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
                aria-label="Close co-borrower modal"
              >
                ×
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div>
                <input
                  type="text"
                  name="firstName"
                  value={coBorrowerDraft.firstName}
                  onChange={handleCoBorrowerDraftChange}
                  placeholder="First Name"
                  className={`${inputClass} ${coBorrowerErrors.firstName ? errorFieldClass : ""}`}
                />
                {coBorrowerErrors.firstName && (
                  <p className="mt-2 text-xs font-bold text-red-600">
                    {coBorrowerErrors.firstName}
                  </p>
                )}
              </div>

              <input
                type="text"
                name="middleName"
                value={coBorrowerDraft.middleName}
                onChange={handleCoBorrowerDraftChange}
                placeholder="Middle Name"
                className={inputClass}
              />

              <div>
                <input
                  type="text"
                  name="lastName"
                  value={coBorrowerDraft.lastName}
                  onChange={handleCoBorrowerDraftChange}
                  placeholder="Last Name"
                  className={`${inputClass} ${coBorrowerErrors.lastName ? errorFieldClass : ""}`}
                />
                {coBorrowerErrors.lastName && (
                  <p className="mt-2 text-xs font-bold text-red-600">
                    {coBorrowerErrors.lastName}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div
                data-field-error={coBorrowerErrors.phone ? "true" : undefined}
              >
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Phone Number
                </label>
                <div className="grid grid-cols-[142px_minmax(0,1fr)] gap-2">
                  <select
                    name="phoneCountryCode"
                    value={coBorrowerDraft.phoneCountryCode}
                    onChange={handleCoBorrowerDraftChange}
                    className={`${selectClass} px-3`}
                  >
                    {countryCodeOptions.map((country) => (
                      <option
                        key={`${country.label}-${country.value}`}
                        value={country.value}
                      >
                        {country.flag} {country.label}
                      </option>
                    ))}
                  </select>

                  <input
                    type="tel"
                    name="phone"
                    value={coBorrowerDraft.phone}
                    onChange={handleCoBorrowerDraftChange}
                    placeholder={`${selectedCoBorrowerCountry.country} phone number`}
                    inputMode="tel"
                    autoComplete="tel"
                    pattern="[0-9]*"
                    className={`${inputClass} ${coBorrowerErrors.phone ? errorFieldClass : ""}`}
                  />
                </div>
                {coBorrowerErrors.phone && (
                  <p className="mt-2 text-xs font-bold text-red-600">
                    {coBorrowerErrors.phone}
                  </p>
                )}
                <p className="mt-2 text-xs font-medium text-slate-500">
                  {selectedCoBorrowerCountry.flag}{" "}
                  {selectedCoBorrowerCountry.country} selected. Enter the local
                  phone number; it will be saved with{" "}
                  {selectedCoBorrowerCountry.dialCode}.
                </p>
              </div>

              <div
                data-field-error={coBorrowerErrors.email ? "true" : undefined}
              >
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={coBorrowerDraft.email}
                  onChange={handleCoBorrowerDraftChange}
                  placeholder="Email Address"
                  className={`${inputClass} ${coBorrowerErrors.email ? errorFieldClass : ""}`}
                />
                {coBorrowerErrors.email && (
                  <p className="mt-2 text-xs font-bold text-red-600">
                    {coBorrowerErrors.email}
                  </p>
                )}
              </div>
            </div>

            {coBorrowers.length > 0 && (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Added Co-Borrowers
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {coBorrowers.length} co-borrower
                      {coBorrowers.length === 1 ? "" : "s"} added to this
                      application.
                    </p>
                  </div>
                  <span className="rounded-full bg-[#259b8f] px-3 py-1 text-xs font-black text-white">
                    {coBorrowers.length}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {coBorrowers.map((coBorrower, index) => (
                    <div
                      key={coBorrower.id}
                      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-black text-slate-900">
                          {index + 1}.{" "}
                          {[
                            coBorrower.firstName,
                            coBorrower.middleName,
                            coBorrower.lastName,
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatPhoneNumber(
                            coBorrower.phoneCountryCode,
                            coBorrower.phone,
                          )}{" "}
                          • {coBorrower.email}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveCoBorrower(coBorrower.id)}
                        className="self-start rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 sm:self-auto"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleDoneCoBorrower}
                className="h-12 rounded-xl border border-slate-300 px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Done
              </button>

              <button
                type="button"
                onClick={handleAddCoBorrower}
                className="h-12 rounded-xl bg-[#259b8f] px-5 text-sm font-black text-white transition hover:bg-[#1f847a]"
              >
                + Add Co-Borrower
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
