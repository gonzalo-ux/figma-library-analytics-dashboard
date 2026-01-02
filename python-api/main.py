#!/usr/bin/env python3
"""
Figma Analytics API
Generates CSV files from Figma library data using the Library Analytics API
"""

import argparse
import os
import sys
import csv
import requests
from datetime import datetime
from typing import Dict, List, Any, Optional
from collections import defaultdict
import json

# Figma API base URL
FIGMA_API_BASE = "https://api.figma.com/v1"


def fetch_figma_data(token: str, file_key: str) -> Dict[str, Any]:
    """Fetch file data from Figma API to get component metadata"""
    url = f"{FIGMA_API_BASE}/files/{file_key}"
    headers = {"X-Figma-Token": token}
    
    print(f"Fetching file data from Figma API for file: {file_key}")
    response = requests.get(url, headers=headers)
    
    if response.status_code != 200:
        raise Exception(f"Figma API error: {response.status_code} - {response.text}")
    
    return response.json()


def fetch_analytics_data(token: str, file_key: str, endpoint: str, group_by: str = "component", start_date: str = None, end_date: str = None) -> Optional[Dict[str, Any]]:
    """Fetch analytics data from Figma Library Analytics API with pagination support"""
    url = f"{FIGMA_API_BASE}/analytics/libraries/{file_key}/{endpoint}"
    headers = {"X-Figma-Token": token}
    base_params = {"group_by": group_by}
    
    # Add date filters if provided
    if start_date:
        base_params["start_date"] = start_date
    if end_date:
        base_params["end_date"] = end_date
    
    try:
        date_range = ""
        if start_date or end_date:
            date_range = f" (from {start_date or 'beginning'} to {end_date or 'today'})"
        print(f"Fetching {endpoint} data (grouped by {group_by}){date_range}...")
        if start_date or end_date:
            print(f"   API params: {base_params}")
        
        # Handle pagination - collect all pages of data
        all_data = []
        cursor = None
        page_num = 1
        
        while True:
            params = base_params.copy()
            if cursor:
                params["cursor"] = cursor
            
            response = requests.get(url, headers=headers, params=params, timeout=30)
            
            if response.status_code == 200:
                try:
                    page_data = response.json()
                    
                    # Extract data from this page
                    page_records = []
                    if isinstance(page_data, dict):
                        if 'data' in page_data:
                            page_records = page_data.get('data', [])
                        elif 'results' in page_data:
                            page_records = page_data.get('results', [])
                        else:
                            # Try to find any list field
                            for key, value in page_data.items():
                                if isinstance(value, list) and key != 'cursor':
                                    page_records = value
                                    break
                    elif isinstance(page_data, list):
                        page_records = page_data
                    
                    all_data.extend(page_records)
                    print(f"   Page {page_num}: Found {len(page_records)} records (total so far: {len(all_data)})")
                    
                    # Check for pagination
                    has_next_page = False
                    if isinstance(page_data, dict):
                        has_next_page = page_data.get('next_page', False)
                        cursor = page_data.get('cursor')
                    
                    if not has_next_page or not cursor:
                        break
                    
                    page_num += 1
                    
                except json.JSONDecodeError as e:
                    print(f"⚠️  Warning: Failed to parse JSON response: {str(e)}")
                    print(f"   Response text (first 500 chars): {response.text[:500]}")
                    return None
            elif response.status_code == 403:
                print(f"⚠️  Warning: Library Analytics API not available (403 Forbidden).")
                print(f"   This requires Figma Enterprise plan and library_analytics:read scope.")
                print(f"   Response: {response.text[:200]}")
                return None
            elif response.status_code == 404:
                print(f"⚠️  Warning: Analytics endpoint not found (404).")
                print(f"   The library may not have analytics enabled or the endpoint doesn't exist.")
                print(f"   Response: {response.text[:200]}")
                return None
            else:
                print(f"⚠️  Warning: Analytics API error {response.status_code}")
                print(f"   Response: {response.text[:500]}")
                # Break out of pagination loop on error
                break
        
        if len(all_data) > 0:
            print(f"✅ Successfully fetched {endpoint} data: {len(all_data)} total records across {page_num} page(s)")
            if len(all_data) > 0:
                # Show first record structure for debugging
                first_record = all_data[0]
                print(f"   Sample record keys: {list(first_record.keys())[:5]}")
            # Return in the expected format
            return {"data": all_data}
        else:
            print(f"⚠️  No data returned from {endpoint}")
            return None
                
    except requests.exceptions.Timeout:
        print(f"⚠️  Warning: Request timeout when fetching {endpoint}")
        return None
    except Exception as e:
        print(f"⚠️  Warning: Failed to fetch analytics data: {str(e)}")
        import traceback
        print(f"   Traceback: {traceback.format_exc()}")
        return None


def get_component_metadata(file_data: Dict[str, Any]):
    """Extract component metadata (name, component_set) from file data"""
    metadata = {}
    
    # Extract components
    components = file_data.get("components", {})
    print(f"   Found {len(components)} components in file metadata")
    
    for component_key, component in components.items():
        component_name = component.get("name", "")
        component_set_name = component.get("componentSetId", "")
        
        # If component_set_name is an ID, try to find the actual name
        if component_set_name:
            component_sets = file_data.get("componentSets", {})
            if component_set_name in component_sets:
                component_set_name = component_sets[component_set_name].get("name", component_set_name)
            else:
                # If not found, use empty string
                component_set_name = ""
        
        metadata[component_key] = {
            "name": component_name,
            "component_set": component_set_name
        }
    
    # Also create a reverse lookup by name (in case keys don't match)
    name_to_key = {}
    for key, data in metadata.items():
        name = data.get("name", "")
        if name:
            # Store first occurrence (components can have same name)
            if name not in name_to_key:
                name_to_key[name] = key
    
    print(f"   Mapped {len(metadata)} component keys to names")
    return metadata, name_to_key


def get_component_name(component_key: str, component_metadata: Dict[str, Dict[str, str]], name_to_key: Dict[str, str], item: Dict[str, Any]):
    """Get component name and set name from various sources"""
    # Try direct key lookup first
    if component_key in component_metadata:
        metadata = component_metadata[component_key]
        return metadata.get('name', component_key), metadata.get('component_set', '')
    
    # Try to get name directly from analytics API response
    component_name = item.get('component_name', '')
    if component_name:
        # If we have a name, try to find the component_set from metadata
        if component_name in name_to_key:
            key = name_to_key[component_name]
            metadata = component_metadata.get(key, {})
            component_set_name = metadata.get('component_set', '')
            return component_name, component_set_name
        return component_name, ''
    
    # Fallback: use key as name
    return component_key, ''


def generate_actions_by_component_csv(output_dir: str, token: str, file_key: str, component_metadata: Dict[str, Dict[str, str]], name_to_key: Dict[str, str], start_date: str = None, end_date: str = None):
    """Generate actions_by_component.csv from component actions grouped by component"""
    filepath = os.path.join(output_dir, 'actions_by_component.csv')
    
    analytics_data = fetch_analytics_data(token, file_key, "component/actions", "component", start_date, end_date)
    
    row_count = 0
    filtered_count = 0
    unmatched_keys = set()
    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['component_name', 'component_set_name', 'week', 'insertions', 'detachments'])
        
        if analytics_data:
            # Handle different possible response structures
            data_list = []
            if isinstance(analytics_data, dict):
                if 'data' in analytics_data:
                    data_list = analytics_data['data']
                elif 'results' in analytics_data:
                    data_list = analytics_data['results']
                else:
                    # Try to find any list in the response
                    for key, value in analytics_data.items():
                        if isinstance(value, list):
                            data_list = value
                            print(f"   Using '{key}' as data source")
                            break
            
            if isinstance(analytics_data, list):
                data_list = analytics_data
            
            for item in data_list:
                if not isinstance(item, dict):
                    continue
                    
                component_key = item.get('component_key', '')
                week = item.get('week', '')
                insertions = item.get('insertions', 0)
                detachments = item.get('detachments', 0)
                
                # Filter by date range if provided
                if start_date and end_date and week:
                    try:
                        week_date = datetime.strptime(week, "%Y-%m-%d")
                        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
                        end_dt = datetime.strptime(end_date, "%Y-%m-%d")
                        # Skip if outside date range (inclusive boundaries)
                        if week_date < start_dt:
                            filtered_count += 1
                            if filtered_count <= 3:  # Debug: show first few filtered dates
                                print(f"   ⚠️  Filtering out {week} (before {start_date})")
                            continue
                        if week_date > end_dt:
                            filtered_count += 1
                            if filtered_count <= 3:  # Debug: show first few filtered dates
                                print(f"   ⚠️  Filtering out {week} (after {end_date})")
                            continue
                    except (ValueError, TypeError) as e:
                        # If date parsing fails, include the row (don't filter)
                        # This handles cases where week might be in a different format
                        print(f"   ⚠️  Could not parse date '{week}': {e}")
                        pass
                
                # Get component name and set name
                component_name, component_set_name = get_component_name(
                    component_key, component_metadata, name_to_key, item
                )
                
                # Track unmatched keys for debugging
                if component_name == component_key and component_key not in component_metadata:
                    unmatched_keys.add(component_key)
                
                writer.writerow([component_name, component_set_name, week, insertions, detachments])
                row_count += 1
    
    if unmatched_keys and len(unmatched_keys) <= 10:
        print(f"   ⚠️  {len(unmatched_keys)} component keys not found in metadata (showing first few): {list(unmatched_keys)[:5]}")
    elif unmatched_keys:
        print(f"   ⚠️  {len(unmatched_keys)} component keys not found in metadata")
    
    if filtered_count > 0:
        print(f"   📅 Filtered out {filtered_count} rows outside date range ({start_date} to {end_date})")
    
    if row_count == 0:
        print(f"⚠️  Generated: actions_by_component.csv (empty - no data available)")
    else:
        print(f"✅ Generated: actions_by_component.csv ({row_count} rows)")


def generate_actions_by_team_csv(output_dir: str, token: str, file_key: str, start_date: str = None, end_date: str = None):
    """Generate actions_by_team.csv from component actions grouped by team"""
    filepath = os.path.join(output_dir, 'actions_by_team.csv')
    
    analytics_data = fetch_analytics_data(token, file_key, "component/actions", "team", start_date, end_date)
    
    row_count = 0
    filtered_count = 0
    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['team_name', 'week', 'insertions', 'detachments'])
        
        if analytics_data:
            data_list = []
            if isinstance(analytics_data, dict):
                data_list = analytics_data.get('data', analytics_data.get('results', []))
            elif isinstance(analytics_data, list):
                data_list = analytics_data
            
            for item in data_list:
                if not isinstance(item, dict):
                    continue
                team_name = item.get('team_name', 'Unknown Team')
                week = item.get('week', '')
                insertions = item.get('insertions', 0)
                detachments = item.get('detachments', 0)
                
                # Filter by date range if provided
                if start_date and end_date and week:
                    try:
                        week_date = datetime.strptime(week, "%Y-%m-%d")
                        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
                        end_dt = datetime.strptime(end_date, "%Y-%m-%d")
                        # Skip if outside date range (inclusive boundaries)
                        if week_date < start_dt:
                            filtered_count += 1
                            if filtered_count <= 3:  # Debug: show first few filtered dates
                                print(f"   ⚠️  Filtering out {week} (before {start_date})")
                            continue
                        if week_date > end_dt:
                            filtered_count += 1
                            if filtered_count <= 3:  # Debug: show first few filtered dates
                                print(f"   ⚠️  Filtering out {week} (after {end_date})")
                            continue
                    except (ValueError, TypeError) as e:
                        # If date parsing fails, include the row (don't filter)
                        # This handles cases where week might be in a different format
                        print(f"   ⚠️  Could not parse date '{week}': {e}")
                        pass
                
                writer.writerow([team_name, week, insertions, detachments])
                row_count += 1
    
    if filtered_count > 0:
        print(f"   📅 Filtered out {filtered_count} rows outside date range ({start_date} to {end_date})")
    
    if row_count == 0:
        print(f"⚠️  Generated: actions_by_team.csv (empty - no data available)")
    else:
        print(f"✅ Generated: actions_by_team.csv ({row_count} rows)")


def generate_usages_by_component_csv(output_dir: str, token: str, file_key: str, component_metadata: Dict[str, Dict[str, str]], name_to_key: Dict[str, str], start_date: str = None, end_date: str = None):
    """Generate usages_by_component.csv from component usages grouped by component"""
    filepath = os.path.join(output_dir, 'usages_by_component.csv')
    
    # Fetch data grouped by component to get per-component, per-file breakdown
    # Note: usages endpoint may not support date filtering, but we'll pass it anyway
    analytics_data = fetch_analytics_data(token, file_key, "component/usages", "component", start_date, end_date)
    
    # Aggregate data: track instances, unique files, and unique teams per component
    component_stats = defaultdict(lambda: {
        'instances': 0,
        'files': set(),
        'teams': set(),
        'component_set': ''
    })
    
    if analytics_data and 'data' in analytics_data:
        for item in analytics_data['data']:
            component_key = item.get('component_key', '')
            file_name = item.get('file_name', 'Unknown File')
            team_name = item.get('team_name', 'Unknown Team')
            instances = item.get('instances', 0)
            
            # Get component metadata
            metadata = component_metadata.get(component_key, {})
            component_name = metadata.get('name', component_key)
            component_set_name = metadata.get('component_set', '')
            
            stats = component_stats[component_name]
            stats['instances'] += instances
            stats['files'].add(file_name)
            stats['teams'].add(team_name)
            if component_set_name:
                stats['component_set'] = component_set_name
    
    # Write per-file rows (as defined by CSV header: component_name, component_set_name, file_name, instances)
    # The frontend UsagesTable aggregates these, but expects num_instances, num_teams_using, num_files_using
    # We'll write the raw data and the component will aggregate it
    row_count = 0
    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['component_name', 'component_set_name', 'file_name', 'instances'])
        
        if analytics_data:
            data_list = []
            if isinstance(analytics_data, dict):
                data_list = analytics_data.get('data', analytics_data.get('results', []))
            elif isinstance(analytics_data, list):
                data_list = analytics_data
            
            for item in data_list:
                if not isinstance(item, dict):
                    continue
                component_key = item.get('component_key', '')
                file_name = item.get('file_name', 'Unknown File')
                instances = item.get('instances', 0)
                
                # Get component name and set name
                component_name, component_set_name = get_component_name(
                    component_key, component_metadata, name_to_key, item
                )
                
                writer.writerow([component_name, component_set_name, file_name, instances])
                row_count += 1
    
    if row_count == 0:
        print(f"⚠️  Generated: usages_by_component.csv (empty - no data available)")
    else:
        print(f"✅ Generated: usages_by_component.csv ({row_count} rows)")


def generate_usages_by_file_csv(output_dir: str, token: str, file_key: str, start_date: str = None, end_date: str = None):
    """Generate usages_by_file.csv from component usages grouped by file"""
    filepath = os.path.join(output_dir, 'usages_by_file.csv')
    
    # Fetch data grouped by file to get per-file breakdown
    # Note: usages endpoint may not support date filtering, but we'll pass it anyway
    analytics_data = fetch_analytics_data(token, file_key, "component/usages", "file", start_date, end_date)
    
    # Aggregate data by file (and team/workspace if available)
    file_data = defaultdict(lambda: {
        'component_count': 0,
        'total_instances': 0,
        'team_name': '',
        'workspace_name': ''
    })
    component_keys_seen = defaultdict(set)
    
    if analytics_data:
        data_list = []
        if isinstance(analytics_data, dict):
            data_list = analytics_data.get('data', analytics_data.get('results', []))
        elif isinstance(analytics_data, list):
            data_list = analytics_data
        
        for item in data_list:
            if not isinstance(item, dict):
                continue
            file_name = item.get('file_name', 'Unknown File')
            component_key = item.get('component_key', '')
            instances = item.get('instances', 0)
            team_name = item.get('team_name', '')
            workspace_name = item.get('workspace_name', '')
            
            file_key = file_name  # Use file_name as key
            file_data[file_key]['total_instances'] += instances
            if component_key not in component_keys_seen[file_key]:
                file_data[file_key]['component_count'] += 1
                component_keys_seen[file_key].add(component_key)
            if team_name and not file_data[file_key]['team_name']:
                file_data[file_key]['team_name'] = team_name
            if workspace_name and not file_data[file_key]['workspace_name']:
                file_data[file_key]['workspace_name'] = workspace_name
    
    row_count = 0
    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        # Frontend expects: file_name, component_count, total_instances
        # But FileUsagesTable also uses: team_name, workspace_name, num_instances
        # We'll write the basic format, and if team/workspace data is available, we can extend
        writer.writerow(['file_name', 'component_count', 'total_instances'])
        
        for file_name, data in file_data.items():
            writer.writerow([file_name, data['component_count'], data['total_instances']])
            row_count += 1
    
    if row_count == 0:
        print(f"⚠️  Generated: usages_by_file.csv (empty - no data available)")
    else:
        print(f"✅ Generated: usages_by_file.csv ({row_count} rows)")


def generate_variable_actions_by_team_csv(output_dir: str, token: str, file_key: str, start_date: str = None, end_date: str = None):
    """Generate variable_actions_by_team.csv from variable actions grouped by team"""
    filepath = os.path.join(output_dir, 'variable_actions_by_team.csv')
    
    analytics_data = fetch_analytics_data(token, file_key, "variable/actions", "team", start_date, end_date)
    
    row_count = 0
    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['team_name', 'variable_name', 'actions'])
        
        if analytics_data:
            data_list = []
            if isinstance(analytics_data, dict):
                data_list = analytics_data.get('data', analytics_data.get('results', []))
            elif isinstance(analytics_data, list):
                data_list = analytics_data
            
            for item in data_list:
                if not isinstance(item, dict):
                    continue
                team_name = item.get('team_name', 'Unknown Team')
                variable_name = item.get('variable_name', 'Unknown Variable')
                actions = item.get('actions', 0)
                
                writer.writerow([team_name, variable_name, actions])
                row_count += 1
    
    if row_count == 0:
        print(f"⚠️  Generated: variable_actions_by_team.csv (empty - no data available)")
    else:
        print(f"✅ Generated: variable_actions_by_team.csv ({row_count} rows)")


def generate_variable_actions_by_variable_csv(output_dir: str, token: str, file_key: str, start_date: str = None, end_date: str = None):
    """Generate variable_actions_by_variable.csv from variable actions grouped by variable"""
    filepath = os.path.join(output_dir, 'variable_actions_by_variable.csv')
    
    analytics_data = fetch_analytics_data(token, file_key, "variable/actions", "variable", start_date, end_date)
    
    row_count = 0
    filtered_count = 0
    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['variable_key', 'week', 'detachments', 'insertions', 'variable_name', 'variable_type', 'collection_key', 'collection_name'])
        
        if analytics_data:
            data_list = []
            if isinstance(analytics_data, dict):
                data_list = analytics_data.get('data', analytics_data.get('results', []))
            elif isinstance(analytics_data, list):
                data_list = analytics_data
            
            for item in data_list:
                if not isinstance(item, dict):
                    continue
                
                variable_key = item.get('variable_key', '')
                week = item.get('week', '')
                detachments = item.get('detachments', 0)
                insertions = item.get('insertions', 0)
                variable_name = item.get('variable_name', '')
                variable_type = item.get('variable_type', '')
                collection_key = item.get('collection_key', '')
                collection_name = item.get('collection_name', '')
                
                # Filter by date range if provided
                if start_date and end_date and week:
                    try:
                        week_date = datetime.strptime(week, "%Y-%m-%d")
                        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
                        end_dt = datetime.strptime(end_date, "%Y-%m-%d")
                        # Skip if outside date range (inclusive boundaries)
                        if week_date < start_dt:
                            filtered_count += 1
                            if filtered_count <= 3:  # Debug: show first few filtered dates
                                print(f"   ⚠️  Filtering out {week} (before {start_date})")
                            continue
                        if week_date > end_dt:
                            filtered_count += 1
                            if filtered_count <= 3:  # Debug: show first few filtered dates
                                print(f"   ⚠️  Filtering out {week} (after {end_date})")
                            continue
                    except (ValueError, TypeError) as e:
                        # If date parsing fails, include the row (don't filter)
                        # This handles cases where week might be in a different format
                        print(f"   ⚠️  Could not parse date '{week}': {e}")
                        pass
                
                writer.writerow([variable_key, week, detachments, insertions, variable_name, variable_type, collection_key, collection_name])
                row_count += 1
    
    if filtered_count > 0:
        print(f"   📅 Filtered out {filtered_count} rows outside date range ({start_date} to {end_date})")
    
    if row_count == 0:
        print(f"⚠️  Generated: variable_actions_by_variable.csv (empty - no data available)")
    else:
        print(f"✅ Generated: variable_actions_by_variable.csv ({row_count} rows)")


def generate_styles_actions_by_style_csv(output_dir: str, token: str, file_key: str, start_date: str = None, end_date: str = None):
    """Generate styles_actions_by_style.csv from style actions grouped by style"""
    filepath = os.path.join(output_dir, 'styles_actions_by_style.csv')
    
    analytics_data = fetch_analytics_data(token, file_key, "style/actions", "style", start_date, end_date)
    
    row_count = 0
    filtered_count = 0
    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['style_key', 'week', 'detachments', 'insertions', 'style_name', 'style_type'])
        
        if analytics_data:
            data_list = []
            if isinstance(analytics_data, dict):
                data_list = analytics_data.get('data', analytics_data.get('results', []))
            elif isinstance(analytics_data, list):
                data_list = analytics_data
            
            for item in data_list:
                if not isinstance(item, dict):
                    continue
                
                style_key = item.get('style_key', '')
                week = item.get('week', '')
                detachments = item.get('detachments', 0)
                insertions = item.get('insertions', 0)
                style_name = item.get('style_name', '')
                style_type = item.get('style_type', '')
                
                # Filter by date range if provided
                if start_date and end_date and week:
                    try:
                        week_date = datetime.strptime(week, "%Y-%m-%d")
                        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
                        end_dt = datetime.strptime(end_date, "%Y-%m-%d")
                        # Skip if outside date range (inclusive boundaries)
                        if week_date < start_dt:
                            filtered_count += 1
                            if filtered_count <= 3:  # Debug: show first few filtered dates
                                print(f"   ⚠️  Filtering out {week} (before {start_date})")
                            continue
                        if week_date > end_dt:
                            filtered_count += 1
                            if filtered_count <= 3:  # Debug: show first few filtered dates
                                print(f"   ⚠️  Filtering out {week} (after {end_date})")
                            continue
                    except (ValueError, TypeError) as e:
                        # If date parsing fails, include the row (don't filter)
                        # This handles cases where week might be in a different format
                        print(f"   ⚠️  Could not parse date '{week}': {e}")
                        pass
                
                writer.writerow([style_key, week, detachments, insertions, style_name, style_type])
                row_count += 1
    
    if filtered_count > 0:
        print(f"   📅 Filtered out {filtered_count} rows outside date range ({start_date} to {end_date})")
    
    if row_count == 0:
        print(f"⚠️  Generated: styles_actions_by_style.csv (empty - no data available)")
    else:
        print(f"✅ Generated: styles_actions_by_style.csv ({row_count} rows)")


def generate_styles_usages_by_style_csv(output_dir: str, token: str, file_key: str, start_date: str = None, end_date: str = None):
    """Generate styles_usages_by_style.csv from style usages grouped by style"""
    filepath = os.path.join(output_dir, 'styles_usages_by_style.csv')
    
    # Fetch data grouped by style to get per-style, per-file breakdown
    # Note: usages endpoint may not support date filtering, but we'll pass it anyway
    analytics_data = fetch_analytics_data(token, file_key, "style/usages", "style", start_date, end_date)
    
    row_count = 0
    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['style_name', 'style_type', 'file_name', 'instances'])
        
        if analytics_data:
            data_list = []
            if isinstance(analytics_data, dict):
                data_list = analytics_data.get('data', analytics_data.get('results', []))
            elif isinstance(analytics_data, list):
                data_list = analytics_data
            
            for item in data_list:
                if not isinstance(item, dict):
                    continue
                style_key = item.get('style_key', '')
                style_name = item.get('style_name', '')
                style_type = item.get('style_type', '')
                file_name = item.get('file_name', 'Unknown File')
                instances = item.get('instances', 0)
                
                writer.writerow([style_name, style_type, file_name, instances])
                row_count += 1
    
    if row_count == 0:
        print(f"⚠️  Generated: styles_usages_by_style.csv (empty - no data available)")
    else:
        print(f"✅ Generated: styles_usages_by_style.csv ({row_count} rows)")


def generate_csv_files(data: Dict[str, Any], output_dir: str, token: str, file_key: str):
    """Generate all CSV files from Figma analytics data"""
    
    # Ensure output directory exists
    print(f"\n📁 Output directory: {output_dir}")
    print(f"📁 Output directory (absolute): {os.path.abspath(output_dir)}")
    os.makedirs(output_dir, exist_ok=True)
    print(f"✅ Output directory created/verified: {os.path.exists(output_dir)}")
    
    print("\n📊 Generating CSV files from Figma Library Analytics API...")
    print("=" * 60)
    
    # Set date range: from 2025-01-01 to today
    # This will fetch all data from January 1, 2025 onwards
    start_date = "2025-01-01"
    end_date = datetime.now().strftime("%Y-%m-%d")
    print(f"📅 Date range: {start_date} to {end_date}")
    print(f"   Will fetch all data from {start_date} to {end_date} (with pagination if needed)")
    print("=" * 60)
    
    # Extract component metadata for mapping component keys to names
    component_metadata, name_to_key = get_component_metadata(data)
    print(f"Found {len(component_metadata)} components in library")
    
    # Generate each CSV file with date filtering
    generate_actions_by_component_csv(output_dir, token, file_key, component_metadata, name_to_key, start_date, end_date)
    generate_actions_by_team_csv(output_dir, token, file_key, start_date, end_date)
    generate_usages_by_component_csv(output_dir, token, file_key, component_metadata, name_to_key, start_date, end_date)
    generate_usages_by_file_csv(output_dir, token, file_key, start_date, end_date)
    generate_variable_actions_by_team_csv(output_dir, token, file_key, start_date, end_date)
    generate_variable_actions_by_variable_csv(output_dir, token, file_key, start_date, end_date)
    generate_styles_actions_by_style_csv(output_dir, token, file_key, start_date, end_date)
    generate_styles_usages_by_style_csv(output_dir, token, file_key, start_date, end_date)
    
    print("=" * 60)
    
    # Check if any files have data
    csv_files = [
        'actions_by_component.csv',
        'actions_by_team.csv',
        'usages_by_component.csv',
        'usages_by_file.csv',
        'variable_actions_by_team.csv',
        'variable_actions_by_variable.csv',
        'styles_actions_by_style.csv',
        'styles_usages_by_style.csv'
    ]
    
    files_with_data = 0
    total_rows = 0
    for filename in csv_files:
        filepath = os.path.join(output_dir, filename)
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                # Subtract 1 for header
                row_count = len(lines) - 1 if len(lines) > 1 else 0
                if row_count > 0:
                    files_with_data += 1
                    total_rows += row_count
    
    print(f"\n✅ All CSV files generated in: {output_dir}")
    print(f"   Files with data: {files_with_data}/{len(csv_files)}")
    print(f"   Total data rows: {total_rows}")
    
    if files_with_data == 0:
        print("\n⚠️  WARNING: All CSV files are empty (headers only).")
        print("   This usually means:")
        print("   1. Library Analytics API is not available (requires Enterprise plan)")
        print("   2. The library has no analytics data yet")
        print("   3. The access token doesn't have library_analytics:read scope")
        print("\n   Check the warnings above for specific API errors.")
    else:
        print("\n✅ CSV generation completed successfully!")


def main():
    parser = argparse.ArgumentParser(description='Generate CSV files from Figma library data')
    parser.add_argument('--token', required=True, help='Figma access token')
    parser.add_argument('--file-key', required=True, help='Figma file key')
    parser.add_argument('--output-dir', required=True, help='Output directory for CSV files')
    parser.add_argument('--library-name', default='', help='Library name for folder organization')
    
    args = parser.parse_args()
    
    # Resolve output directory to absolute path to avoid path resolution issues
    output_dir = os.path.abspath(args.output_dir)
    print(f"📁 Received output directory: {args.output_dir}")
    print(f"📁 Resolved to absolute path: {output_dir}")
    
    try:
        # Fetch data from Figma
        data = fetch_figma_data(args.token, args.file_key)
        
        # Generate CSV files (output_dir already includes library folder from server)
        generate_csv_files(data, output_dir, args.token, args.file_key)
        
        print("\n✅ CSV generation completed successfully!")
        sys.exit(0)
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
