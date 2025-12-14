# -*- coding: utf-8 -*-

from odoo import models, fields


class HelloWorld(models.Model):
    _name = 'hello.world'
    _description = 'Hello World Model'

    name = fields.Char(string='Message', default='Hello World!', readonly=True)
    description = fields.Text(string='Description', default='Welcome to the KPI and Targets application!')