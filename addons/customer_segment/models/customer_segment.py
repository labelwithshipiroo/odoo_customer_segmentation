from odoo import models, fields

class CustomerSegment(models.Model):
    _name = 'customer.segment'
    _description = 'Customer Segment'
    name = fields.Char(string='Name', required=True)
    description = fields.Text(string='Description')