"""Achievement definitions and evaluation logic for Memory Match Arena."""

DIFFICULTY_PAIRS = {
    "easy": 6,
    "medium": 8,
    "hard": 12,
}

ACHIEVEMENTS = {
    "first_victory": {
        "name": "First Victory",
        "description": "Complete your first game.",
        "icon": "🏆",
    },
    "speed_runner": {
        "name": "Speed Runner",
        "description": "Complete a game in 30 seconds or less.",
        "icon": "⚡",
    },
    "perfect_memory": {
        "name": "Perfect Memory",
        "description": "Complete a game without any mismatched moves.",
        "icon": "🧠",
    },
    "hard_mode_hero": {
        "name": "Hard Mode Hero",
        "description": "Complete a game on Hard difficulty.",
        "icon": "🔥",
    },
    "peek_free": {
        "name": "Peek-Free",
        "description": "Complete a game without using Peek.",
        "icon": "👀",
    },
}


def evaluate_achievements(difficulty, seconds, moves, peek_used):
    """
    Evaluate which achievements were earned for a completed game.

    Args:
        difficulty: Game difficulty ("easy", "medium", or "hard").
        seconds: Time taken to complete the game.
        moves: Number of moves made.
        peek_used: Whether the player used the Peek feature.

    Returns:
        A list of achievement IDs earned during the game.
    """
    if difficulty not in DIFFICULTY_PAIRS:
        raise ValueError("Invalid difficulty.")

    if seconds < 1:
        raise ValueError("Seconds must be at least 1.")

    if moves < DIFFICULTY_PAIRS[difficulty]:
        raise ValueError("Moves cannot be lower than the number of pairs.")

    earned = []

    # Every successfully completed game earns First Victory.
    earned.append("first_victory")

    # Complete the game within 30 seconds.
    if seconds <= 30:
        earned.append("speed_runner")

    # A perfect game requires exactly one move per pair.
    if moves == DIFFICULTY_PAIRS[difficulty]:
        earned.append("perfect_memory")

    # Complete the game on Hard difficulty.
    if difficulty == "hard":
        earned.append("hard_mode_hero")

    # Complete without using the Peek feature.
    if not peek_used:
        earned.append("peek_free")

    return earned