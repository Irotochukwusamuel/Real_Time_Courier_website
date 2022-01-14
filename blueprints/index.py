from flask import Blueprint, render_template

index_bp = Blueprint("index_bp", __name__)


@index_bp.route('/')
def index():
    return render_template("index.html")


@index_bp.route('/about')
def about():
    return render_template("about.html")


@index_bp.route('/blog')
def blog():
    return render_template("blog.html")


@index_bp.route('/blog_details')
def blog_details():
    return render_template("blog_details.html")


@index_bp.route('/contact')
def contact():
    return render_template("contact.html")


@index_bp.route('/elements')
def elements():
    return render_template("elements.html")


@index_bp.route('/services')
def services():
    return render_template("services.html")


@index_bp.route('/site')
def site():
    return render_template("site.html")


