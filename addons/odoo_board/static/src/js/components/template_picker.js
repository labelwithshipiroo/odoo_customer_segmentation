/** @odoo-module **/

import { TEMPLATES } from '../utils/constants';
import { getIcon } from '../utils/icons';

/**
 * Template Picker Component
 * Modal dialog for selecting board templates
 */
export class TemplatePicker {
    constructor() {
        this.modalEl = null;
        this.isVisible = false;
        this.templates = [...TEMPLATES];
        
        // Callbacks
        this.callbacks = {
            onSelect: null,
            onClose: null
        };
        
        this._init();
    }

    /**
     * Initialize template picker
     */
    _init() {
        this._createDOM();
        this._attachEventListeners();
    }

    /**
     * Create DOM structure
     */
    _createDOM() {
        this.modalEl = document.createElement('div');
        this.modalEl.className = 'wb-modal-overlay';
        this.modalEl.style.display = 'none';
        this.modalEl.innerHTML = this._getModalHTML();
        document.body.appendChild(this.modalEl);
    }

    /**
     * Get modal HTML
     * @returns {string}
     */
    _getModalHTML() {
        return `
            <div class="wb-modal">
                <div class="wb-modal-header">
                    <h2 class="wb-modal-title">Choose a Template</h2>
                    <button class="wb-modal-close" data-action="close">
                        ${getIcon('x', 24)}
                    </button>
                </div>
                <div class="wb-modal-content">
                    <div class="wb-template-categories" style="display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap;">
                        <button class="wb-category-btn active" data-category="all" 
                                style="padding: 8px 16px; border: 1px solid #e2e8f0; border-radius: 20px; background: white; cursor: pointer; font-size: 14px;">
                            All
                        </button>
                        <button class="wb-category-btn" data-category="brainstorm"
                                style="padding: 8px 16px; border: 1px solid #e2e8f0; border-radius: 20px; background: white; cursor: pointer; font-size: 14px;">
                            Brainstorming
                        </button>
                        <button class="wb-category-btn" data-category="flowchart"
                                style="padding: 8px 16px; border: 1px solid #e2e8f0; border-radius: 20px; background: white; cursor: pointer; font-size: 14px;">
                            Flowchart
                        </button>
                        <button class="wb-category-btn" data-category="kanban"
                                style="padding: 8px 16px; border: 1px solid #e2e8f0; border-radius: 20px; background: white; cursor: pointer; font-size: 14px;">
                            Kanban
                        </button>
                        <button class="wb-category-btn" data-category="retrospective"
                                style="padding: 8px 16px; border: 1px solid #e2e8f0; border-radius: 20px; background: white; cursor: pointer; font-size: 14px;">
                            Retrospective
                        </button>
                        <button class="wb-category-btn" data-category="mindmap"
                                style="padding: 8px 16px; border: 1px solid #e2e8f0; border-radius: 20px; background: white; cursor: pointer; font-size: 14px;">
                            Mind Map
                        </button>
                    </div>
                    <div class="wb-template-grid">
                        ${this._renderTemplateCards()}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render template cards
     * @param {string} category - Filter category (optional)
     * @returns {string}
     */
    _renderTemplateCards(category = 'all') {
        const filteredTemplates = category === 'all' 
            ? this.templates 
            : this.templates.filter(t => t.category === category || t.id === 'blank');
        
        return filteredTemplates.map(template => `
            <div class="wb-template-card" data-template="${template.id}">
                <div class="wb-template-preview">
                    ${this._renderTemplatePreview(template)}
                </div>
                <div class="wb-template-info">
                    <div class="wb-template-name">${template.name}</div>
                    <div class="wb-template-description">${template.description}</div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Render template preview
     * @param {Object} template
     * @returns {string}
     */
    _renderTemplatePreview(template) {
        if (template.id === 'blank') {
            return `
                <div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; color: #94a3b8;">
                    ${getIcon('plus', 32)}
                </div>
            `;
        }
        
        // Generate mini preview based on elements
        const elements = template.elements || [];
        if (elements.length === 0) {
            return `
                <div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">
                    ${getIcon('template', 32)}
                </div>
            `;
        }
        
        // Scale elements to fit preview
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        elements.forEach(el => {
            minX = Math.min(minX, el.x);
            minY = Math.min(minY, el.y);
            maxX = Math.max(maxX, el.x + (el.width || 100));
            maxY = Math.max(maxY, el.y + (el.height || 100));
        });
        
        const contentWidth = maxX - minX;
        const contentHeight = maxY - minY;
        const scale = Math.min(180 / contentWidth, 100 / contentHeight, 1) * 0.8;
        const offsetX = (200 - contentWidth * scale) / 2 - minX * scale;
        const offsetY = (120 - contentHeight * scale) / 2 - minY * scale;
        
        return `
            <svg width="100%" height="100%" viewBox="0 0 200 120" style="background: #f8fafc;">
                ${elements.map(el => this._renderMiniElement(el, scale, offsetX, offsetY)).join('')}
            </svg>
        `;
    }

    /**
     * Render mini element for preview
     */
    _renderMiniElement(el, scale, offsetX, offsetY) {
        const x = el.x * scale + offsetX;
        const y = el.y * scale + offsetY;
        const w = (el.width || 100) * scale;
        const h = (el.height || 80) * scale;
        
        let fill = '#e2e8f0';
        let stroke = 'none';
        let strokeDash = '';
        
        switch (el.type) {
            case 'sticky':
                fill = '#fef3c7';
                break;
            case 'frame':
                fill = 'none';
                stroke = '#94a3b8';
                strokeDash = 'stroke-dasharray="4,2"';
                break;
            case 'shape':
                fill = el.style?.fill || '#dbeafe';
                stroke = el.style?.stroke || '#2563eb';
                break;
            case 'text':
                return `<rect x="${x}" y="${y}" width="${w}" height="${h * 0.3}" fill="#94a3b8" rx="2"/>`;
        }
        
        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" ${strokeDash} rx="4"/>`;
    }

    /**
     * Attach event listeners
     */
    _attachEventListeners() {
        if (!this.modalEl) return;
        
        // Close button
        this.modalEl.querySelector('[data-action="close"]')?.addEventListener('click', () => {
            this.hide();
        });
        
        // Click outside to close
        this.modalEl.addEventListener('click', (e) => {
            if (e.target === this.modalEl) {
                this.hide();
            }
        });
        
        // Category buttons
        this.modalEl.querySelectorAll('[data-category]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this._selectCategory(e.currentTarget.dataset.category);
            });
        });
        
        // Template cards
        this.modalEl.addEventListener('click', (e) => {
            const card = e.target.closest('[data-template]');
            if (card) {
                const templateId = card.dataset.template;
                this._selectTemplate(templateId);
            }
        });
        
        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    /**
     * Select category filter
     * @param {string} category
     */
    _selectCategory(category) {
        // Update button states
        this.modalEl.querySelectorAll('[data-category]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
            btn.style.background = btn.dataset.category === category ? '#2563eb' : 'white';
            btn.style.color = btn.dataset.category === category ? 'white' : '#1e293b';
            btn.style.borderColor = btn.dataset.category === category ? '#2563eb' : '#e2e8f0';
        });
        
        // Update template grid
        const grid = this.modalEl.querySelector('.wb-template-grid');
        if (grid) {
            grid.innerHTML = this._renderTemplateCards(category);
        }
    }

    /**
     * Select template
     * @param {string} templateId
     */
    _selectTemplate(templateId) {
        const template = this.templates.find(t => t.id === templateId);
        if (!template) return;
        
        if (this.callbacks.onSelect) {
            this.callbacks.onSelect(template);
        }
        
        this.hide();
    }

    /**
     * Add custom templates
     * @param {Array} templates
     */
    addTemplates(templates) {
        this.templates = [...this.templates, ...templates];
    }

    /**
     * Show template picker
     */
    show() {
        if (this.modalEl) {
            this.modalEl.style.display = 'flex';
        }
        this.isVisible = true;
    }

    /**
     * Hide template picker
     */
    hide() {
        if (this.modalEl) {
            this.modalEl.style.display = 'none';
        }
        this.isVisible = false;
        
        if (this.callbacks.onClose) {
            this.callbacks.onClose();
        }
    }

    /**
     * Set callback
     * @param {string} event
     * @param {Function} callback
     */
    on(event, callback) {
        if (this.callbacks.hasOwnProperty(event)) {
            this.callbacks[event] = callback;
        }
    }

    /**
     * Destroy template picker
     */
    destroy() {
        if (this.modalEl) {
            this.modalEl.remove();
        }
    }
}

export default TemplatePicker;