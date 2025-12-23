# Themes Directory

This directory contains theme definitions as separate CSS files. Each theme file defines both light and dark mode variants.

## Structure

Each theme file follows this pattern:
- `{theme-name}.css` - Contains both `.theme-{name}` (light mode) and `.dark.theme-{name}` (dark mode) classes

## Adding a New Theme

1. Create a new file: `src/themes/{theme-name}.css`
2. Define both light and dark mode variants
3. Import it in `src/index.css`:
   ```css
   @import './themes/{theme-name}.css';
   ```
4. Update `src/lib/themeLoader.js` to handle the new theme
5. Add it to the theme options in `src/components/ThemeEditor.jsx` and `src/components/SetupStep2.jsx`

## Example

See `neutral.css` or `stone.css` for examples of theme structure.

## Benefits

- ✅ Easy to add/remove themes
- ✅ Better organization
- ✅ Easier to maintain
- ✅ Can be shared/reused
- ✅ Better for team collaboration
- ✅ Keeps `index.css` clean and focused

