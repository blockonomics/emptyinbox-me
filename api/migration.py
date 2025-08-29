import sqlite3

DB_PATH = "instance/emptyinbox.db"

def migrate_users_and_payment_intents():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # --- USERS table ---
    cur.execute('''
        CREATE TABLE users_new (
            user_id VARCHAR(255) NOT NULL,
            api_key VARCHAR(250) NOT NULL UNIQUE,
            inbox_quota INTEGER,
            PRIMARY KEY (user_id)
        );
    ''')
    cur.execute('''
        INSERT INTO users_new (user_id, api_key, inbox_quota)
        SELECT eth_account, api_key, inbox_quota FROM users;
    ''')
    cur.execute('DROP TABLE users;')
    cur.execute('ALTER TABLE users_new RENAME TO users;')

    # --- PAYMENT_INTENTS table ---
    cur.execute('''
        CREATE TABLE payment_intents_new (
            txhash VARCHAR(66) NOT NULL,
            user_id VARCHAR(255) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            amount INTEGER,
            status VARCHAR(1) NOT NULL DEFAULT '0',
            PRIMARY KEY (txhash)
        );
    ''')
    cur.execute('''
        INSERT INTO payment_intents_new (txhash, user_id, created_at, amount, status)
        SELECT txhash, eth_account, created_at, amount, status FROM payment_intents;
    ''')
    cur.execute('DROP TABLE payment_intents;')
    cur.execute('ALTER TABLE payment_intents_new RENAME TO payment_intents;')

    conn.commit()
    conn.close()
    print("Migration completed successfully!")

if __name__ == "__main__":
    migrate_users_and_payment_intents()