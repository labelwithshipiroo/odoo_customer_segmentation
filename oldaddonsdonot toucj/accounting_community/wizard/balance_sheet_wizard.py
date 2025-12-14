# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).

from odoo import fields, models


class BalanceSheetReportWizard(models.TransientModel):
    """Balance Sheet report wizard."""

    _name = "balance.sheet.report.wizard"
    _description = "Balance Sheet Report Wizard"
    _inherit = "accounting_community_abstract_wizard"

    date_from = fields.Date(required=True)
    date_to = fields.Date(required=True)
    target_move = fields.Selection(
        [("posted", "All Posted Entries"), ("all", "All Entries")],
        string="Target Moves",
        required=True,
        default="posted",
    )

    def _print_report(self, report_type):
        self.ensure_one()
        data = self._prepare_report_data()
        report_name = "accounting_community.balance_sheet"
        return (
            self.env["ir.actions.report"]
            .search(
                [("report_name", "=", report_name), ("report_type", "=", report_type)],
                limit=1,
            )
            .report_action(self, data=data)
        )

    def _prepare_report_balance_sheet(self):
        self.ensure_one()
        return {
            "wizard_id": self.id,
            "date_from": self.date_from,
            "date_to": self.date_to,
            "only_posted_moves": self.target_move == "posted",
            "company_id": self.company_id.id,
        }

    def _prepare_report_data(self):
        res = super()._prepare_report_data()
        res.update(self._prepare_report_balance_sheet())
        return res

    def _export(self, report_type):
        """Default export is PDF."""
        return self._print_report(report_type)