import React, { useState } from 'react';
import {
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Tabs,
  Tab
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Save as SaveIcon,
  Clear as ClearIcon
} from '@mui/icons-material';

function QueryInterface({ activeConnection, selectedDatabase }) {
  const [query, setQuery] = useState('');
  const [queryType, setQueryType] = useState('find');
  const [collection, setCollection] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);
  const [collections, setCollections] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  
  // Load collections when database is selected
  React.useEffect(() => {
    if (activeConnection && selectedDatabase) {
      const fetchCollections = async () => {
        const result = await window.electron.getCollections(
          activeConnection.id,
          selectedDatabase.name
        );
        
        if (result.success) {
          setCollections(result.collections);
          if (result.collections.length > 0) {
            setCollection(result.collections[0].name);
          }
        }
      };
      
      fetchCollections();
    }
  }, [activeConnection, selectedDatabase]);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleExecute = async () => {
    if (!activeConnection || !selectedDatabase || !collection) {
      setError('Please select a database and collection');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      let queryObj;
      try {
        if (tabValue === 1) {
          // Simple query mode
          queryObj = {
            collection,
            operation: queryType,
            query: query || '{}'
          };
        } else {
          // Advanced query mode - parse the entire query
          queryObj = JSON.parse(query);
        }
      } catch (e) {
        setError('Invalid query: ' + e.message);
        setLoading(false);
        return;
      }
      
      const result = await window.electron.executeQuery(
        activeConnection.id,
        selectedDatabase.name,
        JSON.stringify(queryObj)
      );
      
      if (result.success) {
        setResults(result.result);
      } else {
        setError(result.error || 'Query failed');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const handleClear = () => {
    setQuery('');
    setResults(null);
    setError('');
  };
  
  const generateQueryTemplate = (type) => {
    switch (type) {
      case 'find':
        return '{}';
      case 'findOne':
        return '{ "field": "value" }';
      case 'insertOne':
        return '{ "field1": "value1", "field2": "value2" }';
      case 'insertMany':
        return '[{ "field1": "value1" }, { "field1": "value2" }]';
      case 'updateOne':
        return '{ "filter": { "field": "value" }, "update": { "$set": { "field": "newValue" } } }';
      case 'updateMany':
        return '{ "filter": { "field": "value" }, "update": { "$set": { "field": "newValue" } } }';
      case 'deleteOne':
        return '{ "field": "value" }';
      case 'deleteMany':
        return '{ "field": "value" }';
      case 'aggregate':
        return '[{ "$match": { "field": "value" } }, { "$group": { "_id": "$field" } }]';
      default:
        return '{}';
    }
  };
  
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Query Interface
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Execute MongoDB queries and view results
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant="fullWidth" 
          sx={{ mb: 2 }}
        >
          <Tab label="Simple Mode" />
          <Tab label="Advanced Mode" />
        </Tabs>
        
        {tabValue === 1 ? (
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Collection</InputLabel>
                <Select
                  value={collection}
                  label="Collection"
                  onChange={(e) => setCollection(e.target.value)}
                >
                  {collections.map((col) => (
                    <MenuItem key={col.name} value={col.name}>
                      {col.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Operation</InputLabel>
                <Select
                  value={queryType}
                  label="Operation"
                  onChange={(e) => {
                    setQueryType(e.target.value);
                    setQuery(generateQueryTemplate(e.target.value));
                  }}
                >
                  <MenuItem value="find">find</MenuItem>
                  <MenuItem value="findOne">findOne</MenuItem>
                  <MenuItem value="insertOne">insertOne</MenuItem>
                  <MenuItem value="insertMany">insertMany</MenuItem>
                  <MenuItem value="updateOne">updateOne</MenuItem>
                  <MenuItem value="updateMany">updateMany</MenuItem>
                  <MenuItem value="deleteOne">deleteOne</MenuItem>
                  <MenuItem value="deleteMany">deleteMany</MenuItem>
                  <MenuItem value="aggregate">aggregate</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Advanced mode: Enter a full query object with collection, operation and query parameters.
            <br />
            Example: {"{ \"collection\": \"users\", \"operation\": \"find\", \"query\": { \"age\": { \"$gt\": 30 } } }"}
          </Typography>
        )}
        
        <TextField
          label="Query"
          multiline
          rows={6}
          fullWidth
          variant="outlined"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="query-editor"
          placeholder={tabValue === 1 ? "Enter query parameters" : "Enter full query object"}
          sx={{ fontFamily: 'monospace' }}
        />
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<ClearIcon />}
            onClick={handleClear}
          >
            Clear
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
            onClick={handleExecute}
            disabled={loading || !collection}
          >
            Execute
          </Button>
        </Box>
      </Paper>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {results && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Results
          </Typography>
          <Box sx={{ maxHeight: '500px', overflow: 'auto' }}>
            <pre className="json-tree">
              {JSON.stringify(results, null, 2)}
            </pre>
          </Box>
        </Paper>
      )}
    </Box>
  );
}

export default QueryInterface;
