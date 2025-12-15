/** @odoo-module **/

import { BaseElement } from './base_element';
import { ELEMENT_TYPES, SHAPE_TYPES, SHAPE_COLORS, ELEMENT_DEFAULTS } from '../utils/constants';
import { getShapePath } from '../utils/geometry';

/**
 * Shape Element
 * Various geometric shapes for diagrams and flowcharts
 */
export class ShapeElement extends BaseElement {
    constructor(data = {}) {
        const defaults = ELEMENT_DEFAULTS.shape;
        
        super({
            ...data,
            type: ELEMENT_TYPES.SHAPE,
            width: data.width || defaults.width,
            height: data.height || defaults.height,
            style: {
                fill: data.style?.fill || defaults.fill,
                stroke: data.style?.stroke || defaults.stroke,
                strokeWidth: data.style?.strokeWidth || defaults.strokeWidth,
                strokeStyle: data.style?.strokeStyle || 'solid',
                textColor: data.style?.textColor || '#1e293b',
                fontSize: data.style?.fontSize || 14,
                fontFamily: data.style?.fontFamily || 'Inter, sans-serif',
                fontWeight: data.style?.fontWeight || 'normal',
                textAlign: data.style?.textAlign || 'center',
                shadow: data.style?.shadow || false,
                ...data.style
            },
            properties: {
                shapeType: data.properties?.shapeType || defaults.shapeType,
                ...data.properties
            }
        });
        
        this.content = data.content || defaults.content;
    }

    /**
     * Get shape type
     * @returns {string}
     */
    get shapeType() {
        return this.properties.shapeType;
    }

    /**
     * Set shape type
     * @param {string} type
     */
    setShapeType(type) {
        if (Object.values(SHAPE_TYPES).includes(type)) {
            this.properties.shapeType = type;
            this._isDirty = true;
        }
    }

    /**
     * Set fill color
     * @param {string} color
     */
    setFill(color) {
        this.style.fill = color;
        this._isDirty = true;
    }

    /**
     * Set stroke color
     * @param {string} color
     */
    setStroke(color) {
        this.style.stroke = color;
        this._isDirty = true;
    }

    /**
     * Set stroke width
     * @param {number} width
     */
    setStrokeWidth(width) {
        this.style.strokeWidth = width;
        this._isDirty = true;
    }

    /**
     * Set stroke style
     * @param {string} style - 'solid', 'dashed', 'dotted'
     */
    setStrokeStyle(style) {
        this.style.strokeStyle = style;
        this._isDirty = true;
    }

    /**
     * Apply color preset
     * @param {string} presetName
     */
    applyColorPreset(presetName) {
        const preset = SHAPE_COLORS.find(c => c.name === presetName);
        if (preset) {
            this.style.fill = preset.fill;
            this.style.stroke = preset.stroke;
            this._isDirty = true;
        }
    }

    /**
     * Get SVG path for the shape
     * @returns {string}
     */
    getShapePath() {
        const { shapeType } = this.properties;
        
        switch (shapeType) {
            case SHAPE_TYPES.RECTANGLE:
            case SHAPE_TYPES.ROUNDED_RECTANGLE:
                return ''; // Use rect element instead
            case SHAPE_TYPES.CIRCLE:
            case SHAPE_TYPES.ELLIPSE:
                return ''; // Use ellipse element instead
            default:
                return getShapePath(shapeType, this.width, this.height);
        }
    }

    /**
     * Get stroke dash array
     * @returns {string}
     */
    getStrokeDashArray() {
        switch (this.style.strokeStyle) {
            case 'dashed':
                return '8,4';
            case 'dotted':
                return '2,4';
            default:
                return 'none';
        }
    }

    /**
     * Render shape as SVG
     * @returns {string}
     */
    renderSVGShape() {
        const { shapeType } = this.properties;
        const { fill, stroke, strokeWidth } = this.style;
        const dashArray = this.getStrokeDashArray();
        const dashAttr = dashArray !== 'none' ? `stroke-dasharray="${dashArray}"` : '';
        
        switch (shapeType) {
            case SHAPE_TYPES.RECTANGLE:
                return `<rect x="0" y="0" width="${this.width}" height="${this.height}" 
                        fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" ${dashAttr}/>`;
                        
            case SHAPE_TYPES.ROUNDED_RECTANGLE:
                const rx = Math.min(this.width, this.height) * 0.15;
                return `<rect x="0" y="0" width="${this.width}" height="${this.height}" rx="${rx}"
                        fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" ${dashAttr}/>`;
                        
            case SHAPE_TYPES.CIRCLE:
                const r = Math.min(this.width, this.height) / 2;
                return `<circle cx="${this.width/2}" cy="${this.height/2}" r="${r - strokeWidth/2}"
                        fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" ${dashAttr}/>`;
                        
            case SHAPE_TYPES.ELLIPSE:
                return `<ellipse cx="${this.width/2}" cy="${this.height/2}" 
                        rx="${this.width/2 - strokeWidth/2}" ry="${this.height/2 - strokeWidth/2}"
                        fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" ${dashAttr}/>`;
                        
            case SHAPE_TYPES.TRIANGLE:
                const triPath = `M ${this.width/2} 0 L ${this.width} ${this.height} L 0 ${this.height} Z`;
                return `<path d="${triPath}" fill="${fill}" stroke="${stroke}" 
                        stroke-width="${strokeWidth}" ${dashAttr}/>`;
                        
            case SHAPE_TYPES.DIAMOND:
                const cx = this.width / 2;
                const cy = this.height / 2;
                const diaPath = `M ${cx} 0 L ${this.width} ${cy} L ${cx} ${this.height} L 0 ${cy} Z`;
                return `<path d="${diaPath}" fill="${fill}" stroke="${stroke}" 
                        stroke-width="${strokeWidth}" ${dashAttr}/>`;
                        
            case SHAPE_TYPES.HEXAGON:
                const hx = this.width / 4;
                const hexPath = `M ${hx} 0 L ${this.width - hx} 0 L ${this.width} ${this.height/2} 
                                 L ${this.width - hx} ${this.height} L ${hx} ${this.height} L 0 ${this.height/2} Z`;
                return `<path d="${hexPath}" fill="${fill}" stroke="${stroke}" 
                        stroke-width="${strokeWidth}" ${dashAttr}/>`;
                        
            case SHAPE_TYPES.STAR:
                const starPath = this._getStarPath();
                return `<path d="${starPath}" fill="${fill}" stroke="${stroke}" 
                        stroke-width="${strokeWidth}" ${dashAttr}/>`;
                        
            case SHAPE_TYPES.ARROW_RIGHT:
                const arrPath = this._getArrowPath('right');
                return `<path d="${arrPath}" fill="${fill}" stroke="${stroke}" 
                        stroke-width="${strokeWidth}" ${dashAttr}/>`;
                        
            default:
                return `<rect x="0" y="0" width="${this.width}" height="${this.height}" 
                        fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" ${dashAttr}/>`;
        }
    }

    /**
     * Generate star path
     * @returns {string}
     */
    _getStarPath() {
        const cx = this.width / 2;
        const cy = this.height / 2;
        const outerRadius = Math.min(this.width, this.height) / 2 - this.style.strokeWidth;
        const innerRadius = outerRadius * 0.4;
        const points = 5;
        let path = '';
        
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / points - Math.PI / 2;
            const x = cx + radius * Math.cos(angle);
            const y = cy + radius * Math.sin(angle);
            path += (i === 0 ? 'M' : 'L') + ` ${x} ${y} `;
        }
        return path + 'Z';
    }

    /**
     * Generate arrow path
     * @param {string} direction
     * @returns {string}
     */
    _getArrowPath(direction) {
        const w = this.width;
        const h = this.height;
        const aw = w * 0.6;
        const ah = h * 0.3;
        
        if (direction === 'right') {
            return `M 0 ${ah} L ${aw} ${ah} L ${aw} 0 L ${w} ${h/2} L ${aw} ${h} L ${aw} ${h - ah} L 0 ${h - ah} Z`;
        }
        // Add other directions as needed
        return '';
    }

    /**
     * Render shape element
     * @returns {string}
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
            <div class="wb-element wb-shape wb-shape-${this.properties.shapeType} ${this.locked ? 'locked' : ''}"
                 data-id="${this.id}"
                 data-type="${this.type}"
                 data-shape="${this.properties.shapeType}"
                 style="${styles}">
                <div class="selection-box"></div>
                <svg class="wb-shape-svg" width="${this.width}" height="${this.height}" 
                     viewBox="0 0 ${this.width} ${this.height}" preserveAspectRatio="none">
                    ${this.renderSVGShape()}
                </svg>
                <div class="wb-shape-content">
                    <div class="content-editable"
                         contenteditable="${!this.locked}"
                         style="${contentStyle}"
                         data-placeholder="">${this.escapeHtml(this.content)}</div>
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
     * Override resize to maintain aspect ratio for some shapes
     * @param {number} width
     * @param {number} height
     */
    resize(width, height) {
        if (this.locked) return;
        
        // For circle shape, maintain 1:1 ratio
        if (this.properties.shapeType === SHAPE_TYPES.CIRCLE) {
            const size = Math.max(width, height);
            this.width = Math.max(40, size);
            this.height = Math.max(40, size);
        } else {
            this.width = Math.max(40, width);
            this.height = Math.max(40, height);
        }
        this._isDirty = true;
    }

    /**
     * Get context menu actions
     * @returns {Array}
     */
    getContextMenuActions() {
        return [
            { id: 'edit', label: 'Edit Text', icon: 'type' },
            { id: 'divider' },
            { 
                id: 'changeShape', 
                label: 'Change Shape', 
                icon: 'square',
                submenu: [
                    { id: 'shape-rectangle', label: 'Rectangle', icon: 'square' },
                    { id: 'shape-rounded-rectangle', label: 'Rounded Rectangle', icon: 'roundedSquare' },
                    { id: 'shape-circle', label: 'Circle', icon: 'circle' },
                    { id: 'shape-ellipse', label: 'Ellipse', icon: 'ellipse' },
                    { id: 'shape-triangle', label: 'Triangle', icon: 'triangle' },
                    { id: 'shape-diamond', label: 'Diamond', icon: 'diamond' },
                    { id: 'shape-hexagon', label: 'Hexagon', icon: 'hexagon' },
                    { id: 'shape-star', label: 'Star', icon: 'star' }
                ]
            },
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
        return { width: 40, height: 40 };
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

    /**
     * Serialize
     */
    toJSON() {
        return {
            ...super.toJSON(),
            shapeType: this.properties.shapeType
        };
    }
}

// Register element type
window.__whiteboardElementTypes = window.__whiteboardElementTypes || {};
window.__whiteboardElementTypes[ELEMENT_TYPES.SHAPE] = ShapeElement;

export default ShapeElement;