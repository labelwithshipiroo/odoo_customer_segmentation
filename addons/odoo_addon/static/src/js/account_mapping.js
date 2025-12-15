odoo.define('odoo_addon.account_mapping', [], function () {
    "use strict";

    function replaceApiMappingInList() {
        // List view: replace x_api_mapping cells with select populated from external API
        var cells = document.querySelectorAll('td[data-field="x_api_mapping"]');
        if (!cells.length) {
            return;
        }

        // Prevent double replacement
        if (cells[0].dataset.replaced) {
            return;
        }
        cells.forEach(function(cell) {
            cell.dataset.replaced = '1';
        });

        // Fetch unified accounts options
        fetch('https://192.168.0.212:3002/odoo/accounts/unified', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        })
        .then(function (res) { return res.json(); })
        .then(function (data) {
            // Expecting data.accounts = [{id, name}, ...] or similar
            var accounts = data && (data.accounts || data);
            if (!Array.isArray(accounts)) {
                console.error('Unexpected unified accounts response', data);
                return;
            }

            cells.forEach(function(cell) {
                var currentValue = cell.textContent.trim();
                var select = document.createElement('select');
                select.className = 'o_api_mapping_select form-control';
                var placeholder = document.createElement('option');
                placeholder.value = '';
                placeholder.textContent = 'Select unified account';
                select.appendChild(placeholder);

                accounts.forEach(function (a) {
                    var opt = document.createElement('option');
                    opt.value = a.id;
                    opt.textContent = a.name;
                    select.appendChild(opt);
                });

                // Set current value if any
                if (currentValue) {
                    select.value = currentValue;
                }

                // On change: update Odoo record and call external mapping API
                select.addEventListener('change', function () {
                    var unifiedId = this.value;
                    var row = cell.closest('tr');
                    var recordId = row ? row.getAttribute('data-id') : null;
                    if (!recordId) {
                        console.error('Cannot find record ID');
                        return;
                    }

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
                                args: [[parseInt(recordId)], {'x_api_mapping': unifiedId}],
                                kwargs: {}
                            }
                        })
                    })
                    .then(function (res) { return res.json(); })
                    .then(function (odooData) {
                        if (odooData.result) {
                            console.log('Odoo record updated');
                        } else {
                            console.error('Failed to update Odoo record', odooData);
                        }
                    })
                    .catch(function (err) {
                        console.error('Error updating Odoo record', err);
                    });

                    // Get account code from the row
                    var codeCell = row.querySelector('td[data-field="code"]');
                    var accountCode = codeCell ? codeCell.textContent.trim() : '';

                    // Call external API to register mapping
                    if (unifiedId) {
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
                });

                cell.innerHTML = '';
                cell.appendChild(select);
            });
        })
        .catch(function (err) {
            console.error('Failed to load unified accounts', err);
        });
    }

    // Initialize on DOM ready and on Odoo view changes
    function init() {
        // Try immediately
        replaceApiMappingInList();

        // Observe DOM mutations to catch list loads (e.g. switching pages)
        var observer = new MutationObserver(function () {
            replaceApiMappingInList();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
});