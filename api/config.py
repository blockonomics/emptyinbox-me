from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import logging
import os

app = Flask(__name__, instance_relative_config=True)
app.debug = True

db_path = os.path.join(app.instance_path, 'emptyinbox.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
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