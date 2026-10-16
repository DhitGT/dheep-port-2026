// These are technology concepts, not claims of proficiency or a single app's architecture.
export default {
  'JavaScript': {
    category: 'Language', summary: 'The language behind browser interactions and JavaScript server applications.',
    parts: [['Events', 'Respond to user actions and application events.'], ['Async / await', 'Coordinate asynchronous operations with promises.'], ['Modules', 'Organize reusable code with imports and exports.'], ['Data & logic', 'Transform data through functions, objects, and collections.']]
  },
  'TypeScript': {
    category: 'Language', summary: 'JavaScript with static types to make application contracts easier to check.',
    parts: [['Types', 'Describe the values a variable or function accepts.'], ['Interfaces', 'Define the shape of objects and service contracts.'], ['Generics', 'Reuse typed logic across different data structures.'], ['Narrowing', 'Refine types through checks and control flow.']]
  },
  'Vue.js': {
    category: 'Frontend', summary: 'A component framework for building reactive user interfaces.',
    parts: [['Components', 'Compose interfaces from reusable single-file components.'], ['Reactivity', 'Keep rendered UI in sync with reactive state.'], ['Composables', 'Share stateful logic with the Composition API.'], ['Props & emits', 'Pass data down and communicate events back up.']]
  },
  'Nuxt.js': {
    category: 'Application framework', summary: 'A Vue framework that brings routing, rendering, and server capabilities together.',
    parts: [['Pages & routes', 'Create application routes from the pages directory.'], ['Rendering', 'Use server rendering or client rendering as needed.'], ['Data fetching', 'Load application data with useFetch and useAsyncData.'], ['Server routes', 'Implement server endpoints through Nitro.']]
  },
  'SvelteKit': {
    category: 'Application framework', summary: 'An application framework built on Svelte for routing, data loading, and server interactions.',
    parts: [['Routing', 'Organize pages and layouts through file-based routes.'], ['Load functions', 'Prepare the data required by a route.'], ['Form actions', 'Handle form submissions on the server.'], ['Server endpoints', 'Expose request handlers through server route files.']]
  },
  'Laravel': {
    category: 'Backend', summary: 'A PHP framework for application APIs, business logic, and database integration.',
    parts: [['Routes', 'Map incoming HTTP requests to application handlers.'], ['Middleware', 'Apply request checks such as authentication.'], ['Validation', 'Validate incoming data before processing it.'], ['Eloquent', 'Query and model relational data through an ORM.']]
  },
  'Tailwind CSS': {
    category: 'Interface styling', summary: 'Utility classes for composing consistent layouts and visual styles.',
    parts: [['Layout', 'Compose flex, grid, spacing, and sizing utilities.'], ['Responsive UI', 'Adapt layouts at different viewport breakpoints.'], ['Interaction states', 'Style hover, focus, and other UI states.'], ['Theme', 'Reuse colors, typography, and spacing conventions.']]
  },
  'WebRTC': {
    category: 'Realtime media', summary: 'Browser APIs for exchanging realtime audio, video, and data.',
    parts: [['Media tracks', 'Represent individual audio and video streams.'], ['Peer connection', 'Negotiate and maintain realtime connections.'], ['ICE / STUN / TURN', 'Find network paths and relay traffic when needed.'], ['Data channels', 'Exchange application data over a peer connection.']]
  },
  'Socket.IO': {
    category: 'Realtime events', summary: 'A client and server library for bidirectional event communication.',
    parts: [['Events', 'Send named events and application payloads.'], ['Rooms', 'Group connections for targeted server broadcasts.'], ['Acknowledgements', 'Receive a reply to an emitted event.'], ['Reconnection', 'Attempt to reconnect after a connection interruption.']]
  },
  'SQLite': {
    category: 'Database', summary: 'An embedded SQL database; browser usage requires a WebAssembly build and a suitable persistence layer.',
    parts: [['SQL queries', 'Read and modify structured relational data.'], ['Transactions', 'Group changes so they commit or roll back together.'], ['Indexes', 'Improve lookup performance for suitable query patterns.'], ['Browser persistence', 'A WebAssembly build can store database files through an OPFS VFS.']]
  },
  'System Design': {
    category: 'Architecture', summary: 'Define how responsibilities, data, and communication fit together in a system.',
    parts: [['Service boundaries', 'Assign clear responsibilities to application layers.'], ['API contracts', 'Define request formats, responses, and errors.'], ['Data strategy', 'Choose storage, consistency, and synchronization behavior.'], ['Reliability', 'Plan retries, recovery, and failure handling.']]
  },
  'Node.js': {
    category: 'Runtime', summary: 'A JavaScript runtime for server applications and development tooling.',
    parts: [['Event loop', 'Schedule callbacks and asynchronous work.'], ['HTTP server', 'Handle incoming web requests and responses.'], ['Streams', 'Process data incrementally instead of loading it all at once.'], ['Modules', 'Organize server code and use package dependencies.']]
  },
  'REST APIs': {
    category: 'Application communication', summary: 'Resource-oriented HTTP interfaces connecting clients and application services.',
    parts: [['Resources', 'Address application resources through URLs.'], ['HTTP methods', 'Use methods such as GET, POST, PATCH, and DELETE.'], ['Representations', 'Exchange resource representations, commonly JSON.'], ['Status codes', 'Communicate success and failure through HTTP responses.']]
  },
  'PostgreSQL': {
    category: 'Database', summary: 'A relational database server for structured application data and transactional workloads.',
    parts: [['Tables & relations', 'Model records and their relationships.'], ['Constraints', 'Enforce data integrity with keys and validation rules.'], ['Transactions', 'Apply related changes as a single unit.'], ['Indexes', 'Support efficient access to frequently queried data.']]
  },
  'MySQL': {
    category: 'Database', summary: 'A relational database server commonly used behind web applications.',
    parts: [['Schema', 'Define tables, column types, and relationships.'], ['SQL queries', 'Read, join, and update application records.'], ['Transactions', 'Use a transactional engine such as InnoDB for atomic changes.'], ['Indexes', 'Improve access paths for queries and joins.']]
  },
  'Pinia': {
    category: 'State management', summary: 'Shared application state management for Vue, with Nuxt integration.',
    parts: [['Stores', 'Separate shared state by application responsibility.'], ['State', 'Hold reactive application values.'], ['Getters', 'Derive values from existing store state.'], ['Actions', 'Coordinate business logic and asynchronous updates.']]
  },
  'LiveKit': {
    category: 'Realtime media platform', summary: 'An SDK and server platform for realtime media sessions built on WebRTC.',
    parts: [['Rooms', 'Provide the shared space for a realtime session.'], ['Participants', 'Represent the people or agents connected to a room.'], ['Tracks', 'Publish and subscribe to audio and video.'], ['Access tokens', 'Authorize room access and participant permissions.']]
  },
  'IndexedDB': {
    category: 'Browser storage', summary: 'An asynchronous browser database for structured data and offline application state.',
    parts: [['Object stores', 'Organize records into named collections.'], ['Keys & indexes', 'Identify records and support additional lookup paths.'], ['Transactions', 'Scope related reads and writes to object stores.'], ['Schema upgrades', 'Change stores and indexes through database version upgrades.']]
  },
  'Web Workers': {
    category: 'Browser concurrency', summary: 'Run JavaScript work off the main UI thread and communicate through messages.',
    parts: [['Worker thread', 'Execute background logic without direct DOM access.'], ['Messages', 'Exchange data with the main thread through postMessage.'], ['Transferables', 'Transfer supported resources without cloning their contents.'], ['Lifecycle', 'Start workers when needed and terminate unused work.']]
  },
  'OPFS': {
    category: 'Browser storage', summary: 'Private file storage scoped to a website origin, useful for browser-side database files.',
    parts: [['Origin storage', 'Keep files isolated within the website origin.'], ['File handles', 'Access directories and files through browser APIs.'], ['Sync access', 'Use synchronous access handles inside dedicated workers.'], ['Quota & lifetime', 'Storage is subject to browser quotas and can be cleared by the user.']]
  }
}
