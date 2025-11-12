#!/usr/bin/env python3
"""
Future Trends Analysis for Kasa Family Management
Analyzes historical data to predict:
- Number of children per year
- Weddings per year
- Family stability and growth patterns
"""

import json
import sys
from datetime import datetime, timedelta
from collections import defaultdict
import statistics
from typing import Dict, List, Any

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

def analyze_children_by_year(data: Dict[str, Any], years_ahead: int = 10) -> Dict[str, Any]:
    """Analyze and predict number of children per year"""
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
    
    # Calculate statistics
    historical_values = [historical_children[y] for y in range(current_year - 10, current_year + 1) if y in historical_children]
    avg_children = statistics.mean(historical_values) if historical_values else 0
    median_children = statistics.median(historical_values) if historical_values else 0
    min_children = min(historical_values) if historical_values else 0
    max_children = max(historical_values) if historical_values else 0
    
    # Predictions for future years
    predictions = {}
    for year in range(current_year + 1, current_year + years_ahead + 1):
        # Simple linear projection based on average
        # Could be improved with trend analysis
        predicted = max(0, int(avg_children))
        predictions[year] = {
            'predicted': predicted,
            'range_min': max(0, int(predicted * 0.8)),
            'range_max': int(predicted * 1.2),
            'confidence': 'medium'
        }
    
    return {
        'historical': dict(historical_children),
        'historical_births': dict(historical_births),
        'statistics': {
            'average': avg_children,
            'median': median_children,
            'min': min_children,
            'max': max_children,
            'trend': 'stable' if len(set(historical_values[-3:])) <= 1 else 'growing' if historical_values[-1] > historical_values[0] else 'declining'
        },
        'predictions': predictions
    }

def analyze_weddings_by_year(data: Dict[str, Any], years_ahead: int = 10) -> Dict[str, Any]:
    """Analyze and predict weddings per year"""
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
    
    # Calculate statistics
    historical_values = [historical_weddings[y] for y in range(current_year - 10, current_year + 1) if y in historical_weddings]
    avg_weddings = statistics.mean(historical_values) if historical_values else 0
    median_weddings = statistics.median(historical_values) if historical_values else 0
    
    # Predictions for future years
    predictions = {}
    for year in range(current_year + 1, current_year + years_ahead + 1):
        predicted = max(0, int(avg_weddings))
        predictions[year] = {
            'predicted': predicted,
            'range_min': max(0, int(predicted * 0.5)),
            'range_max': int(predicted * 1.5),
            'confidence': 'medium'
        }
    
    return {
        'historical': dict(historical_weddings),
        'statistics': {
            'average': avg_weddings,
            'median': median_weddings,
            'total_historical': sum(historical_values)
        },
        'predictions': predictions
    }

def analyze_family_stability(data: Dict[str, Any], years_ahead: int = 10) -> Dict[str, Any]:
    """Analyze family stability and growth patterns"""
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
    
    # Predictions
    predictions = {}
    historical_family_counts = [families_by_year.get(y, 0) for y in range(current_year - 10, current_year + 1)]
    avg_new_families = statistics.mean(historical_family_counts) if historical_family_counts else 0
    
    total_families = len(families)
    for year in range(current_year + 1, current_year + years_ahead + 1):
        years_from_now = year - current_year
        predicted_new_families = int(avg_new_families * years_from_now)
        predicted_total = total_families + predicted_new_families
        
        predictions[year] = {
            'total_families': predicted_total,
            'new_families': predicted_new_families,
            'avg_children_per_family': round(avg_children_per_family, 1),
            'stability_score': 'high' if avg_children_per_family >= 2 else 'medium' if avg_children_per_family >= 1 else 'low'
        }
    
    return {
        'current_stats': {
            'total_families': len(families),
            'total_members': len(members),
            'avg_children_per_family': round(avg_children_per_family, 2),
            'families_with_children': len([f for f in families if any(m.get('familyId') == f.get('_id') for m in members)])
        },
        'historical_families': dict(families_by_year),
        'predictions': predictions
    }

def main():
    """Main analysis function"""
    try:
        # Read JSON data from stdin
        input_data = sys.stdin.read()
        data = json.loads(input_data)
        
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
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        error_result = {
            'error': str(e),
            'type': type(e).__name__
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)

if __name__ == '__main__':
    main()

