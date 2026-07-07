import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

// The app is now fully client-side Firebase (Firestore, Auth, Storage).
// This Express server only serves the built SPA (prod) or the Vite dev
// middleware (development). There are no REST/API routes anymore.
const app = express();
const PORT = 3000;

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

start();
