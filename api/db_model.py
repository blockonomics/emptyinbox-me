from config import db
class Message(db.Model):
    id = db.Column(db.String(16), primary_key=True)
    inbox = db.Column(db.String(250), index=True)
    timestamp = db.Column(db.BigInteger)
    content = db.Column(db.BLOB(8<<20))

class Inbox(db.Model):
    api_key = db.Column(db.String(250), primary_key=True)
    inbox = db.Column(db.String(250), primary_key=True)


def main():
    from config import app, db
    with app.app_context():
        db.create_all()

if __name__=="__main__":
  main()

