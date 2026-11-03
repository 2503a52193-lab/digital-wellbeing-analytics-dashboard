import pytest
import json
import os
import sys

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app
from data_service import DataService

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def assert_valid_json_no_nan(response):
    """Helper to verify that response is valid standard JSON and contains no NaN/Infinity."""
    assert response.status_code == 200
    raw_text = response.get_data(as_text=True)
    # Standard json.loads will fail if invalid unquoted tokens like NaN exist
    data = json.loads(raw_text)
    assert 'NaN' not in raw_text, "Found unquoted NaN in response text"
    assert 'Infinity' not in raw_text, "Found unquoted Infinity in response text"
    return data

def test_health_check(client):
    res = client.get('/api/health')
    data = assert_valid_json_no_nan(res)
    assert data['status'] == 'healthy'
    assert data['dataset_rows'] == 1200

def test_filter_options(client):
    res = client.get('/api/filter-options')
    data = assert_valid_json_no_nan(res)
    assert data['success'] is True
    assert data['data']['age']['min'] == 13
    assert data['data']['age']['max'] == 19

def test_overview_unfiltered(client):
    res = client.get('/api/overview')
    data = assert_valid_json_no_nan(res)
    kpis = data['data']
    assert kpis['total_records'] == 1200
    assert kpis['avg_social_media_hours'] == 4.54
    assert kpis['avg_sleep_hours'] == 6.45
    assert kpis['avg_academic_performance'] == 2.99
    assert kpis['avg_screen_time_before_sleep'] == 1.74

def test_overview_filtered_gender(client):
    res = client.post('/api/overview', json={"filters": {"gender": "female"}})
    data = assert_valid_json_no_nan(res)
    assert data['data']['total_records'] == 585

@pytest.mark.parametrize("sm_max", [8.0, 7.0, 6.0, 5.5, 5.0, 4.0, 3.0, 2.0, 1.0])
def test_social_media_max_filter_regression(client, sm_max):
    """Tests Max Social Media Hours filter at all required thresholds to prevent NaN serialization errors."""
    endpoints = [
        '/api/overview',
        '/api/social-media',
        '/api/academic',
        '/api/wellbeing',
        '/api/insights',
        '/api/summary-report'
    ]
    for ep in endpoints:
        res = client.post(ep, json={"filters": {"social_media_max": sm_max}})
        data = assert_valid_json_no_nan(res)
        assert data['success'] is True

@pytest.mark.parametrize("filter_combo", [
    {"gender": "female", "age_min": 13, "age_max": 13, "platform": "TikTok", "social_media_max": 1.0},
    {"gender": "male", "age_min": 19, "age_max": 19, "platform": "Both", "social_media_min": 7.5, "social_media_max": 7.0},  # 0 matching rows
    {"gender": "female", "platform": "Instagram", "age_min": 15, "age_max": 15, "social_media_max": 5.5},
    {"gender": "all", "platform": "all", "age_min": 13, "age_max": 19, "social_media_max": 5.0}
])
def test_filter_combinations_and_empty_cohorts(client, filter_combo):
    """Ensures combinations including empty and small cohorts serialize cleanly to null without NaN."""
    endpoints = [
        '/api/overview',
        '/api/social-media',
        '/api/academic',
        '/api/wellbeing',
        '/api/insights',
        '/api/summary-report'
    ]
    for ep in endpoints:
        res = client.post(ep, json={"filters": filter_combo})
        data = assert_valid_json_no_nan(res)
        assert data['success'] is True

def test_empty_dataset_kpis_convert_to_null_not_zero(client):
    """Requirement 4: Convert undefined numeric results to JSON null, not invented zero."""
    res = client.post('/api/overview', json={"filters": {"social_media_min": 9.0}})
    data = assert_valid_json_no_nan(res)
    kpis = data['data']
    assert kpis['total_records'] == 0
    assert kpis['avg_social_media_hours'] is None
    assert kpis['avg_sleep_hours'] is None
    assert kpis['avg_academic_performance'] is None
    assert kpis['avg_screen_time_before_sleep'] is None

def test_empty_export_csv(client):
    res = client.post('/api/export-csv', json={"filters": {"social_media_min": 9.0}})
    assert res.status_code == 200
    assert res.content_type == 'text/csv; charset=utf-8'
    csv_text = res.get_data(as_text=True)
    assert 'student_count' in csv_text

def test_frontend_serving(client):
    res = client.get('/')
    assert res.status_code == 200
    assert 'Project 48 | Digital Well-being Analytics Dashboard' in res.get_data(as_text=True)
