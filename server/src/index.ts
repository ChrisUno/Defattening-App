import express from 'express';
import cors from 'cors';
import session from 'express-session';
import connectSqlite3 from 'connect-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import sessionRoutes from './routes/sessions.js';
import participationRoutes from './routes/participations.js';
import weighInRoutes from './routes/weighIns.js';
import journalRoutes from './routes/journals.js';
import activityRoutes from './routes/activity.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SQLiteStore = connectSqlite3(session);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

app.use(session({
  store: new (SQLiteStore as any)({
    dir: path.join(__dirname, '..', 'data'),
    db: 'sessions.db',
  }),
  secret: 'defattening-secret-key-change-in-prod',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
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

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Defattening API running on http://localhost:${PORT}`);
});
