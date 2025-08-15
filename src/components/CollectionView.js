import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  CircularProgress,
  Alert,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Info as InfoIcon
} from '@mui/icons-material';

function CollectionView({ activeConnection, selectedDatabase, selectedCollection }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [queryFilter, setQueryFilter] = useState('');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const loadDocuments = async (filter = '{}') => {
    if (!activeConnection || !selectedDatabase || !selectedCollection) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      let parsedFilter;
      try {
        parsedFilter = JSON.parse(filter);
      } catch (e) {
        setError('Invalid query filter: ' + e.message);
        setLoading(false);
        return;
      }
      
      const result = await window.electron.getDocuments(
        activeConnection.id,
        selectedDatabase.name,
        selectedCollection.name,
        parsedFilter,
        {
          skip: page * rowsPerPage,
          limit: rowsPerPage
        }
      );
      
      if (result.success) {
        setDocuments(result.documents);
        setTotalCount(result.total);
      } else {
        setError(result.error || 'Failed to load documents');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (activeConnection && selectedDatabase && selectedCollection) {
      loadDocuments();
    }
  }, [activeConnection, selectedDatabase, selectedCollection, page, rowsPerPage]);
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleSearch = () => {
    setPage(0);
    loadDocuments(queryFilter || '{}');
  };
  
  const handleRefresh = () => {
    loadDocuments(queryFilter || '{}');
  };
  
  const handleViewDocument = (doc) => {
    setSelectedDocument(doc);
    setDialogOpen(true);
  };
  
  const getDocumentFields = (doc) => {
    if (!doc) return [];
    return Object.keys(doc).filter(key => key !== '_id');
  };
  
  if (!selectedCollection) {
    return (
      <Typography variant="h6">
        Please select a collection from the sidebar
      </Typography>
    );
  }
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" gutterBottom>
          {selectedCollection.name}
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>
      
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Query Filter (JSON)"
            variant="outlined"
            fullWidth
            size="small"
            value={queryFilter}
            onChange={(e) => setQueryFilter(e.target.value)}
            placeholder="{}"
            helperText="e.g. {\"name\": \"John\"}"
          />
          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={handleSearch}
            disabled={loading}
          >
            Search
          </Button>
        </Box>
      </Paper>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} size="small" aria-label="documents table">
              <TableHead>
                <TableRow>
                  <TableCell>_id</TableCell>
                  {documents.length > 0 && getDocumentFields(documents[0]).slice(0, 5).map(field => (
                    <TableCell key={field}>{field}</TableCell>
                  ))}
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow
                    key={doc._id}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    hover
                  >
                    <TableCell component="th" scope="row">
                      {doc._id.toString()}
                    </TableCell>
                    {getDocumentFields(doc).slice(0, 5).map(field => (
                      <TableCell key={field}>
                        {typeof doc[field] === 'object' 
                          ? JSON.stringify(doc[field]).substring(0, 50) + (JSON.stringify(doc[field]).length > 50 ? '...' : '')
                          : String(doc[field]).substring(0, 50) + (String(doc[field]).length > 50 ? '...' : '')}
                      </TableCell>
                    ))}
                    <TableCell>
                      <IconButton size="small" onClick={() => handleViewDocument(doc)}>
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50, 100]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </>
      )}
      
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Document Detail</DialogTitle>
        <DialogContent>
          <pre className="json-tree">
            {selectedDocument ? JSON.stringify(selectedDocument, null, 2) : ''}
          </pre>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default CollectionView;
