const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { MongoClient } = require('mongodb');
// Import Electron Store correctly
const ElectronStore = require('electron-store');

// Initialize store for saved connections
const store = new ElectronStore({
  name: 'mongo-client-connections',
  defaults: {
    connections: []
  }
});

let mainWindow;
let mongoClients = {};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Always load from filesystem
  const startUrl = `file://${path.join(__dirname, '../../public/index.html')}`;
    
  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    // Close all mongo connections when app closes
    Object.values(mongoClients).forEach(client => {
      if (client) client.close();
    });
    mongoClients = {};
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// MongoDB connection handler
ipcMain.handle('connect-to-mongodb', async (event, connectionString, connectionName) => {
  try {
    const client = new MongoClient(connectionString);
    await client.connect();
    const id = Date.now().toString();
    mongoClients[id] = client;
    
    // Save connection to store if not exists
    const savedConnections = store.get('connections');
    if (!savedConnections.some(conn => conn.connectionString === connectionString)) {
      store.set('connections', [
        ...savedConnections, 
        { id, name: connectionName, connectionString }
      ]);
    }
    
    const dbList = await client.db().admin().listDatabases();
    return { success: true, id, databases: dbList.databases };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Get database collections
ipcMain.handle('get-collections', async (event, clientId, dbName) => {
  try {
    const client = mongoClients[clientId];
    if (!client) throw new Error('Connection not found');
    
    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();
    
    return { success: true, collections };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Get collection documents
ipcMain.handle('get-documents', async (event, clientId, dbName, collectionName, query = {}, options = {}) => {
  try {
    const client = mongoClients[clientId];
    if (!client) throw new Error('Connection not found');
    
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    
    // Parse query if it's a string
    const parsedQuery = typeof query === 'string' ? JSON.parse(query) : query;
    
    // Set default options
    const skip = options.skip || 0;
    const limit = options.limit || 50;
    const sort = options.sort || { _id: 1 };
    
    const documents = await collection.find(parsedQuery)
      .skip(skip)
      .limit(limit)
      .sort(sort)
      .toArray();
    
    const count = await collection.countDocuments(parsedQuery);
    
    return { 
      success: true, 
      documents,
      total: count,
      page: Math.floor(skip / limit) + 1,
      totalPages: Math.ceil(count / limit)
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Execute a query
ipcMain.handle('execute-query', async (event, clientId, dbName, query) => {
  try {
    const client = mongoClients[clientId];
    if (!client) throw new Error('Connection not found');
    
    const db = client.db(dbName);
    let result;
    
    // Parse and execute the query
    try {
      const parsedQuery = JSON.parse(query);
      result = await eval(`db.${parsedQuery.collection}.${parsedQuery.operation}(${JSON.stringify(parsedQuery.query)})`);
      if (result.toArray) {
        result = await result.toArray();
      }
    } catch (e) {
      throw new Error(`Query execution error: ${e.message}`);
    }
    
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Get saved connections
ipcMain.handle('get-saved-connections', async () => {
  const connections = store.get('connections');
  return { success: true, connections };
});

// Delete saved connection
ipcMain.handle('delete-connection', async (event, connectionId) => {
  try {
    const connections = store.get('connections');
    const updatedConnections = connections.filter(conn => conn.id !== connectionId);
    store.set('connections', updatedConnections);
    
    // Close connection if active
    if (mongoClients[connectionId]) {
      await mongoClients[connectionId].close();
      delete mongoClients[connectionId];
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
