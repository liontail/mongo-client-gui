# MongoDB Client GUI

A desktop application built with Electron and React for interacting with MongoDB databases.

## Features

- Connect to MongoDB instances
- Browse databases and collections
- View and query documents
- Execute custom MongoDB operations
- Save and manage connection strings

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/mongo-client.git
cd mongo-client

# Install dependencies
npm install
```

## Development

For development with hot reload:

```bash
npm run dev
```

This will start the webpack development server and launch Electron.

## Running the Application

To run the application without development mode:

```bash
npm start
```

## Building for Distribution

To build the application for distribution:

```bash
npm run build
```

To package the application for different platforms:

```bash
npm run package
```

## Using the Application

1. **Connecting to MongoDB**
   - Enter a connection string (e.g., `mongodb://localhost:27017`)
   - Provide a name for the connection
   - Click "Connect"

2. **Browsing Databases**
   - Select a database from the sidebar
   - View collections within the selected database

3. **Viewing Documents**
   - Click on a collection to view its documents
   - Use the search filter to query specific documents

4. **Running Queries**
   - Navigate to the Query Interface
   - Select a collection and operation type
   - Enter your query and click "Execute"

## Technologies Used

- Electron
- React
- MongoDB Node.js Driver
- Material-UI

## License

ISC
