# CMBF System

[![bitHound Dev Dependencies](https://www.bithound.io/github/Covistra/covistra-core/badges/devDependencies.svg)](https://www.bithound.io/github/Covistra/covistra-core/master/dependencies/npm)
[![bitHound Dev Dependencies](https://www.bithound.io/github/Covistra/hapi-plugin-covistra-system/badges/devDependencies.svg)](https://www.bithound.io/github/Covistra/hapi-plugin-covistra-system/master/dependencies/npm)

## Micro Services

This plugin registers the following micro services:

### Router.loadRoutes
Load and register all routes (endpoints) located in the specified path. These routes will be automatically added to the server.

**Identifier**: ```{role:'system', target: 'router', action: 'load'}```

**Message**:
- **routePath**: The full path where to find all route.js files

### System.getStatus
Retrieve the current system status
**Identifier**: ```{role: 'system', target: 'status', action:'read'}```

## System.generateUniqueId
Generate a unique id of the specified length

**Identifier**: ```{role:'system', target: 'random', action: 'generate-unique-id'}```

**Message**:
- **length**: The length of the id to generate

**Response**:
- **id**: Tee generated id