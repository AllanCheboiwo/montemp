const pool = require('./pool'); // adjust path as needed

exports.createTables = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
  
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                name TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        

        await client.query(`
            CREATE TABLE IF NOT EXISTS tags (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                color TEXT DEFAULT '#3788d8',
                UNIQUE(user_id, name)
            );
        `);
        

        await client.query(`
            CREATE TABLE IF NOT EXISTS time_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                tag_id INTEGER REFERENCES tags(id) ON DELETE SET NULL,
                title TEXT NOT NULL,
                start_time TIMESTAMPTZ NOT NULL,
                end_time TIMESTAMPTZ NOT NULL,
                notes TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                CHECK (end_time > start_time)
            );
        `);
        
        

        await client.query(`CREATE INDEX IF NOT EXISTS idx_time_logs_user_id ON time_logs(user_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_time_logs_tag_id ON time_logs(tag_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_time_logs_start_time ON time_logs(start_time);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);`);
        
        await client.query('COMMIT');
        console.log('All tables created successfully');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Creating initial tables failed!', err.message);
        throw err;
    } finally {
        client.release();
    }
};
