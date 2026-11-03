import os
import uuid
import re
import pandas as pd
import numpy as np
import openpyxl
from typing import Dict, Any, Optional, List, Tuple
from data_service import DataService, sanitize_data, safe_round

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Canonical variable definitions and target requirements
CANONICAL_VARIABLES = {
    'academic_performance': {
        'label': 'Academic Performance / GPA / Marks',
        'type': 'numeric',
        'required': True,
        'description': 'Student GPA, exam marks, percentage, or academic evaluation score.'
    },
    'daily_social_media_hours': {
        'label': 'Daily Social Media / Screen Time Hours',
        'type': 'numeric',
        'required': True,
        'description': 'Average daily time spent on social media or mobile screen (hours/day).'
    },
    'sleep_hours': {
        'label': 'Sleep Hours / Duration',
        'type': 'numeric',
        'required': False,
        'description': 'Nightly sleep duration (hours/night).'
    },
    'study_hours': {
        'label': 'Study Hours / Prep Time',
        'type': 'numeric',
        'required': False,
        'description': 'Daily independent self-study or homework time (hours/day).'
    },
    'screen_time_before_sleep': {
        'label': 'Screen Time Before Sleep',
        'type': 'numeric',
        'required': False,
        'description': 'Duration of digital device exposure immediately prior to sleeping (hours).'
    },
    'physical_activity': {
        'label': 'Physical Activity / Exercise',
        'type': 'numeric',
        'required': False,
        'description': 'Daily physical exercise, sports, or workout time (hours/day).'
    },
    'stress_level': {
        'label': 'Stress Level',
        'type': 'numeric',
        'required': False,
        'description': 'Self-reported perceived stress score (e.g., 1 to 10 scale).'
    },
    'anxiety_level': {
        'label': 'Anxiety Level',
        'type': 'numeric',
        'required': False,
        'description': 'Self-reported anxiety score (e.g., 1 to 10 scale).'
    },
    'addiction_level': {
        'label': 'Device Addiction Level',
        'type': 'numeric',
        'required': False,
        'description': 'Self-reported device or screen addiction rating (e.g., 1 to 10).'
    },
    'social_interaction_level': {
        'label': 'In-Person Social Interaction Level',
        'type': 'categorical',
        'required': False,
        'description': 'In-person peer engagement level (e.g., Low, Medium, High).'
    },
    'age': {
        'label': 'Student Age',
        'type': 'numeric',
        'required': False,
        'description': 'Age of the student (years).'
    },
    'gender': {
        'label': 'Student Gender',
        'type': 'categorical',
        'required': False,
        'description': 'Gender identity (e.g., Male, Female).'
    },
    'platform_usage': {
        'label': 'Primary Platform / App Used',
        'type': 'categorical',
        'required': False,
        'description': 'Primary social media platform used (e.g., Instagram, TikTok, Both).'
    },
    'depression_label': {
        'label': 'Depression Screening Flag',
        'type': 'numeric',
        'required': False,
        'description': 'Binary screening indicator (0 or 1).'
    }
}

# Synonym mapping dictionary for intelligent matching
SYNONYM_MAP = {
    'academic_performance': [
        'academic_performance', 'gpa', 'cgpa', 'marks', 'exam_score', 'score', 'scores',
        'percentage', 'grade', 'grades', 'test_score', 'final_score', 'academic_score',
        'result', 'results', 'performance', 'academic_gpa', 'final_grade'
    ],
    'daily_social_media_hours': [
        'daily_social_media_hours', 'social_media_usage', 'screen_time', 'phone_usage',
        'mobile_hours', 'sm_hours', 'social_media_time', 'social_media', 'screen_hours',
        'phone_time', 'social_hours', 'device_time', 'screen_usage', 'daily_screen_time'
    ],
    'sleep_hours': [
        'sleep_hours', 'sleep_duration', 'sleep_time', 'nightly_sleep', 'hours_of_sleep',
        'sleep', 'bed_time_hours', 'avg_sleep', 'sleep_hrs'
    ],
    'study_hours': [
        'study_hours', 'study_time', 'study_duration', 'self_study_hours', 'prep_time',
        'hours_studying', 'homework_hours', 'study', 'study_hrs', 'academic_study_time'
    ],
    'screen_time_before_sleep': [
        'screen_time_before_sleep', 'pre_bed_screen_time', 'bedtime_screen', 'night_screen_time',
        'screen_before_bed', 'screen_before_sleep', 'pre_sleep_screen'
    ],
    'physical_activity': [
        'physical_activity', 'exercise', 'workout_hours', 'sports_hours', 'activity_hours',
        'exercise_hours', 'fitness_hours', 'daily_exercise', 'sports'
    ],
    'stress_level': [
        'stress_level', 'stress', 'stress_score', 'perceived_stress', 'stress_rating'
    ],
    'anxiety_level': [
        'anxiety_level', 'anxiety', 'anxiety_score', 'perceived_anxiety', 'anxiety_rating'
    ],
    'addiction_level': [
        'addiction_level', 'addiction', 'phone_addiction', 'device_addiction', 'screen_addiction'
    ],
    'social_interaction_level': [
        'social_interaction_level', 'social_interaction', 'peer_interaction', 'in_person_social',
        'social_level', 'social_engagement'
    ],
    'age': [
        'age', 'student_age', 'years', 'age_years', 'student_years'
    ],
    'gender': [
        'gender', 'sex', 'student_gender'
    ],
    'platform_usage': [
        'platform_usage', 'platform', 'primary_platform', 'app_used', 'social_platform',
        'most_used_app', 'favorite_app'
    ],
    'depression_label': [
        'depression_label', 'depression', 'depression_flag', 'depression_screen', 'depressed'
    ]
}

def normalize_string(s: str) -> str:
    """Normalizes string for fuzzy/synonym comparison."""
    return re.sub(r'[^a-z0-9]', '', str(s).lower())

def tokenize_words(s: str) -> List[str]:
    """Extracts alphanumeric words from column name."""
    return re.findall(r'[a-z0-9]+', str(s).lower())

def match_column(col_name: str) -> Tuple[Optional[str], float]:
    """
    Attempts to match an uploaded column name to a canonical variable.
    Returns (canonical_key, confidence_score).
    """
    normalized = normalize_string(col_name)
    tokens = set(tokenize_words(col_name))
    best_match = None
    best_score = 0.0

    # Key token combination rules
    if 'cgpa' in tokens or 'gpa' in tokens:
        return ('academic_performance', 0.95)
    if {'sleep', 'hours'}.issubset(tokens) or {'sleep', 'duration'}.issubset(tokens) or {'hours', 'sleep'}.issubset(tokens) or 'sleep' in tokens:
        return ('sleep_hours', 0.9)
    if {'study', 'hours'}.issubset(tokens) or {'study', 'time'}.issubset(tokens) or {'hours', 'study'}.issubset(tokens) or 'study' in tokens:
        return ('study_hours', 0.9)
    if {'screen', 'bed'}.issubset(tokens) or {'bedtime', 'screen'}.issubset(tokens) or ('screen' in tokens and 'sleep' in tokens):
        return ('screen_time_before_sleep', 0.9)
    if {'social', 'media'}.issubset(tokens) or {'screen', 'time'}.issubset(tokens) or {'mobile', 'hours'}.issubset(tokens) or {'phone', 'usage'}.issubset(tokens):
        return ('daily_social_media_hours', 0.85)

    for canonical, synonyms in SYNONYM_MAP.items():
        for syn in synonyms:
            syn_norm = normalize_string(syn)
            if normalized == syn_norm:
                return (canonical, 1.0)
            elif normalized.startswith(syn_norm) or syn_norm.startswith(normalized):
                score = min(len(normalized), len(syn_norm)) / max(len(normalized), len(syn_norm))
                if score > best_score and score >= 0.7:
                    best_score = score
                    best_match = canonical
            elif syn_norm in normalized or normalized in syn_norm:
                score = 0.65
                if score > best_score:
                    best_score = score
                    best_match = canonical

    return (best_match, best_score)

def detect_academic_scale(series: pd.Series) -> Dict[str, Any]:
    """
    Detects whether an academic performance series corresponds to a 4.0 GPA, 10.0 GPA,
    100% percentage, 50 marks, or custom scale.
    """
    clean_series = pd.to_numeric(series, errors='coerce').dropna()
    if len(clean_series) == 0:
        return {
            'type': '4.0_gpa',
            'name': 'Standard 4.0 GPA Scale',
            'min': 0.0,
            'max': 4.0,
            'unit': 'GPA',
            'label': '/ 4.00 GPA'
        }

    s_min = float(clean_series.min())
    s_max = float(clean_series.max())

    if s_max <= 4.05 and s_min >= 0.0:
        return {
            'type': '4.0_gpa',
            'name': 'Standard 4.00 GPA Scale',
            'min': max(0.0, safe_round(s_min, 1) or 0.0),
            'max': 4.0,
            'unit': 'GPA',
            'label': '/ 4.00 GPA'
        }
    elif s_max <= 10.05 and s_max > 4.05:
        return {
            'type': '10.0_cgpa',
            'name': '10.0 CGPA Scale',
            'min': max(0.0, safe_round(s_min, 1) or 0.0),
            'max': 10.0,
            'unit': 'CGPA',
            'label': '/ 10.0 CGPA'
        }
    elif s_max <= 100.05 and s_max > 50.0:
        return {
            'type': '100_percent',
            'name': '100% Marks / Percentage Scale',
            'min': max(0.0, safe_round(s_min, 0) or 0.0),
            'max': 100.0,
            'unit': '%',
            'label': '/ 100%'
        }
    elif s_max <= 50.05 and s_max > 10.05:
        return {
            'type': '50_marks',
            'name': '50 Marks Scale',
            'min': max(0.0, safe_round(s_min, 0) or 0.0),
            'max': 50.0,
            'unit': 'Marks',
            'label': '/ 50 Marks'
        }
    else:
        ceil_max = float(np.ceil(s_max))
        return {
            'type': 'custom',
            'name': f'Custom ({ceil_max} Max Score)',
            'min': max(0.0, safe_round(s_min, 1) or 0.0),
            'max': ceil_max,
            'unit': 'Score',
            'label': f'/ {ceil_max}'
        }

class DatasetManager:
    """
    Manages the baseline sample dataset and uploaded session datasets.
    Provides inspection, smart column mapping, dynamic scale adaptation, and session deletion.
    """
    def __init__(self, original_excel_path: str):
        self.original_excel_path = original_excel_path
        self.original_service = DataService(
            excel_path=original_excel_path,
            dataset_id='original',
            dataset_name='Original Sample Dataset (1,200 Records)',
            academic_scale={
                'type': '4.0_gpa',
                'name': 'Standard 4.00 GPA Scale',
                'min': 2.0,
                'max': 4.0,
                'unit': 'GPA',
                'label': '/ 4.00 GPA'
            }
        )
        self.uploaded_service: Optional[DataService] = None
        self.uploaded_session_info: Optional[Dict[str, Any]] = None
        self.active_dataset_id: str = 'original'

    def get_service(self, dataset_id: Optional[str] = None) -> DataService:
        """Returns the appropriate DataService instance."""
        target_id = dataset_id or self.active_dataset_id
        if target_id == 'uploaded' and self.uploaded_service is not None:
            return self.uploaded_service
        return self.original_service

    def list_datasets(self) -> List[Dict[str, Any]]:
        """Returns the status and profile of available datasets."""
        orig_info = {
            'id': 'original',
            'name': 'Original Sample Dataset',
            'records': len(self.original_service.raw_data),
            'is_active': self.active_dataset_id == 'original',
            'scale': self.original_service.academic_scale,
            'capabilities': self.original_service.capabilities,
            'is_uploaded': False
        }
        res = [orig_info]
        if self.uploaded_service is not None and self.uploaded_session_info is not None:
            up_info = {
                'id': 'uploaded',
                'name': self.uploaded_session_info.get('filename', 'Uploaded Dataset'),
                'records': len(self.uploaded_service.raw_data),
                'is_active': self.active_dataset_id == 'uploaded',
                'scale': self.uploaded_service.academic_scale,
                'capabilities': self.uploaded_service.capabilities,
                'is_uploaded': True,
                'uploaded_at': self.uploaded_session_info.get('uploaded_at'),
                'mapping': self.uploaded_session_info.get('mapping')
            }
            res.append(up_info)
        return sanitize_data(res)

    def switch_dataset(self, target_id: str) -> Dict[str, Any]:
        """Switches active dataset between 'original' and 'uploaded'."""
        if target_id == 'uploaded':
            if self.uploaded_service is None:
                raise ValueError("No uploaded dataset is currently active. Please upload a file first.")
            self.active_dataset_id = 'uploaded'
        else:
            self.active_dataset_id = 'original'
        return {
            'success': True,
            'active_dataset_id': self.active_dataset_id,
            'dataset_name': self.get_service().dataset_name
        }

    def inspect_file(self, file_storage) -> Dict[str, Any]:
        """
        Validates and inspects an uploaded Excel (.xlsx, .xls) or CSV file.
        Returns file columns, sample rows, suggested mappings, and detected academic scale.
        """
        filename = getattr(file_storage, 'filename', 'uploaded_file.csv')
        ext = os.path.splitext(filename)[1].lower()
        if ext not in ['.xlsx', '.xls', '.csv']:
            raise ValueError(f"Unsupported file format '{ext}'. Please upload an Excel (.xlsx/.xls) or CSV (.csv) file.")

        session_id = str(uuid.uuid4())
        dest_filename = f"{session_id}{ext}"
        dest_path = os.path.join(UPLOAD_DIR, dest_filename)

        file_storage.save(dest_path)

        # Read into dataframe
        try:
            if ext in ['.xlsx', '.xls']:
                # Read first sheet using openpyxl or pandas
                wb = openpyxl.load_workbook(dest_path, read_only=True)
                sheet_names = wb.sheetnames
                wb.close()
                df = pd.read_excel(dest_path, sheet_name=sheet_names[0], engine='openpyxl')
            else:
                df = pd.read_csv(dest_path)
        except Exception as e:
            if os.path.exists(dest_path):
                os.remove(dest_path)
            raise ValueError(f"Failed to parse uploaded spreadsheet: {str(e)}")

        # Clean column names
        df.columns = [str(c).strip() for c in df.columns]
        raw_columns = list(df.columns)
        total_rows = len(df)
        if total_rows == 0:
            if os.path.exists(dest_path):
                os.remove(dest_path)
            raise ValueError("The uploaded spreadsheet is empty. Please provide a file with student records.")

        # Suggest mappings
        suggested_mapping: Dict[str, Optional[str]] = {}
        assigned_cols = set()

        # First pass: high confidence exact matches
        for canonical in CANONICAL_VARIABLES.keys():
            matched_col = None
            highest_score = 0.0
            for col in raw_columns:
                if col in assigned_cols:
                    continue
                match_canon, score = match_column(col)
                if match_canon == canonical and score > highest_score and score >= 0.7:
                    highest_score = score
                    matched_col = col
            if matched_col:
                suggested_mapping[canonical] = matched_col
                assigned_cols.add(matched_col)
            else:
                suggested_mapping[canonical] = None

        # Detect academic scale from suggested academic_performance column
        detected_scale = {
            'type': '4.0_gpa',
            'name': 'Standard 4.00 GPA Scale',
            'min': 0.0,
            'max': 4.0,
            'unit': 'GPA',
            'label': '/ 4.00 GPA'
        }
        gpa_col = suggested_mapping.get('academic_performance')
        if gpa_col and gpa_col in df.columns:
            detected_scale = detect_academic_scale(df[gpa_col])

        # Generate sample rows (5 records) for preview
        sample_preview = df.head(5).to_dict(orient='records')

        result = {
            'session_id': session_id,
            'filename': filename,
            'file_path': dest_path,
            'total_rows': total_rows,
            'columns': raw_columns,
            'suggested_mapping': suggested_mapping,
            'detected_scale': detected_scale,
            'sample_preview': sample_preview,
            'canonical_definitions': CANONICAL_VARIABLES
        }
        return sanitize_data(result)

    def apply_mapping(
        self,
        session_id: str,
        mapping: Dict[str, Optional[str]],
        scale_config: Optional[Dict[str, Any]] = None,
        custom_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Applies teacher-confirmed column mapping and scale configuration to the uploaded file.
        Instantiates DataService and sets it as the active dataset.
        """
        # Find file with session_id prefix in UPLOAD_DIR
        matched_files = [f for f in os.listdir(UPLOAD_DIR) if f.startswith(session_id)]
        if not matched_files:
            raise FileNotFoundError("Uploaded file session expired or not found. Please upload the file again.")

        file_path = os.path.join(UPLOAD_DIR, matched_files[0])
        ext = os.path.splitext(file_path)[1].lower()

        if ext in ['.xlsx', '.xls']:
            df = pd.read_excel(file_path, engine='openpyxl')
        else:
            df = pd.read_csv(file_path)

        df.columns = [str(c).strip() for c in df.columns]

        # Verify required variables
        gpa_col = mapping.get('academic_performance')
        sm_col = mapping.get('daily_social_media_hours')
        if not gpa_col or gpa_col not in df.columns:
            raise ValueError("Academic Performance / GPA column must be mapped.")
        if not sm_col or sm_col not in df.columns:
            raise ValueError("Daily Social Media / Screen Time Hours column must be mapped.")

        # Standardize dataframe with canonical columns
        standardized_df = pd.DataFrame()
        capabilities = {}

        for canonical_name, source_col in mapping.items():
            if source_col and source_col in df.columns:
                standardized_df[canonical_name] = df[source_col]
                capabilities[canonical_name] = True
            else:
                capabilities[canonical_name] = False

        # Scale configuration
        if not scale_config:
            scale_config = detect_academic_scale(standardized_df['academic_performance'])
        else:
            # Validate scale bounds
            s_min = float(scale_config.get('min', 0.0))
            s_max = float(scale_config.get('max', 4.0))
            if s_max <= s_min:
                s_max = s_min + 1.0
            scale_config['min'] = s_min
            scale_config['max'] = s_max
            scale_config['label'] = f"/ {s_max} {scale_config.get('unit', '')}".strip()

        dataset_name = custom_name or matched_files[0].split(session_id)[-1].lstrip('_-') or "Uploaded Dataset"

        # Instantiate DataService with standardized DataFrame
        self.uploaded_service = DataService(
            dataframe=standardized_df,
            dataset_id='uploaded',
            dataset_name=dataset_name,
            academic_scale=scale_config,
            capabilities=capabilities
        )

        import datetime
        self.uploaded_session_info = {
            'session_id': session_id,
            'file_path': file_path,
            'filename': dataset_name,
            'uploaded_at': datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'mapping': mapping,
            'scale': scale_config
        }
        self.active_dataset_id = 'uploaded'

        return sanitize_data({
            'success': True,
            'message': f"Dataset '{dataset_name}' successfully loaded and activated.",
            'dataset_id': 'uploaded',
            'dataset_name': dataset_name,
            'total_records': len(standardized_df),
            'scale': scale_config,
            'capabilities': capabilities
        })

    def delete_uploaded_dataset(self) -> Dict[str, Any]:
        """Cleans up uploaded file and session state, reverting active dataset to 'original'."""
        if self.uploaded_session_info and 'file_path' in self.uploaded_session_info:
            fp = self.uploaded_session_info['file_path']
            if os.path.exists(fp):
                try:
                    os.remove(fp)
                except Exception:
                    pass

        self.uploaded_service = None
        self.uploaded_session_info = None
        self.active_dataset_id = 'original'

        return {
            'success': True,
            'message': 'Uploaded dataset cleared. Reverted to Original Sample Dataset.',
            'active_dataset_id': 'original'
        }
