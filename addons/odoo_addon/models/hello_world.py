from odoo import models, fields


class HelloWorld(models.Model):
    _name = 'x_hello_world'
    _description = 'Hello World Model'

    x_name = fields.Char(string='Message')
    x_description = fields.Text(string='Description')

    def write(self, vals):
        """Override write method to handle saving"""
        return super(HelloWorld, self).write(vals)

    def cancel(self):
        """Cancel method for discarding changes"""
        # This method is called when the Discard button is clicked
        # For a simple model, we don't need to do anything special
        pass