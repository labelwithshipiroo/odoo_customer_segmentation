odoo.define('odoo_addon.reports_table', function (require) {
    'use strict';

    var FormController = require('web.FormController');

    // Extend the FormController to add reports functionality for x_hello_world model
    FormController.include({
        /**
         * @override
         */
        start: function () {
            this._super.apply(this, arguments);
            // Only load reports data for x_hello_world model
            if (this.modelName === 'x_hello_world') {
                this._loadReportsData();
            }
        },

        _loadReportsData: function () {
            var self = this;
            fetch('https://localhost:3002/odoo/reports/list', {
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
                self._renderReportsTable(data);
            })
            .catch(function (error) {
                console.error('Error fetching reports data:', error);
                self._renderErrorMessage('Failed to load reports data. Please check the console for details.');
            });
        },

        _renderReportsTable: function (data) {
            var $reportsContainer = this.$el.find('#reports-table-container');
            if ($reportsContainer.length === 0) {
                return;
            }

            if (!data.success || !data.reports) {
                this._renderErrorMessage('Invalid data format received from API');
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
            $reportsContainer.html(html);
        },

        _renderErrorMessage: function (message) {
            var $reportsContainer = this.$el.find('#reports-table-container');
            if ($reportsContainer.length > 0) {
                $reportsContainer.html('<div class="alert alert-danger">' + message + '</div>');
            }
        },
    });
});