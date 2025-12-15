odoo.define('odoo_board.whiteboard', function (require) {
    'use strict';

    var core = require('web.core');
    var Action = require('web.AbstractAction');
    var OdooBoard = require('@odoo_board/odoo_board/odoo_board');

    core.action_registry.add('whiteboard_canvas', OdooBoard);
});