import sqlite3

DB_PATH = "instance/emptyinbox.db"

def migrate_passkey_challenges():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Drop the old table if it exists
    cur.execute("DROP TABLE IF EXISTS passkey_challenges;")

    # Create the new table with updated schema
    cur.execute("""
        CREATE TABLE passkey_challenges (
            challenge_id   VARCHAR(255) NOT NULL,
            username       VARCHAR(255),              -- only for registration
            credential_id  VARCHAR(1000),             -- only for authentication
            challenge      VARCHAR(1000) NOT NULL,    -- Base64url encoded challenge
            operation_type VARCHAR(20) NOT NULL,      -- "registration" or "authentication"
            created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at     DATETIME NOT NULL,
            PRIMARY KEY (challenge_id)
        );
    """)

    # Create indexes for both lookup paths
    cur.execute("CREATE INDEX idx_passkey_challenges_username ON passkey_challenges(username);")
    cur.execute("CREATE INDEX idx_passkey_challenges_credential_id ON passkey_challenges(credential_id);")
    cur.execute("CREATE INDEX idx_passkey_challenges_expires ON passkey_challenges(expires_at);")

    conn.commit()
    conn.close()
    print("Migration completed: passkey_challenges table updated.")

if __name__ == "__main__":
    migrate_passkey_challenges()