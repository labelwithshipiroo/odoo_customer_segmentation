odoo.define('odoo_addon.reports_table', function (require) {
    'use strict';

    var core = require('web.core');

    // Extend the FormRenderer to add reports functionality for x_hello_world model
    var FormRenderer = require('web.FormRenderer');
    FormRenderer.include({
        /**
         * @override
         */
        start: function () {
            var self = this;
            return this._super.apply(this, arguments).then(function () {
                // Only load reports data for x_hello_world model
                if (self.state && self.state.model === 'x_hello_world') {
                    self._loadReportsData();
                }
            });
        },

        _loadReportsData: function () {
            var self = this;
            var $container = this.$el.find('.reports-table-container');
            if ($container.length === 0) {
                return;
            }

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
                self._renderReportsTable(data, $container);
            })
            .catch(function (error) {
                console.error('Error fetching reports data:', error);
                self._renderErrorMessage('Failed to load reports data. Please check the console for details.', $container);
            });
        },

        _renderReportsTable: function (data, $container) {
            if (!data.success || !data.reports) {
                this._renderErrorMessage('Invalid data format received from API', $container);
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
        },

        _renderErrorMessage: function (message, $container) {
            $container.html('<div class="alert alert-danger">' + message + '</div>');
        },
    });
});