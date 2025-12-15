/** @odoo-module **/

import { registry } from "@web/core/registry";
import { OdooBoard } from "./odoo_board";

registry.category("actions").add("whiteboard_canvas", OdooBoard);