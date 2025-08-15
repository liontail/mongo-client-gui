// MongoDB Client GUI main script
document.addEventListener('DOMContentLoaded', function() {
  // Track application state
  const appState = {
    activeConnection: null,
    selectedDatabase: null,
    selectedCollection: null
  };
  const rootElement = document.getElementById('root');
  
  // Create a simple UI for the connection page
  rootElement.innerHTML = `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-radius: 8px;">
      <h1 style="color: #4caf50;">MongoDB Client GUI</h1>
      <p style="color: #555;">Connect to your MongoDB database to start exploring and managing your data.</p>
      
      <div style="margin: 20px 0;">
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px;">Connection Name</label>
          <input id="connectionName" type="text" placeholder="My MongoDB Connection" 
                 style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px;">Connection String</label>
          <input id="connectionString" type="text" placeholder="mongodb://localhost:27017" 
                 style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        </div>
        
        <div id="errorMessage" style="color: #f44336; margin: 10px 0;"></div>
        
        <button id="connectButton" 
                style="background: #4caf50; color: white; border: none; padding: 10px 20px; 
                       border-radius: 4px; cursor: pointer; font-size: 14px; width: 100%;">
          Connect
        </button>
      </div>
      
      <div id="savedConnections" style="margin-top: 30px;">
        <h2 style="font-size: 18px; color: #333;">Saved Connections</h2>
        <div id="connectionsList"></div>
      </div>
    </div>
  `;
  
  // Add functionality
  const connectButton = document.getElementById('connectButton');
  const connectionNameInput = document.getElementById('connectionName');
  const connectionStringInput = document.getElementById('connectionString');
  const errorMessageDiv = document.getElementById('errorMessage');
  const connectionsListDiv = document.getElementById('connectionsList');
  
  // Load saved connections
  loadSavedConnections();
  
  connectButton.addEventListener('click', async function() {
    const connectionName = connectionNameInput.value || 'MongoDB Connection';
    const connectionString = connectionStringInput.value;
    
    if (!connectionString) {
      errorMessageDiv.textContent = 'Connection string is required';
      return;
    }
    
    connectButton.textContent = 'Connecting...';
    connectButton.disabled = true;
    errorMessageDiv.textContent = '';
    
    try {
      const result = await window.electron.connectToMongoDB(connectionString, connectionName);
      
      if (result.success) {
        // Store connection info
        appState.activeConnection = {
          id: result.id,
          name: connectionName,
          connectionString: connectionString,
          databases: result.databases
        };
        // Navigate to database view
        renderDatabaseView();
      } else {
        errorMessageDiv.textContent = result.error || 'Failed to connect';
      }
    } catch (err) {
      errorMessageDiv.textContent = err.message || 'An unexpected error occurred';
    } finally {
      connectButton.textContent = 'Connect';
      connectButton.disabled = false;
    }
  });
  
  // Function to render the database view
  function renderDatabaseView() {
    if (!appState.activeConnection) return;
    
    const { databases } = appState.activeConnection;
    
    rootElement.innerHTML = `
      <div style="font-family: Arial, sans-serif; height: 100vh; display: flex; flex-direction: column; overflow: hidden;">
        <!-- Header -->
        <div style="background-color: #f5f5f5; padding: 10px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ddd;">
          <div style="display: flex; align-items: center;">
            <h2 style="margin: 0; color: #4caf50;">MongoDB Client</h2>
            <span style="background: #4caf50; color: white; padding: 4px 8px; border-radius: 4px; margin-left: 10px; font-size: 14px;">${appState.activeConnection.name}</span>
          </div>
          <button id="disconnectButton" style="background: #f44336; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
            Disconnect
          </button>
        </div>
        
        <!-- Main content area -->
        <div style="display: flex; flex: 1; overflow: hidden;">
          <!-- Sidebar -->
          <div style="width: 250px; border-right: 1px solid #ddd; overflow-y: auto; background: #f9f9f9;">
            <div style="padding: 15px;">
              <h3 style="margin-top: 0; color: #333;">Databases</h3>
              <div id="databaseList">
                ${databases.map(db => `
                  <div class="db-container">
                    <div class="database-item" data-name="${db.name}" style="padding: 8px; margin-bottom: 4px; border-radius: 4px; cursor: pointer; transition: background-color 0.2s; display: flex; align-items: center; justify-content: space-between;">
                      <div>
                        <span class="toggle-icon" style="display: inline-block; width: 20px; height: 20px; text-align: center; line-height: 20px; cursor: pointer;">▶</span>
                        <span style="font-weight: bold;">${db.name}</span>
                      </div>
                      <div style="font-size: 12px; color: #666;">${db.sizeOnDisk ? (db.sizeOnDisk / 1024 / 1024).toFixed(2) + ' MB' : ''}</div>
                    </div>
                    <div class="collections-container" data-for="${db.name}" style="display: none; padding-left: 25px;">
                      <!-- Collections will be loaded here -->
                      <div style="color: #888; font-size: 12px; padding: 5px;">Click to load collections</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
          
          <!-- Main panel -->
          <div id="mainPanel" style="flex: 1; padding: 20px; overflow-y: auto;">
            <h2>Welcome to MongoDB Client</h2>
            <p>Select a database from the sidebar to get started.</p>
          </div>
        </div>
      </div>
    `;
    
    // Add event listener for database items and toggle icons
    document.querySelectorAll('.database-item').forEach(item => {
      const dbName = item.getAttribute('data-name');
      const toggleIcon = item.querySelector('.toggle-icon');
      const collectionsContainer = document.querySelector(`.collections-container[data-for="${dbName}"]`);
      
      // Toggle collection visibility when clicking the toggle icon
      toggleIcon.addEventListener('click', async function(e) {
        e.stopPropagation(); // Prevent triggering the database item click
        
        const isExpanded = toggleIcon.textContent === '▼';
        toggleIcon.textContent = isExpanded ? '▶' : '▼';
        
        if (isExpanded) {
          collectionsContainer.style.display = 'none';
        } else {
          collectionsContainer.style.display = 'block';
          
          // Load collections if not already loaded
          if (collectionsContainer.children.length === 1 && 
              collectionsContainer.children[0].textContent.includes('Click to load')) {
            try {
              // Show loading indicator
              collectionsContainer.innerHTML = '<div style="color: #888; font-size: 12px; padding: 5px;">Loading collections...</div>';
              
              // Fetch collections for this database
              const result = await window.electron.getCollections(appState.activeConnection.id, dbName);
              
              // Make sure we have an array of collections
              const collections = Array.isArray(result) ? result : 
                                 (result.collections && Array.isArray(result.collections)) ? result.collections : [];
              
              if (collections.length === 0) {
                collectionsContainer.innerHTML = '<div style="color: #888; font-size: 12px; padding: 5px;">No collections found</div>';
              } else {
                // Render collections
                collectionsContainer.innerHTML = collections.map(collection => `
                  <div class="collection-item" data-db="${dbName}" data-name="${collection.name}" 
                       style="padding: 6px; margin-bottom: 2px; border-radius: 4px; cursor: pointer;">
                    <span style="display: inline-block; width: 20px; height: 20px; text-align: center; vertical-align: middle;">📄</span>
                    ${collection.name}
                  </div>
                `).join('');
                
                // Add event listeners for collection items
                collectionsContainer.querySelectorAll('.collection-item').forEach(collItem => {
                  collItem.addEventListener('click', function() {
                    const collName = this.getAttribute('data-name');
                    const dbName = this.getAttribute('data-db');
                    
                    // Reset collection item styling
                    document.querySelectorAll('.collection-item').forEach(el => el.style.backgroundColor = '');
                    // Highlight selected collection
                    this.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
                    
                    // Set selected database and collection
                    appState.selectedDatabase = dbName;
                    appState.selectedCollection = collName;
                    
                    // Load the collection contents
                    loadCollectionContents(dbName, collName);
                  });
                  
                  // Add hover effect
                  collItem.addEventListener('mouseover', function() {
                    if (!this.style.backgroundColor)
                      this.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                  });
                  
                  collItem.addEventListener('mouseout', function() {
                    if (this.style.backgroundColor === 'rgba(0, 0, 0, 0.05)')
                      this.style.backgroundColor = '';
                  });
                });
              }
            } catch (err) {
              collectionsContainer.innerHTML = `<div style="color: #f44336; font-size: 12px; padding: 5px;">Error: ${err.message}</div>`;
            }
          }
        }
      });
      
      // Handle database item click (select database)
      item.addEventListener('click', function() {
        const dbName = this.getAttribute('data-name');
        
        // Reset database item styling
        document.querySelectorAll('.database-item').forEach(el => el.style.backgroundColor = '');
        // Highlight selected database
        this.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
        
        // Set selected database and clear selected collection
        appState.selectedDatabase = dbName;
        appState.selectedCollection = null;
        
        // Show the database welcome screen
        loadDatabaseContents(dbName);
      });
      
      // Add hover effect
      item.addEventListener('mouseover', function() {
        if (!this.style.backgroundColor)
          this.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
      });
      
      item.addEventListener('mouseout', function() {
        if (this.style.backgroundColor === 'rgba(0, 0, 0, 0.05)')
          this.style.backgroundColor = '';
      });
    });
    
    // Disconnect button functionality
    document.getElementById('disconnectButton').addEventListener('click', () => {
      appState.activeConnection = null;
      appState.selectedDatabase = null;
      appState.selectedCollection = null;
      renderConnectionPage();
    });
  }
  
  // Function to load database contents
  async function loadDatabaseContents(dbName) {
    if (!appState.activeConnection) return;
    
    appState.selectedDatabase = dbName;
    appState.selectedCollection = null;
    const mainPanel = document.getElementById('mainPanel');
    
    // Highlight selected database
    document.querySelectorAll('.database-item').forEach(item => {
      if (item.getAttribute('data-name') === dbName) {
        item.style.backgroundColor = 'rgba(76, 175, 80, 0.2)';
      } else {
        item.style.backgroundColor = '';
      }
    });
    
    // Show welcome message for the selected database
    mainPanel.innerHTML = `
      <h2>Database: ${dbName}</h2>
      <p>Select a collection from the sidebar to view its documents.</p>
      <div style="margin-top: 20px; color: #666;">
        <p>You can:</p>
        <ul>
          <li>Click on collections in the sidebar to browse documents</li>
          <li>Use the query interface to filter documents</li>
          <li>View document details by clicking on a document row</li>
        </ul>
      </div>
    `;
    
    // Toggle the collections for this database in the sidebar
    const toggleIcon = document.querySelector(`.database-item[data-name="${dbName}"] .toggle-icon`);
    const collectionsContainer = document.querySelector(`.collections-container[data-for="${dbName}"]`);
    
    if (toggleIcon && collectionsContainer) {
      // If collections aren't already shown, show them now
      if (toggleIcon.textContent !== '▼') { // '▼'
        // Trigger click on toggle icon to expand collections
        toggleIcon.click();
      }
    }
  }
  
  // Function to render collection list
  function renderCollectionList(collectionsData) {
    const mainPanel = document.getElementById('mainPanel');
    
    // Ensure collections is an array
    const collections = Array.isArray(collectionsData) ? collectionsData : 
                       (collectionsData && collectionsData.collections && Array.isArray(collectionsData.collections)) ? 
                       collectionsData.collections : [];
    
    if (collections.length === 0) {
      mainPanel.innerHTML = `
        <h2>Database: ${appState.selectedDatabase}</h2>
        <p>No collections found in this database.</p>
      `;
      return;
    }
    
    mainPanel.innerHTML = `
      <h2>Database: ${appState.selectedDatabase}</h2>
      <p>${collections.length} collection(s) found</p>
      
      <div style="margin-top: 20px;">
        ${collections.map(collection => `
          <div class="collection-item" data-name="${collection.name}" style="padding: 15px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; transition: transform 0.2s;">
            <h3 style="margin-top: 0; color: #4caf50;">${collection.name}</h3>
          </div>
        `).join('')}
      </div>
    `;
    
    // Add event listeners for collection items
    document.querySelectorAll('.collection-item').forEach(item => {
      item.addEventListener('click', async function() {
        const collectionName = this.getAttribute('data-name');
        await loadCollectionDocuments(collectionName);
      });
      
      // Add hover effect
      item.addEventListener('mouseover', function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
      });
      
      item.addEventListener('mouseout', function() {
        this.style.transform = '';
        this.style.boxShadow = '';
      });
    });
  }
  
  // Function to load and display collection documents
  async function loadCollectionContents(dbName, collectionName) {
    if (!appState.activeConnection) return;
    
    appState.selectedCollection = collectionName;
    const mainPanel = document.getElementById('mainPanel');
    
    // Show loading
    mainPanel.innerHTML = '<div style="text-align: center; padding: 40px;"><p>Loading documents...</p></div>';
    
    try {
      // Get documents for the selected collection
      const result = await window.electron.getDocuments(
        appState.activeConnection.id,
        dbName,
        collectionName,
        {},
        { skip: 0, limit: 20 }
      );
      
      if (result.success) {
        renderDocuments(result.documents, result.total);
      } else {
        mainPanel.innerHTML = `<div style="color: #f44336; padding: 20px;">Error: ${result.error || 'Failed to load documents'}</div>`;
      }
    } catch (err) {
      mainPanel.innerHTML = `<div style="color: #f44336; padding: 20px;">Error: ${err.message || 'An unexpected error occurred'}</div>`;
    }
  }
  
  // Function to render documents
  function renderDocuments(documents, total) {
    const mainPanel = document.getElementById('mainPanel');
    
    if (documents.length === 0) {
      mainPanel.innerHTML = `
        <h2>Collection: ${appState.selectedCollection}</h2>
        <p>No documents found in this collection.</p>
        <button id="backToCollections" style="margin-top: 20px; background: #4caf50; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
          Back to Collections
        </button>
      `;
      document.getElementById('backToCollections').addEventListener('click', () => {
        loadDatabaseContents(appState.selectedDatabase);
      });
      return;
    }
    
    // Get field names from the first document
    const fields = Object.keys(documents[0]).filter(field => field !== '_id').slice(0, 5);
    
    mainPanel.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h2>Collection: ${appState.selectedCollection}</h2>
        <button id="backToCollections" style="background: #4caf50; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
          Back to Collections
        </button>
      </div>
      <p>${total} document(s) found (showing ${documents.length})</p>
      
      <!-- Query Interface -->
      <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 4px; background-color: #f9f9f9;">
        <h3 style="margin-top: 0; margin-bottom: 10px;">Query Interface</h3>
        
        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
          <select id="queryType" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px; flex-grow: 1;">
            <option value="simple">Simple Query</option>
            <option value="advanced">Advanced Query</option>
          </select>
          
          <button id="clearQueryBtn" style="background: #f44336; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
            Clear
          </button>
        </div>
        
        <!-- Simple Query Interface -->
        <div id="simpleQueryContainer">
          <div style="margin-bottom: 10px;">
            <label style="display: block; margin-bottom: 5px;">Field</label>
            <select id="queryField" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
              <option value="_id">_id</option>
              ${Object.keys(documents[0]).filter(field => field !== '_id').map(field => 
                `<option value="${field}">${field}</option>`).join('')}
            </select>
          </div>
          
          <div style="margin-bottom: 10px;">
            <label style="display: block; margin-bottom: 5px;">Operator</label>
            <select id="queryOperator" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
              <option value="eq">equals</option>
              <option value="ne">not equals</option>
              <option value="gt">greater than</option>
              <option value="gte">greater than or equal</option>
              <option value="lt">less than</option>
              <option value="lte">less than or equal</option>
              <option value="in">in array</option>
              <option value="regex">matches regex</option>
            </select>
          </div>
          
          <div style="margin-bottom: 10px;">
            <label style="display: block; margin-bottom: 5px;">Value</label>
            <input id="queryValue" type="text" placeholder="Value to search for" 
                   style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          </div>
        </div>
        
        <!-- Advanced Query Interface -->
        <div id="advancedQueryContainer" style="display: none;">
          <div style="margin-bottom: 10px;">
            <label style="display: block; margin-bottom: 5px;">MongoDB Query (JSON format)</label>
            <textarea id="advancedQuery" placeholder='{ "field": "value" }' rows="4" 
                      style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-family: monospace;"></textarea>
          </div>
        </div>
        
        <button id="executeQueryBtn" style="background: #2196F3; color: white; border: none; padding: 10px 20px; 
                   border-radius: 4px; cursor: pointer; font-size: 14px; width: 100%;">
          Execute Query
        </button>
      </div>
      
      <div style="margin-top: 20px; overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; min-width: 800px;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">_id</th>
              ${fields.map(field => `<th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">${field}</th>`).join('')}
              <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${documents.map((doc, index) => `
              <tr class="doc-row" style="${index % 2 === 0 ? '' : 'background-color: #f9f9f9;'}">
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${doc._id.toString().substring(0, 10)}...</td>
                ${fields.map(field => `
                  <td style="padding: 10px; border-bottom: 1px solid #ddd;">
                    ${typeof doc[field] === 'object' 
                      ? JSON.stringify(doc[field]).substring(0, 30) + (JSON.stringify(doc[field]).length > 30 ? '...' : '') 
                      : String(doc[field] || '').substring(0, 30) + (String(doc[field] || '').length > 30 ? '...' : '')}
                  </td>
                `).join('')}
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">
                  <button class="view-doc-btn" data-index="${index}" style="background: #2196F3; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
                    View
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    
    // Add event listener for back button
    document.getElementById('backToCollections').addEventListener('click', () => {
      loadDatabaseContents(appState.selectedDatabase);
    });
    
    // Add event listeners for view buttons
    document.querySelectorAll('.view-doc-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const index = parseInt(this.getAttribute('data-index'));
        const doc = documents[index];
        showDocumentDetail(doc);
      });
    });
    
    // Add event listeners for query interface
    const queryTypeSelect = document.getElementById('queryType');
    const simpleQueryContainer = document.getElementById('simpleQueryContainer');
    const advancedQueryContainer = document.getElementById('advancedQueryContainer');
    const clearQueryBtn = document.getElementById('clearQueryBtn');
    const executeQueryBtn = document.getElementById('executeQueryBtn');
    
    // Toggle between simple and advanced query interfaces
    queryTypeSelect.addEventListener('change', function() {
      if (this.value === 'simple') {
        simpleQueryContainer.style.display = 'block';
        advancedQueryContainer.style.display = 'none';
      } else {
        simpleQueryContainer.style.display = 'none';
        advancedQueryContainer.style.display = 'block';
      }
    });
    
    // Clear query fields
    clearQueryBtn.addEventListener('click', function() {
      const queryType = queryTypeSelect.value;
      
      if (queryType === 'simple') {
        document.getElementById('queryField').selectedIndex = 0;
        document.getElementById('queryOperator').selectedIndex = 0;
        document.getElementById('queryValue').value = '';
      } else {
        document.getElementById('advancedQuery').value = '';
      }
    });
    
    // Execute query
    executeQueryBtn.addEventListener('click', async function() {
      const queryType = queryTypeSelect.value;
      let query = {};
      
      try {
        if (queryType === 'simple') {
          const field = document.getElementById('queryField').value;
          const operator = document.getElementById('queryOperator').value;
          let value = document.getElementById('queryValue').value;
          
          // Convert value to appropriate type if needed
          if (operator === 'in') {
            value = value.split(',').map(v => v.trim());
          } else if (!isNaN(value) && value !== '' && operator !== 'regex') {
            value = Number(value);
          }
          
          // Build the MongoDB query object
          if (operator === 'eq') {
            query[field] = value;
          } else if (operator === 'ne') {
            query[field] = { $ne: value };
          } else if (operator === 'gt') {
            query[field] = { $gt: value };
          } else if (operator === 'gte') {
            query[field] = { $gte: value };
          } else if (operator === 'lt') {
            query[field] = { $lt: value };
          } else if (operator === 'lte') {
            query[field] = { $lte: value };
          } else if (operator === 'in') {
            query[field] = { $in: value };
          } else if (operator === 'regex') {
            query[field] = { $regex: value, $options: 'i' };
          }
        } else {
          // Advanced query - parse JSON
          const advancedQueryText = document.getElementById('advancedQuery').value;
          if (advancedQueryText.trim()) {
            query = JSON.parse(advancedQueryText);
          }
        }
        
        // Show loading indicator
        executeQueryBtn.disabled = true;
        executeQueryBtn.textContent = 'Executing...';
        
        // Call API to execute query
        // Prepare the query object in the format the main process expects
        const queryObj = {
          collection: appState.selectedCollection,
          operation: "find", // Default to find operation
          query: query
        };
        
        const result = await window.electron.executeQuery(
          appState.activeConnection.id,
          appState.selectedDatabase,
          JSON.stringify(queryObj)
        );
        
        if (result.success) {
          // Refresh the view with the query results
          if (Array.isArray(result.result)) {
            renderDocuments(result.result, result.result.length);
          } else {
            alert('Query executed successfully, but returned an unexpected format.');
          }
        } else {
          alert(`Query error: ${result.error}`);
        }
      } catch (err) {
        alert(`Error executing query: ${err.message || 'Unknown error'}`);
      } finally {
        executeQueryBtn.disabled = false;
        executeQueryBtn.textContent = 'Execute Query';
      }
    });
    
    // Add hover effect for rows
    document.querySelectorAll('.doc-row').forEach(row => {
      row.addEventListener('mouseover', function() {
        this.style.backgroundColor = 'rgba(76, 175, 80, 0.05)';
      });
      
      row.addEventListener('mouseout', function() {
        if (Array.from(this.parentNode.children).indexOf(this) % 2 === 0) {
          this.style.backgroundColor = '';
        } else {
          this.style.backgroundColor = '#f9f9f9';
        }
      });
    });
  }
  
  // Function to show document detail
  function showDocumentDetail(doc) {
    // Create modal backdrop
    const backdrop = document.createElement('div');
    backdrop.style.position = 'fixed';
    backdrop.style.top = '0';
    backdrop.style.left = '0';
    backdrop.style.width = '100%';
    backdrop.style.height = '100%';
    backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    backdrop.style.zIndex = '1000';
    backdrop.style.display = 'flex';
    backdrop.style.justifyContent = 'center';
    backdrop.style.alignItems = 'center';
    
    // Create modal content
    const modal = document.createElement('div');
    modal.style.backgroundColor = 'white';
    modal.style.borderRadius = '8px';
    modal.style.width = '80%';
    modal.style.maxWidth = '800px';
    modal.style.maxHeight = '80%';
    modal.style.overflow = 'auto';
    modal.style.padding = '20px';
    modal.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    
    modal.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h3 style="margin: 0;">Document Detail</h3>
        <button id="closeModal" style="background: none; border: none; font-size: 20px; cursor: pointer;">&times;</button>
      </div>
      <pre style="background-color: #f5f5f5; padding: 15px; border-radius: 4px; overflow: auto; max-height: 500px;">${JSON.stringify(doc, null, 2)}</pre>
    `;
    
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);
    
    // Close modal on button click or backdrop click
    document.getElementById('closeModal').addEventListener('click', () => {
      document.body.removeChild(backdrop);
    });
    
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        document.body.removeChild(backdrop);
      }
    });
  }
  
  // Function to render connection page
  function renderConnectionPage() {
    rootElement.innerHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-radius: 8px;">
        <h1 style="color: #4caf50;">MongoDB Client GUI</h1>
        <p style="color: #555;">Connect to your MongoDB database to start exploring and managing your data.</p>
        
        <div style="margin: 20px 0;">
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px;">Connection Name</label>
            <input id="connectionName" type="text" placeholder="My MongoDB Connection" 
                   style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          </div>
          
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px;">Connection String</label>
            <input id="connectionString" type="text" placeholder="mongodb://localhost:27017" 
                   style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          </div>
          
          <div id="errorMessage" style="color: #f44336; margin: 10px 0;"></div>
          
          <button id="connectButton" 
                  style="background: #4caf50; color: white; border: none; padding: 10px 20px; 
                         border-radius: 4px; cursor: pointer; font-size: 14px; width: 100%;">
            Connect
          </button>
        </div>
        
        <div id="savedConnections" style="margin-top: 30px;">
          <h2 style="font-size: 18px; color: #333;">Saved Connections</h2>
          <div id="connectionsList"></div>
        </div>
      </div>
    `;
    
    // Reset variables
    const connectButton = document.getElementById('connectButton');
    const connectionNameInput = document.getElementById('connectionName');
    const connectionStringInput = document.getElementById('connectionString');
    const errorMessageDiv = document.getElementById('errorMessage');
    const connectionsListDiv = document.getElementById('connectionsList');
    
    // Load saved connections
    loadSavedConnections();
    
    connectButton.addEventListener('click', async function() {
      const connectionName = connectionNameInput.value || 'MongoDB Connection';
      const connectionString = connectionStringInput.value;
      
      if (!connectionString) {
        errorMessageDiv.textContent = 'Connection string is required';
        return;
      }
      
      connectButton.textContent = 'Connecting...';
      connectButton.disabled = true;
      errorMessageDiv.textContent = '';
      
      try {
        const result = await window.electron.connectToMongoDB(connectionString, connectionName);
        
        if (result.success) {
          // Store connection info
          appState.activeConnection = {
            id: result.id,
            name: connectionName,
            connectionString: connectionString,
            databases: result.databases
          };
          // Navigate to database view
          renderDatabaseView();
        } else {
          errorMessageDiv.textContent = result.error || 'Failed to connect';
        }
      } catch (err) {
        errorMessageDiv.textContent = err.message || 'An unexpected error occurred';
      } finally {
        connectButton.textContent = 'Connect';
        connectButton.disabled = false;
      }
    });
  }
  
  // Initialize with connection page
  // renderConnectionPage();
  
  async function loadSavedConnections() {
    try {
      const result = await window.electron.getSavedConnections();
      
      if (result.success && result.connections && result.connections.length > 0) {
        const connectionItems = result.connections.map(conn => `
          <div style="border: 1px solid #ddd; border-radius: 4px; padding: 10px; margin-bottom: 10px;">
            <h3 style="margin: 0 0 5px 0;">${conn.name}</h3>
            <p style="margin: 0 0 10px 0; font-size: 12px; color: #666; word-break: break-all;">
              ${conn.connectionString}
            </p>
            <div>
              <button class="connect-btn" data-id="${conn.id}" data-conn="${conn.connectionString}" data-name="${conn.name}"
                      style="background: #4caf50; color: white; border: none; padding: 5px 10px; 
                             border-radius: 4px; cursor: pointer; font-size: 12px; margin-right: 5px;">
                Connect
              </button>
              <button class="delete-btn" data-id="${conn.id}"
                      style="background: #f44336; color: white; border: none; padding: 5px 10px; 
                             border-radius: 4px; cursor: pointer; font-size: 12px;">
                Delete
              </button>
            </div>
          </div>
        `).join('');
        
        connectionsListDiv.innerHTML = connectionItems;
        
        // Add event listeners
        document.querySelectorAll('.connect-btn').forEach(btn => {
          btn.addEventListener('click', async function() {
            const id = this.getAttribute('data-id');
            const connString = this.getAttribute('data-conn');
            const name = this.getAttribute('data-name');
            
            try {
              const result = await window.electron.connectToMongoDB(connString, name);
              
              if (result.success) {
                // Store connection info
                appState.activeConnection = {
                  id: result.id,
                  name: name,
                  connectionString: connString,
                  databases: result.databases
                };
                // Navigate to database view
                renderDatabaseView();
              } else {
                errorMessageDiv.textContent = result.error || 'Failed to connect';
              }
            } catch (err) {
              errorMessageDiv.textContent = err.message || 'An unexpected error occurred';
            }
          });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
          btn.addEventListener('click', async function() {
            const id = this.getAttribute('data-id');
            
            if (confirm('Are you sure you want to delete this connection?')) {
              try {
                const result = await window.electron.deleteConnection(id);
                
                if (result.success) {
                  loadSavedConnections(); // Refresh the list
                }
              } catch (err) {
                console.error('Failed to delete connection:', err);
              }
            }
          });
        });
      } else {
        connectionsListDiv.innerHTML = '<p style="color: #666;">No saved connections</p>';
      }
    } catch (err) {
      connectionsListDiv.innerHTML = `<p style="color: #f44336;">Error loading connections: ${err.message}</p>`;
    }
  }
});
