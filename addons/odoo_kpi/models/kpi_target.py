from odoo import models, fields, api


class KPITarget(models.Model):
    _name = 'kpi.target'
    _description = 'KPI Target and Thresholds'
    _order = 'date_from desc'

    kpi_definition_id = fields.Many2one('kpi.definition', string='KPI',
                                        required=True, ondelete='cascade')

    source_model = fields.Char(string='Source Model')
    source_id = fields.Integer(string='Source ID')

    period_type = fields.Selection([
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('yearly', 'Yearly')
    ], string='Period Type', required=True, default='monthly')

    date_from = fields.Date(string='Date From', required=True)
    date_to = fields.Date(string='Date To', required=True)

    target_value = fields.Float(string='Target Value', required=True)
    warning_threshold = fields.Float(string='Warning Threshold (%)', default=90.0,
                                     help='Yellow zone threshold percentage')
    critical_threshold = fields.Float(string='Critical Threshold (%)', default=80.0,
                                      help='Red zone threshold percentage')

    direction = fields.Selection([
        ('higher_better', 'Higher is Better'),
        ('lower_better', 'Lower is Better')
    ], string='Direction', default='higher_better')