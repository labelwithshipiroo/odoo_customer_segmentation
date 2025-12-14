from odoo import models, fields, api, _
from odoo.exceptions import ValidationError


class KPIBudgetLine(models.Model):
    _name = 'kpi.budget.line'
    _description = 'KPI Budget/Forecast Line'
    _order = 'date_from desc'

    kpi_definition_id = fields.Many2one('kpi.definition', string='KPI',
                                        required=True, ondelete='cascade', index=True)
    kpi_code = fields.Char(related='kpi_definition_id.code', string='KPI Code', store=True)
    kpi_type = fields.Selection(related='kpi_definition_id.kpi_type', string='Type', store=True)

    # Link to Odoo's budget system
    budget_id = fields.Many2one('crossovered.budget', string='Budget/Forecast',
                                required=True, ondelete='cascade', index=True)
    budget_name = fields.Char(related='budget_id.name', string='Budget Name', store=True)

    # Polymorphic relationship to source
    source_model = fields.Char(string='Source Model', index=True)
    source_id = fields.Integer(string='Source ID', index=True)
    source_name = fields.Char(string='Source Name', compute='_compute_source_name', store=True)

    period_type = fields.Selection([
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('yearly', 'Yearly')
    ], string='Period Type', required=True, default='monthly')

    date_from = fields.Date(string='Date From', required=True, index=True)
    date_to = fields.Date(string='Date To', required=True, index=True)

    value = fields.Float(string='Budget Value', digits=(16, 2))
    currency_id = fields.Many2one('res.currency', string='Currency',
                                  default=lambda self: self.env.company.currency_id)

    # Comparison with actuals
    actual_value = fields.Float(string='Actual Value', compute='_compute_actual_value', store=False)
    variance = fields.Float(string='Variance', compute='_compute_variance', store=False)
    variance_percent = fields.Float(string='Variance %', compute='_compute_variance', store=False)

    notes = fields.Text(string='Notes')
    computed = fields.Boolean(string='Computed', default=False)

    @api.depends('source_model', 'source_id')
    def _compute_source_name(self):
        for record in self:
            if record.source_model and record.source_id:
                try:
                    source_record = self.env[record.source_model].browse(record.source_id)
                    record.source_name = source_record.display_name if source_record.exists() else 'Deleted Record'
                except:
                    record.source_name = 'Unknown'
            else:
                record.source_name = 'Global'

    @api.depends('kpi_definition_id', 'source_model', 'source_id', 'date_from', 'date_to')
    def _compute_actual_value(self):
        for record in self:
            actual = self.env['kpi.value'].search([
                ('kpi_definition_id', '=', record.kpi_definition_id.id),
                ('source_model', '=', record.source_model),
                ('source_id', '=', record.source_id),
                ('date_from', '>=', record.date_from),
                ('date_to', '<=', record.date_to)
            ])
            record.actual_value = sum(actual.mapped('value'))

    @api.depends('value', 'actual_value')
    def _compute_variance(self):
        for record in self:
            record.variance = record.actual_value - record.value
            if record.value != 0:
                record.variance_percent = (record.variance / record.value) * 100
            else:
                record.variance_percent = 0

    @api.constrains('date_from', 'date_to')
    def _check_dates(self):
        for record in self:
            if record.date_from > record.date_to:
                raise ValidationError(_('Date From cannot be after Date To'))