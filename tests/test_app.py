import pytest
from app import create_app
from game_rules import calculate_score, validate_result


@pytest.fixture()
def client(tmp_path):
    app = create_app({'TESTING': True, 'DATABASE': str(tmp_path / 'test.db')})
    return app.test_client()


def test_home_page(client):
    response = client.get('/')
    assert response.status_code == 200
    assert b'Memory Match Arena' in response.data


def test_empty_leaderboard(client):
    response = client.get('/api/leaderboard?difficulty=easy')
    assert response.status_code == 200
    assert response.json == {'results': []}


def test_valid_score_and_leaderboard(client):
    response = client.post('/api/scores', json={'player': 'Mahesh', 'difficulty': 'easy', 'seconds': 40, 'moves': 8})
    assert response.status_code == 201
    assert response.json['score'] == calculate_score('easy', 40, 8)
    board = client.get('/api/leaderboard?difficulty=easy').json['results']
    assert len(board) == 1
    assert board[0]['player'] == 'Mahesh'

def test_achievement_gallery(client):
    response = client.post(
        '/api/scores',
        json={
            'player': 'Mahesh',
            'difficulty': 'easy',
            'seconds': 20,
            'moves': 6,
            'peek_used': False,
        },
    )

    assert response.status_code == 201

    gallery = client.get('/api/achievements?player=Mahesh')

    assert gallery.status_code == 200
    assert gallery.json['player'] == 'Mahesh'
    assert gallery.json['total'] == 5
    assert gallery.json['unlocked'] == 4

    achievements = {
        achievement['id']: achievement
        for achievement in gallery.json['achievements']
    }

    assert achievements['first_victory']['unlocked'] is True
    assert achievements['speed_runner']['unlocked'] is True
    assert achievements['perfect_memory']['unlocked'] is True
    assert achievements['peek_free']['unlocked'] is True
    assert achievements['hard_mode_hero']['unlocked'] is False


def test_invalid_achievement_player_rejected(client):
    response = client.get('/api/achievements?player=<script>')

    assert response.status_code == 400


def test_empty_achievement_gallery(client):
    response = client.get('/api/achievements?player=NewPlayer')

    assert response.status_code == 200
    assert response.json['player'] == 'NewPlayer'
    assert response.json['unlocked'] == 0
    assert response.json['total'] == 5

    assert all(
        achievement['unlocked'] is False
        for achievement in response.json['achievements']
    )

    assert achievements['first_victory']['unlocked'] is True
    assert achievements['speed_runner']['unlocked'] is True
    assert achievements['perfect_memory']['unlocked'] is True
    assert achievements['peek_free']['unlocked'] is True
    assert achievements['hard_mode_hero']['unlocked'] is False

def test_invalid_achievement_player_rejected(client):
    response = client.get('/api/achievements?player=<script>')

    assert response.status_code == 400

def test_empty_achievement_gallery(client):
    response = client.get('/api/achievements?player=NewPlayer')

    assert response.status_code == 200
    assert response.json['player'] == 'NewPlayer'
    assert response.json['unlocked'] == 0
    assert response.json['total'] == 5

    assert all(
        achievement['unlocked'] is False
        for achievement in response.json['achievements']
    )


@pytest.mark.parametrize('payload', [
    {'player': '<script>', 'difficulty': 'easy', 'seconds': 20, 'moves': 6},
    {'player': 'OK', 'difficulty': 'unknown', 'seconds': 20, 'moves': 6},
    {'player': 'OK', 'difficulty': 'easy', 'seconds': -1, 'moves': 6},
    {'player': 'OK', 'difficulty': 'easy', 'seconds': 20, 'moves': 2},
    {'player': 'OK', 'difficulty': 'easy', 'seconds': True, 'moves': 6},
])
def test_invalid_scores_rejected(client, payload):
    assert client.post('/api/scores', json=payload).status_code == 400


def test_invalid_payload_rejected(client):
    assert client.post('/api/scores', data='not-json').status_code == 400
    assert client.get('/api/leaderboard?difficulty=unknown').status_code == 400


def test_score_formula_and_basic_validation():
    assert calculate_score('easy', 1, 6) == 1497
    assert validate_result('medium', 10, 8) is None
    assert validate_result('hard', 10, 6) is not None
