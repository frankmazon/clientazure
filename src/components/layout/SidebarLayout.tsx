import { ReactNode } from 'react';
import { Box } from '@mui/joy';

type Props = {
    children: ReactNode;
};

const SidebarLayout = ({ children }: Props) => {
    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar placeholder */}
            <Box
                sx={{
                    width: 240,
                    borderRight: '1px solid',
                    borderColor: 'divider',
                    p: 2,
                }}
            >
                Sidebar
            </Box>

            {/* Main content */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {children}
            </Box>
        </Box>
    );
};

export default SidebarLayout;
