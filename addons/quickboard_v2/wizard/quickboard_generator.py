# -*- coding: utf-8 -*-
import logging
from collections import deque

from odoo import _, fields, models
from odoo.exceptions import ValidationError

_logger = logging.getLogger(__name__)

class QuickboardGenerator(models.TransientModel):
    _name = "quickboard.generator"

    model_ids = fields.Many2many('ir.model', string='Model')
    layout_by_ai = fields.Boolean("Layout by AI", default=False)

    def _collect_fields(self, model_record):
        """Return (value_fields, dimension_fields, field_map) for a given ir.model record."""
        fields_info = self.env[model_record.model].fields_get()
        value_fields = []
        dimension_fields = []
        field_map = {}
        for name, info in fields_info.items():
            if not info.get("store", True):
                continue
            ftype = info.get("type")
            # normalize types similar to original logic
            if ftype in ["many2many", "one2many"]:
                continue
            if ftype == "selection":
                ftype_norm = "char"
            elif ftype == "many2one":
                ftype_norm = "integer"
            else:
                ftype_norm = ftype
            if ftype_norm in ["integer", "float", "monetary", "many2one", "selection"]:
                value_fields.append(name)
            if ftype_norm not in ["many2many", "one2many", "float", "monetary"]:
                dimension_fields.append(name)
            field_map[name] = ftype_norm
        return value_fields, dimension_fields, field_map

    def _arrange_items_simple(self, items):
        """Simple layout: place basic items in rows of 4 (width=3), others width=6 height=2."""
        x_cursor = 0
        y_cursor = 0
        row_height = 1
        basics = [i for i in items if i["type"] == "basic"]
        others = [i for i in items if i["type"] != "basic"]
        arranged = []

        # basics: 4 per row, width=3, height=1
        cols = 4
        width_basic = 3
        for idx, b in enumerate(basics):
            row = idx // cols
            col = idx % cols
            b["x_pos"] = col * width_basic
            b["y_pos"] = row * 1
            b["width"] = width_basic
            b["height"] = 1
            arranged.append(b)

        # others: place after basics, 2 per row, width=6 height=2
        start_row = ((len(basics) + cols - 1) // cols)  # next free row
        for idx, o in enumerate(others):
            row = start_row + (idx // 2) * 2
            col = idx % 2
            o["x_pos"] = col * 6
            o["y_pos"] = row
            o["width"] = 6
            o["height"] = 2
            arranged.append(o)

        return arranged

    def _generate_items_for_model(self, model_record):
        """Deterministic generator for items from a model."""
        value_fields, dimension_fields, field_map = self._collect_fields(model_record)
        items = []

        # basic 1: count of id
        if "id" in field_map:
            items.append({
                "name": f"{model_record.model} Count",
                "icon": "fa-list",
                "type": "basic",
                "model": model_record.model,
                "value_field": "id",
                "aggregate_function": "count",
                "text_color": "#000000",
                "background_color": "#f0ad4e",
            })

        # basic 2: sum of first numeric field
        numeric = [f for f in value_fields if field_map.get(f) in ("integer", "float", "monetary")]
        if numeric:
            nf = numeric[0]
            items.append({
                "name": f"{model_record.model} {nf} Sum",
                "icon": "fa-calculator",
                "type": "basic",
                "model": model_record.model,
                "value_field": nf,
                "aggregate_function": "sum",
                "text_color": "#000000",
                "background_color": "#5bc0de",
            })

        # basic 3: avg of numeric if available
        if len(numeric) > 1:
            nf = numeric[1]
            items.append({
                "name": f"{model_record.model} {nf} Avg",
                "icon": "fa-area-chart",
                "type": "basic",
                "model": model_record.model,
                "value_field": nf,
                "aggregate_function": "avg",
                "text_color": "#000000",
                "background_color": "#5cb85c",
            })

        # chart: use first dimension and first numeric value
        if dimension_fields and numeric:
            items.append({
                "name": f"{model_record.model} Chart",
                "icon": "fa-bar-chart",
                "type": "chart",
                "model": model_record.model,
                "value_field": numeric[0],
                "aggregate_function": "sum",
                "dimension_field": dimension_fields[0],
                "chart_type": "line" if field_map.get(dimension_fields[0]) in ("date", "datetime") else "bar",
            })

        # list: top 10 using a dimension if present
        if dimension_fields and value_fields:
            items.append({
                "name": f"{model_record.model} Top by {dimension_fields[0]}",
                "icon": "fa-list-alt",
                "type": "list",
                "model": model_record.model,
                "value_field": value_fields[0],
                "aggregate_function": "count" if field_map.get(value_fields[0]) not in ("integer","float","monetary") else "sum",
                "dimension_field": dimension_fields[0],
                "list_row_limit": 10,
            })

        return items

    def action_generate_quickboard(self):
        if len(self.model_ids.ids) < 1:
            return {
                'name': _('Generate Quickboard'),
                'type': 'ir.actions.act_window',
                'res_model': 'quickboard.generator',
                'view_type': 'form',
                'view_mode': 'form',
                'res_id': self.id,
                'target': 'new',
            }

        try:
            all_items = []
            for model in self.model_ids:
                model_rec = self.env['ir.model'].search([('id','=',model.id)], limit=1)
                if not model_rec:
                    continue
                generated = self._generate_items_for_model(model_rec)
                all_items.extend(generated)

            arranged = self._arrange_items_simple(all_items)

            quickboard_item = self.env['quickboard.item']
            # remove existing items
            quickboard_item.search([]).unlink()

            for o in arranged:
                _logger.info(f"Creating quickboard item: {o}")
                model = self.env["ir.model"].search([("model", "=", o["model"])], limit=1)
                if not model:
                    continue
                value_field = self.env["ir.model.fields"].search([("model_id", "=", model.id), ("name", "=", o["value_field"])], limit=1)
                if not value_field:
                    # skip invalid field
                    continue

                vals = {
                    "name": o.get("name"),
                    "model_id": model.id,
                    "icon": o.get("icon", "fa-square"),
                    "type": o.get("type"),
                    "value_field_id": value_field.id,
                    "aggregate_function": o.get("aggregate_function", "count"),
                    "x_pos": o.get("x_pos", 0),
                    "y_pos": o.get("y_pos", 0),
                    "height": o.get("height", 1),
                    "width": o.get("width", 6),
                }

                if o.get("type") == "basic":
                    vals.update({
                        "text_color": o.get("text_color", "#000000"),
                        "background_color": o.get("background_color", "#aaaaaa"),
                    })
                elif o.get("type") == "chart":
                    dimension_field = self.env["ir.model.fields"].search([("model_id", "=", model.id), ("name", "=", o.get("dimension_field"))], limit=1)
                    if not dimension_field:
                        continue
                    vals.update({
                        "dimension_field_id": dimension_field.id,
                        "chart_type": o.get("chart_type", "bar"),
                    })
                    if "datetime_granularity" in o:
                        vals.update({"datetime_granularity": o.get("datetime_granularity")})
                elif o.get("type") == "list":
                    dimension_field = self.env["ir.model.fields"].search([("model_id", "=", model.id), ("name", "=", o.get("dimension_field"))], limit=1)
                    if not dimension_field:
                        continue
                    vals.update({
                        "dimension_field_id": dimension_field.id,
                        "list_row_limit": o.get("list_row_limit", 10),
                    })
                    if "datetime_granularity" in o:
                        vals.update({"datetime_granularity": o.get("datetime_granularity")})

                quickboard_item.with_context(ai_generation=False).create(vals)

        except Exception as e:
            _logger.exception("Error generating quickboard: %s", e)
            raise ValidationError(_("Unable to generate quickboard. Please check logs."))

        for rec in self:
            self.env["bus.bus"]._sendone("quickboard", "quickboard_updated", {})

        return True