# Publication Activity Calendar

## Overview

The Publication Activity Calendar displays library publication history in a GitHub-style contribution calendar. It visualizes when your Figma library was published over the last year, with color intensity indicating the frequency of publications on each day.

## Features

- **GitHub-style visualization**: Familiar contribution calendar layout
- **Color intensity mapping**: More publications = darker colors
- **Interactive tooltips**: Hover over any day to see publication count and date
- **Responsive legend**: Shows the color scale from less to more activity
- **Last 365 days**: Displays a full year of publication history

## How to Fetch Version History

### Using the Python Script

1. **Get your Figma access token and file key**:
   - Access token: Get from Figma account settings
   - File key: Extract from your Figma file URL
     - Example URL: `https://www.figma.com/design/ABC123/My-Library`
     - File key: `ABC123`

2. **Run the fetch script**:

```bash
cd python-api

# Fetch version history
python fetch_versions.py \
  --token YOUR_FIGMA_ACCESS_TOKEN \
  --file-key YOUR_FILE_KEY \
  --output ../public/csv/version_history.json
```

3. **View the results**:
   - The script will fetch all published versions from Figma
   - Data is saved to `public/csv/version_history.json`
   - The dashboard will automatically load and display the calendar

### Script Output

The script provides:
- Total version count
- Monthly publication breakdown
- Most recent 5 versions with details
- Publication dates and authors

Example output:
```
✅ Found 42 versions
✅ Saved 42 versions to: ../public/csv/version_history.json

============================================================
VERSION HISTORY SUMMARY
============================================================

Total versions: 42

Publications by month:
  2024-12: ████████ (8)
  2024-11: ██████ (6)
  2024-10: ████ (4)
  2024-09: ███ (3)
  ...

Most recent 5 versions:

  📅 2024-12-20 14:30
     Version: v8.2.0
     By: designer1
     Description: Added new button variants and updated color tokens
...
```

## Data Format

The version history JSON file contains an array of version objects:

```json
[
  {
    "id": "12345",
    "created_at": "2024-12-20T14:30:00Z",
    "label": "v8.2.0",
    "description": "Added new button variants",
    "user": {
      "id": "user1",
      "handle": "designer1"
    }
  }
]
```

## Calendar Component

### Props

- `versionData` (Array): Array of version objects from Figma API
- `title` (String, optional): Custom title for the calendar card
- `description` (String, optional): Custom description text

### How It Works

1. **Data Processing**: Counts publications per day from `created_at` timestamps
2. **Calendar Generation**: Creates a 52-week grid starting from one year ago
3. **Color Mapping**: Applies color intensity based on publication count
4. **Interactivity**: Provides hover tooltips with date and count information

### Color Intensity Levels

The calendar uses 5 intensity levels (similar to GitHub):

- **Level 0** (Empty): No publications
- **Level 1** (Light): 1-25% of max daily count
- **Level 2** (Medium-Light): 26-50% of max daily count  
- **Level 3** (Medium-Dark): 51-75% of max daily count
- **Level 4** (Dark): 76-100% of max daily count

Colors automatically adapt to the selected theme (light/dark mode).

## Customization

### Titles and Descriptions

You can customize the calendar's title and description in Edit Mode:

1. Enable Edit Mode (toggle in header)
2. Click on "Publication Activity" or description text
3. Edit and save your changes
4. Changes are saved to `config.json`

### Theme Colors

The calendar uses CSS variable `--chart-themed-6` which changes based on your selected theme:
- Blue theme: Blue shades
- Green theme: Green shades
- Orange theme: Orange shades

## Automation

### Scheduled Updates

To keep the calendar up-to-date, you can schedule the fetch script:

**Using cron (Linux/Mac)**:
```bash
# Run daily at 6 AM
0 6 * * * cd /path/to/project/python-api && python fetch_versions.py --token TOKEN --file-key KEY --output ../public/csv/version_history.json
```

**Using GitHub Actions**:
```yaml
name: Update Version History
on:
  schedule:
    - cron: '0 6 * * *'  # Daily at 6 AM
jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Fetch versions
        run: |
          cd python-api
          python fetch_versions.py \
            --token ${{ secrets.FIGMA_TOKEN }} \
            --file-key ${{ secrets.FILE_KEY }} \
            --output ../public/csv/version_history.json
      - name: Commit changes
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add public/csv/version_history.json
          git commit -m "Update version history" || true
          git push
```

## Troubleshooting

### Calendar Shows "No version history data available"

1. Check if `version_history.json` exists in `public/csv/`
2. Verify the JSON file is valid and not empty
3. Check browser console for loading errors
4. Ensure the file is accessible by the web server

### Script Errors

**403 Forbidden**:
- Verify your Figma access token is valid
- Check token has read permissions for the file

**404 Not Found**:
- Verify the file key is correct
- Ensure the file exists and you have access

**Empty results**:
- The file may not have any published versions yet
- Check if the file is actually a library file

## Future Enhancements

Potential improvements:
- Click on day to see version details
- Filter by date range
- Show version labels on hover
- Export publication statistics
- Compare publication patterns over time

