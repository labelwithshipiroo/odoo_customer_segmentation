odoo.define('odoo_addon.grouping', ['web.rpc'], function (rpc) {
    'use strict';

    function initializeGrouping() {
        // Check if we're on the x_grouping list view
        var checkForListView = function() {
            // Check if we're on the grouping model by looking at the URL or breadcrumbs
            var isGroupingView = window.location.href.includes('x_grouping') ||
                                document.querySelector('[data-model="x_grouping"]') ||
                                document.querySelector('.breadcrumb-item a[href*="x_grouping"]');

            if (!isGroupingView) {
                return; // Not on grouping view, don't initialize
            }

            var listView = document.querySelector('.o_list_view') || document.querySelector('.o_view_controller');
            if (listView && listView.offsetParent !== null) { // Check if visible
                // Hide standard list view content
                var standardTable = listView.querySelector('table');
                if (standardTable) {
                    standardTable.style.display = 'none';
                }

                // Hide search bar and other controls
                var searchBar = listView.querySelector('.o_searchview');
                if (searchBar) {
                    searchBar.style.display = 'none';
                }

                // Create container if it doesn't exist
                var container = listView.querySelector('.grouping-container');
                if (!container) {
                    container = document.createElement('div');
                    container.className = 'grouping-container';
                    container.style.cssText = 'width: 100%; min-height: 200px; padding: 20px;';
                    // Insert at the beginning of the view
                    if (listView.firstChild) {
                        listView.insertBefore(container, listView.firstChild);
                    } else {
                        listView.appendChild(container);
                    }
                }
                loadGroupingData(container);
            } else {
                // Check again in a short delay
                setTimeout(checkForListView, 500);
            }
        };

        var loadGroupingData = function(container) {
            // Show loading state
            container.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div><p>Loading grouping data...</p></div>';

            // Fetch journal accounts from Odoo
            rpc.query({
                model: 'account.account',
                method: 'search_read',
                args: [[], ['code', 'name']],
                kwargs: {}
            })
            .then(function (odooData) {
                // Fetch unified accounts from API
                return fetch('https://192.168.0.212:3002/odoo/accounts/unified', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })
                .then(function (apiResponse) {
                    return apiResponse.json();
                })
                .then(function (apiData) {
                    renderGroupingTable(odooData, apiData, container);
                });
            })
            .catch(function (error) {
                console.error('Error fetching grouping data:', error);
                renderErrorMessage('Failed to load grouping data. Please check the console for details.', container);
            });
        };

        var renderGroupingTable = function(journalAccounts, unifiedAccounts, container) {
            if (!journalAccounts || !unifiedAccounts || !unifiedAccounts.success || !unifiedAccounts.accounts) {
                renderErrorMessage('Invalid data format received', container);
                return;
            }

            var html = '<div class="overflow-x-auto">' +
                '<table class="shadcn-table">' +
                '<thead class="shadcn-table-header">' +
                '<tr class="shadcn-table-row border-b">' +
                '<th class="shadcn-table-head">Code</th>' +
                '<th class="shadcn-table-head">Description</th>' +
                '<th class="shadcn-table-head">Unified Account Mapping</th>' +
                '</tr>' +
                '</thead>' +
                '<tbody class="shadcn-table-body">';

            journalAccounts.forEach(function (account) {
                var mappingDropdown = '<select class="mapping-dropdown shadcn-btn shadcn-btn-secondary" data-account-id="' + account.id + '">' +
                    '<option value="">Select Unified Account</option>';

                unifiedAccounts.accounts.forEach(function (unified) {
                    mappingDropdown += '<option value="' + unified.id + '">' + unified.name + '</option>';
                });

                mappingDropdown += '</select>';

                html += '<tr class="shadcn-table-row">' +
                    '<td class="shadcn-table-cell">' + (account.code || '') + '</td>' +
                    '<td class="shadcn-table-cell">' + (account.name || '') + '</td>' +
                    '<td class="shadcn-table-cell">' + mappingDropdown + '</td>' +
                    '</tr>';
            });

            html += '</tbody></table></div>';
            container.innerHTML = html;

            // Add event listeners for mapping dropdowns
            var dropdowns = container.querySelectorAll('.mapping-dropdown');
            dropdowns.forEach(function(dropdown) {
                dropdown.addEventListener('change', function() {
                    var accountId = this.getAttribute('data-account-id');
                    var unifiedId = this.value;

                    if (unifiedId) {
                        // Send POST request with mapping
                        fetch('https://192.168.0.212:3002/odoo/accounts/map', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                account_id: accountId,
                                unified_id: unifiedId
                            })
                        })
                        .then(function(response) {
                            if (response.ok) {
                                console.log('Mapping updated successfully for account ID:', accountId);
                            } else {
                                console.error('Failed to update mapping for account ID:', accountId);
                            }
                        })
                        .catch(function(error) {
                            console.error('Error updating mapping for account ID:', accountId, error);
                        });
                    }
                });
            });
        };

        var renderErrorMessage = function(message, container) {
            container.innerHTML = '<div class="alert alert-danger">' + message + '</div>';
        };

        // Start checking for the list view
        checkForListView();
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeGrouping);
    } else {
        initializeGrouping();
    }
});