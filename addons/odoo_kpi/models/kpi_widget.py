from odoo import models, fields, api


class KPIWidget(models.Model):
    _name = 'kpi.widget'
    _description = 'KPI Dashboard Widget'
    _order = 'sequence'

    dashboard_id = fields.Many2one('kpi.dashboard', string='Dashboard',
                                   required=True, ondelete='cascade')

    kpi_definition_id = fields.Many2one('kpi.definition', string='KPI', required=True)

    source_model = fields.Char(string='Source Model')
    source_id = fields.Integer(string='Source ID')

    widget_type = fields.Selection([
        ('gauge', 'Gauge'),
        ('line_chart', 'Line Chart'),
        ('bar_chart', 'Bar Chart'),
        ('number', 'Number'),
        ('table', 'Table')
    ], string='Widget Type', required=True, default='number')

    period_type = fields.Selection([
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('yearly', 'Yearly')
    ], string='Period Type', default='monthly')

    show_actuals = fields.Boolean(string='Show Actuals', default=True)
    budget_ids = fields.Many2many('kpi.budget', string='Compare Budgets')

    sequence = fields.Integer(string='Sequence', default=10)