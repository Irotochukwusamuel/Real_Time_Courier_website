import base64
import io
import os
import uuid

from PIL import Image
import config
import json
from modules.database import db


class Message:

    def __init__(self):
        self.cursor = db.cursor(buffered=True)

    def get_user(self, id):
        sql = "select receiver_name from product where login_cookie=%s"
        val = (id,)
        self.cursor.execute(sql, val)
        result = self.cursor.fetchone()
        return result

    def getReceiverID(self, sender):
        sql = "select receiver from message where sender=%s"
        val = (sender,)
        self.cursor.execute(sql, val)
        result = self.cursor.fetchone()
        if result is None:
            return False
        else:
            return result[0]

    def getSenderID(self, receiver):
        sql = "select sender from message where receiver=%s"
        val = (receiver,)
        self.cursor.execute(sql, val)
        result = self.cursor.fetchone()
        if result is None:
            return False
        else:
            return result[0]

    def sendMessage(self, sender, receiver, message, msg_type):

        if sql := "select conversation from message where (sender=%s and receiver=%s) OR (receiver=%s AND sender=%s)":
            val = (sender, receiver, sender, receiver)
            self.cursor.execute(sql, val)
            res_ = self.cursor.fetchall()
            if len(res_) <= 0:
                sql = "insert into message(sender,receiver,conversation) values (%s,%s,%s)"
                msg = json.dumps({"message": [
                    {"id": sender, "message": message, "delivered": False, "to": receiver, "type": msg_type}]
                })
                val = (sender, receiver, msg)
                self.cursor.execute(sql, val)
                db.commit()
                if self.cursor.rowcount == 1:
                    return True
            else:
                result = res_[0]
                unwrapData = json.loads(result[0])
                if data := {"id": sender, "message": message, "delivered": False, "to": receiver, "type": msg_type}:
                    unwrapData["message"].append(data)
                    wrapData = json.dumps({"message": unwrapData["message"]})
                    sql = "update message set conversation = %s where (sender=%s and receiver=%s) OR (receiver=%s AND sender=%s)"
                    val = (wrapData, sender, receiver, sender, receiver)
                    self.cursor.execute(sql, val)
                    db.commit()
                    if self.cursor.rowcount == 1:
                        return True

    def getMessageByUsers(self, sender, receiver):
        if sql := "select conversation from message where (sender=%s and receiver=%s) OR (receiver=%s AND sender=%s)":
            val = (sender, receiver, sender, receiver)
            self.cursor.execute(sql, val)
            result = self.cursor.fetchone()
            if result is not None:
                data = json.loads(result[0])
                message = data["message"]
                wrapper = []
                for x in message:
                    details = {
                        "senderID": x['id'],
                        "message": x['message'],
                        "type": x["type"],
                        "delivered": x["delivered"],
                        "path": self.check_file_DirectoryExist(sender, receiver)
                    }
                    wrapper.append(details)
                return wrapper
            else:
                return "empty"

    @staticmethod
    def check_file_DirectoryExist(sender, receiver):
        sender = sender.replace("#", '')
        receiver = receiver.replace("#", '')
        if os.path.exists(os.path.join(config.basedir, config.chat_save_location + str(sender + receiver))):
            return os.path.join(config.chat_save_location + str(sender + receiver))
        elif os.path.exists(os.path.join(config.basedir, config.chat_save_location + str(receiver + sender))):
            return os.path.join(config.chat_save_location + str(receiver + sender))

    def getLastMessage(self, sender, receiver):
        if sql := "select conversation from message where (sender=%s and receiver=%s) OR (receiver=%s AND sender=%s)":
            val = (sender, receiver, sender, receiver)
            wrapper = []
            try:
                self.cursor.execute(sql, val)
                res = self.cursor.fetchall()
                if len(res) > 0:
                    result = res[0]
                    data = json.loads(result[0])
                    message = data["message"]
                    for x in message:
                        if x["id"] == sender:
                            details = {
                                "senderID": x['id'],
                                "message": x['message'],
                                "type": x["type"],
                                "delivered": x["delivered"],
                                "path": self.check_file_DirectoryExist(sender, receiver)

                            }
                            wrapper.append(details)
                    if len(wrapper) <= 0:
                        return False
                    return [wrapper[-1]]
            except IndexError:
                return False

        return False

    def Messagedelivered(self, sender, receiver):
        if sql := "select conversation from message where (sender=%s and receiver=%s) OR (receiver=%s AND sender=%s)":
            val = (sender, receiver, sender, receiver)
            try:
                self.cursor.execute(sql, val)
                res = self.cursor.fetchall()[0]
                if len(res) > 0:
                    result = res[0]
                    data = json.loads(result)
                    message = data["message"]
                    msg = message
                    wrap = []
                    for x in msg:
                        if x["id"] == sender:
                            wrap.append(x)
                    if len(wrap) <= 0:
                        return False
                    wrap[-1]["delivered"] = True
                    msg = json.dumps({"message": message})
                    sql = "update message set conversation = %s where (sender=%s and receiver=%s) OR (receiver=%s AND sender=%s)"
                    val = (msg, sender, receiver, sender, receiver)
                    self.cursor.execute(sql, val)
                    db.commit()
                    if self.cursor.rowcount == 1:
                        return True
            except IndexError:
                return False

        return False

    def fetchUserChats(self, userID):
        if sql := "select conversation from message where (sender=%s) OR (receiver=%s)":
            val = (userID, userID)
            self.cursor.execute(sql, val)
            result = self.cursor.fetchall()
            if len(result) > 0:
                wrapper = []
                for x in result:
                    data = json.loads(x[0])["message"]
                    if data[0]["to"] == userID:
                        messages = {
                            "name": self.get_user(data[0]["id"]),
                            "msg": data[-1]["message"],
                            "delivered": data[-1]["delivered"],
                            "id": data[0]["id"],
                            "type": data[-1]["type"]
                        }
                    else:
                        messages = {
                            "name": self.get_user(data[0]["to"]),
                            "msg": data[-1]["message"],
                            "delivered": data[-1]["delivered"],
                            "id": data[0]["id"],
                            "type": data[-1]["type"]
                        }
                    wrapper.append(messages)
                return wrapper
            else:
                return "empty"

    def SaveChat_Image(self, image_data, user1, user2):
        im = Image.open(io.BytesIO(base64.b64decode(str(image_data))))
        im = im.resize((300, 300), Image.ANTIALIAS)
        image_name = str(uuid.uuid4().hex + ".png")

        if self.sendMessage(user1, user2, image_name, "image"):
            user1 = user1.replace("#", '')
            user2 = user2.replace("#", '')
            if not os.path.exists(
                    os.path.join(config.basedir,
                                 config.chat_save_location + str(user1 + user2))) and not os.path.exists(
                os.path.join(config.basedir, config.chat_save_location + str(user2 + user1))):
                os.mkdir(os.path.join(config.basedir, config.chat_save_location + str(user1 + user2)))

            if im.mode in ["RGBA", "P", "RGB"]:
                im.convert('RGB')
                im.save(os.path.join(config.basedir, self.check_file_DirectoryExist(user1, user2), image_name),
                        optimize=True, quality=75)
            return True
