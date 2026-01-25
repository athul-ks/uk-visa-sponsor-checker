# UK Visa Sponsor Checker - Chrome Extension

A Chrome Extension that helps international job seekers by automatically highlighting **UK Visa Licensed Sponsors** on LinkedIn job postings.

It works by matching the company name on the job card against the official [UK Government Register of Licensed Sponsors](https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers).

## Features
- **Instant Recognition**: Adds a Green "✓ UK Visa Sponsor" badge next to company names.
- **Privacy Focused**: Runs entirely locally. No API calls are made to remote servers.
- **Lightweight**: Uses an optimized, pre-processed local database for instant lookups.

## Installation

1. Clone this repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** (toggle in the top right).
4. Click **Load unpacked**.
5. Select the folder where you cloned this repository.
6. Go to LinkedIn Jobs and start browsing!

## Updating the Sponsor Data

The extension comes with a pre-bundled `sponsors.json`. However, the UK Register is updated daily. To use the latest data:

1. Download the "Register of licensed sponsors: workers" CSV file from the [official UK Government website](https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers).
2. Save the file as `Sponsors.csv` (or any name ending in `.csv`) in the project root folder.
3. Run the preprocessing script:
   ```bash
   python3 preprocess_sponsors.py --input "Sponsors.csv"
   ```
   *Note: Ensure you have Python 3 installed.*
4. This will generate a new `sponsors.json` file.
5. Reload the extension in `chrome://extensions/` to verify it works with the new data.

## Project Structure
- `manifest.json`: Chrome Extension configuration.
- `content.js`: Main logic script that runs on LinkedIn pages.
- `utils.js`: Helper functions (fuzzy matching, string cleaning).
- `preprocess_sponsors.py`: Python tool to convert the raw Gov CSV into the optimized JSON format used by the extension.
- `sponsors.json`: The compressed database of sponsor names.
