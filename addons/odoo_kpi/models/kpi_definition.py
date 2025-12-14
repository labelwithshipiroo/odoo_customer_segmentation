from odoo import models, fields, api
from odoo.exceptions import ValidationError


class KPIDefinition(models.Model):
    _name = 'kpi.definition'
    _description = 'KPI Definition'
    _order = 'name'

    name = fields.Char(string='KPI Name', required=True)
    code = fields.Char(string='Code', required=True, index=True)
    description = fields.Text(string='Description')

    kpi_type = fields.Selection([
        ('statistical', 'Statistical'),
        ('monetary', 'Monetary'),
        ('formula', 'Formula')
    ], string='KPI Type', required=True, default='statistical')

    unit_of_measure = fields.Char(string='Unit of Measure', default='')

    calculation_method = fields.Selection([
        ('direct', 'Direct (Stored Value)'),
        ('computed', 'Computed (Formula)')
    ], string='Calculation Method', required=True, default='direct')

    formula = fields.Text(string='Formula', help='Formula for computed KPIs')
    formula_line_ids = fields.One2many('kpi.formula.line', 'kpi_id', string='Formula Lines')

    aggregation_method = fields.Selection([
        ('sum', 'Sum'),
        ('avg', 'Average'),
        ('min', 'Minimum'),
        ('max', 'Maximum'),
        ('last', 'Last Value')
    ], string='Aggregation Method', default='sum')

    source_ids = fields.One2many('kpi.source', 'kpi_id', string='Sources')
    value_ids = fields.One2many('kpi.value', 'kpi_definition_id', string='Actual Values')
    budget_line_ids = fields.One2many('kpi.budget.line', 'kpi_definition_id', string='Budget Lines')
    target_ids = fields.One2many('kpi.target', 'kpi_definition_id', string='Targets')

    active = fields.Boolean(default=True)
    color = fields.Integer(string='Color Index', default=0)

    _sql_constraints = [
        ('code_unique', 'unique(code)', 'KPI Code must be unique!')
    ]

    @api.constrains('calculation_method', 'formula')
    def _check_formula(self):
        for record in self:
            if record.calculation_method == 'computed' and not record.formula:
                raise ValidationError('Formula is required for computed KPIs')

    def action_view_values(self):
        return {
            'type': 'ir.actions.act_window',
            'name': f'Values for {self.name}',
            'res_model': 'kpi.value',
            'view_mode': 'list,form',
            'domain': [('kpi_definition_id', '=', self.id)],
            'context': {'default_kpi_definition_id': self.id},
        }

    def action_view_budgets(self):
        return {
            'type': 'ir.actions.act_window',
            'name': f'Budgets for {self.name}',
            'res_model': 'kpi.budget.line',
            'view_mode': 'list,form',
            'domain': [('kpi_definition_id', '=', self.id)],
            'context': {'default_kpi_definition_id': self.id},
        }