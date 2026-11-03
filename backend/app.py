import os
import json
from flask import Flask, request, Response, send_from_directory
from flask_cors import CORS
from data_service import sanitize_data
from dataset_manager import DatasetManager

frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")

app = Flask(__name__, static_folder=frontend_dist)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB file upload limit
# Enable CORS for all routes (frontend on localhost:5173 or other ports)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Initialize DatasetManager
excel_file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "Teen_Mental_Health_Dataset.csv(6).xlsx")
dataset_manager = DatasetManager(excel_file_path)

def strict_json_response(payload, status=200):
    """
    Serializes payload to standard RFC 8259 compliant JSON.
    Enforces allow_nan=False so that NaN/Inf can never be serialized as raw tokens,
    converting any undefined or non-compliant numbers to JSON null.
    """
    clean_payload = sanitize_data(payload)
    json_str = json.dumps(clean_payload, allow_nan=False)
    return Response(json_str, status=status, mimetype="application/json")

def extract_filters_and_service():
    """Extracts filter parameters and determines the requested DataService."""
    filters = {}
    dataset_id = None
    if request.is_json and request.json:
        data = request.json
        filters = data.get('filters', data)
        dataset_id = data.get('dataset_id') or filters.get('dataset_id')
    else:
        args = request.args
        if 'dataset_id' in args:
            dataset_id = args.get('dataset_id')
        if 'age_min' in args:
            filters['age_min'] = args.get('age_min', type=int)
        if 'age_max' in args:
            filters['age_max'] = args.get('age_max', type=int)
        if 'gender' in args:
            filters['gender'] = args.get('gender')
        if 'platform' in args:
            filters['platform'] = args.get('platform')
        if 'social_media_min' in args:
            filters['social_media_min'] = args.get('social_media_min', type=float)
        if 'social_media_max' in args:
            filters['social_media_max'] = args.get('social_media_max', type=float)
        if 'ages' in args:
            raw_ages = args.get('ages')
            filters['ages'] = [int(a) for a in raw_ages.split(',') if a.strip()]

    # Retrieve service for requested or active dataset
    service = dataset_manager.get_service(dataset_id)
    return filters, service

@app.route('/api/health', methods=['GET'])
def health_check():
    active_service = dataset_manager.get_service()
    return strict_json_response({
        "status": "healthy",
        "service": "Digital Well-being Analytics Universal Platform API",
        "active_dataset": active_service.dataset_name,
        "active_dataset_id": active_service.dataset_id,
        "dataset_rows": len(active_service.raw_data)
    })

# ==============================================================================
# DATASET MANAGEMENT & UPLOAD ENDPOINTS
# ==============================================================================

@app.route('/api/datasets', methods=['GET'])
def list_datasets():
    """Returns the list of available datasets (original sample and uploaded)."""
    try:
        datasets = dataset_manager.list_datasets()
        return strict_json_response({
            "success": True,
            "active_dataset_id": dataset_manager.active_dataset_id,
            "datasets": datasets
        })
    except Exception as e:
        return strict_json_response({"success": False, "error": str(e)}, 500)

@app.route('/api/datasets/upload', methods=['POST'])
def upload_dataset():
    """Handles Excel (.xlsx/.xls) or CSV upload, validates, and suggests column mappings."""
    try:
        if 'file' not in request.files:
            return strict_json_response({"success": False, "error": "No file part in the request"}, 400)
        file = request.files['file']
        if file.filename == '':
            return strict_json_response({"success": False, "error": "No file selected"}, 400)

        inspection = dataset_manager.inspect_file(file)
        return strict_json_response({"success": True, "inspection": inspection})
    except ValueError as ve:
        return strict_json_response({"success": False, "error": str(ve)}, 400)
    except Exception as e:
        return strict_json_response({"success": False, "error": f"Upload processing error: {str(e)}"}, 500)

@app.route('/api/datasets/map', methods=['POST'])
def apply_dataset_mapping():
    """Applies teacher-confirmed column mapping and academic scale to activate dataset."""
    try:
        data = request.json or {}
        session_id = data.get('session_id')
        mapping = data.get('mapping')
        scale_config = data.get('scale_config')
        custom_name = data.get('custom_name')

        if not session_id or not mapping:
            return strict_json_response({"success": False, "error": "session_id and mapping are required"}, 400)

        res = dataset_manager.apply_mapping(
            session_id=session_id,
            mapping=mapping,
            scale_config=scale_config,
            custom_name=custom_name
        )
        return strict_json_response(res)
    except ValueError as ve:
        return strict_json_response({"success": False, "error": str(ve)}, 400)
    except Exception as e:
        return strict_json_response({"success": False, "error": f"Failed to map dataset: {str(e)}"}, 500)

@app.route('/api/datasets/switch', methods=['POST'])
def switch_active_dataset():
    """Switches active dataset between 'original' and 'uploaded'."""
    try:
        data = request.json or {}
        target_id = data.get('dataset_id', 'original')
        res = dataset_manager.switch_dataset(target_id)
        return strict_json_response(res)
    except ValueError as ve:
        return strict_json_response({"success": False, "error": str(ve)}, 400)
    except Exception as e:
        return strict_json_response({"success": False, "error": str(e)}, 500)

@app.route('/api/datasets/uploaded', methods=['DELETE', 'POST'])
def delete_uploaded():
    """Deletes uploaded dataset file and clears session state."""
    try:
        res = dataset_manager.delete_uploaded_dataset()
        return strict_json_response(res)
    except Exception as e:
        return strict_json_response({"success": False, "error": str(e)}, 500)

# ==============================================================================
# DASHBOARD ANALYTICS ENDPOINTS
# ==============================================================================

@app.route('/api/filter-options', methods=['GET'])
def filter_options():
    try:
        dataset_id = request.args.get('dataset_id')
        service = dataset_manager.get_service(dataset_id)
        options = service.get_filter_options()
        return strict_json_response({"success": True, "data": options})
    except Exception as e:
        return strict_json_response({"success": False, "error": str(e)}, 500)

@app.route('/api/overview', methods=['GET', 'POST'])
def overview():
    try:
        filters, service = extract_filters_and_service()
        filtered_df = service.filter_dataframe(filters)
        kpis = service.get_overview_kpis(filtered_df)
        return strict_json_response({
            "success": True,
            "data": kpis,
            "active_filters": filters,
            "dataset_info": {
                "id": service.dataset_id,
                "name": service.dataset_name,
                "academic_scale": service.academic_scale,
                "capabilities": service.capabilities
            }
        })
    except Exception as e:
        return strict_json_response({"success": False, "error": str(e)}, 500)

@app.route('/api/social-media', methods=['GET', 'POST'])
def social_media_analytics():
    try:
        filters, service = extract_filters_and_service()
        filtered_df = service.filter_dataframe(filters)
        data = service.get_social_media_analytics(filtered_df)
        return strict_json_response({
            "success": True,
            "data": data,
            "capabilities": service.capabilities
        })
    except Exception as e:
        return strict_json_response({"success": False, "error": str(e)}, 500)

@app.route('/api/academic', methods=['GET', 'POST'])
def academic_analytics():
    try:
        filters, service = extract_filters_and_service()
        filtered_df = service.filter_dataframe(filters)
        data = service.get_academic_analytics(filtered_df)
        return strict_json_response({
            "success": True,
            "data": data,
            "academic_scale": service.academic_scale,
            "capabilities": service.capabilities
        })
    except Exception as e:
        return strict_json_response({"success": False, "error": str(e)}, 500)

@app.route('/api/wellbeing', methods=['GET', 'POST'])
def wellbeing_analytics():
    try:
        filters, service = extract_filters_and_service()
        filtered_df = service.filter_dataframe(filters)
        data = service.get_wellbeing_analytics(filtered_df)
        return strict_json_response({
            "success": True,
            "data": data,
            "capabilities": service.capabilities
        })
    except Exception as e:
        return strict_json_response({"success": False, "error": str(e)}, 500)

@app.route('/api/insights', methods=['GET', 'POST'])
def insights():
    try:
        filters, service = extract_filters_and_service()
        filtered_df = service.filter_dataframe(filters)
        data = service.get_data_insights(filtered_df)
        return strict_json_response({
            "success": True,
            "data": data,
            "academic_scale": service.academic_scale,
            "capabilities": service.capabilities
        })
    except Exception as e:
        return strict_json_response({"success": False, "error": str(e)}, 500)

@app.route('/api/export-csv', methods=['GET', 'POST'])
def export_csv():
    try:
        filters, service = extract_filters_and_service()
        filtered_df = service.filter_dataframe(filters)
        csv_content = service.generate_aggregate_csv(filtered_df)
        filename = f"{service.dataset_id}_wellbeing_analytics_aggregate.csv"
        return Response(
            csv_content,
            mimetype="text/csv",
            headers={"Content-disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        return strict_json_response({"success": False, "error": str(e)}, 500)

@app.route('/api/summary-report', methods=['GET', 'POST'])
def summary_report():
    try:
        filters, service = extract_filters_and_service()
        filtered_df = service.filter_dataframe(filters)
        kpis = service.get_overview_kpis(filtered_df)
        insights_data = service.get_data_insights(filtered_df)
        return strict_json_response({
            "success": True,
            "project_info": {
                "project_no": 48,
                "title": "Digital Well-being Analytics Dashboard",
                "research_question": "Does screen time influence students' academic performance?",
                "dataset_name": service.dataset_name,
                "dataset_id": service.dataset_id,
                "academic_scale": service.academic_scale
            },
            "summary_kpis": kpis,
            "insights": insights_data
        })
    except Exception as e:
        return strict_json_response({"success": False, "error": str(e)}, 500)

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    if app.static_folder and os.path.exists(app.static_folder):
        if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        index_file = os.path.join(app.static_folder, 'index.html')
        if os.path.exists(index_file):
            return send_from_directory(app.static_folder, 'index.html')
    return strict_json_response({
        "service": "Digital Well-being Analytics Universal Platform API",
        "status": "active",
        "endpoints": [
            "/api/health",
            "/api/datasets",
            "/api/datasets/upload",
            "/api/datasets/map",
            "/api/datasets/switch",
            "/api/datasets/uploaded",
            "/api/filter-options",
            "/api/overview",
            "/api/social-media",
            "/api/academic",
            "/api/wellbeing",
            "/api/insights",
            "/api/export-csv",
            "/api/summary-report"
        ]
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting Digital Well-being Analytics Flask API on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=True)
