# -*- coding: utf-8 -*-
{
    'name': 'Whiteboard',
    'version': '18.0.1.0.0',
    'category': 'Productivity',
    'summary': 'Professional whiteboard for visual collaboration - Miro-like experience',
    'description': """
Whiteboard - Professional Visual Collaboration
===============================================

A production-ready whiteboard application inspired by Miro, featuring:

Core Features:
--------------
* **Infinite Canvas** - Unlimited workspace to freely brainstorm, map ideas, and scale content
* **Sticky Notes** - Classic tool for brainstorming, ideation, retrospectives, and workshops
* **Frames** - Structure boards into sections, workflows, or presentation slides
* **Shapes** - Building blocks for diagrams, flowcharts, and system models
* **Connectors** - Show relationships, flows, and dependencies between objects
* **Text Tool** - Headings, descriptions, and documentation directly on the board
* **Templates** - Pre-built layouts for common use cases like brainstorming, user journeys
* **Images** - Insert screenshots, diagrams, inspiration, or references
* **Zoom & Navigation** - Smooth zooming, mini-map, and fast navigation
* **Object Grouping & Alignment** - Move, align, and resize multiple objects consistently

Technical Features:
-------------------
* Built with Odoo 18 OWL framework
* Lucide icons for professional UI
* Real-time canvas rendering
* Undo/redo support
* Auto-save functionality
* Export to PNG/SVG

Author: Odoo Board Team
    """,
    'author': 'Odoo Board',
    'website': 'https://www.odoo.com',
    'depends': ['base', 'web', 'mail'],
    'data': [
        'security/ir.model.access.csv',
        'views/odoo_board_views.xml',
    ],
    'assets': {
        'web.assets_backend': [
            # CSS
            'odoo_board/static/src/css/whiteboard.css',
            
            # Utility modules
            'odoo_board/static/src/js/utils/constants.js',
            'odoo_board/static/src/js/utils/geometry.js',
            'odoo_board/static/src/js/utils/history.js',
            'odoo_board/static/src/js/utils/icons.js',
            
            # Element classes
            'odoo_board/static/src/js/elements/base_element.js',
            'odoo_board/static/src/js/elements/sticky_note.js',
            'odoo_board/static/src/js/elements/text_element.js',
            'odoo_board/static/src/js/elements/shape_element.js',
            'odoo_board/static/src/js/elements/frame_element.js',
            'odoo_board/static/src/js/elements/connector_element.js',
            'odoo_board/static/src/js/elements/image_element.js',
            
            # Canvas system
            'odoo_board/static/src/js/canvas/canvas_core.js',
            'odoo_board/static/src/js/canvas/canvas_interactions.js',
            'odoo_board/static/src/js/canvas/canvas_renderer.js',
            
            # UI Components
            'odoo_board/static/src/js/components/toolbar.js',
            'odoo_board/static/src/js/components/minimap.js',
            'odoo_board/static/src/js/components/context_menu.js',
            'odoo_board/static/src/js/components/properties_panel.js',
            'odoo_board/static/src/js/components/template_picker.js',
            
            # Main application
            'odoo_board/static/src/js/whiteboard_app.js',
            'odoo_board/static/src/js/whiteboard_loader.js',
            
            # XML templates
            'odoo_board/static/src/xml/whiteboard.xml',
        ],
    },
    'images': ['static/description/icon.svg'],
    'installable': True,
    'application': True,
    'auto_install': False,
    'license': 'LGPL-3',
}