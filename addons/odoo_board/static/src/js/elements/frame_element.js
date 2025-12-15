/** @odoo-module **/

import { BaseElement } from './base_element';
import { ELEMENT_TYPES, ELEMENT_DEFAULTS } from '../utils/constants';

/**
 * Frame Element
 * Containers for organizing content into sections, workflows, or slides
 */
export class FrameElement extends BaseElement {
    constructor(data = {}) {
        const defaults = ELEMENT_DEFAULTS.frame;
        
        super({
            ...data,
            type: ELEMENT_TYPES.FRAME,
            width: data.width || defaults.width,
            height: data.height || defaults.height,
            style: {
                backgroundColor: data.style?.backgroundColor || defaults.backgroundColor,
                borderColor: data.style?.borderColor || defaults.borderColor,
                borderWidth: data.style?.borderWidth || 2,
                borderStyle: data.style?.borderStyle || 'dashed',
                borderRadius: data.style?.borderRadius || 12,
                titleColor: data.style?.titleColor || '#1e293b',
                titleFontSize: data.style?.titleFontSize || 14,
                titleFontWeight: data.style?.titleFontWeight || '600',
                shadow: false,
                ...data.style
            },
            properties: {
                title: data.properties?.title || defaults.title,
                showTitle: data.properties?.showTitle !== false,
                frameNumber: data.properties?.frameNumber || null,
                collapsed: data.properties?.collapsed || false,
                ...data.properties
            }
        });
        
        // Frame-specific: track contained elements
        this.containedElementIds = data.containedElementIds || [];
    }

    /**
     * Get frame title
     * @returns {string}
     */
    get title() {
        return this.properties.title;
    }

    /**
     * Set frame title
     * @param {string} title
     */
    setTitle(title) {
        this.properties.title = title;
        this._isDirty = true;
    }

    /**
     * Set frame number (for presentation slides)
     * @param {number} number
     */
    setFrameNumber(number) {
        this.properties.frameNumber = number;
        this._isDirty = true;
    }

    /**
     * Toggle title visibility
     */
    toggleTitleVisibility() {
        this.properties.showTitle = !this.properties.showTitle;
        this._isDirty = true;
    }

    /**
     * Collapse/expand frame
     */
    toggleCollapsed() {
        this.properties.collapsed = !this.properties.collapsed;
        this._isDirty = true;
    }

    /**
     * Set border style
     * @param {string} style - 'solid', 'dashed', 'dotted'
     */
    setBorderStyle(style) {
        this.style.borderStyle = style;
        this._isDirty = true;
    }

    /**
     * Set border color
     * @param {string} color
     */
    setBorderColor(color) {
        this.style.borderColor = color;
        this._isDirty = true;
    }

    /**
     * Set background color
     * @param {string} color
     */
    setBackgroundColor(color) {
        this.style.backgroundColor = color;
        this._isDirty = true;
    }

    /**
     * Add element to frame
     * @param {string} elementId
     */
    addElement(elementId) {
        if (!this.containedElementIds.includes(elementId)) {
            this.containedElementIds.push(elementId);
            this._isDirty = true;
        }
    }

    /**
     * Remove element from frame
     * @param {string} elementId
     */
    removeElement(elementId) {
        const index = this.containedElementIds.indexOf(elementId);
        if (index > -1) {
            this.containedElementIds.splice(index, 1);
            this._isDirty = true;
        }
    }

    /**
     * Check if element is contained in this frame
     * @param {string} elementId
     * @returns {boolean}
     */
    containsElement(elementId) {
        return this.containedElementIds.includes(elementId);
    }

    /**
     * Update contained elements based on position overlap
     * @param {Array} allElements - All elements on the board
     */
    updateContainedElements(allElements) {
        this.containedElementIds = [];
        
        for (const element of allElements) {
            if (element.id === this.id) continue;
            if (element.type === ELEMENT_TYPES.FRAME) continue; // Frames can't contain frames
            
            // Check if element is fully within this frame
            if (this.containsRect(element.getBounds())) {
                this.containedElementIds.push(element.id);
            }
        }
        
        this._isDirty = true;
    }

    /**
     * Check if a rectangle is fully contained within this frame
     * @param {Object} rect - {x, y, width, height}
     * @returns {boolean}
     */
    containsRect(rect) {
        return rect.x >= this.x &&
               rect.y >= this.y &&
               rect.x + rect.width <= this.x + this.width &&
               rect.y + rect.height <= this.y + this.height;
    }

    /**
     * Get contained element IDs
     * @returns {Array}
     */
    getContainedElementIds() {
        return [...this.containedElementIds];
    }

    /**
     * Override getCSSStyles
     */
    getCSSStyles() {
        const baseStyles = super.getCSSStyles();
        return {
            ...baseStyles,
            backgroundColor: this.style.backgroundColor,
            borderColor: this.style.borderColor,
            borderWidth: `${this.style.borderWidth}px`,
            borderStyle: this.style.borderStyle,
            borderRadius: `${this.style.borderRadius}px`
        };
    }

    /**
     * Render frame element
     * @returns {string}
     */
    render() {
        const styles = this.getStyleString();
        const headerStyle = `
            color: ${this.style.titleColor};
            font-size: ${this.style.titleFontSize}px;
            font-weight: ${this.style.titleFontWeight};
        `;
        
        const showNumber = this.properties.frameNumber !== null;
        const isCollapsed = this.properties.collapsed;
        
        return `
            <div class="wb-element wb-frame ${isCollapsed ? 'collapsed' : ''} ${this.locked ? 'locked' : ''}"
                 data-id="${this.id}"
                 data-type="${this.type}"
                 style="${styles}">
                <div class="selection-box"></div>
                
                ${this.properties.showTitle ? `
                <div class="wb-frame-header" style="${headerStyle}">
                    <input type="text" 
                           class="wb-frame-title" 
                           value="${this.escapeAttr(this.properties.title)}"
                           ${this.locked ? 'disabled' : ''}
                           placeholder="Frame title"/>
                    ${showNumber ? `<span class="wb-frame-number">${this.properties.frameNumber}</span>` : ''}
                </div>
                ` : ''}
                
                <div class="wb-frame-content">
                    <!-- Contained elements are rendered separately -->
                </div>
                
                ${this._renderResizeHandles()}
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
     * Escape HTML attribute
     * @param {string} text
     * @returns {string}
     */
    escapeAttr(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    /**
     * Move frame and all contained elements
     * @param {number} dx
     * @param {number} dy
     * @param {Object} elementMap - Map of all elements by ID
     */
    moveWithContents(dx, dy, elementMap) {
        if (this.locked) return;
        
        // Move the frame itself
        this.x += dx;
        this.y += dy;
        
        // Move all contained elements
        for (const elementId of this.containedElementIds) {
            const element = elementMap[elementId];
            if (element && !element.locked) {
                element.x += dx;
                element.y += dy;
                element._isDirty = true;
            }
        }
        
        this._isDirty = true;
    }

    /**
     * Get context menu actions
     * @returns {Array}
     */
    getContextMenuActions() {
        return [
            { id: 'editTitle', label: 'Edit Title', icon: 'type' },
            { id: 'divider' },
            { id: 'toggleCollapse', label: this.properties.collapsed ? 'Expand' : 'Collapse', icon: this.properties.collapsed ? 'maximize' : 'minimize' },
            { id: 'toggleTitle', label: this.properties.showTitle ? 'Hide Title' : 'Show Title', icon: 'type' },
            { id: 'divider' },
            { 
                id: 'borderStyle', 
                label: 'Border Style',
                submenu: [
                    { id: 'border-solid', label: 'Solid' },
                    { id: 'border-dashed', label: 'Dashed' },
                    { id: 'border-dotted', label: 'Dotted' }
                ]
            },
            { id: 'divider' },
            { id: 'copy', label: 'Copy', icon: 'copy', shortcut: 'Ctrl+C' },
            { id: 'duplicate', label: 'Duplicate', icon: 'duplicate', shortcut: 'Ctrl+D' },
            { id: 'divider' },
            { id: 'sendToBack', label: 'Send to Back', icon: 'sendBackward' },
            { id: 'divider' },
            { id: 'lock', label: this.locked ? 'Unlock' : 'Lock', icon: this.locked ? 'unlock' : 'lock' },
            { id: 'delete', label: 'Delete', icon: 'trash', shortcut: 'Delete', danger: true }
        ];
    }

    /**
     * Get minimum dimensions
     */
    getMinDimensions() {
        return { width: 200, height: 150 };
    }

    /**
     * Clone with offset (without contained elements)
     */
    cloneWithOffset(offsetX = 20, offsetY = 20) {
        const clone = this.clone();
        clone.x += offsetX;
        clone.y += offsetY;
        clone.containedElementIds = []; // Don't copy contained elements
        return clone;
    }

    /**
     * Serialize
     */
    toJSON() {
        return {
            ...super.toJSON(),
            containedElementIds: [...this.containedElementIds]
        };
    }

    /**
     * Frames should be rendered behind other elements
     */
    getDefaultZIndex() {
        return -100;
    }
}

// Register element type
window.__whiteboardElementTypes = window.__whiteboardElementTypes || {};
window.__whiteboardElementTypes[ELEMENT_TYPES.FRAME] = FrameElement;

export default FrameElement;