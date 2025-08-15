import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Container,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Storage as StorageIcon
} from '@mui/icons-material';

function ConnectionPage({ setActiveConnection }) {
  const [connectionString, setConnectionString] = useState('');
  const [connectionName, setConnectionName] = useState('');
  const [savedConnections, setSavedConnections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  
  // Load saved connections
  useEffect(() => {
    const loadConnections = async () => {
      const result = await window.electron.getSavedConnections();
      if (result.success && result.connections) {
        setSavedConnections(result.connections);
      }
    };
    
    loadConnections();
  }, []);
  
  const handleConnect = async () => {
    if (!connectionString) {
      setError('Connection string is required');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const result = await window.electron.connectToMongoDB(
        connectionString, 
        connectionName || 'MongoDB Connection'
      );
      
      if (result.success) {
        setActiveConnection({
          id: result.id,
          name: connectionName || 'MongoDB Connection',
          connectionString,
          databases: result.databases
        });
      } else {
        setError(result.error || 'Failed to connect');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSavedConnectionClick = async (connection) => {
    setLoading(true);
    setError('');
    
    try {
      const result = await window.electron.connectToMongoDB(
        connection.connectionString, 
        connection.name
      );
      
      if (result.success) {
        setActiveConnection({
          id: result.id,
          name: connection.name,
          connectionString: connection.connectionString,
          databases: result.databases
        });
      } else {
        setError(result.error || 'Failed to connect');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteConnection = async () => {
    if (!confirmDelete) return;
    
    try {
      const result = await window.electron.deleteConnection(confirmDelete.id);
      if (result.success) {
        setSavedConnections(savedConnections.filter(conn => conn.id !== confirmDelete.id));
      }
    } catch (error) {
      console.error('Failed to delete connection:', error);
    }
    
    setConfirmDelete(null);
  };
  
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          MongoDB Client
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Connect to your MongoDB database to start exploring and managing your data.
        </Typography>
        
        <Box component="form" noValidate autoComplete="off" className="connection-form">
          <TextField
            label="Connection Name"
            variant="outlined"
            fullWidth
            margin="normal"
            value={connectionName}
            onChange={(e) => setConnectionName(e.target.value)}
            placeholder="My MongoDB Connection"
          />
          
          <TextField
            label="Connection String"
            variant="outlined"
            fullWidth
            margin="normal"
            value={connectionString}
            onChange={(e) => setConnectionString(e.target.value)}
            placeholder="mongodb://localhost:27017"
            required
            error={!!error}
            helperText={error}
          />
          
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleConnect}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <StorageIcon />}
              fullWidth
            >
              {loading ? 'Connecting...' : 'Connect'}
            </Button>
          </Box>
        </Box>
      </Paper>
      
      {savedConnections.length > 0 && (
        <Paper elevation={2} sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Saved Connections
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <List>
            {savedConnections.map((connection) => (
              <Card key={connection.id} variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" component="div">
                    {connection.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                    {connection.connectionString}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    color="primary" 
                    onClick={() => handleSavedConnectionClick(connection)}
                  >
                    Connect
                  </Button>
                  <Button 
                    size="small" 
                    color="error" 
                    onClick={() => setConfirmDelete(connection)}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            ))}
          </List>
        </Paper>
      )}
      
      <Dialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
      >
        <DialogTitle>Delete Connection</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the connection "{confirmDelete?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button onClick={handleDeleteConnection} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default ConnectionPage;
