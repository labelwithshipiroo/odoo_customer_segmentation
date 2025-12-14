from odoo import models, fields, api


class KPIFormulaLine(models.Model):
    _name = 'kpi.formula.line'
    _description = 'KPI Formula Component'
    _order = 'sequence'

    kpi_id = fields.Many2one('kpi.definition', string='KPI', required=True, ondelete='cascade')
    sequence = fields.Integer(string='Sequence', default=10)

    operator = fields.Selection([
        ('+', 'Add (+)'),
        ('-', 'Subtract (-)'),
        ('*', 'Multiply (*)'),
        ('/', 'Divide (/)'),
        ('(', 'Open Parenthesis ('),
        (')', 'Close Parenthesis )')
    ], string='Operator')

    operand_type = fields.Selection([
        ('kpi', 'KPI Reference'),
        ('constant', 'Constant Value'),
        ('field', 'Model Field')
    ], string='Operand Type', required=True)

    operand_kpi_id = fields.Many2one('kpi.definition', string='Referenced KPI')
    operand_value = fields.Float(string='Constant Value')
    operand_field = fields.Char(string='Field Name',
                                help='Technical field name from source model')