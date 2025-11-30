# Data Visualization Dashboard

A modern web application for visualizing CSV data with interactive charts using React, Tailwind CSS, shadcn/ui, and Chart.js.

## Features

- 📊 **Multiple Chart Types**: Bar charts and line charts for data visualization
- 📁 **CSV File Upload**: Easy drag-and-drop or click-to-upload CSV files
- 📋 **Data Table**: View your data in a clean, organized table format
- 🎨 **Modern UI**: Built with Tailwind CSS and shadcn/ui components
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI component library
- **Chart.js** - Data visualization
- **PapaParse** - CSV parsing

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

## Usage

1. Click "Choose File" or drag and drop a CSV file onto the upload area
2. The application will automatically parse the CSV and detect numeric columns
3. View your data in:
   - **Bar Chart**: Visualize numeric data as bars
   - **Line Chart**: Track trends over categories
   - **Data Table**: Browse all data in tabular format

## Sample Data

Sample CSV files are available in the `public` folder:
- `sample-data.csv` - Monthly sales and revenue data
- `sample-sales.csv` - Product sales by category

You can download these and upload them to test the dashboard.

## Building for Production

```bash
npm run build
```

The production build will be in the `dist` folder.

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── ui/          # shadcn/ui components
│   │   ├── Dashboard.jsx
│   │   ├── ChartContainer.jsx
│   │   └── DataTable.jsx
│   ├── lib/
│   │   └── utils.js     # Utility functions
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── public/              # Sample CSV files
├── package.json
└── tailwind.config.js
```

## License

MIT
