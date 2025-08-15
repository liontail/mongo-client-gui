import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

// Components
import Layout from './components/Layout';
import ConnectionPage from './components/ConnectionPage';
import DatabaseView from './components/DatabaseView';
import CollectionView from './components/CollectionView';
import QueryInterface from './components/QueryInterface';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4caf50',
    },
    secondary: {
      main: '#ff9800',
    },
  },
});

function App() {
  const [activeConnection, setActiveConnection] = useState(null);
  const [selectedDatabase, setSelectedDatabase] = useState(null);
  const [selectedCollection, setSelectedCollection] = useState(null);
  
  // Check if we have a stored active connection on app load
  useEffect(() => {
    const storedConnection = localStorage.getItem('activeConnection');
    if (storedConnection) {
      setActiveConnection(JSON.parse(storedConnection));
    }
  }, []);
  
  // Store active connection whenever it changes
  useEffect(() => {
    if (activeConnection) {
      localStorage.setItem('activeConnection', JSON.stringify(activeConnection));
    } else {
      localStorage.removeItem('activeConnection');
    }
  }, [activeConnection]);
  
  const handleDatabaseSelect = (db) => {
    setSelectedDatabase(db);
    setSelectedCollection(null);
  };
  
  const handleCollectionSelect = (collection) => {
    setSelectedCollection(collection);
  };
  
  const handleDisconnect = () => {
    setActiveConnection(null);
    setSelectedDatabase(null);
    setSelectedCollection(null);
  };
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route
          path="/"
          element={
            activeConnection ? (
              <Navigate to="/databases" replace />
            ) : (
              <ConnectionPage setActiveConnection={setActiveConnection} />
            )
          }
        />
        <Route
          path="/databases"
          element={
            <Layout 
              activeConnection={activeConnection}
              selectedDatabase={selectedDatabase}
              selectedCollection={selectedCollection}
              onDatabaseSelect={handleDatabaseSelect}
              onCollectionSelect={handleCollectionSelect}
              onDisconnect={handleDisconnect}
            >
              <DatabaseView 
                activeConnection={activeConnection}
                selectedDatabase={selectedDatabase}
                onDatabaseSelect={handleDatabaseSelect}
              />
            </Layout>
          }
        />
        <Route
          path="/collections"
          element={
            <Layout 
              activeConnection={activeConnection}
              selectedDatabase={selectedDatabase}
              selectedCollection={selectedCollection}
              onDatabaseSelect={handleDatabaseSelect}
              onCollectionSelect={handleCollectionSelect}
              onDisconnect={handleDisconnect}
            >
              <CollectionView 
                activeConnection={activeConnection}
                selectedDatabase={selectedDatabase}
                selectedCollection={selectedCollection}
                onCollectionSelect={handleCollectionSelect}
              />
            </Layout>
          }
        />
        <Route
          path="/query"
          element={
            <Layout 
              activeConnection={activeConnection}
              selectedDatabase={selectedDatabase}
              selectedCollection={selectedCollection}
              onDatabaseSelect={handleDatabaseSelect}
              onCollectionSelect={handleCollectionSelect}
              onDisconnect={handleDisconnect}
            >
              <QueryInterface 
                activeConnection={activeConnection}
                selectedDatabase={selectedDatabase}
              />
            </Layout>
          }
        />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
