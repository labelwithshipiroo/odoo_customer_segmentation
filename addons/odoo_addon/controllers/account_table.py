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
            <script src="/web/static/lib/jquery/jquery.js"></script>
            <script>
                // Simplified version of the table loading
                function loadAccountData() {
                    var container = document.querySelector('.account-table-container');
                    if (!container) return;

                    // Fetch accounts via RPC
                    fetch('/web/dataset/call_kw', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            jsonrpc: '2.0',
                            method: 'call',
                            params: {
                                model: 'account.account',
                                method: 'search_read',
                                args: [[], ['id', 'name', 'code', 'x_api_mapping']],
                                kwargs: { limit: 50 }
                            }
                        })
                    })
                    .then(function (response) { return response.json(); })
                    .then(function (data) {
                        var accounts = data.result || [];
                        // Fetch unified accounts for dropdown
                        fetch('/web/dataset/call_kw', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                jsonrpc: '2.0',
                                method: 'call',
                                params: {
                                    model: 'unified.account',
                                    method: 'search_read',
                                    args: [[], ['id', 'name']],
                                    kwargs: {}
                                }
                            })
                        })
                        .then(function (res) { return res.json(); })
                        .then(function (unifiedData) {
                            var unifiedAccounts = unifiedData.result || [];
                            renderAccountTable(accounts, unifiedAccounts, container);
                        })
                        .catch(function (error) {
                            console.error('Error fetching unified accounts:', error);
                            renderAccountTable(accounts, [], container);
                        });
                    })
                    .catch(function (error) {
                        console.error('Error fetching accounts:', error);
                        container.innerHTML = 'Failed to load accounts. Please check the console for details.';
                    });
                }

                function renderAccountTable(accounts, unifiedAccounts, container) {
                    var html = '<div class="overflow-x-auto">' +
                        '<table>' +
                        '<thead>' +
                        '<tr>' +
                        '<th>ID</th>' +
                        '<th>Name</th>' +
                        '<th>Code</th>' +
                        '<th>Mapping</th>' +
                        '</tr>' +
                        '</thead>' +
                        '<tbody>';

                    accounts.forEach(function (account) {
                        var mappingSelect = '<select class="mapping-dropdown" data-account-id="' + account.id + '" data-account-code="' + (account.code || '') + '">' +
                            '<option value="">Select mapping</option>';
                        unifiedAccounts.forEach(function (ua) {
                            var selected = account.x_api_mapping && account.x_api_mapping[0] == ua.id ? ' selected' : '';
                            mappingSelect += '<option value="' + ua.id + '"' + selected + '>' + ua.name + '</option>';
                        });
                        mappingSelect += '</select>';

                        html += '<tr>' +
                            '<td>' + account.id + '</td>' +
                            '<td>' + (account.name || '') + '</td>' +
                            '<td>' + (account.code || '') + '</td>' +
                            '<td>' + mappingSelect + '</td>' +
                            '</tr>';
                    });

                    html += '</tbody></table></div>';

                    container.innerHTML = html;

                    // Add event listeners for mapping dropdowns
                    var dropdowns = container.querySelectorAll('.mapping-dropdown');
                    dropdowns.forEach(function(dropdown) {
                        dropdown.addEventListener('change', function() {
                            var accountId = this.getAttribute('data-account-id');
                            var accountCode = this.getAttribute('data-account-code');
                            var unifiedId = this.value;

                            // Update Odoo record
                            fetch('/web/dataset/call_kw', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    jsonrpc: '2.0',
                                    method: 'call',
                                    params: {
                                        model: 'account.account',
                                        method: 'write',
                                        args: [[parseInt(accountId)], {'x_api_mapping': unifiedId ? parseInt(unifiedId) : false}],
                                        kwargs: {}
                                    }
                                })
                            })
                            .then(function (res) {
                                if (res.ok) {
                                    console.log('Mapping updated in Odoo for account', accountId);
                                } else {
                                    console.error('Failed to update mapping in Odoo');
                                }
                            })
                            .catch(function (err) {
                                console.error('Error updating mapping in Odoo', err);
                            });

                            // Call external API
                            if (unifiedId) {
                                fetch('https://192.168.0.212:3002/odoo/accounts/map', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        account_id: parseInt(accountId),
                                        unified_id: unifiedId,
                                        account_code: accountCode
                                    })
                                })
                                .then(function (res) {
                                    if (res.ok) {
                                        console.log('Mapping saved to external API');
                                    } else {
                                        console.error('Mapping API returned error', res.status);
                                    }
                                })
                                .catch(function (err) {
                                    console.error('Error calling mapping API', err);
                                });
                            }
                        });
                    });
                }

                // Load data on page load
                document.addEventListener('DOMContentLoaded', loadAccountData);
            </script>
        </body>
        </html>
        """