# CommitPilot Debugging Guide

## 🔍 How to Debug Extension Issues

If the extension is not working properly after installation from the marketplace:

### 1. Check Extension Activation
- Open **Developer Tools** (Help > Toggle Developer Tools)
- Look in the **Console** tab for CommitPilot logs:
  - `CommitPilot: main.js loaded`
  - `CommitPilot: vscode API acquired`
  - `CommitPilot: Extension URI: ...`
  - `CommitPilot: Webview resolved and HTML set`

### 2. Check for Errors
- In **Developer Tools Console**, look for any red error messages
- In **Output Panel** (View > Output), select "Extension Host" and look for errors

### 3. Common Issues & Solutions

#### Issue: Sidebar shows only loading or blank screen
**Solution:** 
- Check if API key is configured in settings
- Reload VS Code window (Ctrl+Shift+P > "Reload Window")

#### Issue: CSS styles not loading
**Solution:** 
- Check Console for 404 errors on CSS/JS files
- Ensure extension version is 1.0.0 or higher
- Reinstall the extension

#### Issue: Extension not activating
**Solution:**
- Ensure you have a folder/workspace open (not just single files)
- Check if the sidebar appears in the Activity Bar
- Try opening the sidebar manually

### 4. Reset Extension
If all else fails:
1. Uninstall CommitPilot
2. Reload VS Code
3. Reinstall CommitPilot from marketplace
4. Configure API key in settings
5. Reload VS Code

### 5. Report Issues
If problems persist, report with:
- VS Code version
- CommitPilot extension version
- Console error messages
- Steps to reproduce

GitHub Issues: https://github.com/bandarasd/CommitPilot/issues