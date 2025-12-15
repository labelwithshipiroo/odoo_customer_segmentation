odoo.define('odoo_addon.api_mapping', function () {
    "use strict";

    function replaceApiMappingField() {
        // Form view: replace input[name="x_api_mapping"] with select populated from external API
        var input = document.querySelector('input[name="x_api_mapping"]');
        if (!input) {
            return;
        }

        // Prevent double replacement
        if (input.dataset.replaced) {
            return;
        }
        input.style.display = 'none';
        input.dataset.replaced = '1';

        // Create select
        var select = document.createElement('select');
        select.className = 'o_api_mapping_select form-control';
        var placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Loading...';
        select.appendChild(placeholder);
        input.parentNode.insertBefore(select, input.nextSibling);

        // Helper to get account code from form field
        function getAccountCode() {
            var codeField = document.querySelector('input[name="code"]');
            if (codeField) {
                return codeField.value || '';
            }
            // fallback: try to read from form labels
            var codeEl = document.querySelector('.o_field_widget[name="code"] input');
            return codeEl ? codeEl.value : '';
        }

        // Fetch unified accounts options
        fetch('https://192.168.0.212:3002/odoo/accounts/unified', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        })
        .then(function (res) { return res.json(); })
        .then(function (data) {
            // Expecting data.accounts = [{id, name}, ...] or similar
            select.innerHTML = '';
            var emptyOpt = document.createElement('option');
            emptyOpt.value = '';
            emptyOpt.textContent = 'Select unified account';
            select.appendChild(emptyOpt);

            var accounts = data && (data.accounts || data);
            if (!Array.isArray(accounts)) {
                console.error('Unexpected unified accounts response', data);
                return;
            }
            accounts.forEach(function (a) {
                var opt = document.createElement('option');
                opt.value = a.id;
                opt.textContent = a.name;
                select.appendChild(opt);
            });

            // Set current value if input had one
            if (input.value) {
                select.value = input.value;
            }
        })
        .catch(function (err) {
            console.error('Failed to load unified accounts', err);
            select.innerHTML = '<option value="">Failed to load options</option>';
        });

        // On change: update hidden input and call external mapping API
        select.addEventListener('change', function () {
            var unifiedId = this.value;
            input.value = unifiedId;

            var accountCode = getAccountCode();

            // Call external API to register mapping
            if (unifiedId) {
                fetch('https://192.168.0.212:3002/odoo/accounts/map', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        account_code: accountCode,
                        unified_id: unifiedId
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
    }

    // Initialize on DOM ready and on Odoo view changes
    function init() {
        // Try immediately
        replaceApiMappingField();

        // Observe DOM mutations to catch form loads (e.g. switching records)
        var observer = new MutationObserver(function () {
            replaceApiMappingField();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
});