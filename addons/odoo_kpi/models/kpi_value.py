from odoo import models, fields, api, _
from odoo.exceptions import ValidationError


class KPIValue(models.Model):
    _name = 'kpi.value'
    _description = 'KPI Actual Value'
    _order = 'date_from desc'

    kpi_definition_id = fields.Many2one('kpi.definition', string='KPI',
                                        required=True, ondelete='cascade', index=True)
    kpi_code = fields.Char(related='kpi_definition_id.code', string='KPI Code', store=True)
    kpi_type = fields.Selection(related='kpi_definition_id.kpi_type', string='Type', store=True)

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

    value = fields.Float(string='Value', digits=(16, 2))
    currency_id = fields.Many2one('res.currency', string='Currency',
                                  default=lambda self: self.env.company.currency_id)

    notes = fields.Text(string='Notes')
    computed = fields.Boolean(string='Computed', default=False,
                              help='Indicates if this value was auto-calculated')

    user_id = fields.Many2one('res.users', string='Created By',
                              default=lambda self: self.env.user)

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

    @api.constrains('date_from', 'date_to')
    def _check_dates(self):
        for record in self:
            if record.date_from > record.date_to:
                raise ValidationError(_('Date From cannot be after Date To'))