/** @odoo-module **/

import { Component } from "@odoo/owl";
import { registry } from "@web/core/registry";

class OdooBoard extends Component {
    static template = "odoo_board";
}

registry.category("lazy_components").add("OdooBoard", OdooBoard);