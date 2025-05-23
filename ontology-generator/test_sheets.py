#!/usr/bin/env python3
"""
Test script for Google Sheets integration.
This confirms whether your service account is properly configured.
"""

import os
import json
from sheets_integration import SheetsIntegration

def test_sheets_integration(service_account_file='service_account.json'):
    """Test the Google Sheets integration."""
    print(f"Testing Google Sheets integration with {service_account_file}")
    
    # Verify file exists
    if not os.path.exists(service_account_file):
        print(f"ERROR: Service account file not found: {service_account_file}")
        return False
    
    # Try to initialize the integration
    try:
        sheets = SheetsIntegration(service_account_file=service_account_file)
        
        if not sheets.is_initialized():
            print("ERROR: Google Sheets integration failed to initialize.")
            return False
        
        print("SUCCESS: Google Sheets integration initialized successfully.")
        print(f"Service account email: {sheets.credentials.service_account_email}")
        return True
    except Exception as e:
        print(f"ERROR: Exception during Google Sheets integration setup: {str(e)}")
        return False

def main():
    # Check environment variables first
    env_service_account = os.environ.get('GOOGLE_SERVICE_ACCOUNT_JSON')
    if env_service_account:
        print("Found GOOGLE_SERVICE_ACCOUNT_JSON environment variable.")
        # Write it to a temporary file for testing
        with open('temp_service_account.json', 'w') as f:
            f.write(env_service_account)
        result = test_sheets_integration('temp_service_account.json')
        # Clean up
        os.remove('temp_service_account.json')
        return result
    
    # Otherwise check for file
    if os.path.exists('service_account.json'):
        return test_sheets_integration()
    
    print("ERROR: No service account found. Please provide service_account.json or set GOOGLE_SERVICE_ACCOUNT_JSON environment variable.")
    return False

if __name__ == "__main__":
    success = main()
    if success:
        print("\nIntegration test passed! Your Google Sheets integration is properly configured.")
    else:
        print("\nIntegration test failed. Please check your service account credentials.")