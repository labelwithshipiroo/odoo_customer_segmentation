/** @odoo-module */

import { registry } from "@web/core/registry";
import { reactive } from "@odoo/owl";

const quickboardService = {
    start(env, services) {
        // prefer injected services, fall back to env.services if not present
        const rpc = (services && services.rpc) || (env.services && env.services.rpc);
        const ui = (services && services.ui) || (env.services && env.services.ui);
        const quickboard = reactive({
            items: {},
            isReady: false
        });

        // Helper to support multiple rpc service shapes (function or object with query/call)
        async function callRpc(path, params) {
            try {
                if (typeof rpc === "function") {
                    return await rpc(path, params);
                }
                if (rpc && typeof rpc.query === "function") {
                    // rpc.query expects an object with route + params in some environments
                    try {
                        return await rpc.query({ route: path, params });
                    } catch (e) {
                        // fallback to calling query with (path, params)
                        return await rpc.query(path, params);
                    }
                }
                if (rpc && typeof rpc.call === "function") {
                    return await rpc.call(path, params);
                }
                if (rpc && typeof rpc.rpc === "function") {
                    return await rpc.rpc(path, params);
                }
                throw new Error("Unsupported rpc service shape");
            } catch (err) {
                console.error("callRpc failed", err);
                throw err;
            }
        }

        async function getQuickboardItemDefs() {
            quickboard.isReady = false;
            quickboard.items = {};
            const updates = await callRpc("/quickboard/item_defs", {});
            Object.assign(quickboard.items, updates);
            quickboard.isReady = true;
        };

        async function getQuickboardItem(itemId, startDate, endDate) {
            return await callRpc("/quickboard/item", {
                item_id: itemId,
                start_date: startDate.toSQLDate(),
                end_date: endDate.toSQLDate(),
            });
        };

        async function saveLayout(layout){
            await callRpc("/quickboard/save_layout", {
                layout: layout
            });
        };

        quickboard.getQuickboardItemDefs = getQuickboardItemDefs;
        quickboard.getQuickboardItem = getQuickboardItem;
        quickboard.saveLayout = saveLayout;
        return quickboard;
    }
};

registry.category("services").add("quickboard", quickboardService);
