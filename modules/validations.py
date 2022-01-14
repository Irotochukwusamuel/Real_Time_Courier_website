import json
import uuid

import config
import os
import random
from PIL import Image
from flask import request
from werkzeug.utils import secure_filename
from modules.database import db


class Validation:

    def __init__(self):
        self.cursor = db.cursor(buffered=True)

    def insert_datas(self, login_cookie, Track_ID, receiver_name, receiver_phone, start_date, end_date,
                     origin_country,
                     destination_country, product_photo, product_name, product_address, delivery_price):
        sql = "insert into product (login_cookie,Track_ID,receiver_name,receiver_phone,start_date,end_date,origin_country,destination_country,product_photo,product_name,product_address,delivery_price) values(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)"
        val = (login_cookie, Track_ID, receiver_name, receiver_phone, start_date, end_date,
               origin_country,
               destination_country, product_photo, product_name, product_address, delivery_price,)
        self.cursor.execute(sql, val)
        db.commit()
        if self.cursor.rowcount == 1:
            return True
        else:
            return False

    def check_TrackID_exits(self, track_ID) -> bool:
        sql = "select count(*) from product where Track_ID = %s "
        add = (track_ID,)
        self.cursor.execute(sql, add)
        result = self.cursor.fetchone()
        for x in result:
            if x > 0:
                return True
            else:
                return False

    def login_user(self, username, password):
        if password == self.check_user_exits(username):
            return True
        else:
            return False

    def check_user_exits(self, username) -> bool:
        sql = "select password from users where username=%s"
        val = (username,)
        self.cursor.execute(sql, val)
        result = self.cursor.fetchone()
        if result is not None:
            for pwd in result:
                return pwd
            else:
                return False

    def Get_ALL_Product(self):
        sql = "select * from product"
        self.cursor.execute(sql)
        result = self.cursor.fetchall()
        data = []
        for x in result:
            res = {
                "track_ID": x[2],
                "receiver_name": x[3],
                "receiver_phone": x[4],
                "start_date": x[5],
                "end_date": x[6],
                "origin_country": x[7],
                "destination_country": x[8],
                "product_photo": x[9],
                "product_name": x[10],
                "product_address": x[11],
                "delivery_price": x[12],
                "id": x[0],
                "distance": x[13]
            }
            data.append(res)
        return data

    def get_product(self, track_ID, login_Cookie):
        track_ID = str(track_ID)
        if self.check_TrackID_exits(track_ID):
            sql = 'select * from product where login_cookie=%s'
            val = (login_Cookie,)
            self.cursor.execute(sql, val)
            result = self.cursor.fetchall()
            if result is not None:
                for x in result:
                    return {
                        "track_ID": x[2],
                        "receiver_name": x[3],
                        "reciever_phone": x[4],
                        "start_date": x[5],
                        "end_date": x[6],
                        "origin_country": x[7],
                        "destination_country": x[8],
                        "product_photo": x[9],
                        "product_name": x[10],
                        "product_address": x[11],
                        "delivery_price": x[12],
                        "distance": x[13]
                    }
            else:
                return False
        else:
            return False

    @staticmethod
    def get_cookie_id(data):
        data = str(data)
        if get := request.cookies.get(data):
            return str(get)
        else:
            return False

    def is_loggedIn(self):
        saved_trackID = self.get_cookie_id('track_id')
        if saved_trackID:
            sql = "select Track_ID from product where login_cookie=%s"
            val = (saved_trackID,)
            self.cursor.execute(sql, val)
            result = self.cursor.fetchone()
            return result
        else:
            return False

    def is_Admin(self):
        saved_ = self.get_cookie_id("user")
        if saved_:
            sql = "select username from users where loginCookie=%s"
            val = (saved_,)
            self.cursor.execute(sql, val)
            result = self.cursor.fetchone()
            if result is not None:
                return result
        return False

    @staticmethod
    def allowed_image(filename):
        if "." not in filename:
            return False

        ext = filename.rsplit(".", 1)[1]
        if ext.upper() in ["JPEG", "JPG", "PNG", "GIF"]:
            return True
        else:
            return False

    @staticmethod
    def compress_Image(ticketID, name):
        profile = Image.open(config.basedir + "/static/upload/" + ticketID + "/" + name)
        profile = profile.resize((300, 300), Image.ANTIALIAS)
        profile.save(config.basedir + "/static/upload/" + ticketID + "/" + name, optimize=True, quality=75)

    def validate_photo(self, ticket_ID, image_name, image_type):
        for file in request.files.getlist(image_name):
            if file.filename == "":
                return "file has no name"

            if self.allowed_image(file.filename):
                filename = secure_filename(file.filename)
                split_file = filename.rsplit(".")
                if image_type == "profile":
                    filename = "profile" + '.' + split_file[1]
                elif image_type == "product":
                    filename = "product" + '.' + split_file[1]

                if not os.path.exists(os.path.join(config.basedir, config.image_save_location + ticket_ID)):
                    os.mkdir(os.path.join(config.basedir, config.image_save_location + ticket_ID))

                file.save(os.path.join(config.basedir, config.image_save_location + ticket_ID, filename))
                self.compress_Image(ticket_ID, filename)
                return filename

    def generate_ticket_ID(self):
        while True:
            num = random.randrange(1000000, 9999999)
            gen_ID = "DXL-" + str(num)
            sql = "select Track_ID from product"
            self.cursor.execute(sql)
            result = self.cursor.fetchall()
            get_DB_ids = []
            for x in result:
                get_DB_ids.append(x[0])
            if gen_ID in get_DB_ids:
                continue
            else:
                return gen_ID

    def update_distance(self, distance, track_ID):
        sql = "update product set distance=%s where Track_ID=%s"
        val = (distance, track_ID)
        self.cursor.execute(sql, val)
        db.commit()
        if self.cursor.rowcount == 1:
            return True
        else:
            return False

    def update_alert(self, alert, track_ID):
        rand = str(uuid.uuid4().node)[:-5]
        sql = "update product set alert=%s,rand=%s where Track_ID=%s"
        val = (alert, rand, track_ID)
        self.cursor.execute(sql, val)
        db.commit()
        if self.cursor.rowcount == 1:
            return True
        else:
            return False

    def fetch_alert(self, track_id):
        sql = "select alert from product where Track_ID=%s"
        val = (track_id,)
        self.cursor.execute(sql, val)
        res_ = self.cursor.fetchone()
        if res_ is None:
            return "empty"
        else:
            return res_[0]

    def update_route(self, track_id, location, status_, date_, time_):
        if sql := "select route from product where Track_ID=%s":
            val = (track_id,)
            self.cursor.execute(sql, val)
            res_ = self.cursor.fetchone()
            if len(res_) <= 0 or res_[0] == "":
                data_ = json.dumps({"route": [
                    {"location": location, "status": status_, "date": date_, "time": time_}]
                })
                sql = "update product set route=%s where Track_ID=%s"
                val = (data_, track_id,)
                self.cursor.execute(sql, val)
                db.commit()
                if self.cursor.rowcount == 1:
                    return True
            else:
                result = res_
                unwrapData = json.loads(result[0])
                if data_ := {"location": location, "status": status_, "date": date_, "time": time_}:
                    unwrapData["route"].append(data_)
                    wrapData = json.dumps({"route": unwrapData["route"]})
                    sql = "update product set route=%s where Track_ID=%s"
                    val = (wrapData, track_id)
                    self.cursor.execute(sql, val)
                    db.commit()
                    if self.cursor.rowcount == 1:
                        return True

    def get_routes(self, login_Cookie):
        sql = 'select route from product where login_cookie=%s'
        val = (login_Cookie,)
        self.cursor.execute(sql, val)
        result = self.cursor.fetchone()[0]
        if result != "":
            data = json.loads(result)
            message = data["route"]
            wrapper = []
            for x in message:
                details = {
                    "location": x['location'],
                    "status": x['status'],
                    "date": x["date"],
                    "time": x["time"]
                }
                wrapper.append(details)
            return wrapper
        else:
            return ""

