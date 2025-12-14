from odoo import models, fields, api


class KPISource(models.Model):
    _name = 'kpi.source'
    _description = 'KPI Source Configuration'
    _rec_name = 'kpi_id'

    kpi_id = fields.Many2one('kpi.definition', string='KPI', required=True, ondelete='cascade')

    source_model = fields.Selection([
        ('res.partner', 'Contacts/Customers/Suppliers'),
        ('product.product', 'Products'),
        ('product.template', 'Product Templates'),
        ('sale.order', 'Sales Orders'),
        ('purchase.order', 'Purchase Orders'),
        ('account.move', 'Invoices'),
        ('res.company', 'Company'),
        ('hr.department', 'Departments'),
        ('project.project', 'Projects'),
        ('crm.lead', 'Leads/Opportunities')
    ], string='Source Model', required=True)

    source_filter = fields.Text(string='Domain Filter',
                                help='Domain filter for the source records',
                                default='[]')

    is_global = fields.Boolean(string='Global KPI',
                               help='If checked, KPI is not tied to specific records')

    _sql_constraints = [
        ('kpi_source_unique', 'unique(kpi_id, source_model)',
         'A KPI can only have one configuration per source model!')
    ]