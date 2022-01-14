import time, json

from flask import Blueprint, render_template, request, make_response, Response
import config
from modules.message import Message
from modules.validations import Validation

message_bp = Blueprint("message_bp", __name__)
message = Message()
validate = Validation()
admin = config.admin_id


def result(data):
    return {"data": data}


@message_bp.route('/fetchMessages', methods=["GET", "POST"])
def fetchMessages():
    if request.method == "POST":
        if data := request.get_json():
            if fetch := message.getMessageByUsers(data["id"], data["user"]):
                message.Messagedelivered(data["user"], validate.get_cookie_id('track_id'))
                return result(fetch)


@message_bp.route('/sendMessage', methods=["GET", "POST"])
def sendMessage():
    if request.method == "POST":
        if data := request.get_json():
            if data["type"] == "text":
                if message.sendMessage(data["id"], data["receiver"], data["message"], "text"):
                    return "success"
            elif data["type"] == "image":
                if message.SaveChat_Image(data["message"],  data["id"], data["receiver"]):
                    return "success"
    return "error"


@message_bp.route('/deliveredMessage', methods=["GET", "POST"])
def deliveredMessage():
    if request.method == "POST":
        if data := request.get_json():
            message.Messagedelivered(data["user"], validate.get_cookie_id('track_id'))
            return "success"


@message_bp.route('/chatlist', methods=["GET", "POST"])
def chatlist():
    if request.method == "POST":
        if data := message.fetchUserChats(validate.get_cookie_id('track_id')):
            return result(data)


@message_bp.route('/LastMessage')
def LastMessage():
    Response.expires = -1
    time.sleep(0.1)
    return Response('data:' + json.dumps(
        message.getLastMessage(validate.get_cookie_id('client_id'), validate.get_cookie_id('track_id'))) + '\n\n',
                    mimetype="text/event-stream")
