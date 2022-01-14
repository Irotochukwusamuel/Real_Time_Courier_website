from flask import Blueprint, render_template, request, make_response
import config
from modules.validations import Validation

processor_bp = Blueprint("processor_bp", __name__)
validate = Validation()


@processor_bp.route('/accessProduct', methods=["GET", "POST"])
def accessProduct():
    if request.method == "POST":
        track_ID = config.sanitize_Html(request.form['track_input']).strip()
        if validate.check_TrackID_exits(track_ID):
            return "exist"
        else:
            return "not-exist"


@processor_bp.route('/shipment', methods=["GET", "POST"])
def shipment():
    if validate.is_loggedIn():
        cookie = validate.get_cookie_id('track_id')
        data = validate.get_product(cookie[:-3], cookie)
        route = validate.get_routes(cookie)
        return render_template("signed_IN/shipment.html", data=data, loc=config.image_save_location, route=route)
    else:
        return render_template("index.html")


@processor_bp.route('/admin_login', methods=["GET", "POST"])
def admin_login():
    if request.method == "POST":
        username = config.sanitize_Html(request.form['username'])
        password = config.sanitize_Html(request.form['password'])
        if validate.login_user(username, password):
            return "success"
        else:
            return "failed"


@processor_bp.route('/logout', methods=["GET", "POST"])
def logout():
    res = make_response(render_template("index.html"))
    res.set_cookie("user", "", expires=0)
    res.set_cookie("track_id", "", expires=0)
    res.set_cookie("client_id", "", expires=0)
    return res


@processor_bp.route('/admin')
def admin():
    return render_template("admin/signup.html")


@processor_bp.route('/chigozie')
def chigozie():
    if validate.is_Admin():
        data = validate.Get_ALL_Product()
        return render_template("admin/index.html", data=data, loc=config.image_save_location)
    else:
        return render_template("admin/signup.html")


@processor_bp.route('/contact-message', methods=["GET", "POST"])
def contact_message():
    if request.method == "POST":
        name = config.sanitize_Html(request.form['name'])
        email = config.sanitize_Html(request.form['email'])
        subject = config.sanitize_Html(request.form['subject'])
        message = config.sanitize_Html(request.form['message'])
        if config.ContactUs(email, subject, message, name):
            return "success"
