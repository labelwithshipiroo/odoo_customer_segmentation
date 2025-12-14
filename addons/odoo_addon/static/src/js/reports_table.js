odoo.define('odoo_addon.reports_table', [], function () {
    'use strict';

    // Use a simple approach that doesn't depend on specific Odoo modules
    // jQuery should be available globally in Odoo
    $(document).ready(function() {
        // Check if we're on the x_hello_world form by looking for the container
        var checkForContainer = function() {
            var $container = $('.reports-table-container');
            if ($container.length > 0 && $container.is(':visible')) {
                loadReportsData($container);
            } else {
                // Check again in a short delay
                setTimeout(checkForContainer, 500);
            }
        };

        var loadReportsData = function($container) {
            // Show loading state
            $container.html('<div class="text-center"><div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div><p>Loading reports data...</p></div>');

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
                renderReportsTable(data, $container);
            })
            .catch(function (error) {
                console.error('Error fetching reports data:', error);
                renderErrorMessage('Failed to load reports data. Please check the console for details.', $container);
            });
        };

        var renderReportsTable = function(data, $container) {
            if (!data.success || !data.reports) {
                renderErrorMessage('Invalid data format received from API', $container);
                return;
            }

            var html = '<div class="table-responsive">' +
                '<table class="table table-striped table-bordered">' +
                '<thead class="thead-dark">' +
                '<tr>' +
                '<th>ID</th>' +
                '<th>Name</th>' +
                '<th>Country</th>' +
                '<th>Root Report</th>' +
                '</tr>' +
                '</thead>' +
                '<tbody>';

            data.reports.forEach(function (report) {
                var rootReportName = '';
                if (Array.isArray(report.root_report_id) && report.root_report_id.length > 1) {
                    rootReportName = report.root_report_id[1];
                } else if (report.root_report_id) {
                    rootReportName = report.root_report_id;
                }

                html += '<tr>' +
                    '<td>' + (report.id || '') + '</td>' +
                    '<td>' + (report.name || '') + '</td>' +
                    '<td>' + (report.country_id || 'N/A') + '</td>' +
                    '<td>' + (rootReportName || 'N/A') + '</td>' +
                    '</tr>';
            });

            html += '</tbody></table></div>';
            $container.html(html);
        };

        var renderErrorMessage = function(message, $container) {
            $container.html('<div class="alert alert-danger">' + message + '</div>');
        };

        // Start checking for the container
        checkForContainer();
    });
});