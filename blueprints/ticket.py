from flask import Blueprint, render_template, request, make_response
from werkzeug.utils import secure_filename
import os, sys

import config
from modules.validations import Validation

ticket_bp = Blueprint("ticket_bp", __name__)
validate = Validation()


@ticket_bp.route('/addticket', methods=["GET", "POST"])
def addticket():
    if request.method == "POST":
        track_ID = validate.generate_ticket_ID()
        fullname = request.form['fullname']
        phone_number = request.form['phone_number']
        start_date = request.form['start_date']
        end_date = request.form['end_date']
        origin = request.form['origin']
        destination = request.form['destination']
        product_name = request.form['product_name']
        delivery_address = request.form['delivery_address']
        delivery_price = request.form['delivery_price']
        profile_photo = validate.validate_photo(track_ID, "profile_photo", "profile")
        product_photo = validate.validate_photo(track_ID, "product_photo", "product")

        if validate.insert_datas(track_ID + "###", track_ID, fullname, phone_number, start_date,
                                 end_date, origin,
                                 destination, product_photo, product_name, delivery_address, delivery_price):
            return "success"


@ticket_bp.route('/distance', methods=["GET", "POST"])
def distance():
    if request.method == "POST":
        if data := request.get_json():
            if validate.update_distance(data["distance"], data["track_ID"]):
                return "success"


@ticket_bp.route('/update-route', methods=["GET", "POST"])
def update_route():
    if request.method == "POST":
        location = config.sanitize_Html(request.form["location"])
        status = config.sanitize_Html(request.form["status"])
        date = config.sanitize_Html(request.form["date"])
        time = config.sanitize_Html(request.form["time"])
        track_id = validate.get_cookie_id('crx')

        if validate.update_route(track_id, location, status, date, time):
            return "success"


@ticket_bp.route('/update-alert', methods=["GET", "POST"])
def update_alert():
    if request.method == "POST":
        alert = config.sanitize_Html(request.form["alert_message"])
        track_id = validate.get_cookie_id('crx')

        if validate.update_alert(alert, track_id):
            return "success"


@ticket_bp.route('/fetch-alert', methods=["GET", "POST"])
def fetch_alert():
    track_id = validate.get_cookie_id('track_id')[:-3]
    if data := validate.fetch_alert(track_id):
        return data
