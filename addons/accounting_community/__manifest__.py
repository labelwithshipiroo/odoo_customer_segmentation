{
    "name": "Accounting Community",
    "version": "18.0.1.0.0",
    "category": "Reporting",
    "summary": "Financial Reporting Standard Reports",
    "author": "Odoo Community Association (OCA)",
    "website": "https://github.com/OCA/account-financial-reporting",
    "depends": ["account", "date_range"],
    "data": [
        "security/ir.model.access.csv",
        "security/security.xml",
        "wizard/balance_sheet_wizard_view.xml",
        "menuitems.xml",
        "reports.xml",
        "view/balance_sheet.xml",
    ],
    "assets": {
        "web.assets_backend": [
            "accounting_community/static/src/js/*",
            "accounting_community/static/src/xml/**/*",
        ],
    },
    "installable": True,
    "application": False,
    "auto_install": False,
    "license": "AGPL-3",
}