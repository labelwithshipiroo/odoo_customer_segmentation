from odoo import models, fields


class XGrouping(models.Model):
    _name = 'x_grouping'
    _description = 'Grouping'

    name = fields.Char(string='Name')