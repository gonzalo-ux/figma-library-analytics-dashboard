# Themes Directory

This directory contains theme definitions as separate CSS files. Each theme file defines both light and dark mode variants.

## Structure

The themes directory is organized into:
- `base-color/` - Base color themes (neutral, stone) that provide the foundation
- `{theme-name}.css` - Theme accent files (blue, green) that override some colors from base colors

Each theme file follows this pattern:
- Base colors: `base-color/{name}.css` - Contains both `.neutral-theme` or `.theme-stone` (light mode) and `.dark.neutral-theme` or `.dark.theme-stone` (dark mode) classes
- Theme accents: `{theme-name}.css` - Contains both `.theme-{name}` (light mode) and `.dark.theme-{name}` (dark mode) classes

## Adding a New Base Color

1. Create a new file: `src/themes/base-color/{name}.css`
2. Define both light and dark mode variants
3. Import it in `src/index.css`:
   ```css
   @import './themes/base-color/{name}.css';
   ```
4. Update `src/lib/themeLoader.js` to handle the new base color
5. Add it to the base color options in `src/components/ThemeEditor.jsx` and `src/components/SetupStep2.jsx`

## Adding a New Theme Accent

1. Create a new file: `src/themes/{theme-name}.css`
2. Define both light and dark mode variants (these will override some colors from the base color)
3. Import it in `src/index.css`:
   ```css
   @import './themes/{theme-name}.css';
   ```
4. Update `src/lib/themeLoader.js` to handle the new theme
5. Add it to the theme options in `src/components/ThemeEditor.jsx` and `src/components/SetupStep2.jsx`

## Example

See `base-color/neutral.css` or `base-color/stone.css` for examples of base color structure.
See `blue.css` or `green.css` for examples of theme accent structure.

## Benefits

- ✅ Easy to add/remove themes
- ✅ Better organization
- ✅ Easier to maintain
- ✅ Can be shared/reused
- ✅ Better for team collaboration
- ✅ Keeps `index.css` clean and focused

