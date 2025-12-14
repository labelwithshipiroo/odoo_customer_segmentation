{
    'name': 'Contacts KPI and Targets',
    'version': '1.0.0',
    'category': 'CRM',
    'author': 'YannickCuvelie',
    'license': 'LGPL-3',
    'depends': [
        'base',
        'contacts',
        'product',
        'account',
        'sale',
    ],
    'data': [
        'views/res_partner_views.xml',
        'views/product_views.xml',
        'views/account_move_views.xml',
        'views/sale_order_views.xml',
    ],
    'installable': True,
    'application': False,
}