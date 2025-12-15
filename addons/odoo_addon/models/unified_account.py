from odoo import models, fields

class UnifiedAccount(models.Model):
    _name = 'unified.account'
    _description = 'Unified Account'

    name = fields.Char(string='Name', required=True)
    api_id = fields.Char(string='API ID', required=True)