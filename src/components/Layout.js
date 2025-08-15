import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, 
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import {
  Storage as StorageIcon,
  Code as CodeIcon,
  GridOn as GridOnIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon
} from '@mui/icons-material';

const drawerWidth = 260;

function Layout({ 
  children, 
  activeConnection, 
  selectedDatabase,
  selectedCollection,
  onDatabaseSelect, 
  onCollectionSelect,
  onDisconnect
}) {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [databases, setDatabases] = useState([]);
  const [collections, setCollections] = useState([]);
  
  // Load databases when connection is active
  React.useEffect(() => {
    if (activeConnection) {
      setDatabases(activeConnection.databases || []);
    } else {
      navigate('/');
    }
  }, [activeConnection, navigate]);
  
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
        }
      };
      
      fetchCollections();
    }
  }, [activeConnection, selectedDatabase]);
  
  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };
  
  const handleDatabaseClick = (database) => {
    onDatabaseSelect(database);
    navigate('/collections');
  };
  
  const handleCollectionClick = (collection) => {
    onCollectionSelect(collection);
    navigate('/collections');
  };
  
  const handleQueryClick = () => {
    navigate('/query');
  };
  
  const handleDisconnect = () => {
    onDisconnect();
    navigate('/');
  };
  
  if (!activeConnection) {
    return null;
  }
  
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: (theme) => theme.palette.background.default,
          boxShadow: 1,
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={toggleDrawer}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <StorageIcon sx={{ mr: 1 }} />
            <Typography variant="h6" component="div">
              MongoDB Client
            </Typography>
            {activeConnection && (
              <Chip 
                label={activeConnection.name || 'Connected'} 
                color="primary" 
                size="small" 
                sx={{ ml: 2 }}
              />
            )}
            {selectedDatabase && (
              <Chip 
                label={selectedDatabase.name} 
                color="secondary" 
                size="small" 
                sx={{ ml: 1 }}
              />
            )}
            {selectedCollection && (
              <Chip 
                label={selectedCollection.name} 
                variant="outlined"
                size="small" 
                sx={{ ml: 1 }}
              />
            )}
          </Box>
          <Tooltip title="Disconnect">
            <IconButton color="inherit" onClick={handleDisconnect}>
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="persistent"
        anchor="left"
        open={drawerOpen}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            top: '64px',
            height: 'calc(100% - 64px)'
          },
        }}
      >
        <List sx={{ pt: 1 }}>
          <ListItem disablePadding>
            <ListItemButton onClick={handleQueryClick}>
              <ListItemIcon>
                <CodeIcon />
              </ListItemIcon>
              <ListItemText primary="Query Interface" />
            </ListItemButton>
          </ListItem>
        </List>
        
        <Divider sx={{ my: 1 }} />
        
        <Typography variant="subtitle2" sx={{ px: 2, py: 1 }}>
          Databases
        </Typography>
        <List dense>
          {databases.map((db) => (
            <ListItem 
              key={db.name} 
              disablePadding 
              className={`database-item ${selectedDatabase && selectedDatabase.name === db.name ? 'selected' : ''}`}
            >
              <ListItemButton onClick={() => handleDatabaseClick(db)}>
                <ListItemIcon>
                  <StorageIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={db.name} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        
        {selectedDatabase && (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" sx={{ px: 2, py: 1 }}>
              Collections
            </Typography>
            <List dense>
              {collections.map((collection) => (
                <ListItem 
                  key={collection.name} 
                  disablePadding
                  className={`collection-item ${selectedCollection && selectedCollection.name === collection.name ? 'selected' : ''}`}
                >
                  <ListItemButton onClick={() => handleCollectionClick(collection)}>
                    <ListItemIcon>
                      <GridOnIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={collection.name} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </>
        )}
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          ml: drawerOpen ? `${drawerWidth}px` : 0,
          mt: '64px',
          transition: (theme) =>
            theme.transitions.create('margin', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default Layout;
