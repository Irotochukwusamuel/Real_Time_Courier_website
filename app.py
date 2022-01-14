from flask import Flask
from gevent.pywsgi import WSGIServer
from blueprints.index import index_bp
from blueprints.processors import processor_bp
from blueprints.ticket import ticket_bp
from blueprints.messages import message_bp

import traceback
from gevent import monkey

# monkey.patch_all()

app = Flask(__name__)
app.register_blueprint(index_bp)
app.register_blueprint(processor_bp)
app.register_blueprint(ticket_bp)
app.register_blueprint(message_bp)


@app.errorhandler(404)
def invalid_route(e):
    return "Page not found"


if __name__ == '__main__':
    app.run()
