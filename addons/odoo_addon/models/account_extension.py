from odoo import models, fields, api
import requests


class AccountAccount(models.Model):
    _inherit = "account.account"

    x_api_mapping = fields.Many2one('unified.account', string="API Mapping")

    def write(self, vals):
        print('write called with vals:', vals)
        res = super(AccountAccount, self).write(vals)
        if 'x_api_mapping' in vals and vals['x_api_mapping']:
            print('x_api_mapping changed to:', vals['x_api_mapping'])
            unified = self.env['unified.account'].browse(vals['x_api_mapping'])
            if unified:
                print('calling API with unified_id:', unified.api_id)
                try:
                    response = requests.post('https://192.168.0.212:3002/odoo/accounts/map', json={
                        'account_id': self.id,
                        'unified_id': unified.api_id,
                        'account_code': self.code
                    }, timeout=5)
                    print('API response:', response.status_code, response.text)
                except Exception as e:
                    print('API call failed:', e)
        return res