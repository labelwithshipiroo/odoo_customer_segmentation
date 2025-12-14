# Errors Encountered and Lessons Learned

This document summarizes the errors encountered during the Odoo 18 module installation process and the fixes applied, along with key learnings for Odoo development.

## 1. Related Field Reference Error

**Error:**
```
KeyError: 'Field name referenced in related field definition kpi.budget.line.budget_name does not exist.'
```

**Cause:**
- The `budget_name` field was defined as `related='budget_id.name'` on a model `account.report.budget`.
- The model `account.report.budget` either doesn't exist in the Odoo instance or doesn't have a `name` field.
- During model setup, Odoo validates related fields, causing the KeyError.

**Fix Applied:**
- Changed the model reference from `'account.report.budget'` to `'crossovered.budget'` (standard Odoo budget model).
- Converted `budget_name` from a related field to a computed field with a `_compute_budget_name` method.

**Lesson Learned:**
- Always ensure that related field references point to existing models and fields.
- When the target model might not be available, use computed fields instead of related fields to avoid setup-time errors.
- Standard Odoo models should be verified against the target Odoo version.

## 2. Missing External ID in Security Access

**Error:**
```
No matching record found for external id 'kpi.group_kpi_manager' in field 'Group'
```

**Cause:**
- The `ir.model.access.csv` file referenced a custom group `'kpi.group_kpi_manager'`.
- This group was not defined in the module's XML files, causing the CSV import to fail.

**Fix Applied:**
- Replaced all references to `'kpi.group_kpi_manager'` with `'base.group_user'` in the access CSV.
- This uses the standard user group instead of a custom one.

**Lesson Learned:**
- Ensure all external IDs referenced in CSV files are defined in XML files loaded before the CSV.
- When possible, use standard Odoo groups to avoid dependency issues.
- The loading order in `__manifest__.py` data list is crucial for dependencies.

## 3. Invalid View Type

**Error:**
```
Invalid view type: 'tree'. Allowed types are: list, form, graph, pivot, calendar, kanban, search, qweb, activity
```

**Cause:**
- In modern Odoo versions, the view type `'tree'` has been renamed to `'list'`.
- The view record didn't specify `type="list"`, and the architecture used `<tree>` tags.

**Fix Applied:**
- Changed all `<tree>` tags to `<list>` in view architectures.
- Added `type="list"` field to list view records.
- Updated `view_mode` in actions from `"tree,form"` to `"list,form"`.

**Lesson Learned:**
- Odoo evolves its API; always check compatibility with the target version.
- View types and tags change between versions (e.g., tree → list).
- Actions' `view_mode` must match the actual view types.

## 4. Deprecated States Attribute

**Error:**
```
Since 17.0, the "attrs" and "states" attributes are no longer used.
```

**Cause:**
- Odoo 17+ removed the `states` attribute from buttons and fields.
- The module used `states="draft"` etc. on buttons.

**Fix Applied:**
- Replaced `states` with `invisible` modifiers:
  - `states="draft"` → `invisible="state != 'draft'"`
  - `states="draft,confirmed"` → `invisible="state not in ('draft', 'confirmed')"`
- Additionally replaced remaining `attrs` attributes with `invisible` and `required` modifiers:
  - `attrs="{'invisible': [('active', '=', True)]}"` → `invisible="active == True"`
  - `attrs="{'invisible': [('calculation_method', '!=', 'computed')]}"` → `invisible="calculation_method != 'computed'"`
  - `attrs="{'invisible': [...], 'required': [...]}"` → separate `invisible="..."` and `required="..."` attributes

**Lesson Learned:**
- Odoo 17 introduced significant changes to view modifiers.
- `states` is replaced by `invisible`/`readonly` with domain-like expressions.
- Always review view compatibility when upgrading Odoo versions.

## 5. Missing Menu Parent

**Error:**
```
External ID not found in the system: odoo_kpi.kpi_main_menu
```

**Cause:**
- A menuitem referenced `parent="kpi_main_menu"`, but no such menu was defined.
- The actual menu ID was `menu_kpi_root` or `menu_kpi_operations`.

**Fix Applied:**
- Changed the parent reference to `parent="menu_kpi_operations"`.

**Lesson Learned:**
- Menu hierarchies must be correctly defined and referenced.
- Ensure all menu IDs match between definition and reference.
- Use consistent naming conventions for menu IDs.

## 6. Action Reference Before Definition

**Error:**
```
External ID not found in the system: odoo_kpi.action_kpi_definition
```

**Cause:**
- Menu items referenced actions that were defined in view files loaded after the menu.
- Data loading order in `__manifest__.py` caused actions to be referenced before definition.

**Fix Applied:**
- Created a separate `kpi_actions.xml` file containing all actions.
- Loaded `kpi_actions.xml` before `kpi_menu.xml` in the manifest.
- Moved all action definitions to the actions file.

**Lesson Learned:**
- Data loading order is critical for dependencies.
- Actions, views, and menus must be loaded in the correct sequence.
- When dependencies are complex, separate files by type (actions, menus, views) and order them appropriately in the manifest.

## 7. Search View Reference Before Definition

**Error:**
```
External ID not found in the system: odoo_kpi.view_kpi_definition_search
```

**Cause:**
- Actions in `kpi_actions.xml` referenced search views defined in `kpi_definition_views.xml`.
- Since actions are loaded before views in the manifest, the search views were not yet available.
- Odoo requires referenced external IDs to exist at the time of loading.

**Fix Applied:**
- Removed all `search_view_id` fields from action records in `kpi_actions.xml`.
- Odoo will automatically use the default search view for each model when no specific search view is specified.

**Lesson Learned:**
- Action references to views must be loaded after the views are defined.
- When loading order conflicts occur, remove optional references like `search_view_id` to allow default behavior.
- Actions can reference views that are loaded later, but not search views or other mandatory references.

## 8. View Mode Inconsistency in Model Actions

**Error:**
- Action methods in models referenced `'tree'` in `view_mode` parameter, but view records used `type='list'`.
- This inconsistency causes view loading failures.

**Fix Applied:**
- Updated `action_view_values()` and `action_view_budgets()` in `kpi_definition.py` to use `view_mode='list,form'` instead of `'tree,form'`.

**Lesson Learned:**
- Model action methods must use consistent view mode names with view record definitions.
- Always use `'list'` instead of `'tree'` for Odoo 17+.

## 9. Invalid Budget Model Reference

**Error:**
- `kpi_widget.py` referenced `'account.report.budget'` which doesn't exist in Odoo 18.
- This caused errors when loading widget records.

**Fix Applied:**
- Changed `budget_ids = fields.Many2many('account.report.budget', ...)` to `fields.Many2many('kpi.budget', ...)`.
- Uses the module's own budget model instead of a non-existent accounting model.

**Lesson Learned:**
- Verify that all model references exist in the target Odoo version.
- Custom modules should reference their own models when possible.
- Don't assume accounting models exist; check the target version's dependencies.

## 10. XML Syntax Error in Domain Filters

**Error:**
```
lxml.etree.XMLSyntaxError: Unescaped '<' not allowed in attributes values
```

**Cause:**
- Domain filter strings contained unescaped `<` and `>` comparison operators within XML attributes.
- XML requires these special characters to be escaped as `&lt;` and `&gt;` when used inside attribute values.

**Fix Applied:**
- Replaced `'>='` with `'&gt;='` and `'<='` with `'&lt;='` in domain filter attributes in:
  - `kpi_value_views.xml`
  - `kpi_budget_line_views.xml`

**Lesson Learned:**
- XML attributes containing domain filters must escape comparison operators.
- Always validate XML syntax for special characters in attribute values.
- Use entity references: `&lt;` for `<`, `&gt;` for `>`, `&amp;` for `&`, etc.

## General Lessons

1. **Version Compatibility:** Always develop and test against the target Odoo version. API changes are frequent.

2. **Data Loading Order:** The order of files in `__manifest__.py` data list affects loading. Dependencies must be loaded first.

3. **Standard vs Custom:** Prefer standard Odoo features over custom implementations when possible.

4. **Error Investigation:** Odoo errors often provide clear stack traces. Follow them to identify root causes.

5. **Incremental Fixes:** Fix one error at a time, test, then proceed to avoid cascading issues.

6. **Documentation:** Keep track of changes and reasons for future maintenance.

## 11. Circular Import When Extending External Models

**Error:**
```
ImportError: cannot import name 'product_extension' from partially initialized module 'odoo.addons.odoo_kpi.models'
```

**Cause:**
- Attempted to create a model extension file (product_extension.py) that imported product model.
- The product module itself may indirectly depend on odoo_kpi, creating a circular dependency.
- This happens when trying to extend external models (like product.product) via inheritance in the same module initialization.

**Fix Applied:**
- Removed the model extension file and computed field approach.
- Used view inheritance with action buttons instead to display KPI data.
- Action buttons provide clean navigation to KPI values without requiring model-level relationships.

**Lesson Learned:**
- Avoid importing external models in model extension files during module initialization.
- Use view inheritance with action buttons for polymorphic relationships instead of computed fields.
- When extending external models, prefer XML-based approaches (view inheritance) over Python model extensions to avoid import conflicts.
- Always keep model dependencies unidirectional when possible.

This module is now compatible with Odoo 17+ (including Odoo 18) and should install without these errors.