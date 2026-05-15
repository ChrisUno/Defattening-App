import express from 'express';
import cors from 'cors';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import pool from './db.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import sessionRoutes from './routes/sessions.js';
import participationRoutes from './routes/participations.js';
import weighInRoutes from './routes/weighIns.js';
import journalRoutes from './routes/journals.js';
import activityRoutes from './routes/activity.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PgStore = connectPgSimple(session);
const isProduction = process.env.NODE_ENV === 'production';

const app = express();
const PORT = process.env.PORT || 3001;

if (isProduction) {
  app.set('trust proxy', 1);
  if (process.env.CORS_ORIGIN) {
    app.use(cors({
      origin: process.env.CORS_ORIGIN,
      credentials: true,
    }));
  }
} else {
  app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }));
}

app.use(express.json());

app.use(session({
  store: new PgStore({
    pool,
    tableName: 'http_sessions',
    createTableIfMissing: false,
  }),
  secret: process.env.SESSION_SECRET || 'defattening-secret-key-change-in-prod',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/participations', participationRoutes);
app.use('/api/weigh-ins', weighInRoutes);
app.use('/api/journals', journalRoutes);
app.use('/api/activity', activityRoutes);

const distPath = path.join(__dirname, '..', '..', 'dist');
if (isProduction && fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Defattening server running on http://localhost:${PORT} (${isProduction ? 'production' : 'development'})`);
});
