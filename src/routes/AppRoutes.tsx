import { Routes, Route } from 'react-router-dom';
import { Box, Typography } from '@mui/joy';

import SidebarLayout from '@components/layout/SidebarLayout';
import Header from '@components/layout/Header';

const DashboardPage = () => (
    <Box sx={{ p: 2 }}>
        <Typography level="h2">Dashboard</Typography>
        <Typography level="body-md" className="mt-2">
            Welcome to Pacific Dimension!
        </Typography>
    </Box>
);

const AppRoutes = () => (
    <SidebarLayout>
        <Header />
        <Routes>
            <Route path="/" element={<DashboardPage />} />
            {/* Add more routes here later */}
        </Routes>
    </SidebarLayout>
);

export default AppRoutes;
