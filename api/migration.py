import sqlite3

DB_PATH = "instance/emptyinbox.db"

def migrate_passkey_challenges():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Challenges are short-lived, so rebuilding the table is cheap - but only
    # do it when the schema is actually stale. This runs on every deploy.
    cur.execute("PRAGMA table_info(passkey_challenges);")
    columns = {row[1] for row in cur.fetchall()}
    if columns and 'operation_type' in columns:
        conn.close()
        print("Migration skipped: passkey_challenges already current.")
        return

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


def migrate_btc_payments():
    """Create the BTC payment tables. Additive - the USDT payment_intents
    table is left alone."""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS btc_payment_intents (
            address           VARCHAR(64) NOT NULL,
            user_id           VARCHAR(255) NOT NULL,
            bundle            VARCHAR(32) NOT NULL,
            quota             INTEGER NOT NULL,
            usd_amount        INTEGER NOT NULL,
            expected_satoshis BIGINT NOT NULL,
            received_satoshis BIGINT NOT NULL DEFAULT 0,
            status            VARCHAR(1) NOT NULL DEFAULT '0',
            credited          BOOLEAN NOT NULL DEFAULT 0,
            settled           BOOLEAN NOT NULL DEFAULT 0,
            revoked           BOOLEAN NOT NULL DEFAULT 0,
            txid              VARCHAR(66),
            created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at        DATETIME NOT NULL,
            credited_at       DATETIME,
            PRIMARY KEY (address)
        );
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_btc_intents_user ON btc_payment_intents(user_id);")

    # Composite key: one transaction can pay several of our addresses, and each
    # (txid, addr, status) is delivered once on success plus retries.
    cur.execute("""
        CREATE TABLE IF NOT EXISTS payment_callbacks (
            txid     VARCHAR(66) NOT NULL,
            addr     VARCHAR(64) NOT NULL,
            status   VARCHAR(1) NOT NULL,
            value    BIGINT,
            crypto   VARCHAR(8),
            seen_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (txid, addr, status)
        );
    """)

    conn.commit()
    conn.close()
    print("Migration completed: btc_payment_intents and payment_callbacks created.")


def main():
    """Every migration is idempotent, so a deploy runs the whole set."""
    migrate_passkey_challenges()
    migrate_btc_payments()


if __name__ == "__main__":
    main()
