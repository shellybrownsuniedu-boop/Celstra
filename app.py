import os
from datetime import datetime, timezone
from flask import Flask, request, jsonify, send_from_directory, render_template, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename

# ---------------------------------------------------------
# App Setup & SQLite Database Configuration
# ---------------------------------------------------------
app = Flask(__name__, template_folder="templates")

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{os.path.join(BASE_DIR, 'starlog.db')}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["UPLOAD_FOLDER"] = os.path.join(BASE_DIR, "uploads")
app.config["MAX_CONTENT_LENGTH"] = 32 * 1024 * 1024  # 32MB max upload limit

# Ensure upload directory exists
os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

db = SQLAlchemy(app)

ALLOWED = {
    "image": {"png", "jpg", "jpeg", "gif", "webp"},
    "audio": {"mp3", "wav", "m4a", "ogg", "webm"},
    "video": {"mp4", "mov", "webm"},
}

def detect_media_type(filename: str):
    if not filename or "." not in filename:
        return None
    ext = filename.rsplit(".", 1)[-1].lower()
    for media_type, extensions in ALLOWED.items():
        if ext in extensions:
            return media_type
    return None


# ---------------------------------------------------------
# Database Tables
# ---------------------------------------------------------
class Mood(db.Model):
    __tablename__ = "moods"

    id = db.Column(db.Integer, primary_key=True)
    label = db.Column(db.String(30), unique=True, nullable=False)
    color = db.Column(db.String(10), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "label": self.label,
            "color": self.color,
        }


class Entry(db.Model):
    __tablename__ = "entries"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), default="Star Memory")
    text = db.Column(db.Text, nullable=False)
    date = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    intensity = db.Column(db.Integer, default=3)
    
    # Celestial Coordinate Vectors
    x = db.Column(db.Float, default=0.0)
    y = db.Column(db.Float, default=0.0)
    z = db.Column(db.Float, default=0.0)

    # Relationships & Media
    mood_id = db.Column(db.Integer, db.ForeignKey("moods.id"), nullable=False)
    mood = db.relationship("Mood", backref=db.backref("entries", lazy=True))
    media_path = db.Column(db.String(255), nullable=True)
    media_type = db.Column(db.String(20), nullable=True)
    voice_note_duration = db.Column(db.Float, nullable=True)
    is_favorite = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            "id": f"star-{self.id}",
            "db_id": self.id,
            "title": self.title,
            "content": self.text,
            "text": self.text,
            "date": self.date.isoformat() if self.date else datetime.now(timezone.utc).isoformat(),
            "mood": self.mood.label.lower() if self.mood else "joy",
            "moodIntensity": self.intensity,
            "intensity": self.intensity,
            "x": self.x,
            "y": self.y,
            "z": self.z,
            "photos": [f"/uploads/{os.path.basename(self.media_path)}"] if (self.media_path and self.media_type == "image") else [],
            "voiceNote": {
                "audioUrl": f"/uploads/{os.path.basename(self.media_path)}",
                "duration": self.voice_note_duration or 4.0,
                "recordedAt": self.date.isoformat() if self.date else None
            } if (self.media_path and self.media_type == "audio") else None,
            "media_url": f"/uploads/{os.path.basename(self.media_path)}" if self.media_path else None,
            "media_type": self.media_type,
            "isFavorite": bool(self.is_favorite),
        }


# ---------------------------------------------------------
# Seeding Initial Celestial Moods
# ---------------------------------------------------------
def seed_moods():
    if Mood.query.first():
        return
    moods = [
        Mood(label="Joy", color="#FFB800"),
        Mood(label="Serenity", color="#38BDF8"),
        Mood(label="Sad", color="#64748B"),
        Mood(label="Awful", color="#E11D48"),
        Mood(label="Anxious", color="#A855F7"),
        Mood(label="Hope", color="#2DD4BF"),
        Mood(label="Love", color="#FB7185"),
        Mood(label="Gratitude", color="#F59E0B"),
    ]
    db.session.add_all(moods)
    db.session.commit()

with app.app_context():
    db.create_all()
    seed_moods()


# ---------------------------------------------------------
# Static File & Upload Serving
# ---------------------------------------------------------
@app.route("/uploads/<path:filename>")
def uploaded_file(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)


# ---------------------------------------------------------
# Web HTML Routes (for Jinja Templates)
# ---------------------------------------------------------
@app.route("/")
def home():
    entries = Entry.query.order_by(Entry.date.desc()).all()
    moods = Mood.query.all()
    return render_template("entries.html", entries=entries, moods=moods)

@app.route("/new")
def new_entry_form():
    moods = Mood.query.all()
    return render_template("new_entry.html", moods=moods)

@app.route("/entries", methods=["POST"])
def create_entry_form():
    title = request.form.get("title") or request.form.get("name") or "Star Memory"
    text = request.form.get("text") or request.form.get("memory") or request.form.get("content") or ""
    mood_id = request.form.get("mood_id")

    if not text:
        return "Memory text is required", 400

    # Default to first mood if not supplied
    if not mood_id:
        first_mood = Mood.query.first()
        mood_id = first_mood.id if first_mood else 1

    media_path = None
    media_type = None

    file = request.files.get("media")
    if file and file.filename:
        detected = detect_media_type(file.filename)
        if detected:
            clean_name = secure_filename(file.filename)
            timestamp = int(datetime.now(timezone.utc).timestamp())
            unique_filename = f"{timestamp}_{clean_name}"
            save_path = os.path.join(app.config["UPLOAD_FOLDER"], unique_filename)
            file.save(save_path)
            media_path = save_path
            media_type = detected

    entry = Entry(
        title=title,
        text=text,
        mood_id=int(mood_id),
        media_path=media_path,
        media_type=media_type,
    )
    db.session.add(entry)
    db.session.commit()

    return redirect(url_for("home"))


# ---------------------------------------------------------
# REST API Endpoints (For React Frontend / Astro Synchronizer)
# ---------------------------------------------------------
@app.route("/api/moods", methods=["GET"])
def api_get_moods():
    moods = Mood.query.all()
    return jsonify([m.to_dict() for m in moods])

@app.route("/api/entries", methods=["GET"])
def api_get_entries():
    entries = Entry.query.order_by(Entry.date.desc()).all()
    return jsonify([e.to_dict() for e in entries])

@app.route("/api/entries", methods=["POST"])
def api_create_entry():
    data = request.get_json(silent=True) or request.form

    title = data.get("title") or data.get("name") or "Star Memory"
    text = data.get("text") or data.get("content") or data.get("memory") or ""
    mood_label = data.get("mood")
    mood_id = data.get("mood_id")
    intensity = data.get("intensity") or data.get("moodIntensity") or 4
    x = float(data.get("x", 0.0))
    y = float(data.get("y", 0.0))
    z = float(data.get("z", 0.0))

    if not text:
        return jsonify({"error": "Memory text is required"}), 400

    # Resolve mood_id from string label or integer
    if not mood_id and mood_label:
        matched_mood = Mood.query.filter(Mood.label.ilike(mood_label)).first()
        if matched_mood:
            mood_id = matched_mood.id

    if not mood_id:
        fallback = Mood.query.first()
        mood_id = fallback.id if fallback else 1

    media_path = None
    media_type = None

    if "media" in request.files:
        file = request.files["media"]
        if file and file.filename:
            detected = detect_media_type(file.filename)
            if detected:
                clean_name = secure_filename(file.filename)
                timestamp = int(datetime.now(timezone.utc).timestamp())
                unique_filename = f"{timestamp}_{clean_name}"
                save_path = os.path.join(app.config["UPLOAD_FOLDER"], unique_filename)
                file.save(save_path)
                media_path = save_path
                media_type = detected

    entry = Entry(
        title=title,
        text=text,
        mood_id=int(mood_id),
        intensity=int(intensity),
        x=x,
        y=y,
        z=z,
        media_path=media_path,
        media_type=media_type,
    )
    db.session.add(entry)
    db.session.commit()

    return jsonify(entry.to_dict()), 201

@app.route("/api/entries/bulk_sync", methods=["POST"])
def api_bulk_sync():
    """Bulk import or sync stars from the celestial React UI into SQLite."""
    data = request.get_json(silent=True) or []
    synced_count = 0

    for star in data:
        text = star.get("content") or star.get("text") or ""
        if not text:
            continue
        title = star.get("title") or "Star Memory"
        mood_label = star.get("mood") or "Joy"
        intensity = star.get("moodIntensity") or star.get("intensity") or 3
        x = float(star.get("x", 0.0))
        y = float(star.get("y", 0.0))
        z = float(star.get("z", 0.0))

        matched_mood = Mood.query.filter(Mood.label.ilike(mood_label)).first()
        mood_id = matched_mood.id if matched_mood else 1

        entry = Entry(
            title=title,
            text=text,
            mood_id=mood_id,
            intensity=int(intensity),
            x=x,
            y=y,
            z=z,
            is_favorite=bool(star.get("isFavorite", False)),
        )
        db.session.add(entry)
        synced_count += 1

    db.session.commit()
    return jsonify({"status": "success", "synced": synced_count}), 200


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
