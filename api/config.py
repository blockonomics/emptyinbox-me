from flask import Flask
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.debug = True
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///emptyinbox.db'
db = SQLAlchemy(app)
