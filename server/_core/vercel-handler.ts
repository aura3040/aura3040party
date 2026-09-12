import { createApp } from "./app";

// Vercel serverless entry. Frontend static files are served from dist/public.
export default await createApp({ serveFrontend: false });
