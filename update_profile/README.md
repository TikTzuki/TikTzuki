# Update Profile Script

A Node.js script that automatically fetches a random inspirational quote from [ZenQuotes API](https://zenquotes.io/) and updates the main GitHub profile README with a daily quote.

## 🎯 Purpose

This script is designed to keep your GitHub profile fresh and engaging by automatically replacing the `<blockquote>` section in your profile README with a new inspirational quote every day.

## 🎬 Main Use Case: Automated Profile Updates

This script is primarily designed to work with the GitHub Actions workflow defined in `.github/workflows/release_profile.yml`. 

### Workflow Features

The `release_profile.yml` workflow automates the entire process:

1. **Scheduled Execution**: Runs automatically every day at 00:00 UTC using cron scheduling
2. **Manual Trigger**: Can be manually executed from the GitHub Actions tab using `workflow_dispatch`
3. **Automated Setup**: 
   - Checks out the repository
   - Sets up Node.js (v22)
   - Installs dependencies automatically
4. **Quote Update**: Executes the `index.js` script to fetch and update the quote
5. **Auto-commit**: Uses `EndBug/add-and-commit@v9` action to automatically commit and push changes to the master branch

### Workflow Configuration

```yaml
name: Scheduled Release Profile

on:
  workflow_dispatch:  # Manual trigger
  schedule:
    - cron: "0 0 * * *"  # Daily at 00:00 UTC

jobs:
  build:
    name: Update README.md with daily quote
    runs-on: ubuntu-latest
    steps:
      - Checkout repository
      - Setup Node.js v22
      - Install dependencies
      - Run update_profile script
      - Commit and push changes
```


## 🚀 How It Works

1. The script reads the parent directory's `README.md` file
2. Fetches a random quote from the ZenQuotes API
3. Searches for an existing `<blockquote>` tag in the README
4. Replaces the blockquote with the new quote (or appends if none exists)
5. Writes the updated content back to the file

## 📦 Installation

```bash
npm install
```

## 🔧 Usage

### Run Locally

```bash
node index.js
```

### Run via GitHub Actions

This script is automatically executed by the GitHub Actions workflow defined in `.github/workflows/release_profile.yml`. The workflow:

- Runs daily at 00:00 UTC
- Can be manually triggered from the Actions tab
- Automatically commits and pushes changes to the master branch

## 👤 Author

**TikTuzki**

- GitHub: [@TikTzuki](https://github.com/TikTzuki)
- Email: tiktuzki@gmail.com
---

_Made with ❤️ to keep GitHub profiles inspiring and fresh!_
