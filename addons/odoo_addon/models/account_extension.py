from odoo import models, fields, api
import requests


class AccountAccount(models.Model):
    _inherit = "account.account"

    x_api_mapping = fields.Many2one('unified.account', string="API Mapping")

    @api.onchange('x_api_mapping')
    def _onchange_x_api_mapping(self):
        if self.x_api_mapping:
            try:
                requests.post('https://192.168.0.212:3002/odoo/accounts/map', json={
                    'account_id': self.id,
                    'unified_id': self.x_api_mapping.api_id,
                    'account_code': self.code
                }, timeout=5)
            except:
                pass  # Ignore errors