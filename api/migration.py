import sqlite3

DB_PATH = "instance/emptyinbox.db"

def migrate_for_passkey_support():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Clean up any leftover tables from previous migration attempts
    cur.execute("DROP TABLE IF EXISTS users_new;")
    cur.execute("DROP TABLE IF EXISTS user_sessions_new;")

    # --- USERS table - Add username and created_at columns ---
    cur.execute('''
        CREATE TABLE users_new (
            user_id VARCHAR(255) NOT NULL,
            username VARCHAR(255) UNIQUE NOT NULL,
            api_key VARCHAR(250) NOT NULL UNIQUE,
            inbox_quota INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id)
        );
    ''')
    
    # Migrate existing users with placeholder usernames
    cur.execute('''
        INSERT INTO users_new (user_id, username, api_key, inbox_quota, created_at)
        SELECT 
            user_id, 
            'user_' || substr(user_id, 1, 8) || '_' || rowid AS username,
            api_key, 
            inbox_quota,
            datetime('now')
        FROM users;
    ''')
        
    cur.execute('DROP TABLE users;')
    cur.execute('ALTER TABLE users_new RENAME TO users;')

    # --- USER_SESSIONS table - Change address to user_id ---
    cur.execute('''
        CREATE TABLE user_sessions_new (
            token VARCHAR NOT NULL,
            user_id VARCHAR(255) NOT NULL,
            login_time INTEGER NOT NULL,
            expires_at DATETIME NOT NULL,
            PRIMARY KEY (token),
            FOREIGN KEY (user_id) REFERENCES users (user_id)
        );
    ''')
    
    # Migrate existing sessions
    cur.execute('''
        INSERT INTO user_sessions_new (token, user_id, login_time, expires_at)
        SELECT token, address, login_time, expires_at FROM user_sessions;
    ''')
    
    cur.execute('DROP TABLE user_sessions;')
    cur.execute('ALTER TABLE user_sessions_new RENAME TO user_sessions;')

    # --- Create PASSKEY_CREDENTIALS table ---
    cur.execute('''
        CREATE TABLE passkey_credentials (
            credential_id VARCHAR(1000) NOT NULL,
            user_id VARCHAR(255) NOT NULL,
            public_key TEXT NOT NULL,
            counter INTEGER DEFAULT 0,
            device_type VARCHAR(50),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_used DATETIME,
            PRIMARY KEY (credential_id),
            FOREIGN KEY (user_id) REFERENCES users (user_id)
        );
    ''')

    # --- Create PASSKEY_CHALLENGES table ---
    cur.execute('''
        CREATE TABLE passkey_challenges (
            challenge_id VARCHAR(255) NOT NULL,
            username VARCHAR(255) NOT NULL,
            challenge VARCHAR(1000) NOT NULL,
            operation_type VARCHAR(20) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME NOT NULL,
            PRIMARY KEY (challenge_id)
        );
    ''')

    # Create indexes for better performance
    cur.execute('CREATE INDEX idx_users_username ON users(username);')
    cur.execute('CREATE INDEX idx_passkey_creds_user_id ON passkey_credentials(user_id);')
    cur.execute('CREATE INDEX idx_passkey_challenges_username ON passkey_challenges(username);')
    cur.execute('CREATE INDEX idx_passkey_challenges_expires ON passkey_challenges(expires_at);')

    conn.commit()
    conn.close()
    print("Migration completed successfully!")
    print("Note: Existing users have been given placeholder usernames like 'user_12345678'")
    print("You may want to update these to actual usernames as needed.")

if __name__ == "__main__":
    migrate_for_passkey_support()