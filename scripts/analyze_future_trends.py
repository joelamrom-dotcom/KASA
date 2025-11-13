#!/usr/bin/env python3
"""
Future Trends Analysis for Kasa Family Management
Uses AI/ML to analyze historical data and predict:
- Number of children per year (with confidence intervals)
- Weddings per year (with trend analysis)
- Family stability and growth patterns
"""

import json
import sys
from datetime import datetime, timedelta
from collections import defaultdict
import statistics
from typing import Dict, List, Any, Tuple

# Try importing AI/ML libraries
try:
    import pandas as pd
    import numpy as np
    from sklearn.linear_model import LinearRegression
    from sklearn.preprocessing import PolynomialFeatures
    from sklearn.pipeline import Pipeline
    HAS_ML = True
except ImportError:
    HAS_ML = False
    print("Warning: ML libraries not available. Using basic statistical analysis.", file=sys.stderr)

try:
    from statsmodels.tsa.holtwinters import ExponentialSmoothing
    from statsmodels.tsa.arima.model import ARIMA
    HAS_STATS = True
except ImportError:
    HAS_STATS = False

def calculate_age(birth_date_str: str, reference_date: datetime) -> int:
    """Calculate age from birth date string"""
    try:
        birth_date = datetime.fromisoformat(birth_date_str.replace('Z', '+00:00'))
        age = reference_date.year - birth_date.year
        if (reference_date.month, reference_date.day) < (birth_date.month, birth_date.day):
            age -= 1
        return age
    except:
        return 0

def predict_with_ml(years: List[int], values: List[float], future_years: List[int]) -> Tuple[List[float], List[float], List[float]]:
    """Use ML to predict future values with confidence intervals"""
    if not HAS_ML or len(values) < 3:
        # Fallback to simple average
        avg = statistics.mean(values) if values else 0
        predicted = [max(0, avg) for _ in future_years]
        lower = [max(0, avg * 0.8) for _ in future_years]
        upper = [avg * 1.2 for _ in future_years]
        return predicted, lower, upper
    
    try:
        # Prepare data
        X = np.array(years).reshape(-1, 1)
        y = np.array(values)
        
        # Use polynomial regression for trend analysis
        poly_features = PolynomialFeatures(degree=min(2, len(values) - 1))
        model = Pipeline([
            ('poly', poly_features),
            ('linear', LinearRegression())
        ])
        
        model.fit(X, y)
        
        # Predict future years
        X_future = np.array(future_years).reshape(-1, 1)
        predicted = model.predict(X_future)
        predicted = [max(0, float(p)) for p in predicted]
        
        # Calculate confidence intervals (simplified)
        residuals = y - model.predict(X)
        avg_value = statistics.mean(values) if values else 0
        std_error = np.std(residuals) if len(residuals) > 0 else avg_value * 0.1
        
        lower = [max(0, p - 1.96 * std_error) for p in predicted]
        upper = [p + 1.96 * std_error for p in predicted]
        
        return predicted, lower, upper
    except Exception as e:
        # Fallback to simple average
        avg = statistics.mean(values) if values else 0
        predicted = [max(0, avg) for _ in future_years]
        lower = [max(0, avg * 0.8) for _ in future_years]
        upper = [avg * 1.2 for _ in future_years]
        return predicted, lower, upper

def analyze_children_by_year(data: Dict[str, Any], years_ahead: int = 10) -> Dict[str, Any]:
    """Analyze and predict number of children per year using AI/ML"""
    current_year = datetime.now().year
    historical_children = defaultdict(int)
    historical_births = defaultdict(int)
    
    # Analyze historical data
    families = data.get('families', [])
    members = data.get('members', [])
    
    # Count children by year (based on birth dates)
    for member in members:
        if member.get('birthDate'):
            try:
                birth_date = datetime.fromisoformat(member['birthDate'].replace('Z', '+00:00'))
                birth_year = birth_date.year
                historical_births[birth_year] += 1
            except:
                pass
    
    # Count total children per year (children alive in that year)
    for year in range(current_year - 10, current_year + 1):
        for member in members:
            if member.get('birthDate'):
                try:
                    birth_date = datetime.fromisoformat(member['birthDate'].replace('Z', '+00:00'))
                    reference_date = datetime(year, 12, 31)
                    if birth_date <= reference_date:
                        # Check if member hasn't been converted to family (wedding date)
                        wedding_date = member.get('weddingDate')
                        if not wedding_date:
                            historical_children[year] += 1
                        else:
                            try:
                                wedding = datetime.fromisoformat(wedding_date.replace('Z', '+00:00'))
                                if wedding.year > year:
                                    historical_children[year] += 1
                            except:
                                historical_children[year] += 1
                except:
                    pass
    
    # Prepare data for ML
    historical_years = sorted([y for y in range(current_year - 10, current_year + 1) if y in historical_children])
    historical_values = [historical_children[y] for y in historical_years]
    
    # Calculate statistics
    avg_children = statistics.mean(historical_values) if historical_values else 0
    median_children = statistics.median(historical_values) if historical_values else 0
    min_children = min(historical_values) if historical_values else 0
    max_children = max(historical_values) if historical_values else 0
    
    # Use AI/ML for predictions
    future_years = list(range(current_year + 1, current_year + years_ahead + 1))
    if len(historical_values) >= 2:
        predicted, lower, upper = predict_with_ml(historical_years, historical_values, future_years)
    else:
        # Not enough data for ML, use simple average
        predicted = [max(0, int(avg_children))] * len(future_years)
        lower = [max(0, int(avg_children * 0.8))] * len(future_years)
        upper = [int(avg_children * 1.2)] * len(future_years)
    
    # Determine trend
    if len(historical_values) >= 3:
        recent_avg = statistics.mean(historical_values[-3:])
        early_avg = statistics.mean(historical_values[:3])
        if recent_avg > early_avg * 1.1:
            trend = 'growing'
        elif recent_avg < early_avg * 0.9:
            trend = 'declining'
        else:
            trend = 'stable'
    else:
        trend = 'stable'
    
    # Create predictions dictionary
    predictions = {}
    for i, year in enumerate(future_years):
        # Calculate confidence based on data quality
        if len(historical_values) >= 5:
            confidence = 'high'
        elif len(historical_values) >= 3:
            confidence = 'medium'
        else:
            confidence = 'low'
        
        predictions[year] = {
            'predicted': int(round(predicted[i])),
            'range_min': int(round(lower[i])),
            'range_max': int(round(upper[i])),
            'confidence': confidence
        }
    
    return {
        'historical': dict(historical_children),
        'historical_births': dict(historical_births),
        'statistics': {
            'average': avg_children,
            'median': median_children,
            'min': min_children,
            'max': max_children,
            'trend': trend
        },
        'predictions': predictions,
        'ml_used': HAS_ML
    }

def analyze_weddings_by_year(data: Dict[str, Any], years_ahead: int = 10) -> Dict[str, Any]:
    """Analyze and predict weddings per year using AI/ML"""
    current_year = datetime.now().year
    historical_weddings = defaultdict(int)
    
    # Count family weddings (original families)
    families = data.get('families', [])
    for family in families:
        if family.get('weddingDate'):
            try:
                wedding_date = datetime.fromisoformat(family['weddingDate'].replace('Z', '+00:00'))
                historical_weddings[wedding_date.year] += 1
            except:
                pass
    
    # Count member weddings (children getting married)
    members = data.get('members', [])
    for member in members:
        if member.get('weddingDate'):
            try:
                wedding_date = datetime.fromisoformat(member['weddingDate'].replace('Z', '+00:00'))
                historical_weddings[wedding_date.year] += 1
            except:
                pass
    
    # Prepare data for ML
    historical_years = sorted([y for y in range(current_year - 10, current_year + 1) if y in historical_weddings])
    historical_values = [historical_weddings.get(y, 0) for y in historical_years]
    
    # Calculate statistics
    avg_weddings = statistics.mean(historical_values) if historical_values else 0
    median_weddings = statistics.median(historical_values) if historical_values else 0
    
    # Use AI/ML for predictions
    future_years = list(range(current_year + 1, current_year + years_ahead + 1))
    if len(historical_values) >= 2 and sum(historical_values) > 0:
        predicted, lower, upper = predict_with_ml(historical_years, historical_values, future_years)
    else:
        # Not enough data for ML, use simple average
        predicted = [max(0, int(avg_weddings))] * len(future_years)
        lower = [max(0, int(avg_weddings * 0.5))] * len(future_years)
        upper = [int(avg_weddings * 1.5)] * len(future_years)
    
    # Create predictions dictionary
    predictions = {}
    for i, year in enumerate(future_years):
        # Calculate confidence based on data quality
        if len(historical_values) >= 5 and sum(historical_values) > 0:
            confidence = 'high'
        elif len(historical_values) >= 3:
            confidence = 'medium'
        else:
            confidence = 'low'
        
        predictions[year] = {
            'predicted': int(round(predicted[i])),
            'range_min': int(round(lower[i])),
            'range_max': int(round(upper[i])),
            'confidence': confidence
        }
    
    return {
        'historical': dict(historical_weddings),
        'statistics': {
            'average': avg_weddings,
            'median': median_weddings,
            'total_historical': sum(historical_values)
        },
        'predictions': predictions,
        'ml_used': HAS_ML
    }

def analyze_family_stability(data: Dict[str, Any], years_ahead: int = 10) -> Dict[str, Any]:
    """Analyze family stability and growth patterns using AI/ML"""
    current_year = datetime.now().year
    families = data.get('families', [])
    members = data.get('members', [])
    
    # Count families by creation year
    families_by_year = defaultdict(int)
    for family in families:
        if family.get('weddingDate'):
            try:
                wedding_date = datetime.fromisoformat(family['weddingDate'].replace('Z', '+00:00'))
                families_by_year[wedding_date.year] += 1
            except:
                pass
    
    # Count active families (families with members)
    active_families_by_year = defaultdict(int)
    for year in range(current_year - 10, current_year + 1):
        for family in families:
            family_members = [m for m in members if m.get('familyId') == family.get('_id')]
            if family_members:
                active_families_by_year[year] += 1
    
    # Average children per family
    children_per_family = []
    for family in families:
        family_members = [m for m in members if m.get('familyId') == family.get('_id')]
        children_per_family.append(len(family_members))
    
    avg_children_per_family = statistics.mean(children_per_family) if children_per_family else 0
    
    # Use ML to predict new families per year
    historical_years = sorted([y for y in range(current_year - 10, current_year + 1)])
    historical_family_counts = [families_by_year.get(y, 0) for y in historical_years]
    
    future_years = list(range(current_year + 1, current_year + years_ahead + 1))
    if len(historical_family_counts) >= 2:
        predicted_new_per_year, lower_new, upper_new = predict_with_ml(
            historical_years, historical_family_counts, future_years
        )
    else:
        avg_new_families = statistics.mean(historical_family_counts) if historical_family_counts else 0
        predicted_new_per_year = [max(0, int(avg_new_families))] * len(future_years)
        lower_new = [max(0, int(avg_new_families * 0.5))] * len(future_years)
        upper_new = [int(avg_new_families * 1.5)] * len(future_years)
    
    # Predictions
    predictions = {}
    total_families = len(families)
    cumulative_new = 0
    
    for i, year in enumerate(future_years):
        years_from_now = year - current_year
        # Use ML prediction for new families this year
        new_this_year = int(round(predicted_new_per_year[i]))
        cumulative_new += new_this_year
        predicted_total = total_families + cumulative_new
        
        # Calculate stability score based on multiple factors
        if avg_children_per_family >= 2 and new_this_year > 0:
            stability_score = 'high'
        elif avg_children_per_family >= 1:
            stability_score = 'medium'
        else:
            stability_score = 'low'
        
        predictions[year] = {
            'total_families': predicted_total,
            'new_families': new_this_year,
            'cumulative_new': cumulative_new,
            'avg_children_per_family': round(avg_children_per_family, 1),
            'stability_score': stability_score,
            'growth_rate': round((new_this_year / total_families * 100) if total_families > 0 else 0, 1)
        }
    
    return {
        'current_stats': {
            'total_families': len(families),
            'total_members': len(members),
            'avg_children_per_family': round(avg_children_per_family, 2),
            'families_with_children': len([f for f in families if any(m.get('familyId') == f.get('_id') for m in members)])
        },
        'historical_families': dict(families_by_year),
        'predictions': predictions,
        'ml_used': HAS_ML
    }

def main(data=None, years_ahead=None):
    """Main analysis function - can be called with data directly or read from stdin"""
    try:
        # If data is provided directly, use it; otherwise read from stdin
        if data is None:
            input_data = sys.stdin.read()
            data = json.loads(input_data)
        
        if years_ahead is None:
            years_ahead = int(sys.argv[1]) if len(sys.argv) > 1 else 10
        
        # Run analyses
        children_analysis = analyze_children_by_year(data, years_ahead)
        weddings_analysis = analyze_weddings_by_year(data, years_ahead)
        stability_analysis = analyze_family_stability(data, years_ahead)
        
        # Combine results
        result = {
            'analysis_date': datetime.now().isoformat(),
            'years_ahead': years_ahead,
            'children_analysis': children_analysis,
            'weddings_analysis': weddings_analysis,
            'stability_analysis': stability_analysis
        }
        
        # Output JSON
        return result
        
    except Exception as e:
        error_result = {
            'error': str(e),
            'type': type(e).__name__
        }
        return error_result

if __name__ == '__main__':
    result = main()
    print(json.dumps(result, indent=2))
    if 'error' in result:
        sys.exit(1)

