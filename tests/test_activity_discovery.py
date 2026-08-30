from fastapi.testclient import TestClient

from src.app import app

client = TestClient(app)


def test_activities_include_discovery_metadata():
    response = client.get('/activities')
    assert response.status_code == 200

    activities = response.json()
    assert 'Chess Club' in activities
    assert activities['Chess Club']['category'] == 'Academic'
    assert activities['Chess Club']['organizer'] == 'Mr. Nguyen'
    assert isinstance(activities['Chess Club']['tags'], list)


def test_signup_still_works_for_existing_activity():
    response = client.post('/activities/Chess Club/signup?email=newstudent@mergington.edu')
    assert response.status_code == 200
    assert 'newstudent@mergington.edu' in response.json()['message']

    cleanup = client.delete('/activities/Chess Club/unregister?email=newstudent@mergington.edu')
    assert cleanup.status_code == 200
