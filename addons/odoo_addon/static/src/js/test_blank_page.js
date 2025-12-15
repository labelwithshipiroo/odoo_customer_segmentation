odoo.define('odoo_addon.test_blank_page', function (require) {
    'use strict';

    var AbstractAction = require('web.AbstractAction');
    var core = require('web.core');

    var TestBlankPage = AbstractAction.extend({
        template: 'test_blank_page_template',

        init: function (parent, action) {
            this._super.apply(this, arguments);
        },

        start: function () {
            return this._super().then(function () {
                // Additional initialization if needed
            });
        },
    });

    core.action_registry.add('test_blank_page', TestBlankPage);

    return TestBlankPage;
});