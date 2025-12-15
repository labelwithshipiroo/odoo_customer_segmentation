from odoo import models, fields


class AccountAccount(models.Model):
    _inherit = "account.account"

    x_api_mapping = fields.Char(string="API Mapping")