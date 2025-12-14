{
    'name': 'KPI and Targets',
    'version': '1.0.0',
    'category': 'Extra Tools',
    'summary': 'Manage KPI and Targets',
    'description': '',
    'author': 'Shipiroo',
    'license': 'LGPL-3',
    'depends': [
        'base',
        'contacts',
        'product',
        'account',
        'sale',
    ],
    'data': [
        'security/ir.model.access.csv',
        'views/menu_views.xml',
        'views/odoo_addon_views.xml',
        'views/res_partner_views.xml',
        'views/product_views.xml',
        'views/account_move_views.xml',
        'views/sale_order_views.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'odoo_addon/static/src/js/reports_table.js',
        ],
    },
    'images': ['static/description/icon.png'],
    'installable': True,
    'application': True,
}