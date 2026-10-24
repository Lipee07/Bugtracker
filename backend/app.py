import os

from flask import Flask, jsonify, request, session
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.exc import IntegrityError
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv

# Load settings from the .env file
load_dotenv()

# Create the Flask application
app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("FLASK_SECRET_KEY")

app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = False  # Local HTTP development only

# Allow the React frontend to communicate with Flask
CORS(
    app,
    origins=["http://localhost:5173"],
    supports_credentials=True
)

# Read database settings from environment variables
db_host = os.getenv("DB_HOST", "localhost")
db_port = os.getenv("DB_PORT", "3306")
db_name = os.getenv("DB_NAME", "bugtrack_db")
db_user = os.getenv("DB_USER", "root")
db_password = os.getenv("DB_PASSWORD", "")

# Configure the MySQL database connection
app.config["SQLALCHEMY_DATABASE_URI"] = (
    f"mysql+pymysql://{db_user}:{db_password}"
    f"@{db_host}:{db_port}/{db_name}"
)

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Create the database object
db = SQLAlchemy(app)


# Create a simple table to test the database connection
class Bug(db.Model):
    __tablename__ = "bugs"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    priority = db.Column(db.String(20), default="Medium")
    status = db.Column(db.String(30), default="Open")

    project_id = db.Column(
        db.Integer,
        db.ForeignKey("projects.id", ondelete="SET NULL"),
        nullable=True
    )

class Project(db.Model):
    __tablename__ = "projects"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(
        db.DateTime,
        server_default=db.func.current_timestamp()
    )

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(
        db.String(255),
        unique=True,
        nullable=False,
        index=True
    )
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(
        db.DateTime,
        server_default=db.func.current_timestamp()
    )

# Register a new user
@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not name or not email or not password:
        return jsonify({
            "message": "Name, email, and password are required."
        }), 400

    if len(name) > 100:
        return jsonify({
            "message": "Name must be 100 characters or fewer."
        }), 400

    if len(email) > 255 or "@" not in email:
        return jsonify({
            "message": "Please enter a valid email address."
        }), 400

    if len(password) < 8:
        return jsonify({
            "message": "Password must contain at least 8 characters."
        }), 400

    if User.query.filter_by(email=email).first():
        return jsonify({
            "message": "An account with this email already exists."
        }), 409

    user = User(
        name=name,
        email=email,
        password_hash=generate_password_hash(password)
    )

    try:
        db.session.add(user)
        db.session.commit()

        return jsonify({
            "message": "Account created successfully!"
        }), 201

    except IntegrityError:
        db.session.rollback()
        return jsonify({
            "message": "An account with this email already exists."
        }), 409

    except Exception:
        db.session.rollback()
        app.logger.exception("Registration failed")
        return jsonify({
            "message": "Could not create the account."
        }), 500

# Login an existing user
@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({
            "message": "Email and password are required."
        }), 400

    user = User.query.filter_by(email=email).first()

    if user is None or not check_password_hash(
        user.password_hash, password
    ):
        return jsonify({
            "message": "Invalid email or password."
        }), 401

    session.clear()
    session["user_id"] = user.id

    return jsonify({
        "message": "Login successful!",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email
        }
    }), 200

# Get the logged-in user's account details
@app.route("/api/account", methods=["GET"])
def get_account():
    user_id = session.get("user_id")

    if not user_id:
        return jsonify({
            "message": "Please log in first."
        }), 401

    user = db.session.get(User, user_id)

    if user is None:
        session.clear()
        return jsonify({
            "message": "Account not found."
        }), 404

    return jsonify({
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "created_at": (
                user.created_at.isoformat()
                if user.created_at else None
            )
        }
    }), 200

# Log out the current user
@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()

    return jsonify({
        "message": "Logged out successfully."
    }), 200

# Homepage
@app.route("/")
def home():
    return jsonify({
        "message": "Welcome to BugTrack!",
        "status": "Backend is running"
    })


# Health check
@app.route("/api/health")
def health():
    return jsonify({
        "status": "success",
        "message": "BugTrack API is working!"
    })


# Database connection check
@app.route("/api/db-health")
def database_health():
    try:
        db.session.execute(db.text("SELECT 1"))

        return jsonify({
            "status": "success",
            "message": "MySQL database connected successfully!"
        })

    except Exception:
        app.logger.exception("Database health check failed")

        return jsonify({
            "status": "error",
            "message": "Could not connect to MySQL. Check your configuration."
        }), 500

# API to get all bugs
@app.route("/api/bugs", methods=["GET"])
def get_bugs():
    bugs = Bug.query.order_by(Bug.id.desc()).all()

    return jsonify([
        {
            "id": bug.id,
            "title": bug.title,
            "description": bug.description,
            "priority": bug.priority,
            "status": bug.status,
            "project_id": bug.project_id
        }
        for bug in bugs
    ])


# API to create a new bug
@app.route("/api/bugs", methods=["POST"])
def create_bug():
    data = request.get_json() or {}

    title = data.get("title", "").strip()
    description = data.get("description", "").strip()
    priority = data.get("priority", "Medium")
    project_id = data.get("project_id")

    if not title or not description:
        return jsonify({
            "error": "Title and description are required."
        }), 400

    if len(title) > 200:
        return jsonify({
            "error": "Title cannot exceed 200 characters."
        }), 400

    if len(description) > 5000:
        return jsonify({
        "error": "Description cannot exceed 5000 characters."
    }), 400

    if priority not in ["Low", "Medium", "High", "Critical"]:
        return jsonify({
            "error": "Invalid priority."
        }), 400

    if project_id not in [None, ""]:
        try:
            project_id = int(project_id)
        except (ValueError, TypeError):
            return jsonify({
                "error": "Invalid project ID."
            }), 400

        project = db.session.get(Project, project_id)

        if project is None:
            return jsonify({
                "error": "Selected project does not exist."
            }), 400
    else:
        project_id = None

    bug = Bug(
        title=title,
        description=description,
        priority=priority,
        status="Open",
        project_id=project_id
    )

    db.session.add(bug)
    db.session.commit()

    return jsonify({
        "message": "Bug created successfully!",
        "id": bug.id,
        "title": bug.title,
        "description": bug.description,
        "priority": bug.priority,
        "status": bug.status,
        "project_id": bug.project_id
    }), 201

# Update bug status
@app.route("/api/bugs/<int:bug_id>/status", methods=["PATCH"])
def update_bug_status(bug_id):
    data = request.get_json(silent=True) or {}
    status = data.get("status", "")

    allowed_statuses = ["Open", "In Progress", "Resolved", "Closed"]

    if status not in allowed_statuses:
        return jsonify({
            "error": "Invalid status."
        }), 400

    bug = db.session.get(Bug, bug_id)

    if bug is None:
        return jsonify({
            "error": "Bug not found."
        }), 404

    try:
        bug.status = status
        db.session.commit()

        return jsonify({
            "message": "Bug status updated successfully!",
            "id": bug.id,
            "status": bug.status
        }), 200

    except Exception:
        db.session.rollback()
        app.logger.exception("Failed to update bug status")

        return jsonify({
            "error": "Could not update bug status."
        }), 500


# Delete a bug
@app.route("/api/bugs/<int:bug_id>", methods=["DELETE"])
def delete_bug(bug_id):
    bug = db.session.get(Bug, bug_id)

    if bug is None:
        return jsonify({
            "error": "Bug not found."
        }), 404

    try:
        db.session.delete(bug)
        db.session.commit()

        return jsonify({
            "message": "Bug deleted successfully!"
        }), 200

    except Exception:
        db.session.rollback()
        app.logger.exception("Failed to delete bug")

        return jsonify({
            "error": "Could not delete bug."
        }), 500

# Get all projects
@app.route("/api/projects", methods=["GET"])
def get_projects():
    projects = Project.query.order_by(Project.id.desc()).all()

    return jsonify([
        {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "created_at": (
                project.created_at.isoformat()
                if project.created_at else None
            )
        }
        for project in projects
    ])


# Create a project
@app.route("/api/projects", methods=["POST"])
def create_project():
    from flask import request

    data = request.get_json(silent=True) or {}

    name = data.get("name", "").strip()
    description = data.get("description", "").strip()

    if not name:
        return jsonify({
            "error": "Project name is required."
        }), 400

    if len(name) > 150:
        return jsonify({
            "error": "Project name must be 150 characters or fewer."
        }), 400

    project = Project(
        name=name,
        description=description
    )

    try:
        db.session.add(project)
        db.session.commit()

        return jsonify({
            "message": "Project created successfully!",
            "project": {
                "id": project.id,
                "name": project.name,
                "description": project.description,
                "created_at": (
                    project.created_at.isoformat()
                    if project.created_at else None
                )
            }
        }), 201

    except Exception:
        db.session.rollback()
        app.logger.exception("Failed to create project")

        return jsonify({
            "error": "Could not create the project."
        }), 500

# Start the application
if __name__ == "__main__":
    with app.app_context():
        db.create_all()

    app.run(debug=True, port=5000)