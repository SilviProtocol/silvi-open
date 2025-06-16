# =============================================================================
# config.py - Configuration Only
# =============================================================================

import os
import logging
from sheets_integration import SheetsIntegration
import psycopg2
import requests

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class AppConfig:
    """Application configuration and initialization"""
    
    def __init__(self, app):
        self.app = app
        self.setup_config()
        self.setup_directories()
        self.setup_integrations()
    
    def setup_config(self):
        """Setup Flask configuration"""
        self.app.secret_key = os.environ.get('SECRET_KEY', "biodiversity_ontology_builder")
        
        # Set up storage directories
        if os.environ.get('RENDER') == 'true':
            self.app.config['UPLOAD_FOLDER'] = '/tmp/uploads'
            self.app.config['METADATA_DIR'] = '/tmp/metadata'
        else:
            self.app.config['UPLOAD_FOLDER'] = 'Uploads'
            self.app.config['METADATA_DIR'] = 'Metadata'

        self.app.config['MAX_CONTENT_LENGTH'] = 32 * 1024 * 1024  # 32MB max file size
        self.app.config['SESSION_EXPIRY'] = 3600  # 1 hour in seconds

        # Google Sheets configuration
        self.app.config['USE_GOOGLE_SHEETS'] = True
        self.app.config['GOOGLE_SHEETS_CREDS_FILE'] = 'service_account.json'
        self.app.config['SPREADSHEET_ID'] = os.environ.get('SPREADSHEET_ID', '')

        # Blazegraph configuration
        self.app.config['BLAZEGRAPH_ENDPOINT'] = os.environ.get('BLAZEGRAPH_ENDPOINT', 'http://167.172.143.162:9999/blazegraph/namespace/kb/sparql')
        self.app.config['BLAZEGRAPH_ENABLED'] = True

        # PostgreSQL configuration
        self.app.config['POSTGRESQL_ENABLED'] = True
        self.app.config['POSTGRESQL_CONFIG'] = {
            'db_connection': {
                'host': os.environ.get('POSTGRES_HOST', '167.172.143.162'),
                'database': os.environ.get('POSTGRES_DB', 'treekipedia'),
                'user': os.environ.get('POSTGRES_USER', 'postgres'),
                'password': os.environ.get('POSTGRES_PASSWORD', '9353jeremic'),
                'port': int(os.environ.get('POSTGRES_PORT', 5432))
            }
        }
    
    def setup_directories(self):
        """Ensure upload and metadata directories exist"""
        os.makedirs(self.app.config['UPLOAD_FOLDER'], exist_ok=True)
        os.makedirs(self.app.config['METADATA_DIR'], exist_ok=True)
    
    def setup_integrations(self):
        """Initialize external integrations with improved error handling"""
        # Initialize Google Sheets integration
        logger.info("=== Starting Google Sheets Integration Setup ===")
        
        try:
            service_account_path = 'service_account.json'
            
            # Check if file exists
            if not os.path.exists(service_account_path):
                logger.warning("service_account.json not found. Google Sheets integration disabled.")
                self.app.sheets_integration = None
                return
            
            logger.info(f"Found service account file: {service_account_path}")
            
            # Try to create SheetsIntegration instance
            try:
                logger.info("Creating SheetsIntegration instance...")
                self.sheets_integration = SheetsIntegration(service_account_file=service_account_path)
                logger.info("SheetsIntegration instance created")
            except Exception as import_error:
                logger.error(f"Error creating SheetsIntegration instance: {str(import_error)}")
                self.app.sheets_integration = None
                return
            
            # Check if initialization was successful
            logger.info("Checking if SheetsIntegration is initialized...")
            if self.sheets_integration and hasattr(self.sheets_integration, 'is_initialized') and self.sheets_integration.is_initialized():
                logger.info("✅ Google Sheets integration initialized successfully!")
                if hasattr(self.sheets_integration, 'credentials') and hasattr(self.sheets_integration.credentials, 'service_account_email'):
                    logger.info(f"Service account email: {self.sheets_integration.credentials.service_account_email}")
                self.app.sheets_integration = self.sheets_integration
            else:
                logger.error("❌ Google Sheets integration failed to initialize")
                logger.error("SheetsIntegration.is_initialized() returned False")
                
                # Debug information
                if self.sheets_integration:
                    logger.info(f"SheetsIntegration object exists: {type(self.sheets_integration)}")
                    logger.info(f"Has is_initialized method: {hasattr(self.sheets_integration, 'is_initialized')}")
                    if hasattr(self.sheets_integration, 'initialized'):
                        logger.info(f"Initialized attribute: {self.sheets_integration.initialized}")
                
                self.app.sheets_integration = None
                
        except Exception as e:
            logger.error(f"❌ Error initializing Google Sheets integration: {str(e)}")
            logger.error("Full error details:", exc_info=True)
            self.app.sheets_integration = None
        
        logger.info("=== Google Sheets Integration Setup Complete ===")

# Global utility functions for connections
def test_postgres_connection():
    """Test PostgreSQL connection"""
    from flask import current_app
    try:
        config = current_app.config['POSTGRESQL_CONFIG']['db_connection']
        conn = psycopg2.connect(
            host=config['host'],
            database=config['database'],
            user=config['user'],
            password=config['password'],
            port=config['port'],
            connect_timeout=5
        )
        conn.close()
        return True
    except Exception as e:
        logger.error(f"PostgreSQL connection test failed: {str(e)}")
        return False

def test_postgres_connection_simple():
    """Simple PostgreSQL connection test"""
    try:
        conn = psycopg2.connect(
            host='167.172.143.162',
            database='treekipedia', 
            user='postgres',
            password='9353jeremic',
            port=5432,
            connect_timeout=3
        )
        conn.close()
        return True
    except Exception:
        return False

def test_blazegraph_connection_simple():
    """Simple Blazegraph connection test"""
    try:
        response = requests.get("http://167.172.143.162:9999/blazegraph", timeout=3)
        return response.status_code == 200
    except Exception:
        return False

def check_blazegraph_status():
    """Check if Blazegraph is accessible."""
    from flask import current_app
    try:
        response = requests.get(current_app.config['BLAZEGRAPH_ENDPOINT'], timeout=5)
        return response.status_code == 200
    except:
        return False