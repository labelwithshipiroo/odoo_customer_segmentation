# -*- coding: utf-8 -*-
{
    'name': "Quickboard",
    'summary': """Quickboard is a simple and easy to use dashboard powered with AI.""",
    'description': """
        Quickboard is a simple and easy to use dashboard powered with AI.
    """,
    'author': "Yoni Tjio",
    'category': 'Productivity',
    'version': '18.0.1.0.0',
    'depends': ['web'],
    'data': [
        'security/quickboard_security.xml',
        'security/ir.model.access.csv',
        'views/quickboard_views.xml',
        'views/quickboard_item_views.xml',
        'wizard/quickboard_generator_views.xml'
    ],
    'assets': {
         "web.assets_backend": [
            "quickboard_v2/static/src/**/*",
            "quickboard_v2/static/src/quickboard/quickboard_service.js",
        ],
        "quickboard_v2.assets": [
            ('include', "web.chartjs_lib"),
            "quickboard_v2/static/lib/gridstack/*",
            "quickboard_v2/static/lib/spinjs/*",
            "quickboard_v2/static/src/quickboard/**/*",
            "quickboard_v2/static/src/css/**/*",
        ],
   },
    "license":"Other proprietary",
    "application": True,
    "installable": True,
    "auto_install": False
}
