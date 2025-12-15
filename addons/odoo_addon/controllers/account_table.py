from odoo import http
from odoo.http import request


class AccountTableController(http.Controller):

    @http.route('/odoo_addon/account_table', type='http', auth='user', website=False)
    def account_table(self, **kwargs):
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Account Custom Table</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    background: white;
                }
                .account-table-container {
                    max-width: 100%;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }
                th {
                    background-color: #f2f2f2;
                }
                select {
                    width: 100%;
                }
            </style>
        </head>
        <body>
            <h1>Account Custom Table</h1>
            <div class="account-table-container">
                <p>Loading accounts...</p>
            </div>
        </body>
        </html>
        """