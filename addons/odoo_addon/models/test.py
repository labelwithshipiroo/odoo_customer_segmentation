from odoo import models, fields


class Test(models.Model):
    _name = 'x_test'
    _description = 'Test'

    name = fields.Char(string='Name')