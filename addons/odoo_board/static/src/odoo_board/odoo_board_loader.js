/** @odoo-module **/

import { Component, xml } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { OdooBoard } from "./odoo_board";

class OdooBoardAction extends Component {
    static components = { OdooBoard };
    static template = xml`<OdooBoard action="props.action"/>`;
    static props = ["action"];
}

registry.category("actions").add("whiteboard_canvas", OdooBoardAction);