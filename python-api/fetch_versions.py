#!/usr/bin/env python3
"""
Fetch Figma file version history
Retrieves all published versions of a Figma library file
"""

import argparse
import json
import os
import sys
import requests
from datetime import datetime
from typing import Dict, List, Any

# Figma API base URL
FIGMA_API_BASE = "https://api.figma.com/v1"


def fetch_version_history(token: str, file_key: str) -> List[Dict[str, Any]]:
    """Fetch version history from Figma API with pagination support"""
    url = f"{FIGMA_API_BASE}/files/{file_key}/versions"
    headers = {"X-Figma-Token": token}
    
    print(f"Fetching version history from Figma API for file: {file_key}")
    
    all_versions = []
    page = 1
    
    while True:
        # Add pagination parameter if we have a cursor from previous page
        params = {}
        
        response = requests.get(url, headers=headers, params=params)
        
        if response.status_code != 200:
            raise Exception(f"Figma API error: {response.status_code} - {response.text}")
        
        data = response.json()
        versions = data.get("versions", [])
        
        if not versions:
            break
            
        all_versions.extend(versions)
        print(f"  Page {page}: Found {len(versions)} versions (total so far: {len(all_versions)})")
        
        # Check for pagination - Figma uses 'pagination' field
        pagination = data.get("pagination", {})
        next_page = pagination.get("next_page")
        
        if not next_page:
            break
            
        # Update URL for next page
        url = next_page
        page += 1
    
    print(f"✅ Found {len(all_versions)} total versions across {page} page(s)")
    return all_versions


def save_versions(versions: List[Dict[str, Any]], output_file: str):
    """Save versions to JSON file"""
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(versions, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Saved {len(versions)} versions to: {output_file}")


def display_version_summary(versions: List[Dict[str, Any]]):
    """Display a summary of versions"""
    if not versions:
        print("\n⚠️  No versions found")
        return
    
    print("\n" + "=" * 60)
    print("VERSION HISTORY SUMMARY")
    print("=" * 60)
    
    # Count publications per month
    monthly_counts = {}
    for version in versions:
        created_at = version.get("created_at", "")
        if created_at:
            date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            month_key = date.strftime("%Y-%m")
            monthly_counts[month_key] = monthly_counts.get(month_key, 0) + 1
    
    print(f"\nTotal versions: {len(versions)}")
    print(f"\nPublications by month:")
    for month in sorted(monthly_counts.keys(), reverse=True)[:12]:
        count = monthly_counts[month]
        bar = "█" * count
        print(f"  {month}: {bar} ({count})")
    
    # Show most recent versions
    print(f"\nMost recent 5 versions:")
    for version in versions[:5]:
        created_at = version.get("created_at", "")
        label = version.get("label", "(no label)")
        description = version.get("description", "")
        user = version.get("user", {})
        user_name = user.get("handle", "Unknown")
        
        if created_at:
            date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            date_str = date.strftime("%Y-%m-%d %H:%M")
        else:
            date_str = "Unknown date"
        
        print(f"\n  📅 {date_str}")
        print(f"     Version: {label}")
        print(f"     By: {user_name}")
        if description:
            print(f"     Description: {description[:60]}{'...' if len(description) > 60 else ''}")
    
    print("\n" + "=" * 60)


def main():
    parser = argparse.ArgumentParser(description='Fetch Figma file version history')
    parser.add_argument('--token', required=True, help='Figma access token')
    parser.add_argument('--file-key', required=True, help='Figma file key')
    parser.add_argument('--output', default='../public/csv/version_history.json', 
                        help='Output JSON file path (default: ../public/csv/version_history.json)')
    
    args = parser.parse_args()
    
    try:
        # Fetch version history
        versions = fetch_version_history(args.token, args.file_key)
        
        # Save to file
        save_versions(versions, args.output)
        
        # Display summary
        display_version_summary(versions)
        
        print("\n✅ Version history fetch completed successfully!")
        sys.exit(0)
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

