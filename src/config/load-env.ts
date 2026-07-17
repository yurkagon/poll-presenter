import { config } from 'dotenv';

// Load variables from the project-local .env into process.env.
// Imported by both the Nest bootstrap and prisma.config.ts.
config();
