from odoo import http
from odoo.http import request


class TestPageController(http.Controller):

    @http.route('/odoo_addon/test_page', type='http', auth='user', website=False)
    def test_page(self, **kwargs):
        return request.render('odoo_addon.test_page_template', {})