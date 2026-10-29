<<<<<<< HEAD
# ✦ Memory Match Arena

**Four-member ROSPL game project** — a responsive browser-based memory matching game with a Python Flask backend and SQLite leaderboard.

## Features

- Easy (6 pairs), Medium (8 pairs), and Hard (12 pairs) modes
- Flip-to-match card animations, match counter, move counter, live timer
- One-time peek hint with a 15-second score penalty
- Deterministic server-side score formula and top-10 leaderboards per difficulty
- Light/dark theme, responsive layout, accessible labels
- SQLite persistent scores and automated Python API tests
- Four distinct modules designed for a real team contribution workflow

## Tech stack

| Layer | Technology |
|---|---|
| Web | HTML5, CSS3, JavaScript (ES6) |
| Server | Python 3.10+, Flask |
| Storage | SQLite (built into Python) |
| Tests and CI | pytest, GitHub Actions |
| Collaboration | Git and GitHub pull requests |

## How to run (Windows PowerShell / VS Code)

```powershell
cd memory-match-arena
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

Open **http://127.0.0.1:5000** in your browser.

> If activation is restricted, skip it and use `.\.venv\Scripts\python.exe -m pip install -r requirements.txt` then `.\.venv\Scripts\python.exe app.py`.

# Memory Match Arena

A memory matching game built with Flask, HTML, CSS, and JavaScript.

## Setup & Installation
1. Clone the repository:
   ```bash
   git clone [https://github.com/](https://github.com/)<your-username>/Memory-Match-Arena.git

### Test the backend

```powershell
python -m pytest -q
```

On macOS/Linux: `python3 -m venv .venv`, `source .venv/bin/activate`, then the same `pip`, `python`, and pytest commands.

## Gameplay

1. Enter a player name and choose a difficulty.
2. Select two cards; matched pairs remain face-up.
3. Match every pair. One peek hint is available per round but costs 15 seconds.
4. On completion, save your score and view the leaderboard for your difficulty.

**Scoring:** `max(100, pairs × 250 − seconds × 3 − (moves − pairs) × 20)`. The server recomputes the submitted score instead of trusting a client-supplied score.

Note: this is an educational leaderboard, **not a tamper-proof competitive system**; a malicious user could submit fabricated but plausible game results directly to the API. A production deployment would require server-owned sessions and anti-abuse controls.

## Project structure

```text
memory-match-arena/
├── app.py                       # Flask routes, leaderboard & SQLite
├── game_rules.py                # Difficulty, scoring and validation
├── templates/index.html        # Semantic game page and contributor section
├── static/css/style.css        # Responsive interface and card animations
├── static/js/game.js           # Client-side game state and interactions
├── tests/test_app.py           # Flask API and scoring tests
├── .github/workflows/tests.yml # Automated tests for pushes and PRs
├── docs/CONTRIBUTING.md        # Four-member roles and PR workflow
├── docs/ROSPL_REPORT_NOTES.md  # Report and demonstration outline
└── requirements.txt
```

## Actual team contributions

This starter code is a shared baseline. Four real contributions must be made through independent improvements, commits, and pull requests **before describing the work as four completed contributions**. Read [the contribution guide](docs/CONTRIBUTING.md).

| Member | Name / GitHub | Module | PR |
|---|---|---|---|
| 1 | To be assigned | Frontend/UI | Pending |
| 2 | To be assigned | Game engine | Pending |
| 3 | To be assigned | API and database | Pending |
| 4 | To be assigned | Tests, CI, documentation | Pending |

## Future improvements

Multiplayer challenges, keyboard navigation, sounds, achievement badges, score verification, and deployment.

## License

This original student starter is offered under the [MIT License](LICENSE). Credits for subsequent work should be attributed in Git commits and the contribution table.
=======
# Memory-Match-Arena
An open-source memory matching game built using Python Flask, HTML, CSS, JavaScript and SQLite.
>>>>>>> 07b69bfcb6ae76bca642713e770ab650b5c2a735
