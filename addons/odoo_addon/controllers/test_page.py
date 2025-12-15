from odoo import http
from odoo.http import request


class TestPageController(http.Controller):

    @http.route('/odoo_addon/test_page', type='http', auth='user', website=False)
    def test_page(self, **kwargs):
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Test Page</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    margin: 0;
                    background: white;
                }
                h1 {
                    color: #333;
                }
            </style>
        </head>
        <body>
            <h1>Hello</h1>
        </body>
        </html>
        """