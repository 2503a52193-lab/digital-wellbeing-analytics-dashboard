import pytest
import io
import os
import sys
import json
import pandas as pd

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app, dataset_manager

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_list_datasets_initial(client):
    res = client.get('/api/datasets')
    assert res.status_code == 200
    data = json.loads(res.get_data(as_text=True))
    assert data['success'] is True
    assert data['active_dataset_id'] == 'original'
    assert len(data['datasets']) == 1
    assert data['datasets'][0]['records'] == 1200

def test_upload_inspect_excel_scale(client):
    """Test uploading an Excel file with 10.0 CGPA scale and missing optional columns."""
    df = pd.DataFrame({
        'Student_Name': ['A', 'B', 'C', 'D'],
        'Age': [18, 19, 18, 20],
        'CGPA': [8.5, 7.2, 9.1, 6.8],
        'Mobile_Hours': [3.0, 5.0, 2.0, 6.5],
        'Hours_Sleep': [7.0, 6.5, 8.0, 5.5]
    })
    excel_bytes = io.BytesIO()
    with pd.ExcelWriter(excel_bytes, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Students')
    excel_bytes.seek(0)

    res = client.post(
        '/api/datasets/upload',
        data={'file': (excel_bytes, 'University_CGPA.xlsx')},
        content_type='multipart/form-data'
    )
    assert res.status_code == 200
    data = json.loads(res.get_data(as_text=True))
    assert data['success'] is True
    insp = data['inspection']
    assert insp['detected_scale']['type'] == '10.0_cgpa'
    assert insp['suggested_mapping']['academic_performance'] == 'CGPA'
    assert insp['suggested_mapping']['daily_social_media_hours'] == 'Mobile_Hours'
    assert insp['suggested_mapping']['sleep_hours'] == 'Hours_Sleep'
    # Optional columns are correctly None
    assert insp['suggested_mapping']['study_hours'] is None
    assert insp['suggested_mapping']['stress_level'] is None

def test_upload_inspect_csv_synonyms_and_scale(client):

    """
    Test uploading a CSV with alternative column names:
    - exam_score (100% scale)
    - phone_usage (daily social media)
    - sleep_duration
    - study_time (study hours present!)
    - workout_hours (physical activity)
    """
    csv_data = (
        "student_id,student_age,sex,exam_score,phone_usage,study_time,sleep_duration,workout_hours,stress\n"
        "1,15,female,88.5,3.5,4.0,7.5,1.2,5\n"
        "2,16,male,72.0,5.0,2.5,6.0,0.5,7\n"
        "3,17,female,94.0,1.5,5.5,8.0,1.5,3\n"
        "4,15,male,65.0,6.5,1.5,5.5,0.0,8\n"
        "5,18,female,81.0,4.0,3.0,7.0,1.0,4\n"
    )
    file_bytes = io.BytesIO(csv_data.encode('utf-8'))

    res = client.post(
        '/api/datasets/upload',
        data={'file': (file_bytes, 'HighSchool_Test_Results.csv')},
        content_type='multipart/form-data'
    )
    assert res.status_code == 200
    data = json.loads(res.get_data(as_text=True))
    assert data['success'] is True
    insp = data['inspection']
    assert insp['total_rows'] == 5
    assert 'exam_score' in insp['columns']
    
    # Check synonym mapping recommendations
    sugg = insp['suggested_mapping']
    assert sugg['academic_performance'] == 'exam_score'
    assert sugg['daily_social_media_hours'] == 'phone_usage'
    assert sugg['study_hours'] == 'study_time'
    assert sugg['sleep_hours'] == 'sleep_duration'
    assert sugg['physical_activity'] == 'workout_hours'
    assert sugg['stress_level'] == 'stress'

    # Check scale detection
    scale = insp['detected_scale']
    assert scale['type'] == '100_percent'
    assert scale['max'] == 100.0

def test_apply_mapping_and_analyze_custom_dataset(client):
    """Uploads, maps, and verifies that the new dataset becomes active with study hours!"""
    csv_data = (
        "Name,Years,Gender,Final_Score,Screen_Hours,Study_Hours,Nightly_Sleep\n"
        "Alice,16,female,92,2.5,4.5,8.0\n"
        "Bob,17,male,68,5.5,1.5,6.0\n"
        "Charlie,16,male,78,3.5,3.0,7.0\n"
        "Diana,17,female,85,2.0,4.0,7.5\n"
        "Ethan,18,male,60,6.0,1.0,5.5\n"
        "Fiona,16,female,95,1.5,5.0,8.5\n"
    )
    upload_res = client.post(
        '/api/datasets/upload',
        data={'file': (io.BytesIO(csv_data.encode('utf-8')), 'Class_Cohort.csv')},
        content_type='multipart/form-data'
    )
    insp = json.loads(upload_res.get_data(as_text=True))['inspection']
    session_id = insp['session_id']

    mapping = {
        'academic_performance': 'Final_Score',
        'daily_social_media_hours': 'Screen_Hours',
        'study_hours': 'Study_Hours',
        'sleep_hours': 'Nightly_Sleep',
        'age': 'Years',
        'gender': 'Gender'
    }
    scale_config = {
        'type': '100_percent',
        'name': '100% Score Scale',
        'min': 0.0,
        'max': 100.0,
        'unit': '%'
    }

    map_res = client.post(
        '/api/datasets/map',
        json={
            'session_id': session_id,
            'mapping': mapping,
            'scale_config': scale_config,
            'custom_name': 'Class 2026 Assessment'
        }
    )
    assert map_res.status_code == 200
    map_data = json.loads(map_res.get_data(as_text=True))
    assert map_data['success'] is True
    assert map_data['total_records'] == 6
    assert map_data['capabilities']['study_hours'] is True

    # Check overview endpoint for uploaded dataset
    overview_res = client.get('/api/overview')
    ov = json.loads(overview_res.get_data(as_text=True))
    assert ov['data']['total_records'] == 6
    assert ov['dataset_info']['id'] == 'uploaded'
    assert ov['dataset_info']['academic_scale']['max'] == 100.0
    assert ov['data']['avg_study_hours'] is not None

    # Check academic endpoint has study hours!
    academic_res = client.get('/api/academic')
    ac = json.loads(academic_res.get_data(as_text=True))
    assert ac['data']['study_hours_info']['exists'] is True
    assert len(ac['data']['gpa_by_study_hours']) > 0

    # Switch back to original dataset
    switch_res = client.post('/api/datasets/switch', json={'dataset_id': 'original'})
    assert switch_res.status_code == 200
    sw = json.loads(switch_res.get_data(as_text=True))
    assert sw['active_dataset_id'] == 'original'

    # Verify original dataset has 1200 records again
    orig_ov = json.loads(client.get('/api/overview').get_data(as_text=True))
    assert orig_ov['data']['total_records'] == 1200
    assert orig_ov['dataset_info']['id'] == 'original'

    # Clean up uploaded dataset
    del_res = client.delete('/api/datasets/uploaded')
    assert del_res.status_code == 200
    assert dataset_manager.uploaded_service is None

def test_minimal_dataset_missing_optional_metrics(client):
    """Test uploaded dataset with only required columns; all endpoints must return 200 with valid JSON."""
    csv_data = (
        "Exam,ScreenTime\n"
        "3.5,4.0\n"
        "2.8,6.0\n"
        "3.9,2.0\n"
    )
    upload_res = client.post(
        '/api/datasets/upload',
        data={'file': (io.BytesIO(csv_data.encode('utf-8')), 'Bare_Minimum.csv')},
        content_type='multipart/form-data'
    )
    insp = json.loads(upload_res.get_data(as_text=True))['inspection']
    session_id = insp['session_id']

    mapping = {
        'academic_performance': 'Exam',
        'daily_social_media_hours': 'ScreenTime'
    }
    client.post(
        '/api/datasets/map',
        json={
            'session_id': session_id,
            'mapping': mapping,
            'scale_config': {'type': '4.0_gpa', 'name': '4.0 GPA', 'min': 0, 'max': 4, 'unit': 'GPA'},
            'custom_name': 'Minimalist Data'
        }
    )

    # 1. Social media analytics
    res_sm = client.get('/api/social-media')
    assert res_sm.status_code == 200
    sm_data = json.loads(res_sm.get_data(as_text=True))
    assert sm_data['success'] is True
    assert sm_data['data']['platform_available'] is False
    assert sm_data['data']['age_available'] is False

    # 2. Well-being analytics
    res_wb = client.get('/api/wellbeing')
    assert res_wb.status_code == 200
    wb_data = json.loads(res_wb.get_data(as_text=True))
    assert wb_data['success'] is True
    assert wb_data['data']['stress_available'] is False
    assert wb_data['data']['anxiety_available'] is False

    # 3. Insights analytics
    res_ins = client.get('/api/insights')
    assert res_ins.status_code == 200
    ins_data = json.loads(res_ins.get_data(as_text=True))
    assert ins_data['success'] is True

    # 4. Aggregate CSV export
    res_csv = client.get('/api/export-csv')
    assert res_csv.status_code == 200
    assert 'text/csv' in res_csv.headers['Content-Type']
    csv_text = res_csv.get_data(as_text=True)
    assert 'student_count' in csv_text

    # Clean up
    client.delete('/api/datasets/uploaded')

