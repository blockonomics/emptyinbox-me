from flask import Flask
from flask_sqlalchemy import SQLAlchemy
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