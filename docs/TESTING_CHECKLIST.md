# Multi-Library Feature Testing Checklist

## Pre-Testing Setup
- [ ] Code has been pulled/updated
- [ ] Dependencies installed (`npm install`)
- [ ] Backend server dependencies installed (`cd server && npm install`)
- [ ] Python API is available in `python-api/` directory
- [ ] Development server started (`npm run dev`)
- [ ] Backend server started (`cd server && npm start`)

## 1. Fresh Installation Test (No Existing Config)

### Setup Wizard
- [ ] Open app in browser
- [ ] Setup wizard appears automatically
- [ ] Step 1: Figma Credentials shows correctly
- [ ] Can add Figma access token
- [ ] "Add Library" button works
- [ ] Can add multiple libraries
- [ ] Library URL validation works
- [ ] Library name is required
- [ ] Filters (prefix/suffix/contains) inputs work
- [ ] Can remove libraries
- [ ] Pages section shows up
- [ ] Default 4 pages appear when first library is added
- [ ] Can customize page names
- [ ] Can change library assignment per page
- [ ] Can change data type per page
- [ ] Can add more pages
- [ ] Can remove pages
- [ ] "Next" button validates all fields
- [ ] Error messages show for invalid data
- [ ] Step 2: Theme selection works
- [ ] Step 3: Typography works
- [ ] Wizard saves config on completion

### Dashboard After Setup
- [ ] Dashboard loads successfully
- [ ] Tabs show configured page names
- [ ] Can switch between tabs
- [ ] Date range picker works
- [ ] No console errors

## 2. CSV Generation Test

### Single Library
- [ ] Click "Generate CSV Files" button
- [ ] Loading spinner appears
- [ ] Success message shows after generation
- [ ] CSV files created in `public/csv/`
- [ ] Refresh page loads data correctly

### Multiple Libraries
- [ ] Add 2+ libraries in setup
- [ ] Click "Generate CSV Files"
- [ ] Shows progress for each library
- [ ] Reports success/failure per library
- [ ] All CSV files generated
- [ ] Check console for any errors

## 3. Filter Testing

### Prefix Filter
- [ ] Add library with prefix filter (e.g., "Icon -")
- [ ] Generate CSV files
- [ ] Data on that page excludes items starting with prefix
- [ ] Items appear on other pages if not filtered there

### Suffix Filter
- [ ] Add library with suffix filter (e.g., "_old")
- [ ] Generate CSV files
- [ ] Data excludes items ending with suffix

### Contains Filter
- [ ] Add library with contains filter (e.g., "deprecated")
- [ ] Generate CSV files
- [ ] Data excludes items containing text

### Combined Filters
- [ ] Set multiple filters on one library
- [ ] Verify OR logic (excluded if ANY filter matches)

### Case Insensitivity
- [ ] Filter with "ICON" should match "Icon -"
- [ ] Filter with "icon" should match "Icon -"

## 4. Page Configuration Test

### Different Page Types
- [ ] Components page shows components (no icons)
- [ ] Icons page shows only icons
- [ ] Variables page shows variables
- [ ] Styles page shows styles
- [ ] Branches page works

### Multiple Pages Same Library
- [ ] Create 2+ pages using same library
- [ ] Different filters per page
- [ ] Each page shows correctly filtered data
- [ ] No data overlap where it shouldn't be

### One Library Per Page
- [ ] Try to assign different library to page
- [ ] Change takes effect
- [ ] Data loads from correct library

## 5. Backward Compatibility Test

### Old Config Format
- [ ] Create old format config.json:
```json
{
  "figma": {
    "accessToken": "token",
    "libraryUrl": "url"
  }
}
```
- [ ] Load app
- [ ] Dashboard loads with default pages
- [ ] All features work as before
- [ ] No breaking changes

### Migration
- [ ] Run setup wizard with old config present
- [ ] Old token is preserved
- [ ] Can add old URL as first library
- [ ] Can migrate smoothly to new format

## 6. Edit Mode Test

### Admin Sidebar
- [ ] Edit mode toggle works
- [ ] Admin sidebar appears
- [ ] Typography editor works
- [ ] Theme editor works
- [ ] Custom theme editor works
- [ ] All editable text fields work
- [ ] Chart type selectors work

### Persistence
- [ ] Changes saved to localStorage
- [ ] Changes persist after refresh
- [ ] Can export config
- [ ] Can import config

## 7. Data Visualization Test

### Charts
- [ ] Insertions charts load
- [ ] Detachments charts load
- [ ] Teams pie chart loads
- [ ] Line charts load
- [ ] Can switch chart types in edit mode

### Tables
- [ ] Components table loads
- [ ] Icons table loads
- [ ] Usages table loads
- [ ] File usages table loads
- [ ] Sorting works
- [ ] Search/filter works (if applicable)

### Stats Cards
- [ ] Total Components shows correct count
- [ ] Total Variables shows correct count
- [ ] Total Icons shows correct count
- [ ] Total Text Styles shows correct count

## 8. Error Handling Test

### Invalid Input
- [ ] Invalid Figma URL shows error
- [ ] Missing access token shows error
- [ ] Missing library name shows error
- [ ] Missing page name shows error

### Network Errors
- [ ] Backend server down shows error
- [ ] Python API missing shows error
- [ ] Invalid access token shows error
- [ ] Invalid file key shows error

### Edge Cases
- [ ] No libraries configured - appropriate message
- [ ] No pages configured - appropriate message
- [ ] CSV file missing - graceful error
- [ ] Empty CSV file - handles correctly
- [ ] Malformed CSV - error message

## 9. Performance Test

### Large Dataset
- [ ] Load library with 100+ components
- [ ] Page loads in reasonable time
- [ ] Charts render smoothly
- [ ] No lag when switching tabs
- [ ] Filtering is fast

### Multiple Libraries
- [ ] Add 5+ libraries
- [ ] All generate successfully
- [ ] Dashboard remains responsive
- [ ] No memory leaks

## 10. Browser Compatibility

### Chrome
- [ ] All features work
- [ ] No console errors

### Firefox
- [ ] All features work
- [ ] No console errors

### Safari
- [ ] All features work
- [ ] No console errors

### Edge
- [ ] All features work
- [ ] No console errors

## 11. Mobile Responsiveness

### Phone (< 640px)
- [ ] Layout adapts correctly
- [ ] Tabs are scrollable/accessible
- [ ] Forms are usable
- [ ] Charts are readable
- [ ] Edit mode works

### Tablet (640px - 1024px)
- [ ] Layout looks good
- [ ] All features accessible
- [ ] No horizontal scroll

## 12. Documentation Test

- [ ] README is accurate
- [ ] Multi-Library Guide is complete
- [ ] Implementation Summary is accurate
- [ ] Quick Reference is helpful
- [ ] Code comments are clear
- [ ] Examples in docs work

## 13. Code Quality

- [ ] No linting errors (`npm run lint`)
- [ ] No TypeScript errors (if applicable)
- [ ] Console is clean (no warnings/errors in normal use)
- [ ] Code follows project conventions
- [ ] Components are properly structured
- [ ] Utilities are well-organized

## Bug Report Template

If you find issues, document:

```
**Bug Title**: Brief description

**Steps to Reproduce**:
1. 
2. 
3. 

**Expected Result**: 

**Actual Result**: 

**Browser**: 
**OS**: 
**Console Errors**: 
**Screenshots**: 
```

## Success Criteria

All sections above should be checked ✅ before considering the feature complete and ready for release.

## Post-Testing

- [ ] All tests passed
- [ ] Bugs documented and fixed
- [ ] Performance is acceptable
- [ ] Documentation is complete
- [ ] Ready for release
- [ ] Version number updated
- [ ] Changelog updated
- [ ] Git commit made
- [ ] PR created (if applicable)

## Notes

Add any additional notes or observations during testing:

---

**Last Updated**: December 28, 2025  
**Tested By**: _____________  
**Test Environment**: _____________  
**Result**: ⬜ Pass ⬜ Fail ⬜ Partial

