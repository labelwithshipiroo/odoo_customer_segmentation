from odoo import models, fields


class KPIAssignment(models.Model):
    _name = 'kpi.assignment'
    _description = 'KPI Assignment to Source Models'
    _rec_name = 'kpi_definition_id'

    kpi_definition_id = fields.Many2one(
        'kpi.definition',
        string='KPI',
        required=True,
        ondelete='cascade'
    )
    
    source_model = fields.Selection([
        ('res.partner', 'Partner/Client'),
        ('product.product', 'Product (Variant)'),
        ('product.template', 'Product (Template)'),
        ('sale.order', 'Sales Order'),
        ('purchase.order', 'Purchase Order'),
    ], string='Source Model', required=True)
    
    active = fields.Boolean(default=True)
    
    _sql_constraints = [
        ('unique_assignment', 'unique(kpi_definition_id, source_model)',
         'A KPI can only be assigned once to each source model!')
    ]