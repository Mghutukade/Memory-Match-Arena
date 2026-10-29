"""Tests for the Memory Match Arena achievement system."""

import pytest

from achievements import evaluate_achievements


def test_first_victory_is_awarded_for_completed_game():
    achievements = evaluate_achievements(
        difficulty="easy",
        seconds=45,
        moves=8,
        peek_used=True,
    )

    assert "first_victory" in achievements
    assert "speed_runner" not in achievements
    assert "perfect_memory" not in achievements
    assert "hard_mode_hero" not in achievements
    assert "peek_free" not in achievements


def test_speed_runner_is_awarded_within_30_seconds():
    achievements = evaluate_achievements(
        difficulty="easy",
        seconds=25,
        moves=8,
        peek_used=True,
    )

    assert "first_victory" in achievements
    assert "speed_runner" in achievements
    assert "perfect_memory" not in achievements


def test_speed_runner_is_awarded_at_exactly_30_seconds():
    achievements = evaluate_achievements(
        difficulty="medium",
        seconds=30,
        moves=10,
        peek_used=True,
    )

    assert "speed_runner" in achievements


def test_speed_runner_is_not_awarded_after_30_seconds():
    achievements = evaluate_achievements(
        difficulty="easy",
        seconds=31,
        moves=8,
        peek_used=True,
    )

    assert "speed_runner" not in achievements


def test_perfect_memory_is_awarded_with_exact_pair_count():
    achievements = evaluate_achievements(
        difficulty="easy",
        seconds=40,
        moves=6,
        peek_used=True,
    )

    assert "perfect_memory" in achievements


def test_perfect_memory_is_awarded_for_hard_mode():
    achievements = evaluate_achievements(
        difficulty="hard",
        seconds=60,
        moves=12,
        peek_used=False,
    )

    assert "perfect_memory" in achievements
    assert "hard_mode_hero" in achievements


def test_perfect_memory_is_not_awarded_with_extra_moves():
    achievements = evaluate_achievements(
        difficulty="medium",
        seconds=40,
        moves=10,
        peek_used=False,
    )

    assert "perfect_memory" not in achievements


def test_hard_mode_hero_is_awarded_for_hard_difficulty():
    achievements = evaluate_achievements(
        difficulty="hard",
        seconds=90,
        moves=15,
        peek_used=True,
    )

    assert "hard_mode_hero" in achievements


def test_hard_mode_hero_is_not_awarded_for_easy_difficulty():
    achievements = evaluate_achievements(
        difficulty="easy",
        seconds=90,
        moves=8,
        peek_used=False,
    )

    assert "hard_mode_hero" not in achievements


def test_peek_free_is_awarded_when_peek_is_not_used():
    achievements = evaluate_achievements(
        difficulty="medium",
        seconds=45,
        moves=9,
        peek_used=False,
    )

    assert "peek_free" in achievements


def test_peek_free_is_not_awarded_when_peek_is_used():
    achievements = evaluate_achievements(
        difficulty="medium",
        seconds=45,
        moves=9,
        peek_used=True,
    )

    assert "peek_free" not in achievements


def test_fast_perfect_peek_free_game_unlocks_multiple_achievements():
    achievements = evaluate_achievements(
        difficulty="easy",
        seconds=20,
        moves=6,
        peek_used=False,
    )

    assert achievements == [
        "first_victory",
        "speed_runner",
        "perfect_memory",
        "peek_free",
    ]


def test_fast_perfect_hard_game_unlocks_all_achievements():
    achievements = evaluate_achievements(
        difficulty="hard",
        seconds=20,
        moves=12,
        peek_used=False,
    )

    assert achievements == [
        "first_victory",
        "speed_runner",
        "perfect_memory",
        "hard_mode_hero",
        "peek_free",
    ]


@pytest.mark.parametrize(
    "difficulty,expected_pairs",
    [
        ("easy", 6),
        ("medium", 8),
        ("hard", 12),
    ],
)
def test_valid_move_count_for_each_difficulty(
    difficulty,
    expected_pairs,
):
    achievements = evaluate_achievements(
        difficulty=difficulty,
        seconds=60,
        moves=expected_pairs,
        peek_used=True,
    )

    assert "perfect_memory" in achievements


def test_invalid_difficulty_is_rejected():
    with pytest.raises(ValueError, match="Invalid difficulty"):
        evaluate_achievements(
            difficulty="extreme",
            seconds=30,
            moves=10,
            peek_used=False,
        )


def test_invalid_seconds_are_rejected():
    with pytest.raises(ValueError, match="Seconds must be at least 1"):
        evaluate_achievements(
            difficulty="easy",
            seconds=0,
            moves=6,
            peek_used=False,
        )


def test_moves_cannot_be_lower_than_number_of_pairs():
    with pytest.raises(
        ValueError,
        match="Moves cannot be lower than the number of pairs",
    ):
        evaluate_achievements(
            difficulty="hard",
            seconds=30,
            moves=10,
            peek_used=False,
        )