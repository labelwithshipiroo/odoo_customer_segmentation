from odoo.tests import TransactionCase


class TestBalanceSheet(TransactionCase):

    def test_balance_sheet_wizard(self):
        wizard = self.env["balance.sheet.report.wizard"].create({
            "date_from": "2023-01-01",
            "date_to": "2023-12-31",
        })
        self.assertTrue(wizard)