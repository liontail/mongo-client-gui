const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  connectToMongoDB: (connectionString, connectionName) => {
    return ipcRenderer.invoke('connect-to-mongodb', connectionString, connectionName);
  },
  getCollections: (clientId, dbName) => {
    return ipcRenderer.invoke('get-collections', clientId, dbName);
  },
  getDocuments: (clientId, dbName, collectionName, query, options) => {
    return ipcRenderer.invoke('get-documents', clientId, dbName, collectionName, query, options);
  },
  executeQuery: (clientId, dbName, query) => {
    return ipcRenderer.invoke('execute-query', clientId, dbName, query);
  },
  getSavedConnections: () => {
    return ipcRenderer.invoke('get-saved-connections');
  },
  deleteConnection: (connectionId) => {
    return ipcRenderer.invoke('delete-connection', connectionId);
  }
});
