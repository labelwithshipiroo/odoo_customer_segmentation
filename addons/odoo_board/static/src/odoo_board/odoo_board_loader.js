/** @odoo-module **/

import { Component } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { OdooBoard } from "./odoo_board";

class OdooBoardAction extends Component {
    static template = "whiteboard.Board";
    static components = { OdooBoard };
    
    setup() {
        this.action = this.props.action;
    }
}

registry.category("actions").add("whiteboard_canvas", OdooBoardAction);