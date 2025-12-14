{
    'name': 'Customer Segment',
    'version': '1.0',
    'category': 'Sales',
    'summary': 'Manage customer segments',
    'description': '',
    'license': 'LGPL-3',
    'depends': ['base'],
    'data': [
        'security/ir.model.access.csv',
        'views/customer_segment_views.xml',
        'views/res_partner_views.xml',
        'views/menu_views.xml',
    ],
    'images': ['static/description/icon.png'],
    'installable': True,
    'application': True,
}