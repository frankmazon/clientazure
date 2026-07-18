import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FaChevronDown,
  FaChevronRight,
  FaExclamationTriangle,
  FaExternalLinkAlt,
  FaFileExport,
  FaFolder,
  FaFolderOpen,
  FaSignOutAlt,
  FaTachometerAlt,
  FaTimes,
  FaUsers,
} from 'react-icons/fa';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const documentTypes = [
  { label: 'BAS from ATO Portal', value: 'bas-from-ato-portal' },
  {
    label: 'Business Banking Statements',
    value: 'business-banking-statements',
  },
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
  {
    label: 'Last 6 Months Mortgage Statements',
    value: 'last-6-months-mortgage-statements',
  },
  { label: 'Council Rates Notice', value: 'council-rates-notice' },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showClients, setShowClients] = useState(true);
  const [showClientPortal, setShowClientPortal] = useState(true);

  const handleConfirmLogout = () => {
    localStorage.removeItem('isAdminLoggedIn');
    setShowLogoutModal(false);
    navigate('/login');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
      isActive
        ? 'bg-orange-500 text-white shadow-lg'
        : 'text-slate-300 hover:bg-white/10 hover:text-white'
    }`;

  const childNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `ml-6 flex items-start gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold leading-5 transition ${
      isActive
        ? 'bg-orange-500 text-white shadow-lg'
        : 'text-slate-400 hover:bg-white/10 hover:text-white'
    }`;

  return (
    <>
      {isOpen && (
        <button
          type="button"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          aria-label="Close sidebar overlay"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-slate-950 text-white transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
            <div>
              <h2 className="text-xl font-extrabold">Document Portal</h2>
              <p className="text-xs text-slate-400">Admin Dashboard</p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-300 hover:bg-white/10 lg:hidden"
              aria-label="Close sidebar"
            >
              <FaTimes />
            </button>
          </div>

          <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
            {/* <NavLink
              to="/dashboard"
              end
              onClick={onClose}
              className={navLinkClass}
            >
              <FaTachometerAlt />
              Client Summary
            </NavLink> */}

            <div className="rounded-2xl bg-white/[0.04] p-2">
              <button
                type="button"
                onClick={() => setShowClients((prev) => !prev)}
                className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                <span className="flex items-center gap-3">
                  <FaUsers />
                  Clients
                </span>

                {showClients ? <FaChevronDown /> : <FaChevronRight />}
              </button>

              {showClients && (
                <div className="mt-2 space-y-1">
                  <NavLink
                    to="/dashboard/clients"
                    onClick={onClose}
                    className={childNavLinkClass}
                  >
                    <FaUsers className="mt-0.5 shrink-0" />
                    <span>All Clients</span>
                  </NavLink>

                  <NavLink
                    to="/dashboard/client-search"
                    onClick={onClose}
                    className={childNavLinkClass}
                  >
                    <FaUsers className="mt-0.5 shrink-0" />
                    <span>Search Client</span>
                  </NavLink>

                  {/* {documentTypes.map((type) => (
                    <NavLink
                      key={type.value}
                      to={`/dashboard/documents/${type.value}`}
                      onClick={onClose}
                      className={childNavLinkClass}
                    >
                      <FaFolder className="mt-0.5 shrink-0 text-orange-400" />
                      <span>{type.label}</span>
                    </NavLink>
                  ))} */}
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white/[0.04] p-2">
              <button
                type="button"
                onClick={() => setShowClientPortal((prev) => !prev)}
                className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                <span className="flex items-center gap-3">
                  {showClientPortal ? (
                    <FaFolderOpen className="text-orange-400" />
                  ) : (
                    <FaFolder className="text-orange-400" />
                  )}
                  Client Portal
                </span>

                {showClientPortal ? <FaChevronDown /> : <FaChevronRight />}
              </button>

              {showClientPortal && (
                <div className="mt-2 space-y-1">
                  <NavLink
                    to="/client-dashboard"
                    onClick={onClose}
                    className={childNavLinkClass}
                  >
                    <FaExternalLinkAlt className="mt-0.5 shrink-0 text-xs" />
                    <span>Open Client Portal</span>
                  </NavLink>

                  {/* <NavLink
                    to="/dashboard/client-portal-uploads"
                    onClick={onClose}
                    className={childNavLinkClass}
                  >
                    <FaFolder className="mt-0.5 shrink-0 text-orange-400" />
                    <span>Client Portal Uploads</span>
                  </NavLink> */}
                </div>
              )}
            </div>

            {/* <NavLink
              to="/dashboard/export-clients"
              onClick={onClose}
              className={navLinkClass}
            >
              <FaFileExport />
              Export Clients
            </NavLink> */}
          </nav>

          <div className="border-t border-white/10 p-4">
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-sm font-bold">Logged in as</p>
              <p className="mt-1 text-xs text-slate-400">Administrator</p>

              <button
                type="button"
                onClick={() => setShowLogoutModal(true)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-600"
              >
                <FaSignOutAlt />
                Logout
              </button>
            </div>
          </div>
        </div>
      </aside>

      {showLogoutModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
              <FaExclamationTriangle className="text-2xl" />
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-extrabold text-slate-900">
                Confirm Logout
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Are you sure you want to logout?
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="h-12 rounded-xl border border-slate-300 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmLogout}
                className="h-12 rounded-xl bg-red-500 text-sm font-bold text-white transition hover:bg-red-600"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}