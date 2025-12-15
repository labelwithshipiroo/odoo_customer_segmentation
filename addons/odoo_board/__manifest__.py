# -*- coding: utf-8 -*-
{
    'name': "OdooBoard",
    'summary': "Minimal dashboard addon based on Quickboard view",
    'description': """
        OdooBoard - minimal addon that provides the same top menu/view shell as Quickboard.
        Grid layout area is intentionally left empty.
    """,
    'author': "Generated",
    'category': 'Productivity',
    'version': '18.0.1.0.0',
    'depends': ['web'],
    'data': [
        'security/ir.model.access.csv',
        'views/odoo_board_views.xml',
    ],
    'assets': {
         "web.assets_backend": [
            "odoo_board/static/src/**/*",
        ],
    },
    "license": "Other proprietary",
    "application": True,
    "installable": True,
    "auto_install": True,
}