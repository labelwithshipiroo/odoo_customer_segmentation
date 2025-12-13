# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).

from odoo import models


class BalanceSheetReport(models.AbstractModel):
    _name = "report.accounting_community.balance_sheet"
    _description = "Balance Sheet Report"

    @api.model
    def _get_report_values(self, docids, data):
        wizard = self.env["balance.sheet.report.wizard"].browse(data["wizard_id"])
        return {
            "doc_ids": docids,
            "doc_model": "balance.sheet.report.wizard",
            "data": data,
            "wizard": wizard,
            "lines": self._get_lines(data),
        }

    def _get_lines(self, data):
        # Placeholder for balance sheet lines
        return []