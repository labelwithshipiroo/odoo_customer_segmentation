# -*- coding: utf-8 -*-
from odoo import models, fields, api
import json
import base64


class WhiteboardBoard(models.Model):
    """Whiteboard Board Model - Main container for whiteboard elements"""
    _name = 'whiteboard.board'
    _description = 'Whiteboard Board'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'write_date desc'

    name = fields.Char(
        string='Board Name',
        required=True,
        default='Untitled Board',
        tracking=True
    )
    description = fields.Text(string='Description')

    # Board owner
    user_id = fields.Many2one(
        'res.users',
        string='Owner',
        default=lambda self: self.env.user,
        required=True,
        tracking=True
    )
    
    # Store board data as JSON
    board_data = fields.Text(
        string='Board Data',
        help='JSON data containing all board elements'
    )
    
    # Store canvas state (zoom, pan position)
    canvas_state = fields.Text(
        string='Canvas State',
        help='JSON data containing canvas transform state'
    )
    
    # Thumbnail for preview
    thumbnail = fields.Binary(
        string='Thumbnail',
        attachment=True,
        help='Preview image of the board'
    )
    
    # Related elements (for relational storage option)
    element_ids = fields.One2many(
        'whiteboard.element',
        'board_id',
        string='Elements'
    )
    
    # Statistics
    element_count = fields.Integer(
        string='Element Count',
        compute='_compute_element_count',
        store=True
    )
    
    @api.depends('board_data')
    def _compute_element_count(self):
        for record in self:
            count = 0
            if record.board_data:
                try:
                    data = json.loads(record.board_data)
                    elements = data.get('elements', [])
                    count = len(elements)
                except (json.JSONDecodeError, TypeError):
                    count = 0
            record.element_count = count

    def action_open_board(self):
        """Open the whiteboard in fullscreen mode"""
        self.ensure_one()
        return {
            'type': 'ir.actions.client',
            'tag': 'whiteboard_view',
            'name': self.name,
            'target': 'fullscreen',
            'context': {
                'active_id': self.id,
            },
        }

    @api.model
    def get_board_data(self, board_id):
        """Get board data for the whiteboard app"""
        board = self.browse(board_id)
        if not board.exists():
            return None
        
        elements = []
        if board.board_data:
            try:
                data = json.loads(board.board_data)
                elements = data.get('elements', [])
            except (json.JSONDecodeError, TypeError):
                elements = []
        
        canvas_state = None
        if board.canvas_state:
            try:
                canvas_state = json.loads(board.canvas_state)
            except (json.JSONDecodeError, TypeError):
                canvas_state = None
        
        return {
            'id': board.id,
            'name': board.name,
            'description': board.description,
            'elements': elements,
            'canvasState': canvas_state,
        }

    def save_board_data(self, data):
        """Save board data from the whiteboard app"""
        self.ensure_one()
        
        values = {}
        
        if 'name' in data:
            values['name'] = data['name']
        
        if 'elements' in data:
            values['board_data'] = json.dumps({'elements': data['elements']})
        
        if 'canvasState' in data:
            values['canvas_state'] = json.dumps(data['canvasState'])
        
        if 'thumbnail' in data:
            # Handle base64 thumbnail
            thumbnail_data = data['thumbnail']
            if thumbnail_data.startswith('data:'):
                # Remove data URL prefix
                thumbnail_data = thumbnail_data.split(',', 1)[1]
            values['thumbnail'] = thumbnail_data
        
        if values:
            self.write(values)
        
        return True

    @api.model
    def create_from_template(self, template_id):
        """Create a new board from a template"""
        template_data = self._get_template_data(template_id)
        
        values = {
            'name': template_data.get('name', 'New Board'),
            'board_data': json.dumps({'elements': template_data.get('elements', [])}),
        }
        
        board = self.create(values)
        return board.id

    def _get_template_data(self, template_id):
        """Get template data by ID"""
        # Templates are defined in the frontend constants.js
        # This is a fallback for server-side template creation
        templates = {
            'brainstorm': {
                'name': 'Brainstorming Session',
                'elements': [
                    {
                        'type': 'frame',
                        'x': 100, 'y': 100,
                        'width': 800, 'height': 600,
                        'title': 'Ideas',
                        'color': 'blue'
                    },
                    {
                        'type': 'sticky_note',
                        'x': 150, 'y': 180,
                        'width': 150, 'height': 150,
                        'content': 'Idea 1',
                        'color': 'yellow'
                    },
                    {
                        'type': 'sticky_note',
                        'x': 350, 'y': 180,
                        'width': 150, 'height': 150,
                        'content': 'Idea 2',
                        'color': 'pink'
                    },
                    {
                        'type': 'sticky_note',
                        'x': 550, 'y': 180,
                        'width': 150, 'height': 150,
                        'content': 'Idea 3',
                        'color': 'green'
                    },
                ]
            },
            'flowchart': {
                'name': 'Flowchart',
                'elements': [
                    {
                        'type': 'shape',
                        'shapeType': 'rectangle',
                        'x': 300, 'y': 100,
                        'width': 150, 'height': 60,
                        'content': 'Start',
                        'style': {'fill': '#4ADE80'}
                    },
                    {
                        'type': 'shape',
                        'shapeType': 'diamond',
                        'x': 275, 'y': 250,
                        'width': 200, 'height': 120,
                        'content': 'Decision?',
                        'style': {'fill': '#60A5FA'}
                    },
                    {
                        'type': 'shape',
                        'shapeType': 'rectangle',
                        'x': 100, 'y': 450,
                        'width': 150, 'height': 60,
                        'content': 'Option A',
                        'style': {'fill': '#FBBF24'}
                    },
                    {
                        'type': 'shape',
                        'shapeType': 'rectangle',
                        'x': 500, 'y': 450,
                        'width': 150, 'height': 60,
                        'content': 'Option B',
                        'style': {'fill': '#F87171'}
                    },
                ]
            },
            'kanban': {
                'name': 'Kanban Board',
                'elements': [
                    {
                        'type': 'frame',
                        'x': 50, 'y': 50,
                        'width': 280, 'height': 500,
                        'title': 'To Do',
                        'color': 'gray'
                    },
                    {
                        'type': 'frame',
                        'x': 360, 'y': 50,
                        'width': 280, 'height': 500,
                        'title': 'In Progress',
                        'color': 'blue'
                    },
                    {
                        'type': 'frame',
                        'x': 670, 'y': 50,
                        'width': 280, 'height': 500,
                        'title': 'Done',
                        'color': 'green'
                    },
                    {
                        'type': 'sticky_note',
                        'x': 80, 'y': 130,
                        'width': 200, 'height': 100,
                        'content': 'Task 1',
                        'color': 'yellow'
                    },
                    {
                        'type': 'sticky_note',
                        'x': 80, 'y': 260,
                        'width': 200, 'height': 100,
                        'content': 'Task 2',
                        'color': 'yellow'
                    },
                ]
            },
            'mindmap': {
                'name': 'Mind Map',
                'elements': [
                    {
                        'type': 'shape',
                        'shapeType': 'circle',
                        'x': 350, 'y': 250,
                        'width': 150, 'height': 150,
                        'content': 'Central Idea',
                        'style': {'fill': '#8B5CF6'}
                    },
                    {
                        'type': 'sticky_note',
                        'x': 100, 'y': 100,
                        'width': 120, 'height': 80,
                        'content': 'Branch 1',
                        'color': 'pink'
                    },
                    {
                        'type': 'sticky_note',
                        'x': 580, 'y': 100,
                        'width': 120, 'height': 80,
                        'content': 'Branch 2',
                        'color': 'blue'
                    },
                    {
                        'type': 'sticky_note',
                        'x': 100, 'y': 420,
                        'width': 120, 'height': 80,
                        'content': 'Branch 3',
                        'color': 'green'
                    },
                    {
                        'type': 'sticky_note',
                        'x': 580, 'y': 420,
                        'width': 120, 'height': 80,
                        'content': 'Branch 4',
                        'color': 'orange'
                    },
                ]
            },
        }
        
        return templates.get(template_id, {'name': 'New Board', 'elements': []})

    def duplicate_board(self):
        """Duplicate the current board"""
        self.ensure_one()
        new_board = self.copy({
            'name': f"{self.name} (Copy)",
        })
        return new_board.action_open_board()


class WhiteboardElement(models.Model):
    """Whiteboard Element Model - Individual element on a board (optional relational storage)"""
    _name = 'whiteboard.element'
    _description = 'Whiteboard Element'
    _order = 'z_index, id'

    board_id = fields.Many2one(
        'whiteboard.board',
        string='Board',
        required=True,
        ondelete='cascade',
        index=True
    )
    
    element_type = fields.Selection([
        ('sticky_note', 'Sticky Note'),
        ('text', 'Text'),
        ('shape', 'Shape'),
        ('frame', 'Frame'),
        ('connector', 'Connector'),
        ('image', 'Image'),
    ], string='Type', required=True)
    
    # Position
    x = fields.Float(string='X Position', default=0)
    y = fields.Float(string='Y Position', default=0)
    
    # Dimensions
    width = fields.Float(string='Width', default=100)
    height = fields.Float(string='Height', default=100)
    
    # Layer order
    z_index = fields.Integer(string='Z-Index', default=0)
    rotation = fields.Float(string='Rotation', default=0)
    
    # Content
    content = fields.Text(string='Content')
    
    # Style and properties as JSON
    style_data = fields.Text(
        string='Style Data',
        help='JSON data containing element styling'
    )
    
    properties_data = fields.Text(
        string='Properties Data',
        help='JSON data containing element-specific properties'
    )
    
    # State
    locked = fields.Boolean(string='Locked', default=False)
    visible = fields.Boolean(string='Visible', default=True)

    def to_dict(self):
        """Convert element to dictionary for JSON serialization"""
        self.ensure_one()
        
        style = {}
        if self.style_data:
            try:
                style = json.loads(self.style_data)
            except (json.JSONDecodeError, TypeError):
                style = {}
        
        properties = {}
        if self.properties_data:
            try:
                properties = json.loads(self.properties_data)
            except (json.JSONDecodeError, TypeError):
                properties = {}
        
        return {
            'id': str(self.id),
            'type': self.element_type,
            'x': self.x,
            'y': self.y,
            'width': self.width,
            'height': self.height,
            'zIndex': self.z_index,
            'rotation': self.rotation,
            'content': self.content,
            'style': style,
            'locked': self.locked,
            'visible': self.visible,
            **properties
        }

    @api.model
    def create_from_dict(self, board_id, data):
        """Create element from dictionary data"""
        values = {
            'board_id': board_id,
            'element_type': data.get('type', 'sticky_note'),
            'x': data.get('x', 0),
            'y': data.get('y', 0),
            'width': data.get('width', 100),
            'height': data.get('height', 100),
            'z_index': data.get('zIndex', 0),
            'rotation': data.get('rotation', 0),
            'content': data.get('content', ''),
            'locked': data.get('locked', False),
            'visible': data.get('visible', True),
        }
        
        # Extract style
        if 'style' in data:
            values['style_data'] = json.dumps(data['style'])
        
        # Extract properties (everything not in standard fields)
        standard_fields = {
            'id', 'type', 'x', 'y', 'width', 'height', 'zIndex',
            'rotation', 'content', 'style', 'locked', 'visible'
        }
        properties = {k: v for k, v in data.items() if k not in standard_fields}
        if properties:
            values['properties_data'] = json.dumps(properties)
        
        return self.create(values)