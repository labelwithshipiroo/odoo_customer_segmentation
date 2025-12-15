/** @odoo-module **/

import { STICKY_COLORS, SHAPE_COLORS, FONT_SIZES, FONT_FAMILIES, ELEMENT_TYPES } from '../utils/constants';
import { getIcon } from '../utils/icons';

/**
 * Properties Panel Component
 * Side panel for editing selected element properties
 */
export class PropertiesPanel {
    constructor(containerEl) {
        this.container = containerEl;
        this.panelEl = null;
        this.selectedElements = [];
        this.isVisible = false;
        
        // Callbacks
        this.callbacks = {
            onPropertyChange: null,
            onClose: null
        };
        
        this._init();
    }

    /**
     * Initialize panel
     */
    _init() {
        this._createDOM();
    }

    /**
     * Create DOM structure
     */
    _createDOM() {
        if (!this.container) return;
        
        this.panelEl = document.createElement('div');
        this.panelEl.className = 'wb-properties-panel';
        this.panelEl.style.display = 'none';
        this.container.appendChild(this.panelEl);
    }

    /**
     * Show panel with selected elements
     * @param {Array} elements
     */
    show(elements) {
        if (!this.panelEl) return;
        
        this.selectedElements = elements || [];
        
        if (this.selectedElements.length === 0) {
            this.hide();
            return;
        }
        
        this._render();
        this.panelEl.style.display = 'block';
        this.isVisible = true;
    }

    /**
     * Hide panel
     */
    hide() {
        if (this.panelEl) {
            this.panelEl.style.display = 'none';
        }
        this.isVisible = false;
        this.selectedElements = [];
    }

    /**
     * Toggle visibility
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else if (this.selectedElements.length > 0) {
            this.show(this.selectedElements);
        }
    }

    /**
     * Render panel content
     */
    _render() {
        if (!this.panelEl || this.selectedElements.length === 0) return;
        
        const element = this.selectedElements[0];
        const isMultiple = this.selectedElements.length > 1;
        
        let content = `
            <div class="wb-properties-header">
                <span class="wb-properties-title">
                    ${isMultiple ? `${this.selectedElements.length} Elements` : this._getElementTypeName(element.type)}
                </span>
                <button class="wb-properties-close" data-action="close">
                    ${getIcon('x', 18)}
                </button>
            </div>
            <div class="wb-properties-content">
        `;
        
        if (isMultiple) {
            content += this._renderMultipleSelectionProperties();
        } else {
            content += this._renderElementProperties(element);
        }
        
        content += '</div>';
        
        this.panelEl.innerHTML = content;
        this._attachEventListeners();
    }

    /**
     * Get element type display name
     * @param {string} type
     * @returns {string}
     */
    _getElementTypeName(type) {
        const names = {
            [ELEMENT_TYPES.STICKY]: 'Sticky Note',
            [ELEMENT_TYPES.TEXT]: 'Text',
            [ELEMENT_TYPES.SHAPE]: 'Shape',
            [ELEMENT_TYPES.FRAME]: 'Frame',
            [ELEMENT_TYPES.CONNECTOR]: 'Connector',
            [ELEMENT_TYPES.IMAGE]: 'Image'
        };
        return names[type] || 'Element';
    }

    /**
     * Render properties for multiple selection
     * @returns {string}
     */
    _renderMultipleSelectionProperties() {
        return `
            <div class="wb-properties-section">
                <p style="color: #64748b; font-size: 14px; text-align: center; padding: 20px;">
                    Multiple elements selected.<br>
                    Common properties will be shown.
                </p>
            </div>
            
            <div class="wb-properties-section">
                <label class="wb-properties-label">Alignment</label>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px;">
                    <button class="wb-toolbar-btn" data-property="align" data-value="left" title="Align Left">
                        ${getIcon('alignLeft', 16)}
                    </button>
                    <button class="wb-toolbar-btn" data-property="align" data-value="center" title="Align Center">
                        ${getIcon('alignCenter', 16)}
                    </button>
                    <button class="wb-toolbar-btn" data-property="align" data-value="right" title="Align Right">
                        ${getIcon('alignRight', 16)}
                    </button>
                    <button class="wb-toolbar-btn" data-property="align" data-value="top" title="Align Top">
                        ${getIcon('alignTop', 16)}
                    </button>
                    <button class="wb-toolbar-btn" data-property="align" data-value="middle" title="Align Middle">
                        ${getIcon('alignMiddle', 16)}
                    </button>
                    <button class="wb-toolbar-btn" data-property="align" data-value="bottom" title="Align Bottom">
                        ${getIcon('alignBottom', 16)}
                    </button>
                </div>
            </div>
            
            <div class="wb-properties-section">
                <label class="wb-properties-label">Distribution</label>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px;">
                    <button class="wb-toolbar-btn" data-property="distribute" data-value="horizontal" style="width: 100%;">
                        Horizontal
                    </button>
                    <button class="wb-toolbar-btn" data-property="distribute" data-value="vertical" style="width: 100%;">
                        Vertical
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render properties for single element
     * @param {BaseElement} element
     * @returns {string}
     */
    _renderElementProperties(element) {
        let content = '';
        
        // Position & Size
        content += `
            <div class="wb-properties-section">
                <label class="wb-properties-label">Position & Size</label>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    <div>
                        <label style="font-size: 11px; color: #94a3b8;">X</label>
                        <input type="number" class="wb-properties-input" 
                               data-property="x" value="${Math.round(element.x)}"/>
                    </div>
                    <div>
                        <label style="font-size: 11px; color: #94a3b8;">Y</label>
                        <input type="number" class="wb-properties-input" 
                               data-property="y" value="${Math.round(element.y)}"/>
                    </div>
                    <div>
                        <label style="font-size: 11px; color: #94a3b8;">Width</label>
                        <input type="number" class="wb-properties-input" 
                               data-property="width" value="${Math.round(element.width)}"/>
                    </div>
                    <div>
                        <label style="font-size: 11px; color: #94a3b8;">Height</label>
                        <input type="number" class="wb-properties-input" 
                               data-property="height" value="${Math.round(element.height)}"/>
                    </div>
                </div>
            </div>
        `;
        
        // Type-specific properties
        switch (element.type) {
            case ELEMENT_TYPES.STICKY:
                content += this._renderStickyNoteProperties(element);
                break;
            case ELEMENT_TYPES.TEXT:
                content += this._renderTextProperties(element);
                break;
            case ELEMENT_TYPES.SHAPE:
                content += this._renderShapeProperties(element);
                break;
            case ELEMENT_TYPES.FRAME:
                content += this._renderFrameProperties(element);
                break;
            case ELEMENT_TYPES.CONNECTOR:
                content += this._renderConnectorProperties(element);
                break;
            case ELEMENT_TYPES.IMAGE:
                content += this._renderImageProperties(element);
                break;
        }
        
        // Opacity
        content += `
            <div class="wb-properties-section">
                <label class="wb-properties-label">Opacity</label>
                <input type="range" min="0" max="100" value="${(element.opacity || 1) * 100}"
                       data-property="opacity"
                       style="width: 100%;"/>
            </div>
        `;
        
        return content;
    }

    /**
     * Render sticky note properties
     * @param {StickyNoteElement} element
     * @returns {string}
     */
    _renderStickyNoteProperties(element) {
        return `
            <div class="wb-properties-section">
                <label class="wb-properties-label">Color</label>
                <div class="wb-color-picker">
                    ${STICKY_COLORS.map(c => `
                        <button class="wb-color-swatch ${element.colorName === c.name ? 'selected' : ''}"
                                data-property="color" 
                                data-value="${c.name}"
                                style="background-color: ${c.value};"
                                title="${c.name}"></button>
                    `).join('')}
                </div>
            </div>
            
            <div class="wb-properties-section">
                <label class="wb-properties-label">Font Size</label>
                <select class="wb-properties-input" data-property="fontSize">
                    ${FONT_SIZES.map(size => `
                        <option value="${size}" ${element.style.fontSize === size ? 'selected' : ''}>
                            ${size}px
                        </option>
                    `).join('')}
                </select>
            </div>
            
            <div class="wb-properties-section">
                <label class="wb-properties-label">Text Align</label>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px;">
                    <button class="wb-toolbar-btn ${element.style.textAlign === 'left' ? 'active' : ''}"
                            data-property="textAlign" data-value="left">
                        ${getIcon('alignLeft', 16)}
                    </button>
                    <button class="wb-toolbar-btn ${element.style.textAlign === 'center' ? 'active' : ''}"
                            data-property="textAlign" data-value="center">
                        ${getIcon('alignCenter', 16)}
                    </button>
                    <button class="wb-toolbar-btn ${element.style.textAlign === 'right' ? 'active' : ''}"
                            data-property="textAlign" data-value="right">
                        ${getIcon('alignRight', 16)}
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render text properties
     * @param {TextElement} element
     * @returns {string}
     */
    _renderTextProperties(element) {
        return `
            <div class="wb-properties-section">
                <label class="wb-properties-label">Font Family</label>
                <select class="wb-properties-input" data-property="fontFamily">
                    ${FONT_FAMILIES.map(font => `
                        <option value="${font.value}" ${element.style.fontFamily === font.value ? 'selected' : ''}>
                            ${font.name}
                        </option>
                    `).join('')}
                </select>
            </div>
            
            <div class="wb-properties-section">
                <label class="wb-properties-label">Font Size</label>
                <select class="wb-properties-input" data-property="fontSize">
                    ${FONT_SIZES.map(size => `
                        <option value="${size}" ${element.style.fontSize === size ? 'selected' : ''}>
                            ${size}px
                        </option>
                    `).join('')}
                </select>
            </div>
            
            <div class="wb-properties-section">
                <label class="wb-properties-label">Style</label>
                <div style="display: flex; gap: 4px;">
                    <button class="wb-toolbar-btn ${element.style.fontWeight === 'bold' ? 'active' : ''}"
                            data-property="bold" data-value="toggle">
                        ${getIcon('bold', 16)}
                    </button>
                    <button class="wb-toolbar-btn ${element.style.fontStyle === 'italic' ? 'active' : ''}"
                            data-property="italic" data-value="toggle">
                        ${getIcon('italic', 16)}
                    </button>
                    <button class="wb-toolbar-btn ${element.style.textDecoration.includes('underline') ? 'active' : ''}"
                            data-property="underline" data-value="toggle">
                        ${getIcon('underline', 16)}
                    </button>
                </div>
            </div>
            
            <div class="wb-properties-section">
                <label class="wb-properties-label">Text Color</label>
                <input type="color" class="wb-properties-input" 
                       data-property="textColor" 
                       value="${element.style.textColor || '#1e293b'}"
                       style="height: 36px; padding: 4px;"/>
            </div>
        `;
    }

    /**
     * Render shape properties
     * @param {ShapeElement} element
     * @returns {string}
     */
    _renderShapeProperties(element) {
        return `
            <div class="wb-properties-section">
                <label class="wb-properties-label">Fill Color</label>
                <div class="wb-color-picker">
                    ${SHAPE_COLORS.map(c => `
                        <button class="wb-color-swatch ${element.style.fill === c.fill ? 'selected' : ''}"
                                data-property="fill" 
                                data-value="${c.fill}"
                                style="background-color: ${c.fill}; border: 1px solid ${c.stroke};"
                                title="${c.name}"></button>
                    `).join('')}
                </div>
            </div>
            
            <div class="wb-properties-section">
                <label class="wb-properties-label">Stroke Color</label>
                <input type="color" class="wb-properties-input" 
                       data-property="stroke" 
                       value="${element.style.stroke || '#1e293b'}"
                       style="height: 36px; padding: 4px;"/>
            </div>
            
            <div class="wb-properties-section">
                <label class="wb-properties-label">Stroke Width</label>
                <input type="range" min="0" max="10" value="${element.style.strokeWidth || 2}"
                       data-property="strokeWidth"
                       style="width: 100%;"/>
            </div>
            
            <div class="wb-properties-section">
                <label class="wb-properties-label">Stroke Style</label>
                <select class="wb-properties-input" data-property="strokeStyle">
                    <option value="solid" ${element.style.strokeStyle === 'solid' ? 'selected' : ''}>Solid</option>
                    <option value="dashed" ${element.style.strokeStyle === 'dashed' ? 'selected' : ''}>Dashed</option>
                    <option value="dotted" ${element.style.strokeStyle === 'dotted' ? 'selected' : ''}>Dotted</option>
                </select>
            </div>
        `;
    }

    /**
     * Render frame properties
     * @param {FrameElement} element
     * @returns {string}
     */
    _renderFrameProperties(element) {
        return `
            <div class="wb-properties-section">
                <label class="wb-properties-label">Title</label>
                <input type="text" class="wb-properties-input" 
                       data-property="title" 
                       value="${element.properties.title || 'Frame'}"/>
            </div>
            
            <div class="wb-properties-section">
                <label class="wb-properties-label">Border Style</label>
                <select class="wb-properties-input" data-property="borderStyle">
                    <option value="solid" ${element.style.borderStyle === 'solid' ? 'selected' : ''}>Solid</option>
                    <option value="dashed" ${element.style.borderStyle === 'dashed' ? 'selected' : ''}>Dashed</option>
                    <option value="dotted" ${element.style.borderStyle === 'dotted' ? 'selected' : ''}>Dotted</option>
                </select>
            </div>
            
            <div class="wb-properties-section">
                <label class="wb-properties-label">Border Color</label>
                <input type="color" class="wb-properties-input" 
                       data-property="borderColor" 
                       value="${element.style.borderColor || '#e2e8f0'}"
                       style="height: 36px; padding: 4px;"/>
            </div>
            
            <div class="wb-properties-section">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                    <input type="checkbox" data-property="showTitle" 
                           ${element.properties.showTitle ? 'checked' : ''}/>
                    <span style="font-size: 14px;">Show Title</span>
                </label>
            </div>
        `;
    }

    /**
     * Render connector properties
     * @param {ConnectorElement} element
     * @returns {string}
     */
    _renderConnectorProperties(element) {
        return `
            <div class="wb-properties-section">
                <label class="wb-properties-label">Line Type</label>
                <select class="wb-properties-input" data-property="connectorType">
                    <option value="straight" ${element.properties.connectorType === 'straight' ? 'selected' : ''}>Straight</option>
                    <option value="curved" ${element.properties.connectorType === 'curved' ? 'selected' : ''}>Curved</option>
                    <option value="elbow" ${element.properties.connectorType === 'elbow' ? 'selected' : ''}>Elbow</option>
                </select>
            </div>
            
            <div class="wb-properties-section">
                <label class="wb-properties-label">Start End</label>
                <select class="wb-properties-input" data-property="startEnd">
                    <option value="none" ${element.properties.startEnd === 'none' ? 'selected' : ''}>None</option>
                    <option value="arrow" ${element.properties.startEnd === 'arrow' ? 'selected' : ''}>Arrow</option>
                    <option value="dot" ${element.properties.startEnd === 'dot' ? 'selected' : ''}>Dot</option>
                    <option value="diamond" ${element.properties.startEnd === 'diamond' ? 'selected' : ''}>Diamond</option>
                </select>
            </div>
            
            <div class="wb-properties-section">
                <label class="wb-properties-label">End End</label>
                <select class="wb-properties-input" data-property="endEnd">
                    <option value="none" ${element.properties.endEnd === 'none' ? 'selected' : ''}>None</option>
                    <option value="arrow" ${element.properties.endEnd === 'arrow' ? 'selected' : ''}>Arrow</option>
                    <option value="dot" ${element.properties.endEnd === 'dot' ? 'selected' : ''}>Dot</option>
                    <option value="diamond" ${element.properties.endEnd === 'diamond' ? 'selected' : ''}>Diamond</option>
                </select>
            </div>
            
            <div class="wb-properties-section">
                <label class="wb-properties-label">Color</label>
                <input type="color" class="wb-properties-input" 
                       data-property="color" 
                       value="${element.style.color || '#1e293b'}"
                       style="height: 36px; padding: 4px;"/>
            </div>
            
            <div class="wb-properties-section">
                <label class="wb-properties-label">Stroke Width</label>
                <input type="range" min="1" max="10" value="${element.style.strokeWidth || 2}"
                       data-property="strokeWidth"
                       style="width: 100%;"/>
            </div>
        `;
    }

    /**
     * Render image properties
     * @param {ImageElement} element
     * @returns {string}
     */
    _renderImageProperties(element) {
        return `
            <div class="wb-properties-section">
                <button class="wb-toolbar-btn" data-action="replaceImage" style="width: 100%;">
                    ${getIcon('image', 16)}
                    Replace Image
                </button>
            </div>
            
            <div class="wb-properties-section">
                <label class="wb-properties-label">Fit Mode</label>
                <select class="wb-properties-input" data-property="objectFit">
                    <option value="contain" ${element.style.objectFit === 'contain' ? 'selected' : ''}>Contain</option>
                    <option value="cover" ${element.style.objectFit === 'cover' ? 'selected' : ''}>Cover</option>
                    <option value="fill" ${element.style.objectFit === 'fill' ? 'selected' : ''}>Fill</option>
                </select>
            </div>
            
            <div class="wb-properties-section">
                <label class="wb-properties-label">Border Radius</label>
                <input type="range" min="0" max="50" value="${element.style.borderRadius || 0}"
                       data-property="borderRadius"
                       style="width: 100%;"/>
            </div>
            
            <div class="wb-properties-section">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                    <input type="checkbox" data-property="lockAspectRatio" 
                           ${element.properties.lockAspectRatio ? 'checked' : ''}/>
                    <span style="font-size: 14px;">Lock Aspect Ratio</span>
                </label>
            </div>
            
            <div class="wb-properties-section">
                <button class="wb-toolbar-btn" data-action="resetSize" style="width: 100%;">
                    ${getIcon('maximize', 16)}
                    Reset to Original Size
                </button>
            </div>
        `;
    }

    /**
     * Attach event listeners
     */
    _attachEventListeners() {
        if (!this.panelEl) return;
        
        // Close button
        this.panelEl.querySelector('[data-action="close"]')?.addEventListener('click', () => {
            this.hide();
            if (this.callbacks.onClose) this.callbacks.onClose();
        });
        
        // Property changes
        this.panelEl.querySelectorAll('[data-property]').forEach(input => {
            const eventType = input.tagName === 'SELECT' ? 'change' : 
                             input.type === 'checkbox' ? 'change' :
                             input.type === 'range' ? 'input' : 'blur';
            
            input.addEventListener(eventType, (e) => {
                this._handlePropertyChange(e.target);
            });
            
            // For buttons
            if (input.tagName === 'BUTTON') {
                input.addEventListener('click', (e) => {
                    this._handlePropertyChange(e.currentTarget);
                });
            }
        });
        
        // Actions
        this.panelEl.querySelectorAll('[data-action]').forEach(btn => {
            if (btn.dataset.action === 'close') return;
            
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                if (this.callbacks.onPropertyChange) {
                    this.callbacks.onPropertyChange('action', action, this.selectedElements);
                }
            });
        });
    }

    /**
     * Handle property change
     * @param {HTMLElement} input
     */
    _handlePropertyChange(input) {
        const property = input.dataset.property;
        let value = input.dataset.value || input.value;
        
        // Handle different input types
        if (input.type === 'checkbox') {
            value = input.checked;
        } else if (input.type === 'range' || input.type === 'number') {
            value = parseFloat(value);
            if (property === 'opacity') {
                value = value / 100;
            }
        }
        
        if (this.callbacks.onPropertyChange) {
            this.callbacks.onPropertyChange(property, value, this.selectedElements);
        }
        
        // Update UI for toggle buttons
        if (input.tagName === 'BUTTON' && input.dataset.value !== 'toggle') {
            input.parentElement?.querySelectorAll('.wb-toolbar-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            input.classList.add('active');
        }
    }

    /**
     * Update panel with new selection
     * @param {Array} elements
     */
    updateSelection(elements) {
        this.selectedElements = elements || [];
        
        if (this.isVisible) {
            if (this.selectedElements.length === 0) {
                this.hide();
            } else {
                this._render();
            }
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
     * Destroy panel
     */
    destroy() {
        if (this.panelEl) {
            this.panelEl.remove();
        }
    }
}

export default PropertiesPanel;