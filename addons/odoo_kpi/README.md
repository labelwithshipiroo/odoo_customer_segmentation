# Odoo KPI Management Addon

A comprehensive Key Performance Indicator (KPI) management system for Odoo that allows you to define, track, and visualize KPIs across your business operations.

## Features

### KPI Definition & Configuration
- **Flexible KPI Types**: Support for monetary, statistical, and formula-based KPIs
- **Multiple Calculation Methods**: Direct value entry or computed formulas
- **Source Mapping**: Link KPIs to various business objects (Contacts, Products, Sales Orders, Invoices, etc.)
- **Aggregation Methods**: Sum, average, minimum, maximum, or last value calculations

### Data Management
- **Actual Values Tracking**: Record and manage KPI actual values with time periods
- **Budget & Forecast Integration**: Link KPIs to Odoo's budget system for variance analysis
- **Target Setting**: Define targets and thresholds with warning/critical levels
- **Formula Support**: Build complex KPIs using formulas referencing other KPIs

### Dashboard & Visualization
- **Custom Dashboards**: Create personalized KPI dashboards
- **Multiple Widget Types**: Gauges, line charts, bar charts, numbers, and tables
- **Real-time Updates**: Automatic calculation and display of KPI values
- **User Permissions**: Role-based access control for KPI management

## Installation

1. Place the `odoo_kpi` folder in your Odoo addons directory
2. Update your Odoo configuration to include the addons path
3. Install the module through Odoo Apps menu or using the command line

## Configuration

### 1. Define KPIs
- Navigate to **KPI Management > Configuration > KPI Definitions**
- Create new KPIs with appropriate types, units, and calculation methods
- Configure source mappings to link KPIs to business data

### 2. Set Up Sources
- Define which business objects (models) should provide data for each KPI
- Use domain filters to limit data scope

### 3. Configure Targets
- Set target values and thresholds for each KPI
- Define warning and critical threshold percentages

### 4. Create Dashboards
- Build custom dashboards with various widget types
- Arrange widgets to display KPI data effectively

## Usage

### Recording Actual Values
- Go to **KPI Management > Operations > Actual Values**
- Enter KPI values manually or import from external systems
- Values can be recorded at different time periods (daily, weekly, monthly, etc.)

### Budget Management
- Link KPIs to Odoo budget lines for automatic variance calculation
- Compare actual performance against budgeted targets

### Dashboard Viewing
- Access KPI dashboards from **KPI Management > Reporting > KPI Dashboard**
- View real-time KPI performance with visual indicators
- Export dashboard data for reporting purposes

## Technical Details

### Models
- `kpi.definition`: Core KPI definitions
- `kpi.source`: Source model configurations
- `kpi.value`: Actual KPI values
- `kpi.budget.line`: Budget/forecast lines
- `kpi.formula.line`: Formula components
- `kpi.target`: Target and threshold settings
- `kpi.dashboard`: Dashboard configurations
- `kpi.widget`: Dashboard widget definitions

### Security
- Role-based access control with KPI Manager group
- Separate permissions for viewing and editing KPIs
- Record-level security rules

### Dependencies
- `base`: Core Odoo functionality
- `web`: Web interface components
- `account`: Integration with accounting/budgeting features

## API Usage

### Computing KPI Values
```python
# Example of computing a KPI value
kpi = self.env['kpi.definition'].search([('code', '=', 'REV001')])
values = self.env['kpi.value'].search([
    ('kpi_definition_id', '=', kpi.id),
    ('date_from', '>=', start_date),
    ('date_to', '<=', end_date)
])
total_value = sum(values.mapped('value'))
```

### Creating Dashboard Widgets
```python
# Programmatically create a dashboard widget
widget = self.env['kpi.widget'].create({
    'dashboard_id': dashboard.id,
    'kpi_definition_id': kpi.id,
    'widget_type': 'gauge',
    'period_type': 'monthly'
})
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This module is licensed under LGPL-3.

## Support

For support and questions, please contact the development team or create an issue in the project repository.