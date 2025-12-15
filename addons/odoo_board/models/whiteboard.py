from odoo import models, fields, api
import json


class Whiteboard(models.Model):
    _name = 'whiteboard.board'
    _description = 'Whiteboard'
    _order = 'write_date desc'

    name = fields.Char(string='Whiteboard Name', required=True)
    elements = fields.Text(string='Elements JSON', default='[]')
    user_id = fields.Many2one('res.users', string='Created by', default=lambda self: self.env.user)
    shared = fields.Boolean(string='Shared', default=False)
    active = fields.Boolean(string='Active', default=True)

    def get_elements(self):
        """Return elements as JSON"""
        self.ensure_one()
        try:
            return json.loads(self.elements)
        except:
            return []

    def save_elements(self, elements_data):
        """Save elements from JSON"""
        self.ensure_one()
        self.elements = json.dumps(elements_data)
        return True

    def action_open_canvas(self):
        """Open the whiteboard canvas"""
        self.ensure_one()
        return {
            'type': 'ir.actions.client',
            'name': 'Whiteboard Canvas',
            'tag': 'whiteboard_canvas',
            'context': {'board_id': self.id},
        }


class WhiteboardElement(models.Model):
    _name = 'whiteboard.element'
    _description = 'Whiteboard Element'

    board_id = fields.Many2one('whiteboard.board', string='Whiteboard', required=True, ondelete='cascade')
    element_type = fields.Selection([
        ('sticky', 'Sticky Note'),
        ('text', 'Text Box'),
        ('shape', 'Shape'),
        ('line', 'Line')
    ], string='Type', required=True)
    content = fields.Text(string='Content')
    x_position = fields.Float(string='X Position')
    y_position = fields.Float(string='Y Position')
    width = fields.Float(string='Width')
    height = fields.Float(string='Height')
    color = fields.Char(string='Color')
    font_size = fields.Integer(string='Font Size', default=14)
    z_index = fields.Integer(string='Z-Index', default=0)