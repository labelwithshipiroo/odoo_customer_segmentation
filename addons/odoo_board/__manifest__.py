# -*- coding: utf-8 -*-
{
    'name': "OdooBoard",
    'summary': 'Collaborative Whiteboard for Odoo',
    'description': """
        Whiteboard for Odoo
        ====================================
        * Create sticky notes and text boxes
        * Drag and drop elements
        * Collaborate in real-time
        * Save and load whiteboards
    """,
    'author': "Generated",
    'category': 'Productivity',
    'version': '18.0.1.0.0',
    'depends': ['web'],
    'data': [
        'security/ir.model.access.csv',
        'views/odoo_board_views.xml',
        'views/whiteboard_canvas.xml',
    ],
    'assets': {
         "web.assets_backend": [
            "odoo_board/static/src/odoo_board/odoo_board_loader.js",
            "odoo_board/static/src/odoo_board/odoo_board.js",
            "odoo_board/static/src/odoo_board/whiteboard_element.js",
            "odoo_board/static/src/odoo_board/xml/whiteboard_templates.xml",
            "odoo_board/static/src/odoo_board/css/whiteboard.css",
        ],
    },
    "license": "Other proprietary",
    "application": True,
    "installable": True,
    "auto_install": True,
}