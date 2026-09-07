type ClientUploadNotification = {
  clientId?: number;
  clientName: string;
  uniqueId: string;
  documentType: string;
  documentLabel: string;
  fileName: string;
  isReupload?: boolean;
};

export const addClientUploadNotification = ({
  clientId,
  clientName,
  uniqueId,
  documentType,
  documentLabel,
  fileName,
  isReupload = false,
}: ClientUploadNotification) => {
  let existingNotifications: unknown[] = [];

  try {
    const saved = JSON.parse(localStorage.getItem("notifications") || "[]");
    existingNotifications = Array.isArray(saved) ? saved : [];
  } catch {
    existingNotifications = [];
  }

  const notification = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    clientId,
    clientName,
    uniqueId,
    title: isReupload ? "Client Re-uploaded Document" : "New Client Document",
    message: `${clientName} uploaded ${documentLabel} (${fileName}).`,
    time: new Date().toLocaleString(),
    unread: true,
    type: "file",
    source: "Client Portal",
    documentType,
    redirectTo: "/dashboard/client-search",
  };

  localStorage.setItem(
    "notifications",
    JSON.stringify([notification, ...existingNotifications].slice(0, 100)),
  );
  window.dispatchEvent(new Event("notifications-updated"));
};
