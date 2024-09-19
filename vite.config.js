import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Allow access to the server from other devices on the network
    port: 3000, // Default port, change if needed
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'cert/localhost-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'cert/localhost.pem')),
    },
  },
  build: {
    outDir: 'dist', // Output directory for production builds
  },
})
