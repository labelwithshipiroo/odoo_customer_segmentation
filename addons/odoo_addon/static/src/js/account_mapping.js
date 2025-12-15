odoo.define('odoo_addon.account_mapping', [], function () {
    "use strict";

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
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
});