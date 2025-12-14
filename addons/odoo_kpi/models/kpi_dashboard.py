from odoo import models, fields, api


class KPIDashboard(models.Model):
    _name = 'kpi.dashboard'
    _description = 'KPI Dashboard'
    _order = 'name'

    name = fields.Char(string='Dashboard Name', required=True)
    user_id = fields.Many2one('res.users', string='Owner',
                              default=lambda self: self.env.user)

    widget_ids = fields.One2many('kpi.widget', 'dashboard_id', string='Widgets')

    is_default = fields.Boolean(string='Default Dashboard')
    shared = fields.Boolean(string='Shared',
                           help='If checked, this dashboard is visible to all users')

    active = fields.Boolean(default=True)