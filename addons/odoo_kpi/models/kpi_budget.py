from odoo import models, fields, api, _
from odoo.exceptions import ValidationError


class KPIBudget(models.Model):
    _name = 'kpi.budget'
    _description = 'KPI Budget'
    _order = 'name'

    name = fields.Char(string='Budget Name', required=True, index=True)
    description = fields.Text(string='Description')
    company_id = fields.Many2one('res.company', string='Company',
                                default=lambda self: self.env.company, readonly=True)
    user_id = fields.Many2one('res.users', string='Responsible',
                             default=lambda self: self.env.user, readonly=True)
    date_from = fields.Date(string='Start Date', required=True)
    date_to = fields.Date(string='End Date', required=True)

    period_type = fields.Selection([
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('yearly', 'Yearly')
    ], string='Period Type', required=True, default='monthly')

    state = fields.Selection([
        ('draft', 'Draft'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled')
    ], string='Status', default='draft', required=True)

    budget_line_ids = fields.One2many('kpi.budget.line', 'budget_id', string='Budget Lines')

    @api.constrains('date_from', 'date_to')
    def _check_dates(self):
        for record in self:
            if record.date_from > record.date_to:
                raise ValidationError(_('Start Date cannot be after End Date'))

    def action_confirm(self):
        self.write({'state': 'confirmed'})

    def action_cancel(self):
        self.write({'state': 'cancelled'})

    def action_draft(self):
        self.write({'state': 'draft'})