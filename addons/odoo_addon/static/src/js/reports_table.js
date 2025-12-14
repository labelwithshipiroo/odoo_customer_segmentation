odoo.define('odoo_addon.reports_table', [], function () {
    'use strict';

    // Use vanilla JavaScript instead of jQuery to avoid dependency issues
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

            var html = '<div class="overflow-x-auto">' +
                '<table class="shadcn-table">' +
                '<thead class="shadcn-table-header">' +
                '<tr class="shadcn-table-row border-b">' +
                '<th class="shadcn-table-head">ID</th>' +
                '<th class="shadcn-table-head">Name</th>' +
                '<th class="shadcn-table-head">Country</th>' +
                '<th class="shadcn-table-head">Root Report</th>' +
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

                html += '<tr class="shadcn-table-row">' +
                    '<td class="shadcn-table-cell">' + (report.id || '') + '</td>' +
                    '<td class="shadcn-table-cell">' + (report.name || '') + '</td>' +
                    '<td class="shadcn-table-cell">' +
                        '<span class="shadcn-badge shadcn-badge-secondary">' + (report.country_id || 'N/A') + '</span>' +
                    '</td>' +
                    '<td class="shadcn-table-cell">' + (rootReportName || 'N/A') + '</td>' +
                    '</tr>';
            });

            html += '</tbody></table></div>';
            container.innerHTML = html;
        };

        var renderErrorMessage = function(message, container) {
            container.innerHTML = '<div class="alert alert-danger">' + message + '</div>';
        };

        // Start checking for the container
        checkForContainer();
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeReportsTable);
    } else {
        initializeReportsTable();
    }
});