import os
import openpyxl
import pandas as pd
import numpy as np
from typing import Dict, Any, Optional, List, Tuple

DEFAULT_EXCEL_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "Teen_Mental_Health_Dataset.csv(6).xlsx"
)

def sanitize_data(obj: Any) -> Any:
    """
    Recursively replaces NaN, Infinity, and -Infinity with None (JSON null),
    and converts NumPy scalar types to native Python types for strict standard JSON compliance.
    """
    if obj is None:
        return None
    # Check bool FIRST because in Python bool is a subclass of int
    if isinstance(obj, (bool, np.bool_)):
        return bool(obj)
    if isinstance(obj, (float, np.floating)):
        if np.isnan(obj) or np.isinf(obj):
            return None
        return float(obj)
    if isinstance(obj, (int, np.integer)):
        return int(obj)
    if isinstance(obj, dict):
        return {str(k): sanitize_data(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple, set)):
        return [sanitize_data(v) for v in obj]
    return obj

def safe_round(val: Any, decimals: int = 2) -> Optional[float]:
    """Safely rounds float values, returning None if val is None, NaN, or Inf."""
    if val is None:
        return None
    try:
        f = float(val)
        if np.isnan(f) or np.isinf(f):
            return None
        return round(f, decimals)
    except (ValueError, TypeError):
        return None

class DataService:
    def __init__(
        self,
        excel_path: Optional[str] = None,
        dataframe: Optional[pd.DataFrame] = None,
        dataset_id: str = 'original',
        dataset_name: str = 'Original Sample Dataset (1,200 Records)',
        academic_scale: Optional[Dict[str, Any]] = None,
        capabilities: Optional[Dict[str, bool]] = None
    ):
        self.excel_path = excel_path or DEFAULT_EXCEL_PATH
        self.dataset_id = dataset_id
        self.dataset_name = dataset_name
        self._df: Optional[pd.DataFrame] = None

        # Academic scale configuration
        self.academic_scale = academic_scale or {
            'type': '4.0_gpa',
            'name': 'Standard 4.00 GPA Scale',
            'min': 2.0,
            'max': 4.0,
            'unit': 'GPA',
            'label': '/ 4.00 GPA'
        }

        if dataframe is not None:
            self._init_from_dataframe(dataframe, capabilities)
        else:
            self._load_data()

    def _init_from_dataframe(self, df: pd.DataFrame, capabilities: Optional[Dict[str, bool]] = None):
        """Initializes service from a standardized DataFrame."""
        df_copy = df.copy()
        df_copy.columns = [str(c).strip() for c in df_copy.columns]

        # Numeric conversions
        numeric_cols = [
            'age', 'daily_social_media_hours', 'sleep_hours', 'study_hours',
            'screen_time_before_sleep', 'academic_performance', 'physical_activity',
            'stress_level', 'anxiety_level', 'addiction_level', 'depression_label'
        ]
        for col in numeric_cols:
            if col in df_copy.columns:
                df_copy[col] = pd.to_numeric(df_copy[col], errors='coerce')

        # Categorical conversions
        categorical_cols = ['gender', 'platform_usage', 'social_interaction_level']
        for col in categorical_cols:
            if col in df_copy.columns:
                df_copy[col] = df_copy[col].astype(str).str.strip()

        self._df = df_copy

        if capabilities:
            self.capabilities = capabilities
        else:
            self.capabilities = {
                col: (col in df_copy.columns and df_copy[col].notna().sum() > 0)
                for col in numeric_cols + categorical_cols
            }

    def _load_data(self):
        """Loads and validates the baseline original dataset from Excel using openpyxl and pandas."""
        if not os.path.exists(self.excel_path):
            raise FileNotFoundError(f"Excel dataset not found at: {self.excel_path}")
        
        # Load workbook with openpyxl to verify sheets
        wb = openpyxl.load_workbook(self.excel_path, read_only=True)
        sheet_name = "Teen_Mental_Health_Dataset" if "Teen_Mental_Health_Dataset" in wb.sheetnames else wb.sheetnames[0]
        wb.close()
        
        # Read dataset sheet into pandas
        df = pd.read_excel(self.excel_path, sheet_name=sheet_name, engine="openpyxl")
        df.columns = [str(c).strip() for c in df.columns]
        
        numeric_cols = [
            'age', 'daily_social_media_hours', 'sleep_hours', 'screen_time_before_sleep',
            'academic_performance', 'physical_activity', 'stress_level', 'anxiety_level',
            'addiction_level', 'depression_label'
        ]
        for col in numeric_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
        
        categorical_cols = ['gender', 'platform_usage', 'social_interaction_level']
        for col in categorical_cols:
            if col in df.columns:
                df[col] = df[col].astype(str).str.strip()
        
        self._df = df
        self.capabilities = {
            'academic_performance': True,
            'daily_social_media_hours': True,
            'sleep_hours': True,
            'screen_time_before_sleep': True,
            'study_hours': False,  # Baseline original dataset does not have study hours
            'physical_activity': True,
            'stress_level': True,
            'anxiety_level': True,
            'addiction_level': True,
            'social_interaction_level': True,
            'age': True,
            'gender': True,
            'platform_usage': True,
            'depression_label': True
        }

    @property
    def raw_data(self) -> pd.DataFrame:
        if self._df is None:
            self._load_data()
        return self._df.copy()

    def get_filter_options(self) -> Dict[str, Any]:
        """Returns valid dynamic filter bounds and choices for the current dataset."""
        df = self.raw_data
        
        # Age options
        age_opts = {"min": 13, "max": 19, "options": []}
        if 'age' in df.columns and df['age'].dropna().count() > 0:
            age_series = df['age'].dropna()
            age_opts = {
                "min": int(age_series.min()),
                "max": int(age_series.max()),
                "options": sorted([int(x) for x in age_series.unique()])
            }

        # Gender options
        gender_opts = ["all"]
        if 'gender' in df.columns and df['gender'].dropna().count() > 0:
            gender_opts = ["all"] + sorted([g for g in df['gender'].dropna().unique().tolist() if g and g.lower() != 'nan'])

        # Platform options
        platform_opts = ["all"]
        if 'platform_usage' in df.columns and df['platform_usage'].dropna().count() > 0:
            platform_opts = ["all"] + sorted([p for p in df['platform_usage'].dropna().unique().tolist() if p and p.lower() != 'nan'])

        # Social media bounds
        sm_min, sm_max = 0.0, 8.0
        if 'daily_social_media_hours' in df.columns and df['daily_social_media_hours'].dropna().count() > 0:
            sm_series = df['daily_social_media_hours'].dropna()
            sm_min = float(sm_series.min())
            sm_max = float(sm_series.max())

        opts = {
            "dataset_id": self.dataset_id,
            "dataset_name": self.dataset_name,
            "academic_scale": self.academic_scale,
            "capabilities": self.capabilities,
            "age": age_opts,
            "gender": {"options": gender_opts},
            "platform": {"options": platform_opts},
            "social_media_hours": {
                "min": sm_min,
                "max": sm_max
            },
            "total_records": len(df)
        }
        return sanitize_data(opts)

    def filter_dataframe(self, filters: Dict[str, Any]) -> pd.DataFrame:
        """Applies interactive filter parameters to the current dataset."""
        df = self.raw_data
        if len(df) == 0:
            return df

        # Age filtering
        if 'age' in df.columns:
            age_min = filters.get('age_min')
            if age_min is not None:
                df = df[df['age'] >= int(age_min)]
            age_max = filters.get('age_max')
            if age_max is not None:
                df = df[df['age'] <= int(age_max)]
            ages = filters.get('ages')
            if ages and isinstance(ages, list) and len(ages) > 0:
                df = df[df['age'].isin([int(a) for a in ages])]

        # Gender filtering
        if 'gender' in df.columns:
            gender = filters.get('gender')
            if gender and gender.lower() != 'all':
                df = df[df['gender'].str.lower() == gender.lower()]

        # Platform filtering
        if 'platform_usage' in df.columns:
            platform = filters.get('platform')
            if platform and platform.lower() != 'all':
                df = df[df['platform_usage'].str.lower() == platform.lower()]

        # Social media hours range
        if 'daily_social_media_hours' in df.columns:
            sm_min = filters.get('social_media_min')
            if sm_min is not None:
                df = df[df['daily_social_media_hours'] >= float(sm_min)]
            sm_max = filters.get('social_media_max')
            if sm_max is not None:
                df = df[df['daily_social_media_hours'] <= float(sm_max)]

        return df

    def get_overview_kpis(self, filtered_df: pd.DataFrame) -> Dict[str, Any]:
        """Calculates headline KPI metrics with measurement descriptions."""
        total_in_full = len(self.raw_data)
        count = len(filtered_df)
        
        scale_label = self.academic_scale.get('label', '/ 4.00')

        if count == 0:
            return sanitize_data({
                "dataset_id": self.dataset_id,
                "dataset_name": self.dataset_name,
                "academic_scale": self.academic_scale,
                "capabilities": self.capabilities,
                "total_records": 0,
                "total_possible": total_in_full,
                "percentage_of_total": 0.0,
                "avg_social_media_hours": None,
                "avg_sleep_hours": None,
                "avg_academic_performance": None,
                "avg_screen_time_before_sleep": None,
                "avg_study_hours": None,
                "descriptions": self._get_metric_descriptions()
            })

        avg_sm = safe_round(filtered_df['daily_social_media_hours'].mean(), 2) if 'daily_social_media_hours' in filtered_df.columns else None
        avg_sleep = safe_round(filtered_df['sleep_hours'].mean(), 2) if 'sleep_hours' in filtered_df.columns else None
        avg_academic = safe_round(filtered_df['academic_performance'].mean(), 2) if 'academic_performance' in filtered_df.columns else None
        avg_screen_before_sleep = safe_round(filtered_df['screen_time_before_sleep'].mean(), 2) if 'screen_time_before_sleep' in filtered_df.columns else None
        avg_study = safe_round(filtered_df['study_hours'].mean(), 2) if 'study_hours' in filtered_df.columns else None
        pct_of_total = safe_round((count / total_in_full) * 100, 1) if total_in_full > 0 else 0.0

        res = {
            "dataset_id": self.dataset_id,
            "dataset_name": self.dataset_name,
            "academic_scale": self.academic_scale,
            "capabilities": self.capabilities,
            "total_records": count,
            "total_possible": total_in_full,
            "percentage_of_total": pct_of_total,
            "avg_social_media_hours": avg_sm,
            "avg_sleep_hours": avg_sleep,
            "avg_academic_performance": avg_academic,
            "avg_screen_time_before_sleep": avg_screen_before_sleep,
            "avg_study_hours": avg_study,
            "descriptions": self._get_metric_descriptions()
        }
        return sanitize_data(res)

    def _get_metric_descriptions(self) -> Dict[str, str]:
        scale_label = self.academic_scale.get('label', '/ 4.00')
        scale_name = self.academic_scale.get('name', '4.00 GPA Scale')
        return {
            "total_records": "The number of verified student records matching active filter criteria.",
            "avg_social_media_hours": "Mean self-reported daily time spent across social media platforms (hours/day).",
            "avg_sleep_hours": "Average nightly sleep duration reported by respondents (hours/night).",
            "avg_academic_performance": f"Average academic achievement evaluated on the {scale_name} ({scale_label}).",
            "avg_screen_time_before_sleep": "Average duration of digital device exposure immediately preceding bedtime (hours).",
            "avg_study_hours": "Average daily self-study or preparation time (hours/day)."
        }

    def get_social_media_analytics(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Provides distributions and correlations for social media habits."""
        # 1. Daily social media usage distribution (1-hr bins: 1-2, 2-3, ..., 7-8)
        bins = [1, 2, 3, 4, 5, 6, 7, 8.01]
        labels = ['1-2h', '2-3h', '3-4h', '4-5h', '5-6h', '6-7h', '7-8h']
        usage_distribution = []
        if 'daily_social_media_hours' in df.columns and len(df) > 0:
            binned = pd.cut(df['daily_social_media_hours'], bins=bins, labels=labels, right=False)
            vc = binned.value_counts()
            for lbl in labels:
                usage_distribution.append({
                    "range": lbl,
                    "count": int(vc.get(lbl, 0))
                })
        else:
            for lbl in labels:
                usage_distribution.append({"range": lbl, "count": 0})

        # 2. Platform usage comparison
        platform_available = self.capabilities.get('platform_usage', False) and 'platform_usage' in df.columns
        platform_comparison = []
        if platform_available:
            unique_platforms = [p for p in df['platform_usage'].dropna().unique().tolist() if p and p.lower() != 'nan']
            if not unique_platforms:
                unique_platforms = ['Instagram', 'TikTok', 'Both']
            for p in unique_platforms:
                sub = df[df['platform_usage'] == p] if len(df) > 0 else df
                p_count = len(sub)
                platform_comparison.append({
                    "platform_usage": p,
                    "count": p_count,
                    "avg_hours": safe_round(sub['daily_social_media_hours'].mean(), 2) if (p_count > 0 and 'daily_social_media_hours' in sub.columns) else None,
                    "avg_gpa": safe_round(sub['academic_performance'].mean(), 2) if (p_count > 0 and 'academic_performance' in sub.columns) else None,
                    "avg_sleep": safe_round(sub['sleep_hours'].mean(), 2) if (p_count > 0 and 'sleep_hours' in sub.columns) else None,
                    "percentage": safe_round((p_count / len(df) * 100), 1) if len(df) > 0 else 0.0
                })

        # 3. Age-wise social media usage
        age_available = self.capabilities.get('age', False) and 'age' in df.columns
        age_wise_usage = []
        if age_available and len(df) > 0:
            min_age = int(df['age'].dropna().min()) if df['age'].dropna().count() > 0 else 13
            max_age = int(df['age'].dropna().max()) if df['age'].dropna().count() > 0 else 19
            for a in range(min_age, max_age + 1):
                sub = df[df['age'] == a]
                a_count = len(sub)
                age_wise_usage.append({
                    "age": a,
                    "count": a_count,
                    "avg_hours": safe_round(sub['daily_social_media_hours'].mean(), 2) if (a_count > 0 and 'daily_social_media_hours' in sub.columns) else None,
                    "avg_gpa": safe_round(sub['academic_performance'].mean(), 2) if (a_count > 0 and 'academic_performance' in sub.columns) else None
                })

        # 4. Social media hours vs academic performance (binned tiers + scatter sample)
        tiers_def = [
            ('Low (1-3h)', 1.0, 3.0),
            ('Moderate (3-5h)', 3.0, 5.0),
            ('High (5-7h)', 5.0, 7.0),
            ('Intense (7-8h)', 7.0, 8.01)
        ]
        tier_summary = []
        if 'daily_social_media_hours' in df.columns and 'academic_performance' in df.columns:
            for t_label, t_low, t_high in tiers_def:
                if len(df) > 0:
                    sub = df[(df['daily_social_media_hours'] >= t_low) & (df['daily_social_media_hours'] < t_high)]
                else:
                    sub = df
                t_count = len(sub)
                tier_summary.append({
                    "tier": t_label,
                    "count": t_count,
                    "avg_gpa": safe_round(sub['academic_performance'].mean(), 2) if t_count > 0 else None,
                    "median_gpa": safe_round(sub['academic_performance'].median(), 2) if t_count > 0 else None
                })

        # Scatter sample (max 300 points)
        scatter_sample = []
        if len(df) > 0 and 'daily_social_media_hours' in df.columns and 'academic_performance' in df.columns:
            avail_cols = [c for c in ['daily_social_media_hours', 'academic_performance', 'gender', 'age', 'platform_usage'] if c in df.columns]
            sample_df = df[avail_cols].dropna(subset=['daily_social_media_hours', 'academic_performance'])
            scatter_sample = sample_df.sample(min(300, len(sample_df)), random_state=42).to_dict(orient='records')

        res = {
            "platform_available": platform_available,
            "age_available": age_available,
            "usage_distribution": usage_distribution,
            "platform_comparison": platform_comparison,
            "age_wise_usage": age_wise_usage,
            "tier_summary": tier_summary,
            "scatter_points": scatter_sample
        }
        return sanitize_data(res)

    def _get_academic_brackets(self) -> List[Tuple[str, float, float]]:
        """Generates dynamic academic performance brackets tailored to the dataset scale."""
        scale_type = self.academic_scale.get('type', '4.0_gpa')
        scale_max = float(self.academic_scale.get('max', 4.0))

        if scale_type == '4.0_gpa' or scale_max <= 4.05:
            return [
                ('2.00 - 2.49 (Satisfactory)', 2.0, 2.5),
                ('2.50 - 2.99 (Good)', 2.5, 3.0),
                ('3.00 - 3.49 (Very Good)', 3.0, 3.5),
                ('3.50 - 4.00 (Excellent)', 3.5, 4.01)
            ]
        elif scale_type == '10.0_cgpa' or (scale_max <= 10.05 and scale_max > 4.05):
            return [
                ('0.0 - 4.9 (Pass)', 0.0, 5.0),
                ('5.0 - 6.9 (Average)', 5.0, 7.0),
                ('7.0 - 8.4 (Good)', 7.0, 8.5),
                ('8.5 - 10.0 (Distinction)', 8.5, 10.01)
            ]
        elif scale_type == '100_percent' or scale_max > 50.0:
            return [
                ('< 50% (Remedial)', 0.0, 50.0),
                ('50% - 64% (Pass)', 50.0, 65.0),
                ('65% - 79% (Merit)', 65.0, 80.0),
                ('80% - 100% (Distinction)', 80.0, 100.01)
            ]
        elif scale_type == '50_marks' or (scale_max <= 50.05 and scale_max > 20.0):
            return [
                ('< 20 (Remedial)', 0.0, 20.0),
                ('20 - 29 (Pass)', 20.0, 30.0),
                ('30 - 39 (Good)', 30.0, 40.0),
                ('40 - 50 (Distinction)', 40.0, 50.01)
            ]
        else:
            # Custom partitions
            s_min = float(self.academic_scale.get('min', 0.0))
            step = (scale_max - s_min) / 4.0
            b1 = round(s_min + step, 1)
            b2 = round(s_min + 2 * step, 1)
            b3 = round(s_min + 3 * step, 1)
            b4 = round(scale_max, 1)
            return [
                (f"{s_min} - {b1} (Tier 1)", s_min, b1),
                (f"{b1} - {b2} (Tier 2)", b1, b2),
                (f"{b2} - {b3} (Tier 3)", b2, b3),
                (f"{b3} - {b4} (Tier 4)", b3, b4 + 0.01)
            ]

    def get_academic_analytics(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Provides academic distributions, study hours analytics, and comparisons."""
        brackets_def = self._get_academic_brackets()
        score_distribution = []
        if 'academic_performance' in df.columns:
            for g_label, g_low, g_high in brackets_def:
                if len(df) > 0:
                    sub = df[(df['academic_performance'] >= g_low) & (df['academic_performance'] < g_high)]
                else:
                    sub = df
                g_count = len(sub)
                pct = safe_round((g_count / len(df) * 100), 1) if len(df) > 0 else 0.0
                score_distribution.append({
                    "bracket": g_label,
                    "count": g_count,
                    "percentage": pct
                })

        # 2. Academic performance vs sleep duration
        sleep_available = self.capabilities.get('sleep_hours', False) and 'sleep_hours' in df.columns
        sleep_gpa = []
        if sleep_available:
            sleep_brackets_def = [
                ('4-5h', 4.0, 5.0),
                ('5-6h', 5.0, 6.0),
                ('6-7h', 6.0, 7.0),
                ('7-8h', 7.0, 8.0),
                ('8-9h', 8.0, 9.01)
            ]
            for s_label, s_low, s_high in sleep_brackets_def:
                if len(df) > 0:
                    sub = df[(df['sleep_hours'] >= s_low) & (df['sleep_hours'] < s_high)]
                else:
                    sub = df
                s_count = len(sub)
                sleep_gpa.append({
                    "sleep_bracket": s_label,
                    "count": s_count,
                    "avg_gpa": safe_round(sub['academic_performance'].mean(), 2) if (s_count > 0 and 'academic_performance' in sub.columns) else None
                })

        # 3. Academic performance vs screen time before sleep
        screen_sleep_available = self.capabilities.get('screen_time_before_sleep', False) and 'screen_time_before_sleep' in df.columns
        screen_sleep_gpa = []
        if screen_sleep_available:
            screen_brackets_def = [
                ('0.5-1.0h', 0.5, 1.0),
                ('1.0-1.5h', 1.0, 1.5),
                ('1.5-2.0h', 1.5, 2.0),
                ('2.0-2.5h', 2.0, 2.5),
                ('2.5-3.0h', 2.5, 3.01)
            ]
            for sc_label, sc_low, sc_high in screen_brackets_def:
                if len(df) > 0:
                    sub = df[(df['screen_time_before_sleep'] >= sc_low) & (df['screen_time_before_sleep'] < sc_high)]
                else:
                    sub = df
                sc_count = len(sub)
                screen_sleep_gpa.append({
                    "screen_sleep_bracket": sc_label,
                    "count": sc_count,
                    "avg_gpa": safe_round(sub['academic_performance'].mean(), 2) if (sc_count > 0 and 'academic_performance' in sub.columns) else None
                })

        # 4. Academic performance vs study hours (Only if study hours exists!)
        study_hours_exist = self.capabilities.get('study_hours', False) and 'study_hours' in df.columns
        study_hours_gpa = []
        study_scatter = []
        if study_hours_exist:
            study_brackets_def = [
                ('0-2h (Minimal)', 0.0, 2.0),
                ('2-4h (Moderate)', 2.0, 4.0),
                ('4-6h (Dedicated)', 4.0, 6.0),
                ('6h+ (Intensive)', 6.0, 24.01)
            ]
            for st_label, st_low, st_high in study_brackets_def:
                if len(df) > 0:
                    sub = df[(df['study_hours'] >= st_low) & (df['study_hours'] < st_high)]
                else:
                    sub = df
                st_count = len(sub)
                study_hours_gpa.append({
                    "study_bracket": st_label,
                    "count": st_count,
                    "avg_gpa": safe_round(sub['academic_performance'].mean(), 2) if (st_count > 0 and 'academic_performance' in sub.columns) else None
                })
            if len(df) > 0:
                avail_study_cols = [c for c in ['study_hours', 'academic_performance', 'gender', 'age'] if c in df.columns]
                sample_df = df[avail_study_cols].dropna(subset=['study_hours', 'academic_performance'])
                study_scatter = sample_df.sample(min(300, len(sample_df)), random_state=42).to_dict(orient='records')

        # Scatter points for GPA vs Sleep
        sleep_scatter = []
        if sleep_available and len(df) > 0:
            avail_sleep_cols = [c for c in ['sleep_hours', 'academic_performance', 'screen_time_before_sleep', 'gender'] if c in df.columns]
            sample_df = df[avail_sleep_cols].dropna(subset=['sleep_hours', 'academic_performance'])
            sleep_scatter = sample_df.sample(min(300, len(sample_df)), random_state=42).to_dict(orient='records')

        res = {
            "academic_scale": self.academic_scale,
            "score_distribution": score_distribution,
            "sleep_available": sleep_available,
            "screen_sleep_available": screen_sleep_available,
            "gpa_by_sleep_duration": sleep_gpa,
            "gpa_by_screen_before_sleep": screen_sleep_gpa,
            "sleep_scatter": sleep_scatter,
            "study_hours_info": {
                "exists": study_hours_exist,
                "note": "Study hours are available in this dataset. Academic vs. study duration analytics are active." if study_hours_exist else "The survey dataset does not contain a dedicated 'study_hours' column. Academic comparisons are conducted across daily screen time, screen time before sleep, and sleep duration."
            },
            "gpa_by_study_hours": study_hours_gpa,
            "study_scatter": study_scatter
        }
        return sanitize_data(res)

    def get_wellbeing_analytics(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Provides mental well-being, stress, anxiety, sleep, and physical activity analytics."""
        total_count = len(df)

        # 1. Stress level distribution
        stress_available = self.capabilities.get('stress_level', False) and 'stress_level' in df.columns
        stress_counts = []
        if stress_available:
            vc_stress = df['stress_level'].value_counts() if total_count > 0 else {}
            for lvl in range(1, 11):
                cnt = int(vc_stress.get(lvl, 0))
                pct = safe_round((cnt / total_count * 100), 1) if total_count > 0 else 0.0
                stress_counts.append({"level": lvl, "count": cnt, "percentage": pct})

        # 2. Anxiety level distribution
        anxiety_available = self.capabilities.get('anxiety_level', False) and 'anxiety_level' in df.columns
        anxiety_counts = []
        if anxiety_available:
            vc_anxiety = df['anxiety_level'].value_counts() if total_count > 0 else {}
            for lvl in range(1, 11):
                cnt = int(vc_anxiety.get(lvl, 0))
                pct = safe_round((cnt / total_count * 100), 1) if total_count > 0 else 0.0
                anxiety_counts.append({"level": lvl, "count": cnt, "percentage": pct})

        # 3. Addiction level distribution
        addiction_available = self.capabilities.get('addiction_level', False) and 'addiction_level' in df.columns
        addiction_counts = []
        if addiction_available:
            vc_addiction = df['addiction_level'].value_counts() if total_count > 0 else {}
            for lvl in range(1, 11):
                cnt = int(vc_addiction.get(lvl, 0))
                pct = safe_round((cnt / total_count * 100), 1) if total_count > 0 else 0.0
                addiction_counts.append({"level": lvl, "count": cnt, "percentage": pct})

        # 4. Social interaction level
        social_available = self.capabilities.get('social_interaction_level', False) and 'social_interaction_level' in df.columns
        social_counts = []
        if social_available:
            vc_social = df['social_interaction_level'].value_counts() if total_count > 0 else {}
            for s_lvl in ['low', 'medium', 'high']:
                cnt = int(vc_social.get(s_lvl, 0))
                pct = safe_round((cnt / total_count * 100), 1) if total_count > 0 else 0.0
                social_counts.append({"level": s_lvl, "count": cnt, "percentage": pct})

        # 5. Physical activity comparisons
        pa_available = self.capabilities.get('physical_activity', False) and 'physical_activity' in df.columns
        pa_gender = []
        pa_age = []
        if pa_available:
            if 'gender' in df.columns:
                for g in ['male', 'female']:
                    sub = df[df['gender'] == g] if total_count > 0 else df
                    g_count = len(sub)
                    pa_gender.append({
                        "gender": g,
                        "count": g_count,
                        "avg_physical_activity": safe_round(sub['physical_activity'].mean(), 2) if g_count > 0 else None,
                        "avg_stress": safe_round(sub['stress_level'].mean(), 2) if (g_count > 0 and 'stress_level' in sub.columns) else None,
                        "avg_anxiety": safe_round(sub['anxiety_level'].mean(), 2) if (g_count > 0 and 'anxiety_level' in sub.columns) else None
                    })
            if 'age' in df.columns and df['age'].dropna().count() > 0:
                min_age = int(df['age'].dropna().min())
                max_age = int(df['age'].dropna().max())
                for a in range(min_age, max_age + 1):
                    sub = df[df['age'] == a] if total_count > 0 else df
                    a_count = len(sub)
                    pa_age.append({
                        "age": a,
                        "count": a_count,
                        "avg_physical_activity": safe_round(sub['physical_activity'].mean(), 2) if a_count > 0 else None,
                        "avg_sleep": safe_round(sub['sleep_hours'].mean(), 2) if (a_count > 0 and 'sleep_hours' in sub.columns) else None
                    })

        # 6. Sleep patterns (sleep hours vs screen time before sleep)
        sleep_screen_available = ('screen_time_before_sleep' in df.columns and 'sleep_hours' in df.columns)
        screen_sleep_rel = []
        if sleep_screen_available:
            screen_brackets_def = [
                ('0.5-1.0h', 0.5, 1.0),
                ('1.0-1.5h', 1.0, 1.5),
                ('1.5-2.0h', 1.5, 2.0),
                ('2.0-2.5h', 2.0, 2.5),
                ('2.5-3.0h', 2.5, 3.01)
            ]
            for sc_lbl, sc_low, sc_high in screen_brackets_def:
                if total_count > 0:
                    sub = df[(df['screen_time_before_sleep'] >= sc_low) & (df['screen_time_before_sleep'] < sc_high)]
                else:
                    sub = df
                sc_count = len(sub)
                screen_sleep_rel.append({
                    "screen_bracket": sc_lbl,
                    "count": sc_count,
                    "avg_sleep_hours": safe_round(sub['sleep_hours'].mean(), 2) if sc_count > 0 else None,
                    "avg_stress": safe_round(sub['stress_level'].mean(), 2) if (sc_count > 0 and 'stress_level' in sub.columns) else None
                })

        # 7. Depression screening label
        dep_available = self.capabilities.get('depression_label', False) and 'depression_label' in df.columns
        dep_prevalence = {
            "available": dep_available,
            "flagged_count": 0,
            "unflagged_count": 0,
            "rate_percent": None,
            "ethical_note": "This binary indicator reflects aggregate statistical screening markers from survey responses and does not represent clinical medical diagnosis."
        }
        if dep_available:
            dep_counts = df['depression_label'].value_counts().to_dict() if total_count > 0 else {}
            flagged = int(dep_counts.get(1, 0))
            unflagged = int(dep_counts.get(0, 0))
            dep_prevalence.update({
                "flagged_count": flagged,
                "unflagged_count": unflagged,
                "rate_percent": safe_round((flagged / total_count * 100), 2) if total_count > 0 else None
            })

        res = {
            "stress_available": stress_available,
            "anxiety_available": anxiety_available,
            "addiction_available": addiction_available,
            "social_available": social_available,
            "physical_activity_available": pa_available,
            "sleep_screen_available": sleep_screen_available,
            "stress_distribution": stress_counts,
            "anxiety_distribution": anxiety_counts,
            "addiction_distribution": addiction_counts,
            "social_interaction": social_counts,
            "physical_activity_gender": pa_gender,
            "physical_activity_age": pa_age,
            "sleep_screen_relation": screen_sleep_rel,
            "depression_screening": dep_prevalence
        }
        return sanitize_data(res)

    def get_data_insights(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Calculates statistical correlations, descriptive stats, and research synthesis."""
        potential_numeric = [
            'daily_social_media_hours', 'screen_time_before_sleep', 'sleep_hours',
            'study_hours', 'academic_performance', 'physical_activity', 'stress_level',
            'anxiety_level', 'addiction_level', 'age'
        ]
        # Only evaluate numeric columns present in this dataset
        numeric_cols = [c for c in potential_numeric if c in df.columns]
        
        count = len(df)

        # 1. Pearson correlation matrix
        corr_dict: Dict[str, Dict[str, Optional[float]]] = {}
        gpa_corr: Dict[str, Optional[float]] = {}
        if count >= 2 and len(numeric_cols) > 1:
            try:
                corr = df[numeric_cols].corr()
                for col1 in numeric_cols:
                    corr_dict[col1] = {}
                    for col2 in numeric_cols:
                        val = corr.loc[col1, col2] if (col1 in corr.index and col2 in corr.columns) else None
                        corr_dict[col1][col2] = safe_round(val, 3)
                if 'academic_performance' in corr.index:
                    for col in numeric_cols:
                        if col != 'academic_performance':
                            val = corr.loc['academic_performance', col]
                            gpa_corr[col] = safe_round(val, 3)
            except Exception:
                corr_dict = {c1: {c2: None for c2 in numeric_cols} for c1 in numeric_cols}
                gpa_corr = {c: None for c in numeric_cols if c != 'academic_performance'}
        else:
            corr_dict = {c1: {c2: None for c2 in numeric_cols} for c1 in numeric_cols}
            gpa_corr = {c: None for c in numeric_cols if c != 'academic_performance'}

        # 2. Descriptive statistics table
        descriptive_stats = []
        for feature in numeric_cols:
            if count == 0:
                descriptive_stats.append({
                    "feature": feature,
                    "count": 0,
                    "mean": None,
                    "std": None,
                    "min": None,
                    "q25": None,
                    "median": None,
                    "q75": None,
                    "max": None
                })
            else:
                series = df[feature].dropna()
                cnt = len(series)
                descriptive_stats.append({
                    "feature": feature,
                    "count": cnt,
                    "mean": safe_round(series.mean(), 2) if cnt > 0 else None,
                    "std": safe_round(series.std(), 2) if cnt > 1 else None,
                    "min": safe_round(series.min(), 2) if cnt > 0 else None,
                    "q25": safe_round(series.quantile(0.25), 2) if cnt > 0 else None,
                    "median": safe_round(series.median(), 2) if cnt > 0 else None,
                    "q75": safe_round(series.quantile(0.75), 2) if cnt > 0 else None,
                    "max": safe_round(series.max(), 2) if cnt > 0 else None
                })

        # 3. Direct answers to Research Question
        evidence_list = []
        r_sm_gpa = gpa_corr.get('daily_social_media_hours')
        r_screen_sleep_gpa = gpa_corr.get('screen_time_before_sleep')
        r_sleep_gpa = gpa_corr.get('sleep_hours')
        r_study_gpa = gpa_corr.get('study_hours')

        if 'daily_social_media_hours' in numeric_cols:
            evidence_list.append({
                "factor": "Daily Social Media / Screen Time vs Academic Performance",
                "pearson_r": r_sm_gpa,
                "interpretation": f"Correlation (r = {r_sm_gpa if r_sm_gpa is not None else 'undefined'}). {'Negligible linear relationship observed.' if (r_sm_gpa is not None and abs(r_sm_gpa) < 0.1) else 'Calculated linear association.'}"
            })

        if 'study_hours' in numeric_cols:
            evidence_list.append({
                "factor": "Independent Study Hours vs Academic Performance",
                "pearson_r": r_study_gpa,
                "interpretation": f"Study hours correlation (r = {r_study_gpa if r_study_gpa is not None else 'undefined'}). Higher prep time generally associates positively with academic mastery."
            })

        if 'screen_time_before_sleep' in numeric_cols:
            evidence_list.append({
                "factor": "Screen Time Before Sleep vs Academic Performance",
                "pearson_r": r_screen_sleep_gpa,
                "interpretation": f"Pre-sleep screen correlation (r = {r_screen_sleep_gpa if r_screen_sleep_gpa is not None else 'undefined'}). Minor association with sleep onset."
            })

        if 'sleep_hours' in numeric_cols:
            evidence_list.append({
                "factor": "Sleep Duration vs Academic Performance",
                "pearson_r": r_sleep_gpa,
                "interpretation": f"Sleep duration correlation (r = {r_sleep_gpa if r_sleep_gpa is not None else 'undefined'}). Baseline sleep favors stability."
            })

        if count < 2:
            verdict = "Sample size is insufficient (N < 2) to evaluate statistical correlations for this specific cohort."
        else:
            verdict = "Analysis complete: bivariate Pearson correlations between screen time metrics and academic performance are summarized above."

        research_answer = {
            "question": "Does screen time influence students' academic performance?",
            "primary_verdict": verdict,
            "statistical_evidence": evidence_list,
            "correlation_vs_causation": (
                "Crucially, empirical correlation does not establish causation. A student spending extensive time on social media may maintain high marks due to unmeasured factors such as cognitive efficiency, independent study discipline, or parental support. Conversely, students with lower screen time might encounter difficulties due to non-digital learning hurdles."
            ),
            "dataset_limitations": [
                "Dataset captures a cross-sectional survey snapshot in time.",
                "Self-reported time estimates are subject to recall variance.",
                "Socioeconomic background and educational resource disparities are unobserved.",
                f"Academic performance is bounded within the {self.academic_scale.get('name', 'configured scale')}."
            ],
            "ethical_guidelines": (
                "All analyses are presented at population and aggregate cohort levels. Individual students are never diagnosed, labeled as mentally compromised, or individually targeted."
            )
        }

        res = {
            "correlation_matrix": corr_dict,
            "academic_correlations": gpa_corr,
            "descriptive_stats": descriptive_stats,
            "research_synthesis": research_answer
        }
        return sanitize_data(res)

    def generate_aggregate_csv(self, df: pd.DataFrame) -> str:
        """Generates anonymized aggregate summary analytics as CSV text."""
        # Find available grouping columns
        group_candidates = ['age', 'gender', 'platform_usage']
        group_cols = [c for c in group_candidates if (c in df.columns and self.capabilities.get(c, False))]

        if not group_cols or len(df) == 0:
            # Fallback to single row aggregate
            agg_dict = {'student_count': len(df)}
            for col in ['daily_social_media_hours', 'study_hours', 'sleep_hours', 'academic_performance']:
                if col in df.columns:
                    agg_dict[f'avg_{col}'] = safe_round(df[col].mean(), 2) if len(df) > 0 else None
            return pd.DataFrame([agg_dict]).to_csv(index=False)

        agg_rules = {'student_count': (group_cols[0], 'count')}
        for col in ['daily_social_media_hours', 'study_hours', 'sleep_hours', 'screen_time_before_sleep', 'academic_performance', 'physical_activity', 'stress_level', 'anxiety_level']:
            if col in df.columns:
                agg_rules[f'avg_{col}'] = (col, 'mean')

        agg = df.groupby(group_cols).agg(**agg_rules).round(2).reset_index()
        return agg.to_csv(index=False)
