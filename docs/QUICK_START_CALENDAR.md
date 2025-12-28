# Quick Start: Publication Activity Calendar

## 1. Fetch Version History from Figma

```bash
# Using npm script
npm run fetch-versions -- --token YOUR_FIGMA_TOKEN --file-key YOUR_FILE_KEY --output public/csv/version_history.json

# Or directly with Python
cd python-api
python fetch_versions.py \
  --token YOUR_FIGMA_TOKEN \
  --file-key YOUR_FILE_KEY \
  --output ../public/csv/version_history.json
```

### Finding Your File Key

Your file key is in the Figma URL:
```
https://www.figma.com/design/ABC123XYZ/My-Library
                              ^^^^^^^^^^^
                              This is your file key
```

### Getting Your Access Token

1. Go to [Figma Account Settings](https://www.figma.com/settings)
2. Scroll to "Personal access tokens"
3. Click "Generate new token"
4. Give it a name and copy the token
5. **Important**: Save it securely - you can't view it again!

## 2. View the Calendar

Once the version history is fetched:

1. Start the dev server: `npm run dev`
2. Navigate to the Components tab
3. The publication calendar appears in the right column
4. Hover over any day to see publication details

## 3. Calendar Features

- **Color Intensity**: Darker = more publications that day
- **Tooltips**: Hover to see exact dates and counts
- **Full Year**: Shows last 365 days of activity
- **Theme Aware**: Colors match your selected theme

## 4. Update Regularly

To keep the calendar current, run the fetch script periodically:

```bash
# Add to your workflow
npm run fetch-versions -- --token TOKEN --file-key KEY --output public/csv/version_history.json
```

Consider automating this with:
- Cron jobs (daily/weekly)
- GitHub Actions
- CI/CD pipeline

## Troubleshooting

**No data showing?**
- Check `public/csv/version_history.json` exists
- Verify it contains valid JSON
- Refresh your browser

**Script errors?**
- Verify your token is valid
- Check the file key is correct
- Ensure you have read access to the file

**Empty calendar?**
- The file may not have published versions yet
- Try publishing a version in Figma first

## Next Steps

- See [PUBLICATION_CALENDAR.md](PUBLICATION_CALENDAR.md) for detailed documentation
- Set up automation for regular updates
- Customize titles/descriptions in Edit Mode

