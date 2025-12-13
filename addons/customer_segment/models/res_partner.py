from odoo import models, fields

class ResPartner(models.Model):
    _inherit = 'res.partner'
    segment_id = fields.Many2one('customer.segment', string='Segment')