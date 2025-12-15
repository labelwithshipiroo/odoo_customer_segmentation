/** @odoo-module **/

import { generateId } from '../utils/geometry';

/**
 * Base Element Class
 * Foundation for all whiteboard elements
 */
export class BaseElement {
    constructor(data = {}) {
        this.id = data.id || generateId();
        this.type = data.type || 'base';
        this.x = data.x || 0;
        this.y = data.y || 0;
        this.width = data.width || 100;
        this.height = data.height || 100;
        this.rotation = data.rotation || 0;
        this.zIndex = data.zIndex || 0;
        this.locked = data.locked || false;
        this.visible = data.visible !== false;
        this.opacity = data.opacity !== undefined ? data.opacity : 1;
        this.parentId = data.parentId || null;
        this.groupId = data.groupId || null;
        
        // Common style properties
        this.style = {
            backgroundColor: data.style?.backgroundColor || 'transparent',
            borderColor: data.style?.borderColor || '#1e293b',
            borderWidth: data.style?.borderWidth || 0,
            borderRadius: data.style?.borderRadius || 0,
            shadow: data.style?.shadow || false,
            ...data.style
        };
        
        // Content
        this.content = data.content || '';
        
        // Additional properties
        this.properties = data.properties || {};
        
        // Internal state
        this._isDirty = true;
    }

    /**
     * Get element bounds
     * @returns {Object} {x, y, width, height}
     */
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    /**
     * Get element center point
     * @returns {Object} {x, y}
     */
    getCenter() {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        };
    }

    /**
     * Check if a point is inside this element
     * @param {Object} point - {x, y}
     * @returns {boolean}
     */
    containsPoint(point) {
        return point.x >= this.x &&
               point.x <= this.x + this.width &&
               point.y >= this.y &&
               point.y <= this.y + this.height;
    }

    /**
     * Check if this element intersects with a rectangle
     * @param {Object} rect - {x, y, width, height}
     * @returns {boolean}
     */
    intersects(rect) {
        return !(rect.x > this.x + this.width ||
                 rect.x + rect.width < this.x ||
                 rect.y > this.y + this.height ||
                 rect.y + rect.height < this.y);
    }

    /**
     * Move the element
     * @param {number} dx - Delta X
     * @param {number} dy - Delta Y
     */
    move(dx, dy) {
        if (this.locked) return;
        this.x += dx;
        this.y += dy;
        this._isDirty = true;
    }

    /**
     * Set position
     * @param {number} x
     * @param {number} y
     */
    setPosition(x, y) {
        if (this.locked) return;
        this.x = x;
        this.y = y;
        this._isDirty = true;
    }

    /**
     * Resize the element
     * @param {number} width
     * @param {number} height
     */
    resize(width, height) {
        if (this.locked) return;
        this.width = Math.max(20, width);
        this.height = Math.max(20, height);
        this._isDirty = true;
    }

    /**
     * Set rotation
     * @param {number} angle - Angle in degrees
     */
    setRotation(angle) {
        if (this.locked) return;
        this.rotation = angle % 360;
        this._isDirty = true;
    }

    /**
     * Update content
     * @param {string} content
     */
    setContent(content) {
        this.content = content;
        this._isDirty = true;
    }

    /**
     * Update style property
     * @param {string} property
     * @param {any} value
     */
    setStyle(property, value) {
        this.style[property] = value;
        this._isDirty = true;
    }

    /**
     * Update multiple style properties
     * @param {Object} styles
     */
    setStyles(styles) {
        Object.assign(this.style, styles);
        this._isDirty = true;
    }

    /**
     * Update property
     * @param {string} property
     * @param {any} value
     */
    setProperty(property, value) {
        this.properties[property] = value;
        this._isDirty = true;
    }

    /**
     * Lock/unlock the element
     * @param {boolean} locked
     */
    setLocked(locked) {
        this.locked = locked;
    }

    /**
     * Set visibility
     * @param {boolean} visible
     */
    setVisible(visible) {
        this.visible = visible;
        this._isDirty = true;
    }

    /**
     * Clone the element
     * @returns {BaseElement} A new instance with same properties
     */
    clone() {
        const data = this.toJSON();
        data.id = generateId();
        return new this.constructor(data);
    }

    /**
     * Serialize to JSON
     * @returns {Object}
     */
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            rotation: this.rotation,
            zIndex: this.zIndex,
            locked: this.locked,
            visible: this.visible,
            opacity: this.opacity,
            parentId: this.parentId,
            groupId: this.groupId,
            style: { ...this.style },
            content: this.content,
            properties: { ...this.properties }
        };
    }

    /**
     * Get CSS styles for rendering
     * @returns {Object}
     */
    getCSSStyles() {
        return {
            position: 'absolute',
            left: `${this.x}px`,
            top: `${this.y}px`,
            width: `${this.width}px`,
            height: `${this.height}px`,
            transform: this.rotation ? `rotate(${this.rotation}deg)` : '',
            zIndex: this.zIndex,
            opacity: this.opacity,
            backgroundColor: this.style.backgroundColor,
            borderColor: this.style.borderColor,
            borderWidth: this.style.borderWidth ? `${this.style.borderWidth}px` : '',
            borderStyle: this.style.borderWidth ? 'solid' : '',
            borderRadius: this.style.borderRadius ? `${this.style.borderRadius}px` : '',
            boxShadow: this.style.shadow ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : '',
            display: this.visible ? '' : 'none'
        };
    }

    /**
     * Get style string for inline styles
     * @returns {string}
     */
    getStyleString() {
        const styles = this.getCSSStyles();
        return Object.entries(styles)
            .filter(([, value]) => value !== '' && value !== undefined)
            .map(([key, value]) => {
                // Convert camelCase to kebab-case
                const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
                return `${kebabKey}: ${value}`;
            })
            .join('; ');
    }

    /**
     * Render to HTML string (to be overridden)
     * @returns {string}
     */
    render() {
        return `<div class="wb-element" data-id="${this.id}" style="${this.getStyleString()}"></div>`;
    }

    /**
     * Get resize handles configuration
     * @returns {Array} Array of handle positions
     */
    getResizeHandles() {
        return ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
    }

    /**
     * Get anchor points for connectors
     * @returns {Object} Named anchor points
     */
    getAnchorPoints() {
        return {
            top: { x: this.x + this.width / 2, y: this.y },
            right: { x: this.x + this.width, y: this.y + this.height / 2 },
            bottom: { x: this.x + this.width / 2, y: this.y + this.height },
            left: { x: this.x, y: this.y + this.height / 2 },
            center: { x: this.x + this.width / 2, y: this.y + this.height / 2 }
        };
    }

    /**
     * Called when element is selected
     */
    onSelect() {
        // Override in subclasses if needed
    }

    /**
     * Called when element is deselected
     */
    onDeselect() {
        // Override in subclasses if needed
    }

    /**
     * Called when element starts being edited
     */
    onStartEdit() {
        // Override in subclasses if needed
    }

    /**
     * Called when element stops being edited
     */
    onEndEdit() {
        // Override in subclasses if needed
    }

    /**
     * Mark as clean (no pending updates)
     */
    markClean() {
        this._isDirty = false;
    }

    /**
     * Check if element needs re-render
     * @returns {boolean}
     */
    isDirty() {
        return this._isDirty;
    }
}

/**
 * Factory function to create elements from JSON data
 * @param {Object} data - Element data
 * @returns {BaseElement|null}
 */
export function createElementFromData(data) {
    // This will be populated by element type imports
    const elementTypes = window.__whiteboardElementTypes || {};
    
    const ElementClass = elementTypes[data.type] || BaseElement;
    return new ElementClass(data);
}

// Register element types globally
window.__whiteboardElementTypes = window.__whiteboardElementTypes || {};

export default BaseElement;