/** @odoo-module **/

import { BaseElement } from './base_element';
import { ELEMENT_TYPES, FONT_FAMILIES, FONT_SIZES, ELEMENT_DEFAULTS } from '../utils/constants';

/**
 * Text Element
 * Free-form text for headings, descriptions, and labels
 */
export class TextElement extends BaseElement {
    constructor(data = {}) {
        const defaults = ELEMENT_DEFAULTS.text;
        
        super({
            ...data,
            type: ELEMENT_TYPES.TEXT,
            width: data.width || defaults.width,
            height: data.height || defaults.height,
            style: {
                backgroundColor: 'transparent',
                textColor: data.style?.textColor || defaults.color,
                fontSize: data.style?.fontSize || defaults.fontSize,
                fontFamily: data.style?.fontFamily || defaults.fontFamily,
                fontWeight: data.style?.fontWeight || 'normal',
                fontStyle: data.style?.fontStyle || 'normal',
                textDecoration: data.style?.textDecoration || 'none',
                textAlign: data.style?.textAlign || 'left',
                lineHeight: data.style?.lineHeight || 1.5,
                letterSpacing: data.style?.letterSpacing || 0,
                ...data.style
            }
        });
        
        this.content = data.content || defaults.content;
        this.autoHeight = data.autoHeight !== false;
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
     * Set font family
     * @param {string} fontFamily
     */
    setFontFamily(fontFamily) {
        this.style.fontFamily = fontFamily;
        this._isDirty = true;
    }

    /**
     * Set text color
     * @param {string} color
     */
    setTextColor(color) {
        this.style.textColor = color;
        this._isDirty = true;
    }

    /**
     * Toggle bold
     * @returns {boolean} New bold state
     */
    toggleBold() {
        this.style.fontWeight = this.style.fontWeight === 'bold' ? 'normal' : 'bold';
        this._isDirty = true;
        return this.style.fontWeight === 'bold';
    }

    /**
     * Toggle italic
     * @returns {boolean} New italic state
     */
    toggleItalic() {
        this.style.fontStyle = this.style.fontStyle === 'italic' ? 'normal' : 'italic';
        this._isDirty = true;
        return this.style.fontStyle === 'italic';
    }

    /**
     * Toggle underline
     * @returns {boolean} New underline state
     */
    toggleUnderline() {
        const hasUnderline = this.style.textDecoration.includes('underline');
        this.style.textDecoration = hasUnderline ? 'none' : 'underline';
        this._isDirty = true;
        return !hasUnderline;
    }

    /**
     * Toggle strikethrough
     * @returns {boolean} New strikethrough state
     */
    toggleStrikethrough() {
        const hasStrike = this.style.textDecoration.includes('line-through');
        this.style.textDecoration = hasStrike ? 'none' : 'line-through';
        this._isDirty = true;
        return !hasStrike;
    }

    /**
     * Set text alignment
     * @param {string} align - 'left', 'center', 'right', 'justify'
     */
    setTextAlign(align) {
        this.style.textAlign = align;
        this._isDirty = true;
    }

    /**
     * Set line height
     * @param {number} lineHeight
     */
    setLineHeight(lineHeight) {
        this.style.lineHeight = lineHeight;
        this._isDirty = true;
    }

    /**
     * Get text formatting state
     * @returns {Object}
     */
    getFormattingState() {
        return {
            bold: this.style.fontWeight === 'bold',
            italic: this.style.fontStyle === 'italic',
            underline: this.style.textDecoration.includes('underline'),
            strikethrough: this.style.textDecoration.includes('line-through'),
            fontSize: this.style.fontSize,
            fontFamily: this.style.fontFamily,
            textAlign: this.style.textAlign,
            textColor: this.style.textColor
        };
    }

    /**
     * Apply formatting
     * @param {Object} formatting
     */
    applyFormatting(formatting) {
        if (formatting.bold !== undefined) {
            this.style.fontWeight = formatting.bold ? 'bold' : 'normal';
        }
        if (formatting.italic !== undefined) {
            this.style.fontStyle = formatting.italic ? 'italic' : 'normal';
        }
        if (formatting.underline !== undefined) {
            const current = this.style.textDecoration.replace('underline', '').trim();
            this.style.textDecoration = formatting.underline 
                ? (current ? current + ' underline' : 'underline')
                : current || 'none';
        }
        if (formatting.fontSize !== undefined) {
            this.style.fontSize = formatting.fontSize;
        }
        if (formatting.fontFamily !== undefined) {
            this.style.fontFamily = formatting.fontFamily;
        }
        if (formatting.textAlign !== undefined) {
            this.style.textAlign = formatting.textAlign;
        }
        if (formatting.textColor !== undefined) {
            this.style.textColor = formatting.textColor;
        }
        this._isDirty = true;
    }

    /**
     * Override getCSSStyles
     */
    getCSSStyles() {
        const baseStyles = super.getCSSStyles();
        return {
            ...baseStyles,
            backgroundColor: 'transparent',
            color: this.style.textColor,
            cursor: 'text'
        };
    }

    /**
     * Get content styles
     * @returns {string}
     */
    getContentStyle() {
        return `
            font-size: ${this.style.fontSize}px;
            font-family: ${this.style.fontFamily};
            font-weight: ${this.style.fontWeight};
            font-style: ${this.style.fontStyle};
            text-decoration: ${this.style.textDecoration};
            text-align: ${this.style.textAlign};
            line-height: ${this.style.lineHeight};
            letter-spacing: ${this.style.letterSpacing}px;
            color: ${this.style.textColor};
        `;
    }

    /**
     * Render text element
     * @returns {string}
     */
    render() {
        const styles = this.getStyleString();
        const contentStyle = this.getContentStyle();
        
        return `
            <div class="wb-element wb-text-element ${this.locked ? 'locked' : ''}"
                 data-id="${this.id}"
                 data-type="${this.type}"
                 style="${styles}">
                <div class="selection-box"></div>
                <div class="content-editable"
                     contenteditable="${!this.locked}"
                     style="${contentStyle}"
                     data-placeholder="Type something...">${this.escapeHtml(this.content)}</div>
                ${this._renderResizeHandles()}
            </div>
        `;
    }

    /**
     * Render resize handles (only horizontal for text)
     * @returns {string}
     */
    _renderResizeHandles() {
        if (this.locked) return '';
        
        // Text elements typically only resize horizontally
        const handles = ['e', 'w'];
        return handles.map(pos => 
            `<div class="wb-resize-handle ${pos}" data-handle="${pos}"></div>`
        ).join('');
    }

    /**
     * Escape HTML
     * @param {string} text
     * @returns {string}
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Resize - special handling for auto-height
     * @param {number} width
     * @param {number} height
     */
    resize(width, height) {
        if (this.locked) return;
        this.width = Math.max(50, width);
        if (!this.autoHeight) {
            this.height = Math.max(20, height);
        }
        this._isDirty = true;
    }

    /**
     * Auto-adjust height based on content
     * @param {number} measuredHeight
     */
    adjustHeight(measuredHeight) {
        if (this.autoHeight) {
            this.height = Math.max(40, measuredHeight + 16);
            this._isDirty = true;
        }
    }

    /**
     * Get context menu actions
     * @returns {Array}
     */
    getContextMenuActions() {
        const formatting = this.getFormattingState();
        
        return [
            { id: 'edit', label: 'Edit Text', icon: 'type' },
            { id: 'divider' },
            { id: 'bold', label: 'Bold', icon: 'bold', checked: formatting.bold, shortcut: 'Ctrl+B' },
            { id: 'italic', label: 'Italic', icon: 'italic', checked: formatting.italic, shortcut: 'Ctrl+I' },
            { id: 'underline', label: 'Underline', icon: 'underline', checked: formatting.underline, shortcut: 'Ctrl+U' },
            { id: 'divider' },
            { id: 'copy', label: 'Copy', icon: 'copy', shortcut: 'Ctrl+C' },
            { id: 'duplicate', label: 'Duplicate', icon: 'duplicate', shortcut: 'Ctrl+D' },
            { id: 'divider' },
            { id: 'bringForward', label: 'Bring Forward', icon: 'bringForward' },
            { id: 'sendBackward', label: 'Send Backward', icon: 'sendBackward' },
            { id: 'divider' },
            { id: 'lock', label: this.locked ? 'Unlock' : 'Lock', icon: this.locked ? 'unlock' : 'lock' },
            { id: 'delete', label: 'Delete', icon: 'trash', shortcut: 'Delete', danger: true }
        ];
    }

    /**
     * Get minimum dimensions
     */
    getMinDimensions() {
        return { width: 50, height: 30 };
    }

    /**
     * Clone with offset
     */
    cloneWithOffset(offsetX = 20, offsetY = 20) {
        const clone = this.clone();
        clone.x += offsetX;
        clone.y += offsetY;
        return clone;
    }
}

// Register element type
window.__whiteboardElementTypes = window.__whiteboardElementTypes || {};
window.__whiteboardElementTypes[ELEMENT_TYPES.TEXT] = TextElement;

export default TextElement;