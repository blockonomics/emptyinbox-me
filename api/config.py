from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_apscheduler import APScheduler
from datetime import datetime, timedelta
import logging
import os

app = Flask(__name__, instance_relative_config=True)
app.debug = True

basedir = os.path.abspath(os.path.dirname(__file__))
instance_dir = os.path.join(basedir, 'instance')
db_path = os.path.join(instance_dir, 'emptyinbox.db')

# Ensure instance directory exists with proper permissions
os.makedirs(instance_dir, mode=0o755, exist_ok=True)

SQLALCHEMY_DATABASE_URI = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_DATABASE_URI'] = SQLALCHEMY_DATABASE_URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# --- Logging Configuration ---
if not app.debug:
    handler = logging.StreamHandler()
    handler.setLevel(logging.INFO)
    formatter = logging.Formatter('%(asctime)s [%(levelname)s] %(message)s')
    handler.setFormatter(formatter)
    app.logger.addHandler(handler)
    app.logger.setLevel(logging.INFO)

# --- Cleanup job ---
def delete_old_messages():
    from db_models import Message
    cutoff = int((datetime.utcnow() - timedelta(days=7)).timestamp())
    deleted = db.session.query(Message).filter(Message.timestamp < cutoff).delete()
    db.session.commit()
    if deleted:
        app.logger.info(f"Deleted {deleted} old messages")

# --- APScheduler config ---
class Config:
    SCHEDULER_API_ENABLED = True

app.config.from_object(Config)
scheduler = APScheduler()
scheduler.init_app(app)

# Run every 24 hours
scheduler.add_job(
    id='Delete Old Messages',
    func=delete_old_messages,
    trigger='interval',
    hours=24
)

scheduler.start()

