# Figma Analytics Dashboard

A modern, configurable web application for visualizing Figma library analytics with interactive charts, customizable themes, and flexible data sources.

## Features

- 📊 **Multiple Chart Types**: Bar, Line, Area, Pie, and Radial charts powered by Recharts
- 🎨 **Customizable Themes**: Choose from preset themes or create your own with custom CSS
- ✏️ **Edit Mode**: Customize titles, descriptions, and chart types directly in the UI
- 📁 **CSV Data Visualization**: Visualize component usage, insertions, detachments, and more
- 🏢 **Multi-Library Support**: Track data from multiple Figma libraries with a single access token
- 🔍 **Advanced Filtering**: Filter components, variables, and styles by prefix, suffix, or content
- 📑 **Custom Pages**: Create custom dashboard tabs for different data views
- 🌿 **Branches Management**: View and manage Figma library branches (Active, Archived, Merged)
- 📝 **Flexible Changelog**: Support for Figma Library, Google Docs, or Notion as changelog sources
- 📅 **Publication Calendar**: GitHub-style contribution calendar showing library publication activity over the last year
- 🔧 **Python API Integration**: Automatic CSV generation from Figma library data
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI component library
- **Recharts** - Data visualization
- **PapaParse** - CSV parsing
- **Express.js** - Backend server for Python API integration

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Python 3.x (for CSV generation)
- Access to the [figma-analytics-api](https://github.com/gonzalo-vasquez_zse/figma-analytics-api) repository

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd figma-analytics-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd server
npm install
cd ..
```

4. Configure your Figma credentials:
   - Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   - Edit `.env` and add your Figma access token and library URL:
   ```bash
   VITE_FIGMA_ACCESS_TOKEN=your_figma_access_token_here
   VITE_FIGMA_LIBRARY_URL=https://www.figma.com/file/ABC123XYZ/Library-Name
   ```
   - You can get your Figma access token from [Figma Account Settings](https://www.figma.com/settings).

5. Set up Python API for CSV generation:
   - Install Python dependencies:
     ```bash
     cd python-api
     python3 -m pip install -r requirements.txt
     cd ..
     ```
     (Or use `pip3 install -r requirements.txt` if available)
   - The Python script is located at `python-api/main.py`
   - You can customize the data extraction logic in `main.py` based on your Figma file structure

6. Start the development server:
```bash
npm run dev
```

7. (Optional) Start the backend server (for CSV generation):
```bash
npm run server
```

8. Open your browser and navigate to `http://localhost:5173`

## First-Time Setup

On first launch, you'll be guided through a setup wizard:

1. **Figma Credentials**: Enter your Figma access token and library URL
2. **Python API Setup**: Verify Python API connection (optional)
3. **Generate CSV Files**: Generate initial CSV files from your Figma library

## Usage

### Multi-Library Support

The dashboard now supports tracking multiple Figma libraries with advanced filtering:

1. **Add Multiple Libraries**: In the setup wizard, add as many Figma libraries as you need
2. **Configure Filters**: For each library, set exclusion filters:
   - Prefix: Exclude items starting with specific text (e.g., "Icon -")
   - Suffix: Exclude items ending with specific text (e.g., "/deprecated")
   - Contains: Exclude items containing specific text (e.g., "_old")

3. **Create Custom Pages**: Configure dashboard tabs to show different data views:
   - Each page can pull from a different library
   - Filter the same library in different ways for multiple pages
   - Built-in page types: Components, Icons, Variables, Styles, Branches

For detailed information, see the [Multi-Library Guide](docs/MULTI_LIBRARY_GUIDE.md).

### CSV Data Visualization

1. The dashboard automatically loads CSV files from `public/csv/`
2. Navigate between different data views using the tabs:
   - **Components**: Component usage analytics
   - **Icons**: Icon insertion analytics
   - **Variables**: Variable usage analytics
   - **Branches**: Figma library branches

3. Use the period selector (30/60/90 days) to filter data

### Edit Mode

Click the "Edit Mode" button in the header to customize:

- **Theme**: Choose from preset themes (Default, Dark, Blue, Green) or create custom CSS
- **Chart Types**: Select chart types for each visualization (Bar, Line, Area, Pie, Radial)
- **Titles & Descriptions**: Click on any title or description to edit inline
- **Changelog Source**: Configure changelog to use Figma, Google Docs, or Notion

All changes are saved automatically to localStorage and can be exported/imported.

### Changelog Configuration

The dashboard supports multiple changelog sources:

- **Figma Library**: Uses the existing `sync-changelog` script (default)
- **Google Docs**: Configure with document ID and API key
- **Notion**: Configure with database ID and integration token

Configure changelog source in Edit Mode.

### Publication Activity Calendar

View your library's publication history in a GitHub-style contribution calendar:

1. **Fetch version history** from Figma:
   ```bash
   cd python-api
   python fetch_versions.py \
     --token YOUR_FIGMA_TOKEN \
     --file-key YOUR_FILE_KEY \
     --output ../public/csv/version_history.json
   ```

2. The calendar automatically displays:
   - Last 365 days of publication activity
   - Color intensity based on publications per day
   - Interactive tooltips with dates and counts
   - Monthly labels for easy navigation

For detailed instructions, see [docs/PUBLICATION_CALENDAR.md](docs/PUBLICATION_CALENDAR.md).

## Configuration

### Config File

Create a `config.json` file in the root directory (it's gitignored):

```json
{
  "figma": {
    "accessToken": "your_token",
    "libraryUrl": "https://www.figma.com/file/ABC123XYZ/Name"
  },
  "changelog": {
    "source": "figma",
    "config": {}
  },
  "theme": {
    "preset": "default",
    "customCss": ""
  },
  "charts": {
    "insertions": "bar",
    "detachments": "bar",
    "teams": "pie"
  },
  "content": {
    "dashboardTitle": "Figma Components Library Analytics",
    "titles": {},
    "descriptions": {}
  }
}
```

### Environment Variables

See `.env.example` for all available environment variables.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run server` - Start backend server
- `npm run sync-changelog` - Sync changelog from Figma
- `npm run sync-branches` - Sync branches from Figma
- `npm run discover-rows` - Discover changelog row IDs

## Python API Integration

The dashboard includes a Python script to generate CSV files from Figma data:

1. Install Python dependencies: `cd python-api && pip install -r requirements.txt && cd ..`
2. Start the backend server: `npm run server`
3. Use the "Generate CSV Files" button in the header or call `/api/generate-csv` endpoint

**Note:** The Python script (`python-api/main.py`) is a template. You'll need to implement the actual data extraction logic based on your Figma file structure. The script currently generates empty CSV files with the correct headers.

## Project Structure

```
├── server/              # Express.js backend server
├── python-api/          # Python script for CSV generation
│   ├── main.py          # Main Python script
│   └── requirements.txt # Python dependencies
├── src/
│   ├── components/      # React components
│   │   ├── charts/      # Chart components (Bar, Line, Area, Pie, Radial)
│   │   └── ui/          # shadcn/ui components
│   ├── lib/             # Utilities and adapters
│   │   ├── changelog/   # Changelog adapters (Figma, Google Docs, Notion)
│   │   └── themes/      # Theme presets
│   ├── config/          # Default configuration
│   └── themes/          # Theme JSON files
├── public/csv/          # CSV data files
├── scripts/             # Utility scripts
└── config.json          # User configuration (gitignored)
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and contribution guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Built with [shadcn/ui](https://ui.shadcn.com/)
- Charts powered by [Recharts](https://recharts.org/)
- CSV parsing with [PapaParse](https://www.papaparse.com/)
