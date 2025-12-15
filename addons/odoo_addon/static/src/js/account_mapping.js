odoo.define('odoo_addon.account_mapping', [], function () {
    "use strict";

    function initializeAccountTable() {
        // Check if we're on the account table page
        var checkForContainer = function() {
            var container = document.querySelector('.account-table-container');
            if (container && container.offsetParent !== null) { // Check if visible
                loadAccountData(container);
            } else {
                // Check again in a short delay
                setTimeout(checkForContainer, 500);
            }
        };

        var loadAccountData = function(container) {
            // Show loading state
            container.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div><p>Loading accounts...</p></div>';

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
                        kwargs: { limit: 100 } // Limit for demo
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
                renderErrorMessage('Failed to load accounts. Please check the console for details.', container);
            });
        };

        var renderAccountTable = function(accounts, unifiedAccounts, container) {
            var html = '<div class="overflow-x-auto">' +
                '<table class="shadcn-table">' +
                '<thead class="shadcn-table-header">' +
                '<tr class="shadcn-table-row border-b">' +
                '<th class="shadcn-table-head">ID</th>' +
                '<th class="shadcn-table-head">Name</th>' +
                '<th class="shadcn-table-head">Code</th>' +
                '<th class="shadcn-table-head">Mapping</th>' +
                '</tr>' +
                '</thead>' +
                '<tbody class="shadcn-table-body">';

            accounts.forEach(function (account) {
                var mappingSelect = '<select class="mapping-dropdown" data-account-id="' + account.id + '" data-account-code="' + (account.code || '') + '">' +
                    '<option value="">Select mapping</option>';
                unifiedAccounts.forEach(function (ua) {
                    var selected = account.x_api_mapping && account.x_api_mapping[0] == ua.id ? ' selected' : '';
                    mappingSelect += '<option value="' + ua.id + '"' + selected + '>' + ua.name + '</option>';
                });
                mappingSelect += '</select>';

                html += '<tr class="shadcn-table-row">' +
                    '<td class="shadcn-table-cell">' + account.id + '</td>' +
                    '<td class="shadcn-table-cell">' + (account.name || '') + '</td>' +
                    '<td class="shadcn-table-cell">' + (account.code || '') + '</td>' +
                    '<td class="shadcn-table-cell">' + mappingSelect + '</td>' +
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
        };

        var renderErrorMessage = function(message, container) {
            container.innerHTML = '<div class="alert alert-danger">' + message + '</div>';
        };

        // Start checking for the container
        checkForContainer();
    }

    function populateUnifiedAccounts() {
        console.log('Populating unified accounts');
        // Fetch unified accounts options
        fetch('https://192.168.0.212:3002/odoo/accounts/unified', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        })
        .then(function (res) { return res.json(); })
        .then(function (data) {
            console.log('Unified accounts API response:', data);
            // Expecting data.accounts = [{id, name}, ...] or similar
            var accounts = data && (data.accounts || data);
            if (!Array.isArray(accounts)) {
                console.error('Unexpected unified accounts response', data);
                return;
            }

            // For each account, create if not exists
            accounts.forEach(function (a) {
                // Use RPC to search if exists
                fetch('/web/dataset/call_kw', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        method: 'call',
                        params: {
                            model: 'unified.account',
                            method: 'search_read',
                            args: [[['api_id', '=', a.id]], ['id']],
                            kwargs: {}
                        }
                    })
                })
                .then(function (res) { return res.json(); })
                .then(function (searchData) {
                    if (searchData.result && searchData.result.length > 0) {
                        // Exists, update name if changed
                        var existingId = searchData.result[0].id;
                        fetch('/web/dataset/call_kw', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                jsonrpc: '2.0',
                                method: 'call',
                                params: {
                                    model: 'unified.account',
                                    method: 'write',
                                    args: [[existingId], {'name': a.name}],
                                    kwargs: {}
                                }
                            })
                        });
                    } else {
                        // Create
                        fetch('/web/dataset/call_kw', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                jsonrpc: '2.0',
                                method: 'call',
                                params: {
                                    model: 'unified.account',
                                    method: 'create',
                                    args: [{'name': a.name, 'api_id': a.id}],
                                    kwargs: {}
                                }
                            })
                        });
                    }
                })
                .catch(function (err) {
                    console.error('Error creating/updating unified account', err);
                });
            });
        })
        .catch(function (err) {
            console.error('Failed to load unified accounts', err);
        });
    }

    // Initialize on DOM ready
    function init() {
        populateUnifiedAccounts();
        initializeAccountTable();
        // Add listener for input changes in the list (many2one widget)
        document.addEventListener('input', function(e) {
            console.log('input event on', e.target.tagName, e.target.name, e.target.value);
            if (e.target.tagName === 'INPUT' && e.target.classList.contains('o-autocomplete--input') && e.target.closest('table')) {
                var input = e.target;
                var row = input.closest('tr');
                var recordId = row ? row.getAttribute('data-id') : null;
                if (recordId && input.value) {
                    console.log('Mapping changed for record', recordId, 'to', input.value);
                    // Get the unified record id
                    var unifiedId = input.value;
                    // Get account code from the row
                    var codeCell = row.querySelector('td[data-field="code"]');
                    var accountCode = codeCell ? codeCell.textContent.trim() : '';
                    // Call API
                    fetch('https://192.168.0.212:3002/odoo/accounts/map', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            account_id: parseInt(recordId),
                            unified_id: unifiedId,
                            account_code: accountCode
                        })
                    })
                    .then(function (res) {
                        if (!res.ok) {
                            console.error('Mapping API returned error', res.status);
                        } else {
                            console.log('Mapping saved to external API');
                        }
                    })
                    .catch(function (err) {
                        console.error('Error calling mapping API', err);
                    });
                }
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
});