{
    'name': 'KPI Management',
    'version': '1.0',
    'category': 'Productivity',
    'summary': 'Comprehensive KPI management and dashboard system',
    'description': '''
        A comprehensive KPI (Key Performance Indicator) management system for Odoo.
        Features include:
        - KPI Definition and Configuration
        - Source Mapping to business objects
        - Actual Value Tracking
        - Budget and Forecast Management
        - Dashboard Visualization
        - Formula-based KPI calculations
        - Target and Threshold Management
    ''',
    'license': 'LGPL-3',
    'depends': ['base', 'web', 'account'],
    'data': [
        'security/kpi_security.xml',
        'security/ir.model.access.csv',
        'views/kpi_definition_views.xml',
        'views/kpi_source_views.xml',
        'views/kpi_value_views.xml',
        'views/kpi_budget_line_views.xml',
        'views/kpi_formula_line_views.xml',
        'views/kpi_target_views.xml',
        'views/kpi_dashboard_views.xml',
        'views/kpi_widget_views.xml',
        'views/kpi_menu.xml',
        'data/kpi_data.xml',
    ],
    'images': ['static/description/icon.png'],
    'installable': True,
    'application': True,
    'auto_install': False,
}