import { Box, Typography } from '@mui/joy';

const Header = () => (
    <Box
        component="header"
        sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            p: 2,
        }}
    >
        <Typography level="h4">Pacific Dimension</Typography>
    </Box>
);

export default Header;
