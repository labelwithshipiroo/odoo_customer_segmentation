/** @odoo-module **/

import { BaseElement } from './base_element';
import { ELEMENT_TYPES, STICKY_COLORS, ELEMENT_DEFAULTS } from '../utils/constants';

/**
 * Sticky Note Element
 * Classic Miro-style sticky note for brainstorming and ideation
 */
export class StickyNoteElement extends BaseElement {
    constructor(data = {}) {
        const defaults = ELEMENT_DEFAULTS.sticky;
        
        super({
            ...data,
            type: ELEMENT_TYPES.STICKY,
            width: data.width || defaults.width,
            height: data.height || defaults.height,
            style: {
                backgroundColor: data.style?.backgroundColor || defaults.color,
                textColor: data.style?.textColor || defaults.textColor,
                fontSize: data.style?.fontSize || defaults.fontSize,
                fontFamily: data.style?.fontFamily || 'Inter, sans-serif',
                fontWeight: data.style?.fontWeight || 'normal',
                textAlign: data.style?.textAlign || 'left',
                shadow: true,
                borderRadius: 4,
                ...data.style
            }
        });
        
        this.content = data.content || defaults.content;
        this.colorName = this._getColorName(this.style.backgroundColor);
    }

    /**
     * Get color name from value
     * @param {string} colorValue
     * @returns {string}
     */
    _getColorName(colorValue) {
        const color = STICKY_COLORS.find(c => c.value === colorValue);
        return color ? color.name : 'yellow';
    }

    /**
     * Set sticky note color
     * @param {string} colorName - Name from STICKY_COLORS
     */
    setColor(colorName) {
        const color = STICKY_COLORS.find(c => c.name === colorName);
        if (color) {
            this.style.backgroundColor = color.value;
            this.style.textColor = color.textColor;
            this.colorName = colorName;
            this._isDirty = true;
        }
    }

    /**
     * Set font size
     * @param {number} size
     */
    setFontSize(size) {
        this.style.fontSize = size;
        this._isDirty = true;
    }

    /**
     * Set text alignment
     * @param {string} align - 'left', 'center', 'right'
     */
    setTextAlign(align) {
        this.style.textAlign = align;
        this._isDirty = true;
    }

    /**
     * Toggle bold
     */
    toggleBold() {
        this.style.fontWeight = this.style.fontWeight === 'bold' ? 'normal' : 'bold';
        this._isDirty = true;
    }

    /**
     * Override getCSSStyles for sticky-specific styles
     */
    getCSSStyles() {
        const baseStyles = super.getCSSStyles();
        return {
            ...baseStyles,
            backgroundColor: this.style.backgroundColor,
            color: this.style.textColor,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
            borderRadius: '4px'
        };
    }

    /**
     * Render sticky note
     * @returns {string} HTML string
     */
    render() {
        const styles = this.getStyleString();
        const contentStyle = `
            font-size: ${this.style.fontSize}px;
            font-family: ${this.style.fontFamily};
            font-weight: ${this.style.fontWeight};
            text-align: ${this.style.textAlign};
            color: ${this.style.textColor};
        `;
        
        return `
            <div class="wb-element wb-sticky-note color-${this.colorName} ${this.locked ? 'locked' : ''}"
                 data-id="${this.id}"
                 data-type="${this.type}"
                 style="${styles}">
                <div class="selection-box"></div>
                <div class="wb-sticky-note-header"></div>
                <div class="wb-sticky-note-content">
                    <div class="content-editable"
                         contenteditable="${!this.locked}"
                         style="${contentStyle}"
                         data-placeholder="Type here...">${this.escapeHtml(this.content)}</div>
                </div>
                ${this._renderResizeHandles()}
                ${this._renderRotateHandle()}
            </div>
        `;
    }

    /**
     * Render resize handles
     * @returns {string}
     */
    _renderResizeHandles() {
        if (this.locked) return '';
        
        const handles = this.getResizeHandles();
        return handles.map(pos => 
            `<div class="wb-resize-handle ${pos}" data-handle="${pos}"></div>`
        ).join('');
    }

    /**
     * Render rotation handle
     * @returns {string}
     */
    _renderRotateHandle() {
        if (this.locked) return '';
        return '<div class="wb-rotate-handle"></div>';
    }

    /**
     * Escape HTML in content
     * @param {string} text
     * @returns {string}
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Get context menu actions
     * @returns {Array}
     */
    getContextMenuActions() {
        return [
            { id: 'edit', label: 'Edit', icon: 'pencil' },
            { id: 'divider' },
            { id: 'copy', label: 'Copy', icon: 'copy', shortcut: 'Ctrl+C' },
            { id: 'duplicate', label: 'Duplicate', icon: 'duplicate', shortcut: 'Ctrl+D' },
            { id: 'divider' },
            { id: 'color', label: 'Change Color', icon: 'palette', submenu: 
                STICKY_COLORS.map(c => ({ id: `color-${c.name}`, label: c.name, color: c.value }))
            },
            { id: 'divider' },
            { id: 'bringForward', label: 'Bring Forward', icon: 'bringForward', shortcut: 'Ctrl+]' },
            { id: 'sendBackward', label: 'Send Backward', icon: 'sendBackward', shortcut: 'Ctrl+[' },
            { id: 'divider' },
            { id: 'lock', label: this.locked ? 'Unlock' : 'Lock', icon: this.locked ? 'unlock' : 'lock' },
            { id: 'delete', label: 'Delete', icon: 'trash', shortcut: 'Delete', danger: true }
        ];
    }

    /**
     * Clone with offset
     * @param {number} offsetX
     * @param {number} offsetY
     * @returns {StickyNoteElement}
     */
    cloneWithOffset(offsetX = 20, offsetY = 20) {
        const clone = this.clone();
        clone.x += offsetX;
        clone.y += offsetY;
        return clone;
    }

    /**
     * Serialize to JSON
     */
    toJSON() {
        return {
            ...super.toJSON(),
            colorName: this.colorName
        };
    }

    /**
     * Get minimum dimensions
     */
    getMinDimensions() {
        return { width: 120, height: 80 };
    }
}

// Register element type
window.__whiteboardElementTypes = window.__whiteboardElementTypes || {};
window.__whiteboardElementTypes[ELEMENT_TYPES.STICKY] = StickyNoteElement;

export default StickyNoteElement;