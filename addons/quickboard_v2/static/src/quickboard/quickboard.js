/** @odoo-module **/

import { Component, useRef, useEffect, useState, onPatched } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { QuickboardItem } from "./quickboard_item";
import { DateTimeInput } from "@web/core/datetime/datetime_input";

class Quickboard extends Component {
    static template = "quickboard";
    static components = { DateTimeInput, QuickboardItem };

    setup() {
        this.action = useService("action");
        this.dialog = useService("dialog");

        this.gridRef = useRef("grid-stack");
        this.state = useState({
            "startDate": luxon.DateTime.local().startOf('month'),
            "endDate": luxon.DateTime.now(),
            "today": luxon.DateTime.now(),
            "items": [],
        });

        this.quickboard = useState(useService("quickboard"));
        this.quickboard.getQuickboardItemDefs(
            this.state.startDate,
            this.state.endDate
        );

        useEffect(
            (isReady) => {
                self = this;
                let items = Object.entries(this.quickboard.items)
                    .filter(([k, v]) => !isNaN(k))
                    .map(([k, v]) => Object.assign({}, v));
                this.state.items = items;
            },
            () => [this.quickboard.isReady]
        );

        onPatched(() => {
            // Guard GridStack usage — some deployments may not include the library.
            if (typeof GridStack === "undefined") {
                console.warn("GridStack not available; quickboard will render without draggable layout.");
                this.gridRef.current = null;
                return;
            }
            this.gridRef.current =
                this.gridRef.current ||
                GridStack.init({
                    float: true,
                    columnOpts: {
                        breakpoints: [{ w: 768, c: 1 }],
                    },
                    cellHeight: "10rem",
                });
            if (this.gridRef.current) {
                const grid = this.gridRef.current;
                grid.batchUpdate();
                grid.removeAll(false);
    
                for (let i = 0; i < this.state.items.length; i++) {
                    const element = document.querySelector(
                        `#grid-stack-item-${this.state.items[i]["id"]}`
                    );
                    if (element) {
                        try {
                            grid.makeWidget(element);
                        } catch (err) {
                            console.error("GridStack.makeWidget failed for element", element, err);
                        }
                    }
                }
    
                grid.batchUpdate(false);
            }
        });

        this.busService = this.env.services.bus_service;
        this.busService.addChannel("quickboard");
        this.busService.subscribe("quickboard_updated", ({}) => {
            this.onMessage()
        });

        this.setupNoData();
    }

    onMessage() {
        this.applyFilter();
        let grid = this.gridRef.current;
        if (grid && typeof grid.compact === "function") {
            try {
                grid.compact();
            } catch (err) {
                console.warn("Grid compact failed", err);
            }
        }
    }

    onStartDateChanged(date) {
        this.state.startDate = date;
    }

    onEndDateChanged(date) {
        this.state.endDate = date;
    }

    saveQuickboard(ev) {
        const grid = this.gridRef.current;
        if (!grid || typeof grid.save !== "function") {
            console.warn("GridStack not available — layout not saved");
            return;
        }
        let serializedData = grid.save(false);
        this.quickboard.saveLayout(serializedData);
    }

    applyFilter(ev) {
        this.quickboard.getQuickboardItemDefs();
    }

    compact(ev) {
        let grid = this.gridRef.current;
        if (grid && typeof grid.compact === "function") {
            grid.compact();
        } else {
            console.warn("GridStack not available — cannot compact");
        }
    }

    async generateQuickboard(ev) {
        let cell_width = 1;
        let cell_height = 1;
        let screen_width = (typeof screen !== "undefined" && screen.width) || 0;
        let screen_height = (typeof screen !== "undefined" && screen.height) || 0;
        const grid = this.gridRef.current;
        if (grid && typeof grid.cellWidth === "function" && typeof grid.getCellHeight === "function") {
            try {
                cell_width = grid.cellWidth();
                // DO NOT REMOVE: Without this the getCellHeight will return weird number
                const h_0 = grid.cellHeight().el.clientHeight;
                cell_height = grid.getCellHeight();
            } catch (err) {
                console.warn("Error getting grid cell size, using defaults", err);
            }
        } else {
            console.warn("GridStack not available — using default cell sizes");
        }
    
        this.action.doAction(
            {
                'type': "ir.actions.act_window",
                'name': "Generate Quickboard",
                'res_model': "quickboard.generator",
                'views': [[false, "form"]],
                'view_mode': "form",
                'target': "new",
                'context': {
                    'dialog_size': 'medium',
                    'cell_width': cell_width,
                    'cell_height': cell_height,
                    'screen_width': screen_width,
                    'screen_height': screen_height
                }
            },
        );
    }

    async addItem(ev) {
        this.action.doAction(
            {
                'type': "ir.actions.act_window",
                'name': "New ",
                'res_model': "quickboard.item",
                'views': [[false, "form"]],
                'view_mode': "form",
                'target': "new",
                'context': {
                    'dialog_size': 'medium'
                }
            },
            {
                "onClose": () => {
                    this.applyFilter();
                }
            }
        );
    }

    setupNoData() {
        Chart.register({
            id: "NoData",
            afterDraw: function (chart) {
                if (
                    chart.data.datasets
                        .map((d) => d.data.length)
                        .reduce((p, a) => p + a, 0) === 0
                ) {
                    const ctx = chart.ctx;
                    const width = chart.width;
                    const height = chart.height;
                    chart.clear();

                    ctx.save();
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";

                    ctx.fillText("No data to display.", width / 2, height / 2);
                    ctx.restore();
                }
            },
        });
    }
}

registry.category("lazy_components").add("Quickboard", Quickboard);
