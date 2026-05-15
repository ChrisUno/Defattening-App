import pg from 'pg';

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'defattening',
  user: process.env.DB_USER || 'defattening',
  password: process.env.DB_PASSWORD || 'defattening',
});

export default pool;
