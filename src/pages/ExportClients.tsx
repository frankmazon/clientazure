import { FaDownload, FaFileCsv } from 'react-icons/fa';
import DashboardLayout from '../components/layout/layout';

export default function ExportClients() {
  const handleExport = () => {
    console.log('Export clients');
  };

  return (
    <DashboardLayout
      title="Export Clients"
      subtitle="Download all client document submissions."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow lg:col-span-2">
          <div className="mb-6 flex items-center gap-4">
            <div className="rounded-2xl bg-orange-100 p-4 text-orange-600">
              <FaFileCsv className="text-3xl" />
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Export Client Records
              </h2>
              <p className="text-sm text-slate-500">
                Generate a CSV file containing all submitted client records.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-3 rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white hover:bg-orange-600"
          >
            <FaDownload />
            Export CSV
          </button>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <h3 className="mb-3 text-lg font-bold text-slate-900">
            Export Includes
          </h3>

          <ul className="space-y-3 text-sm text-slate-600">
            <li>Client full name</li>
            <li>Email address</li>
            <li>Document type</li>
            <li>File name</li>
            <li>Submitted date</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}