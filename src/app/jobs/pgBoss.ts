import PgBoss from 'pg-boss';

const boss = new PgBoss({
  connectionString: process.env.DATABASE_URL,
  // You can add additional pg-boss configuration options here
});

console.log('boss initialized with DATABASE_URL:', process.env.DATABASE_URL);

export default boss;



