# Contributing to Figma Analytics Dashboard

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone <your-fork-url>
   cd figma-analytics-dashboard
   ```

3. Install dependencies:
   ```bash
   npm install
   cd server && npm install && cd ..
   ```

4. Create a `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Development Guidelines

### Code Style

- Use ESLint for code linting (run `npm run lint`)
- Follow existing code patterns and conventions
- Use functional components with hooks
- Prefer TypeScript-style JSDoc comments for complex functions

### Component Structure

- Components should be in `src/components/`
- UI components (shadcn-style) go in `src/components/ui/`
- Chart components go in `src/components/charts/`
- Keep components focused and reusable

### Configuration

- Default configuration in `src/config/default.config.json`
- User configuration in `config.json` (gitignored)
- Use `src/lib/config.js` for configuration management

### Testing

- Test your changes manually in the browser
- Ensure edit mode works correctly
- Verify chart rendering with different data sets
- Test responsive design on different screen sizes

## Pull Request Process

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit:
   ```bash
   git commit -m "Add: description of your changes"
   ```

3. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

4. Create a Pull Request on GitHub

### PR Guidelines

- Provide a clear description of changes
- Reference any related issues
- Include screenshots for UI changes
- Ensure all tests pass
- Update documentation if needed

## Adding New Features

### New Chart Types

1. Create component in `src/components/charts/`
2. Add to `ChartFactory.jsx`
3. Update chart type options in `ChartTypeSelector.jsx`

### New Theme Presets

1. Create JSON file in `src/themes/`
2. Add to `themeLoader.js`
3. Update `ThemeEditor.jsx` options

### New Changelog Adapters

1. Create adapter class in `src/lib/changelog/`
2. Extend `ChangelogAdapter` base class
3. Add to `createChangelogAdapter` factory
4. Update `ChangelogConfig.jsx` UI

## Reporting Issues

When reporting issues, please include:

- Description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Browser and OS information
- Screenshots if applicable

## Questions?

Feel free to open an issue for questions or discussions about the project.

Thank you for contributing! 🎉
