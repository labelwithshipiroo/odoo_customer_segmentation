odoo.define('odoo_addon.reports_table', [], function () {
    'use strict';

    // Use vanilla JavaScript instead of jQuery to avoid dependency issues
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

    function initializeReportsTable() {
        // Check if we're on the x_hello_world form by looking for the container
        var checkForContainer = function() {
            var container = document.querySelector('.reports-table-container');
            if (container && container.offsetParent !== null) { // Check if visible
                loadReportsData(container);
            } else {
                // Check again in a short delay
                setTimeout(checkForContainer, 500);
            }
        };

        var loadReportsData = function(container) {
            // Show loading state
            container.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div><p>Loading reports data...</p></div>';

            fetch('https://192.168.0.212:3002/odoo/reports/list', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(function (data) {
                renderReportsTable(data, container);
            })
            .catch(function (error) {
                console.error('Error fetching reports data:', error);
                renderErrorMessage('Failed to load reports data. Please check the console for details.', container);
            });
        };

        var renderReportsTable = function(data, container) {
            if (!data.success || !data.reports) {
                renderErrorMessage('Invalid data format received from API', container);
                return;
            }

            // Aggregate data for pie chart by country
            var countryCounts = {};
            data.reports.forEach(function (report) {
                var country = report.country_id || 'N/A';
                countryCounts[country] = (countryCounts[country] || 0) + 1;
            });

            var html = '<div class="overflow-x-auto">' +
                '<table class="shadcn-table">' +
                '<thead class="shadcn-table-header">' +
                '<tr class="shadcn-table-row border-b">' +
                '<th class="shadcn-table-head">ID</th>' +
                '<th class="shadcn-table-head">Name</th>' +
                '<th class="shadcn-table-head">Country</th>' +
                '<th class="shadcn-table-head">Root Report</th>' +
                '<th class="shadcn-table-head">Status</th>' +
                '</tr>' +
                '</thead>' +
                '<tbody class="shadcn-table-body">';

            data.reports.forEach(function (report) {
                var rootReportName = '';
                if (Array.isArray(report.root_report_id) && report.root_report_id.length > 1) {
                    rootReportName = report.root_report_id[1];
                } else if (report.root_report_id) {
                    rootReportName = report.root_report_id;
                }

                var statusDropdown = '<select class="status-dropdown shadcn-btn shadcn-btn-secondary" data-report-id="' + (report.id || '') + '">' +
                    '<option value="active">Active</option>' +
                    '<option value="not_active">Not Active</option>' +
                    '</select>';

                html += '<tr class="shadcn-table-row">' +
                    '<td class="shadcn-table-cell">' + (report.id || '') + '</td>' +
                    '<td class="shadcn-table-cell">' + (report.name || '') + '</td>' +
                    '<td class="shadcn-table-cell">' +
                        '<span class="shadcn-badge shadcn-badge-secondary">' + (report.country_id || 'N/A') + '</span>' +
                    '</td>' +
                    '<td class="shadcn-table-cell">' + (rootReportName || 'N/A') + '</td>' +
                    '<td class="shadcn-table-cell">' + statusDropdown + '</td>' +
                    '</tr>';
            });

            html += '</tbody></table></div>';

            // Add pie chart container
            html += '<div class="mt-4">' +
                '<h3 class="text-lg font-semibold mb-2">Reports by Country</h3>' +
                '<canvas id="reports-pie-chart" width="400" height="200"></canvas>' +
                '</div>';

            container.innerHTML = html;

            // Render pie chart
            renderPieChart(countryCounts);

            // Add event listeners for status dropdowns
            var dropdowns = container.querySelectorAll('.status-dropdown');
            dropdowns.forEach(function(dropdown) {
                dropdown.addEventListener('change', function() {
                    var reportId = this.getAttribute('data-report-id');
                    var status = this.value;

                    // Send POST request with identifier
                    fetch('https://192.168.0.212:3002/odoo/reports/status', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            id: reportId,
                            status: status
                        })
                    })
                    .then(function(response) {
                        if (response.ok) {
                            console.log('Status updated successfully for report ID:', reportId);
                        } else {
                            console.error('Failed to update status for report ID:', reportId);
                        }
                    })
                    .catch(function(error) {
                        console.error('Error updating status for report ID:', reportId, error);
                    });
                });
            });
        };

        var renderPieChart = function(countryCounts) {
            var ctx = document.getElementById('reports-pie-chart');
            if (!ctx) return;

            var labels = Object.keys(countryCounts);
            var data = Object.values(countryCounts);

            new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: [
                            '#FF6384',
                            '#36A2EB',
                            '#FFCE56',
                            '#4BC0C0',
                            '#9966FF',
                            '#FF9F40'
                        ],
                        hoverBackgroundColor: [
                            '#FF6384',
                            '#36A2EB',
                            '#FFCE56',
                            '#4BC0C0',
                            '#9966FF',
                            '#FF9F40'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'right',
                        },
                        title: {
                            display: true,
                            text: 'Reports Distribution by Country'
                        }
                    }
                }
            });
        };

        var renderErrorMessage = function(message, container) {
            container.innerHTML = '<div class="alert alert-danger">' + message + '</div>';
        };

        // Start checking for the container
        checkForContainer();
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initializeReportsTable();
            initializeAccountTable();
        });
    } else {
        initializeReportsTable();
        initializeAccountTable();
    }
});