import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/layout';
import ChatDashboard from '@/components/messages/ChatDashboard';
export default function Messages() {
  const [params] = useSearchParams();
  return <DashboardLayout title="Messages" subtitle="Talk with clients about their scenarios."><ChatDashboard key={params.get("clientId") || "inbox"} token={sessionStorage.getItem('adminChatToken') || ''} role="Admin" initialClientId={Number(params.get('clientId')) || undefined} /></DashboardLayout>;
}
