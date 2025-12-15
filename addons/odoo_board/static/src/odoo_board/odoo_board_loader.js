/** @odoo-module **/

import { registry } from "@web/core/registry";
import { LazyComponent } from "@web/core/assets";
import { Component, xml } from "@odoo/owl";
import { standardActionServiceProps } from "@web/webclient/actions/action_service";

class OdooBoardLoader extends Component {
    static components = { LazyComponent };
    static template = xml`
    <LazyComponent bundle="'odoo_board.assets'" Component="'OdooBoard'" props="props"/>
    `;
    static props = {
        ...standardActionServiceProps,
        props: { type: Object, optional: true },
        Component: { type: Function, optional: true },
    };
}

registry.category("actions").add("odoo_board", OdooBoardLoader);