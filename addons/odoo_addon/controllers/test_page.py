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

    @http.route('/odoo_addon/accounts', type='http', auth='user', website=False)
    def accounts_page(self, **kwargs):
        # Get account data
        accounts = request.env['account.account'].search([], limit=50)

        # Build HTML table
        table_rows = ""
        for account in accounts:
            table_rows += f"""
            <tr>
                <td>{account.code}</td>
                <td>{account.name}</td>
                <td>{account.account_type}</td>
                <td>{account.company_id.name if account.company_id else ''}</td>
            </tr>
            """

        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Accounts List</title>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    background: white;
                }}
                table {{
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }}
                th, td {{
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }}
                th {{
                    background-color: #f2f2f2;
                    font-weight: bold;
                }}
                tr:nth-child(even) {{
                    background-color: #f9f9f9;
                }}
                h1 {{
                    color: #333;
                }}
            </style>
        </head>
        <body>
            <h1>Accounts List</h1>
            <table>
                <thead>
                    <tr>
                        <th>Code</th>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Company</th>
                    </tr>
                </thead>
                <tbody>
                    {table_rows}
                </tbody>
            </table>
        </body>
        </html>
        """