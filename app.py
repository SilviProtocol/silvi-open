from flask import Flask, flash, redirect, url_for
from config import AppConfig, logger
from routes_main import main_bp
from routes_api import api_bp
import os
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def create_app():
    """Create and configure the Flask application with dynamic ontology support"""
    app = Flask(__name__)
    
    # Initialize configuration
    config = AppConfig(app)
    
    # Dynamic ontology is now always enabled (no complex integration needed)
    app.config['DYNAMIC_ONTOLOGY_ENABLED'] = True
    app.config['DYNAMIC_CONFIG_CACHE_TTL'] = 3600  # 1 hour cache
    app.config['ONTOLOGY_QUALITY_THRESHOLD'] = 0.7  # Minimum quality score
    app.config['AUTO_CATEGORIZATION_ENABLED'] = True
    app.config['RELATIONSHIP_INFERENCE_ENABLED'] = True
    app.config['MAX_FIELDS_FOR_DYNAMIC_ANALYSIS'] = 500  # Performance limit
    
    logger.info("✅ Dynamic ontology system initialized!")
    
    # Register blueprints
    app.register_blueprint(main_bp)
    app.register_blueprint(api_bp)
    
    # Register error handlers
    register_error_handlers(app)
    
    # Add template global functions
    register_template_globals(app)
    
    # Add context processor for common template variables
    register_context_processors(app)
    
    # Add dynamic ontology health check routes
    register_dynamic_ontology_routes(app)
    
    return app

def register_error_handlers(app):
    """Register global error handlers"""
    
    @app.errorhandler(413)
    def request_entity_too_large(error):
        """Handle file size exceeded error."""
        flash(f'File too large. Max size: {app.config["MAX_CONTENT_LENGTH"] // (1024 * 1024)}MB.', 'error')
        return redirect(url_for('main.index')), 413

    @app.errorhandler(404)
    def page_not_found(error):
        """Handle 404 errors."""
        flash('Page not found.', 'error')
        return redirect(url_for('main.index')), 404

    @app.errorhandler(500)
    def internal_server_error(error):
        """Handle 500 errors."""
        logger.error(f"Internal server error: {str(error)}", exc_info=True)
        flash('An internal server error occurred.', 'error')
        return redirect(url_for('main.index')), 500

def register_template_globals(app):
    """Register template global functions"""
    
    @app.template_global()
    def has_dynamic_ontology():
        """Check if dynamic ontology is available"""
        return True  # Always available now
    
    @app.template_global()
    def get_app_version():
        """Get application version"""
        return '2.0.0-dynamic'

def register_context_processors(app):
    """Register context processors for common template variables"""
    
    @app.context_processor
    def inject_common_vars():
        """Inject common variables into all templates"""
        return {
            'has_dynamic_ontology': True,
            'app_version': '2.0.0-dynamic',
            'dynamic_ontology_enabled': True
        }

def register_dynamic_ontology_routes(app):
    """Register additional routes for dynamic ontology features"""
    
    @app.route('/health/dynamic-ontology')
    def dynamic_ontology_health():
        """Health check endpoint for dynamic ontology system"""
        from flask import jsonify
        from enhanced_dynamic_ontology import DynamicOntologyGenerator
        
        try:
            # Test the generator with a simple analysis
            test_data = [
                {
                    'Field': 'test_field',
                    'Schema (revised)': 'test_schema_field',
                    'Exists': '',
                    'ai researched (may need ai+human fields in main schema)': 'test_category',
                    'manual calculation': '',
                    'option set': ''
                }
            ]
            
            generator = DynamicOntologyGenerator()
            analysis = generator.analyze_spreadsheet_data(test_data)
            
            return jsonify({
                'status': 'healthy',
                'message': 'Dynamic ontology system operational',
                'enabled': True,
                'version': analysis.get('version', 'unknown'),
                'features': {
                    'field_analysis': True,
                    'categorization': app.config.get('AUTO_CATEGORIZATION_ENABLED', False),
                    'relationship_inference': app.config.get('RELATIONSHIP_INFERENCE_ENABLED', False),
                    'quality_assessment': True
                }
            }), 200
            
        except Exception as e:
            logger.error(f"Dynamic ontology health check failed: {str(e)}")
            return jsonify({
                'status': 'error',
                'message': f'Dynamic ontology system error: {str(e)}',
                'enabled': False
            }), 500

    @app.route('/features')
    def list_features():
        """List all available features"""
        from flask import jsonify
        
        features = {
            'core_features': {
                'csv_upload': True,
                'google_sheets_import': app.config.get('USE_GOOGLE_SHEETS', False),
                'blazegraph_integration': app.config.get('BLAZEGRAPH_ENABLED', False),
                'postgresql_integration': app.config.get('POSTGRESQL_ENABLED', False),
                'version_management': True
            },
            'dynamic_ontology': {
                'enabled': True,
                'field_detection': True,
                'auto_categorization': app.config.get('AUTO_CATEGORIZATION_ENABLED', False),
                'relationship_inference': app.config.get('RELATIONSHIP_INFERENCE_ENABLED', False),
                'quality_assessment': True,
                'preview_mode': True
            },
            'integrations': {
                'sheets_status': 'initialized' if getattr(app, 'sheets_integration', None) else 'not_available',
                'blazegraph_status': 'enabled' if app.config.get('BLAZEGRAPH_ENABLED') else 'disabled',
                'postgres_status': 'enabled' if app.config.get('POSTGRESQL_ENABLED') else 'disabled'
            }
        }
        
        return jsonify(features)

# Create the app instance
app = create_app()

def print_startup_banner():
    """Print application startup information"""
    port = int(os.environ.get('PORT', 5001))
    
    print(f"\n{'='*60}")
    print(f"🌲 Treekipedia GraphFlow - Dynamic Ontology Generator")
    print(f"✨ Dynamic Ontology System: ENABLED")
    print(f"{'='*60}")
    print(f"🌐 Server: http://localhost:{port}")
    print(f"📊 Blazegraph: {app.config['BLAZEGRAPH_ENDPOINT']}")
    print(f"📋 Google Sheets: {'✅ Enabled' if app.config['USE_GOOGLE_SHEETS'] else '❌ Disabled'}")
    print(f"🗄️  PostgreSQL: {'✅ Enabled' if app.config['POSTGRESQL_ENABLED'] else '❌ Disabled'}")
    print(f"🤖 Dynamic Features:")
    print(f"   • Field Type Detection: ✅")
    print(f"   • Auto Categorization: {'✅' if app.config.get('AUTO_CATEGORIZATION_ENABLED') else '❌'}")
    print(f"   • Relationship Inference: {'✅' if app.config.get('RELATIONSHIP_INFERENCE_ENABLED') else '❌'}")
    print(f"   • Quality Assessment: ✅")
    print(f"   • Preview Mode: ✅")
    print(f"   • No Config Files Needed: ✅")
    print(f"{'='*60}")
    print(f"📚 Documentation: http://localhost:{port}/documentation")
    print(f"🔍 Health Check: http://localhost:{port}/health/dynamic-ontology")
    print(f"⚙️  Features List: http://localhost:{port}/features")
    print(f"{'='*60}\n")

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    
    # Print startup banner with feature information
    print_startup_banner()
    
    # Check if running in production
    if os.environ.get('FLASK_ENV') == 'production':
        print("🚀 Running in PRODUCTION mode")
        app.run(host='0.0.0.0', port=port, debug=False)
    else:
        print("🛠️  Running in DEVELOPMENT mode")
        app.run(host='0.0.0.0', port=port, debug=True)