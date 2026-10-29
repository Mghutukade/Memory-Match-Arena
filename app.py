"""Memory Match Arena: Flask routes and score submission API."""
from datetime import datetime, timezone
import os
from pathlib import Path
import re
import sqlite3

from flask import Flask, jsonify, render_template, request
from achievements import ACHIEVEMENTS, evaluate_achievements
from game_rules import DIFFICULTIES, calculate_score, validate_result

BASE_DIR = Path(__file__).resolve().parent


def create_app(test_config=None):
    app = Flask(__name__)
    app.config.update(DATABASE=str(BASE_DIR / 'scores.db'), JSON_SORT_KEYS=False)
    if test_config:
        app.config.update(test_config)

    def connection():
        db = sqlite3.connect(app.config['DATABASE'])
        db.row_factory = sqlite3.Row
        return db

    with connection() as db:
        db.execute('''CREATE TABLE IF NOT EXISTS scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player TEXT NOT NULL,
            difficulty TEXT NOT NULL,
            seconds INTEGER NOT NULL,
            moves INTEGER NOT NULL,
            score INTEGER NOT NULL,
            created_at TEXT NOT NULL
        )''')

        db.execute('''CREATE TABLE IF NOT EXISTS achievements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player TEXT NOT NULL,
            achievement_id TEXT NOT NULL,
            earned_at TEXT NOT NULL,
            UNIQUE(player, achievement_id)
        )''')

        db.commit()

    @app.get('/')
    def home():
        return render_template('index.html', difficulties=DIFFICULTIES)

    @app.get('/api/leaderboard')
    def leaderboard():
        difficulty = request.args.get('difficulty', 'easy')
        if difficulty not in DIFFICULTIES:
            return jsonify(error='Invalid difficulty.'), 400
        with connection() as db:
            rows = db.execute('''SELECT player, difficulty, seconds, moves, score, created_at
                FROM scores WHERE difficulty = ?
                ORDER BY score DESC, seconds ASC, moves ASC, id ASC LIMIT 10''',
                (difficulty,)).fetchall()
        return jsonify(results=[dict(row) for row in rows])

    @app.post('/api/scores')
    def save_score():
        payload = request.get_json(silent=True)

        if not isinstance(payload, dict):
            return jsonify(error='Send a JSON object.'), 400

        player = payload.get('player')

        if (
            not isinstance(player, str)
            or not re.fullmatch(
                r'[\w .-]{2,20}',
                player,
                flags=re.UNICODE
            )
            or not player.strip()
        ):
            return jsonify(
                error='Name must be 2–20 letters, digits, spaces, dots, underscores or dashes.'
            ), 400

        difficulty = payload.get('difficulty')
        seconds = payload.get('seconds')
        moves = payload.get('moves')
        peek_used = payload.get('peek_used', False)

        reason = validate_result(difficulty, seconds, moves)

        if reason:
            return jsonify(error=reason), 400

        if not isinstance(peek_used, bool):
            return jsonify(error='peek_used must be a boolean.'), 400

        score = calculate_score(difficulty, seconds, moves)

        earned_achievements = evaluate_achievements(
            difficulty=difficulty,
            seconds=seconds,
            moves=moves,
            peek_used=peek_used,
        )

        created_at = datetime.now(timezone.utc).isoformat(timespec='seconds')

        with connection() as db:
            cursor = db.execute(
                '''INSERT INTO scores
                    (player, difficulty, seconds, moves, score, created_at)
                VALUES (?, ?, ?, ?, ?, ?)''',
                (
                    player.strip(),
                    difficulty,
                    seconds,
                    moves,
                    score,
                    created_at,
                )
            )

            entry_id = cursor.lastrowid

            newly_unlocked = []

            for achievement_id in earned_achievements:
                achievement = ACHIEVEMENTS[achievement_id]

                try:
                    db.execute(
                        '''INSERT INTO achievements
                        (player, achievement_id, earned_at)
                        VALUES (?, ?, ?)''',
                        (
                            player.strip(),
                            achievement_id,
                            created_at,
                        )
                    )
                    newly_unlocked.append(achievement_id)

                except sqlite3.IntegrityError:
                    # Achievement was already unlocked by this player.
                    pass

            db.commit()

        return jsonify(
            id=entry_id,
            score=score,
            achievements=[
                {
                    "id": achievement_id,
                    **ACHIEVEMENTS[achievement_id],
                }
                for achievement_id in newly_unlocked
            ],
            message='Score saved!',
        ), 201

    @app.get('/api/achievements')
    def get_achievements():
        player = request.args.get('player', '').strip()

        if (
            not isinstance(player, str)
            or not re.fullmatch(
                r'[\w .-]{2,20}',
                player,
                flags=re.UNICODE
            )
            or not player
        ):
            return jsonify(
                error='Name must be 2–20 letters, digits, spaces, dots, underscores or dashes.'
            ), 400

        with connection() as db:
            rows = db.execute(
                '''SELECT achievement_id, earned_at
                FROM achievements
                WHERE player = ?
                ORDER BY earned_at ASC''',
                (player,)
            ).fetchall()

        unlocked = {
            row['achievement_id']: row['earned_at']
            for row in rows
        }

        achievements = []

        for achievement_id, achievement in ACHIEVEMENTS.items():
            earned_at = unlocked.get(achievement_id)

            achievements.append({
                "id": achievement_id,
                "name": achievement["name"],
                "description": achievement["description"],
                "icon": achievement["icon"],
                "unlocked": earned_at is not None,
                "earned_at": earned_at,
            })

        unlocked_count = sum(
            1 for achievement in achievements
            if achievement["unlocked"]
        )

        return jsonify(
            player=player,
            unlocked=unlocked_count,
            total=len(achievements),
            achievements=achievements,
        ), 200

    return app


app = create_app()

if __name__ == '__main__':
    app.run(debug=os.getenv('FLASK_DEBUG') == '1')
