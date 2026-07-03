import { useState } from 'react';
import emailjs from '@emailjs/browser';

const SERVICE_ID = 'service_4d8mjir';
const TEMPLATE_ID = 'template_5iexv1b';
const PUBLIC_KEY = 'Z-lJJhTln-512oNez';

const API_URL = 'https://docsuploadpythonapi.azurewebsites.net/api/uploadclient';
const CLIENT_DASHBOARD_URL =
  'https://icy-river-055fcb80f.7.azurestaticapps.net/client-dashboard';

const documentOptions = [
  { label: 'ID', value: 'id' },
  { label: 'Property Documents', value: 'property-documents' },
  { label: 'Credit History', value: 'credit-history' },
  { label: 'Income Documents', value: 'income-documents' },
  { label: 'Other', value: 'other' },
];

const leadTypeOptions = [
  { label: 'Business Owner', value: 'business_owner' },
  { label: 'Referrer', value: 'referrer' },
];

const initialFormData = {
  leadType: 'business_owner',
  firstName: '',
  middleName: '',
  lastName: '',
  email: '',
  phone: '',
  documentTypes: [] as string[],
  documentFiles: {} as Record<string, File | null>,
  sssNumber: '',
  hdmfNumber: '',
  philhealthNumber: '',
  tinNumber: '',
  licenseNumber: '',
};

export default function HomePage() {
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDocumentTypeToggle = (type: string) => {
    setFormData((prev) => {
      const isSelected = prev.documentTypes.includes(type);
      const updatedFiles = { ...prev.documentFiles };

      if (isSelected) delete updatedFiles[type];
      else updatedFiles[type] = null;

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

    setFormData((prev) => ({
      ...prev,
      documentFiles: {
        ...prev.documentFiles,
        [type]: file,
      },
    }));
  };

  const formatDocumentType = (type: string) =>
    documentOptions.find((item) => item.value === type)?.label ||
    type
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  const formatLeadType = (type: string) =>
    leadTypeOptions.find((item) => item.value === type)?.label ||
    'Business Owner';

  const getMissingRequirements = (data: typeof initialFormData) => {
    const missing: string[] = [];

    documentOptions.forEach((item) => {
      if (!data.documentTypes.includes(item.value)) {
        missing.push(`${item.label} document`);
      }
    });

    return missing;
  };

  const uploadToAzure = async (
    documentType: string,
    file: File,
    existingUniqueId?: string,
  ) => {
    const azureFormData = new FormData();

    if (existingUniqueId) {
      azureFormData.append('uniqueId', existingUniqueId);
    }

    azureFormData.append('leadType', formData.leadType);
    azureFormData.append('firstName', formData.firstName);
    azureFormData.append('middleName', formData.middleName);
    azureFormData.append('lastName', formData.lastName);
    azureFormData.append('email', formData.email);
    azureFormData.append('phone', formData.phone);
    azureFormData.append('documentType', documentType);
    azureFormData.append('file', file);

    const response = await fetch(API_URL, {
      method: 'POST',
      body: azureFormData,
    });

    const result = await response.json();

    console.log('Azure upload result:', result);

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Azure upload failed.');
    }

    return result as {
      success: boolean;
      message: string;
      clientId: number;
      uniqueId: string;
      blobUrl: string;
      leadType?: string;
      status?: string;
      ghlSync?: unknown;
    };
  };

  const scheduleIncompleteReminder = (clientData: {
    uniqueId: string;
    fullName: string;
    email: string;
    missingRequirements: string[];
  }) => {
    const existingNotifications = JSON.parse(
      localStorage.getItem('notifications') || '[]',
    );

    const reminderNotification = {
      id: Date.now(),
      title: 'Incomplete Client Submission',
      message: `${clientData.fullName} is incomplete. Missing: ${clientData.missingRequirements.join(
        ', ',
      )}.`,
      time: new Date().toLocaleString(),
      unread: true,
      type: 'incomplete',
      redirectTo: '/dashboard',
    };

    localStorage.setItem(
      'notifications',
      JSON.stringify([reminderNotification, ...existingNotifications]),
    );

    window.setTimeout(async () => {
      try {
        await emailjs.send(
          SERVICE_ID,
          TEMPLATE_ID,
          {
            to_email: clientData.email,
            email: clientData.email,
            email_title: 'Incomplete Document Submission',
            unique_id: clientData.uniqueId,
            full_name: clientData.fullName,
            document_type: 'Incomplete Submission',
            file_name: 'N/A',
            submitted_at: new Date().toLocaleString(),
            message:
              'Your submission is incomplete. Please upload the missing required documents.',
            missing_fields: clientData.missingRequirements.join(', '),
            dashboard_link: CLIENT_DASHBOARD_URL,
          },
          { publicKey: PUBLIC_KEY },
        );
      } catch (error) {
        console.error('Incomplete reminder email failed:', error);
      }
    }, 5 * 60 * 1000);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (formData.documentTypes.length === 0) {
      alert('Please select at least one document type.');
      return;
    }

    const missingFiles = formData.documentTypes.filter(
      (type) => !formData.documentFiles[type],
    );

    if (missingFiles.length > 0) {
      alert('Please upload a file for each selected document type.');
      return;
    }

    try {
      setIsSubmitting(true);

      const existingNotifications = JSON.parse(
        localStorage.getItem('notifications') || '[]',
      );

      const fullName = `${formData.firstName} ${formData.middleName} ${formData.lastName}`
        .replace(/\s+/g, ' ')
        .trim();

      const submittedAt = new Date().toLocaleString();
      const uploadResults = [];
      let sharedUniqueId = '';

      for (const selectedDocumentType of formData.documentTypes) {
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

      const uniqueId = sharedUniqueId || uploadResults[0]?.uniqueId;

      if (!uniqueId) {
        throw new Error('No upload result returned from Azure.');
      }

      const selectedDocumentLabels = formData.documentTypes
        .map(formatDocumentType)
        .join(', ');

      const uploadedFileNames = uploadResults
        .map((item) => item.fileName)
        .join(', ');

      const missingRequirements = getMissingRequirements(formData);
      const isIncomplete = missingRequirements.length > 0;
      const leadTypeLabel = formatLeadType(formData.leadType);

      const newNotification = {
        id: Date.now(),
        clientId: uploadResults[0]?.clientId,
        title: isIncomplete
          ? 'Incomplete Client Submission'
          : 'New Complete Document Submission',
        message: isIncomplete
          ? `${fullName} submitted ${selectedDocumentLabels}. Missing: ${missingRequirements.join(
              ', ',
            )}.`
          : `${fullName} submitted all required documents.`,
        time: submittedAt,
        unread: true,
        type: isIncomplete ? 'incomplete' : 'submission',
        leadType: leadTypeLabel,
        status: 'Pending Team Call',
        documentType: formData.documentTypes[0],
        redirectTo: '/dashboard',
      };

      localStorage.setItem(
        'notifications',
        JSON.stringify([newNotification, ...existingNotifications]),
      );

      await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        {
          to_email: formData.email,
          email: formData.email,
          email_title: isIncomplete
            ? 'Incomplete Document Submission'
            : 'New Document Submission',
          unique_id: uniqueId,
          full_name: fullName,
          phone: formData.phone || 'N/A',
          lead_type: leadTypeLabel,
          status: 'Pending Team Call',
          document_type: selectedDocumentLabels,
          file_name: uploadedFileNames,
          submitted_at: submittedAt,
          sss_number: formData.sssNumber || 'N/A',
          hdmf_number: formData.hdmfNumber || 'N/A',
          philhealth_number: formData.philhealthNumber || 'N/A',
          tin_number: formData.tinNumber || 'N/A',
          license_number: formData.licenseNumber || 'N/A',
          message: isIncomplete
            ? 'Your submission is incomplete. Please upload the missing required documents.'
            : 'Your documents have been successfully submitted.',
          missing_fields: isIncomplete
            ? missingRequirements.join(', ')
            : 'None',
          dashboard_link: CLIENT_DASHBOARD_URL,
        },
        { publicKey: PUBLIC_KEY },
      );

      if (isIncomplete) {
        scheduleIncompleteReminder({
          uniqueId,
          fullName,
          email: formData.email,
          missingRequirements,
        });
      }

      alert(
        isIncomplete
          ? `Document submitted successfully!\nUnique ID: ${uniqueId}\nLead Type: ${leadTypeLabel}\nStatus: Pending Team Call\nMissing: ${missingRequirements.join(
              ', ',
            )}`
          : `Document submitted successfully!\nUnique ID: ${uniqueId}\nLead Type: ${leadTypeLabel}\nStatus: Pending Team Call`,
      );

      setFormData(initialFormData);

      document
        .querySelectorAll<HTMLInputElement>('input[type="file"]')
        .forEach((input) => {
          input.value = '';
        });
    } catch (error) {
      console.error('Submit error:', error);
      alert(error instanceof Error ? error.message : 'Document submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isIdDocument = formData.documentTypes.includes('id');

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <main className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-xl sm:p-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Secure Document Submission
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Fill out the form and upload your required document.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Lead Type
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                {leadTypeOptions.map((type) => {
                  const isSelected = formData.leadType === type.value;

                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          leadType: type.value,
                        }))
                      }
                      className={`rounded-2xl border p-4 text-left transition ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100'
                          : 'border-slate-300 bg-white hover:border-blue-300'
                      }`}
                    >
                      <span className="text-sm font-bold text-slate-800">
                        {type.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="First Name"
                className="h-12 rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-orange-500"
                required
              />

              <input
                type="text"
                name="middleName"
                value={formData.middleName}
                onChange={handleChange}
                placeholder="Middle Name"
                className="h-12 rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-orange-500"
              />

              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Last Name"
                className="h-12 rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-orange-500"
                required
              />
            </div>

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email Address"
              className="h-12 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-orange-500"
              required
            />

            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Phone Number"
              className="h-12 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-orange-500"
              required
            />

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Document Type
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                {documentOptions.map((type) => {
                  const isSelected = formData.documentTypes.includes(type.value);

                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleDocumentTypeToggle(type.value)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-100'
                          : 'border-slate-300 bg-white hover:border-orange-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded border ${
                            isSelected
                              ? 'border-orange-500 bg-orange-500'
                              : 'border-slate-300 bg-white'
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
            </div>

            {isIdDocument && (
              <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
                <h3 className="mb-4 text-lg font-bold text-slate-900">
                  ID Information
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    ['sssNumber', 'SSS Number'],
                    ['hdmfNumber', 'HDMF / Pag-IBIG Number'],
                    ['philhealthNumber', 'PhilHealth Number'],
                    ['tinNumber', 'TIN Number'],
                    ['licenseNumber', 'License Number'],
                  ].map(([name, label]) => (
                    <input
                      key={name}
                      type="text"
                      name={name}
                      value={formData[name as keyof typeof formData] as string}
                      onChange={handleChange}
                      placeholder={label}
                      className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-500"
                    />
                  ))}
                </div>
              </div>
            )}

            {formData.documentTypes.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900">
                  Upload Documents
                </h3>

                {formData.documentTypes.map((type) => (
                  <div
                    key={type}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      {formatDocumentType(type)} File
                    </label>

                    <input
                      type="file"
                      onChange={(event) => handleDocumentFileChange(type, event)}
                      className="block w-full rounded-xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-orange-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-orange-600"
                      required
                    />

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
              className="h-12 w-full rounded-xl bg-orange-500 text-sm font-bold text-white shadow-md transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Document'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}