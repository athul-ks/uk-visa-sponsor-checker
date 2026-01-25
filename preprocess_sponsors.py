import csv
import json
import argparse
import re
import gzip

def clean_company_name(name):
    """
    Cleans the company name by removing common suffixes and special characters
    to improve matching accuracy.
    """
    name = name.lower()
    
    # Remove content in parentheses
    name = re.sub(r'\(.*?\)', '', name)
    
    # Remove common legal entity suffixes
    suffixes = [
        ' limited', ' ltd', ' plc', ' llp', ' inc', ' corp', ' corporation',
        ' gmbh', ' s.a.', ' s.r.l.', ' b.v.', ' n.v.', ' sa', ' sarl'
    ]
    
    for suffix in suffixes:
        if name.endswith(suffix):
            name = name[:-len(suffix)]
            
    # Remove special characters and extra whitespace
    name = re.sub(r'[^a-z0-9\s]', '', name)
    name = " ".join(name.split())
    
    return name

def preprocess_csv(input_path, output_path):
    """
    Reads the CSV file, processes company names, and exports a JSON dictionary.
    """
    sponsors = {}
    
    try:
        with open(input_path, 'r', encoding='utf-8', errors='replace') as f:
            reader = csv.DictReader(f)
            
            # Check if headers exist and look correct
            if not reader.fieldnames:
                print("Error: CSV file appears to be empty or missing headers.")
                return

            # Try to identify the organisation name and route columns
            # The UK Gov CSV usually has 'Organisation Name' and 'Route'
            org_col = None
            route_col = None
            for col in reader.fieldnames:
                lower_col = col.lower()
                if 'organisation name' in lower_col:
                    org_col = col
                elif 'route' in lower_col:
                    route_col = col
            
            if not org_col:
                print(f"Error: Could not find 'Organisation Name' column. Available columns: {reader.fieldnames}")
                return
            
            if not route_col:
                print(f"Warning: Could not find 'Route' column. Filtering by 'Skilled Worker' will be skipped. Available columns: {reader.fieldnames}")

            count = 0
            skipped_count = 0
            for row in reader:
                # Filter by Route if column exists
                if route_col:
                    route_value = row[route_col].strip()
                    if route_value.lower() != 'skilled worker':
                        skipped_count += 1
                        continue

                original_name = row[org_col]
                cleaned = clean_company_name(original_name)
                
                if cleaned:
                    sponsors[cleaned] = original_name
                    count += 1
                    
        print(f"Processed {count} records (Skipped {skipped_count} non-'Skilled Worker' entries).")
        
        # Determine strict output format based on extension
        if output_path.endswith('.json.gz'):
             with gzip.open(output_path, 'wt', encoding='utf-8') as f:
                json.dump(sponsors, f)
        else:
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(sponsors, f)
                
        print(f"Successfully saved optimised JSON to {output_path}")

    except FileNotFoundError:
        print(f"Error: Input file '{input_path}' not found.")
    except Exception as e:
        print(f"An error occurred: {e}")
    
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Convert UK Sponsor CSV to optimised JSON.')
    parser.add_argument('--input', default='2026-01-01_Sponsors.csv', help='Path to the input CSV file.')
    parser.add_argument('--output', default='sponsors.json', help='Path to the output JSON file.')
    
    args = parser.parse_args()
    
    preprocess_csv(args.input, args.output)
