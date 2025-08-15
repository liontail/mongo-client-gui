import React from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Storage as StorageIcon,
  GridOn as GridOnIcon
} from '@mui/icons-material';

function DatabaseView({ activeConnection, selectedDatabase, onDatabaseSelect }) {
  if (!activeConnection) {
    return <Typography>No active connection</Typography>;
  }

  const { databases } = activeConnection;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Databases
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Select a database to view its collections and documents
      </Typography>

      <Grid container spacing={3}>
        {databases.map((database) => (
          <Grid item xs={12} md={6} lg={4} key={database.name}>
            <Card 
              variant="outlined"
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: 3,
                  borderColor: 'primary.main'
                },
                ...(selectedDatabase && selectedDatabase.name === database.name ? {
                  borderColor: 'primary.main',
                  borderWidth: 2
                } : {})
              }}
              onClick={() => onDatabaseSelect(database)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <StorageIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" component="div">
                    {database.name}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip
                    label={`${database.sizeOnDisk ? (database.sizeOnDisk / 1024 / 1024).toFixed(2) + ' MB' : 'Empty'}`}
                    size="small"
                    color="secondary"
                    variant="outlined"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default DatabaseView;
