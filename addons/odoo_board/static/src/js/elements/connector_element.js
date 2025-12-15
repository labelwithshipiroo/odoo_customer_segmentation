/** @odoo-module **/

import { BaseElement } from './base_element';
import { ELEMENT_TYPES, CONNECTOR_TYPES, CONNECTOR_ENDS, CONNECTOR_COLORS, ELEMENT_DEFAULTS } from '../utils/constants';
import { generateConnectorPath, getRectAnchors, getClosestAnchor, distance } from '../utils/geometry';

/**
 * Connector Element
 * Lines and arrows connecting elements to show relationships
 */
export class ConnectorElement extends BaseElement {
    constructor(data = {}) {
        const defaults = ELEMENT_DEFAULTS.connector;
        
        super({
            ...data,
            type: ELEMENT_TYPES.CONNECTOR,
            width: 0,
            height: 0,
            style: {
                color: data.style?.color || defaults.color,
                strokeWidth: data.style?.strokeWidth || defaults.strokeWidth,
                strokeStyle: data.style?.strokeStyle || defaults.lineStyle,
                ...data.style
            },
            properties: {
                connectorType: data.properties?.connectorType || defaults.connectorType,
                startEnd: data.properties?.startEnd || defaults.startEnd,
                endEnd: data.properties?.endEnd || defaults.endEnd,
                // Connection points
                startPoint: data.properties?.startPoint || { x: 0, y: 0 },
                endPoint: data.properties?.endPoint || { x: 100, y: 100 },
                // Connected element IDs (optional)
                startElementId: data.properties?.startElementId || null,
                endElementId: data.properties?.endElementId || null,
                // Anchor positions on connected elements
                startAnchor: data.properties?.startAnchor || null,
                endAnchor: data.properties?.endAnchor || null,
                // Control points for manual curve adjustment
                controlPoints: data.properties?.controlPoints || null,
                ...data.properties
            }
        });
    }

    /**
     * Get start point
     * @returns {Object} {x, y}
     */
    get startPoint() {
        return this.properties.startPoint;
    }

    /**
     * Get end point
     * @returns {Object} {x, y}
     */
    get endPoint() {
        return this.properties.endPoint;
    }

    /**
     * Set start point
     * @param {number} x
     * @param {number} y
     */
    setStartPoint(x, y) {
        this.properties.startPoint = { x, y };
        this._updateBounds();
        this._isDirty = true;
    }

    /**
     * Set end point
     * @param {number} x
     * @param {number} y
     */
    setEndPoint(x, y) {
        this.properties.endPoint = { x, y };
        this._updateBounds();
        this._isDirty = true;
    }

    /**
     * Connect to start element
     * @param {BaseElement} element
     * @param {string} anchor - Optional anchor name ('top', 'right', 'bottom', 'left')
     */
    connectStart(element, anchor = null) {
        if (!element) {
            this.properties.startElementId = null;
            this.properties.startAnchor = null;
            return;
        }
        
        this.properties.startElementId = element.id;
        
        if (anchor) {
            this.properties.startAnchor = anchor;
        } else {
            // Find closest anchor
            const { name } = getClosestAnchor(element.getBounds(), this.properties.endPoint);
            this.properties.startAnchor = name;
        }
        
        this._updateFromConnectedElements({ [element.id]: element });
        this._isDirty = true;
    }

    /**
     * Connect to end element
     * @param {BaseElement} element
     * @param {string} anchor - Optional anchor name
     */
    connectEnd(element, anchor = null) {
        if (!element) {
            this.properties.endElementId = null;
            this.properties.endAnchor = null;
            return;
        }
        
        this.properties.endElementId = element.id;
        
        if (anchor) {
            this.properties.endAnchor = anchor;
        } else {
            // Find closest anchor
            const { name } = getClosestAnchor(element.getBounds(), this.properties.startPoint);
            this.properties.endAnchor = name;
        }
        
        this._updateFromConnectedElements({ [element.id]: element });
        this._isDirty = true;
    }

    /**
     * Update connector points based on connected elements
     * @param {Object} elementMap - Map of element IDs to elements
     */
    updateConnections(elementMap) {
        this._updateFromConnectedElements(elementMap);
        this._isDirty = true;
    }

    /**
     * Internal: Update points from connected elements
     * @param {Object} elementMap
     */
    _updateFromConnectedElements(elementMap) {
        const startElement = elementMap[this.properties.startElementId];
        const endElement = elementMap[this.properties.endElementId];
        
        if (startElement) {
            const anchors = getRectAnchors(startElement.getBounds());
            const anchorPoint = anchors[this.properties.startAnchor || 'right'];
            if (anchorPoint) {
                this.properties.startPoint = { ...anchorPoint };
            }
        }
        
        if (endElement) {
            const anchors = getRectAnchors(endElement.getBounds());
            const anchorPoint = anchors[this.properties.endAnchor || 'left'];
            if (anchorPoint) {
                this.properties.endPoint = { ...anchorPoint };
            }
        }
        
        this._updateBounds();
    }

    /**
     * Update internal bounds for hit testing
     */
    _updateBounds() {
        const { startPoint, endPoint } = this.properties;
        this.x = Math.min(startPoint.x, endPoint.x);
        this.y = Math.min(startPoint.y, endPoint.y);
        this.width = Math.abs(endPoint.x - startPoint.x);
        this.height = Math.abs(endPoint.y - startPoint.y);
    }

    /**
     * Set connector type
     * @param {string} type - 'straight', 'curved', 'elbow'
     */
    setConnectorType(type) {
        if (Object.values(CONNECTOR_TYPES).includes(type)) {
            this.properties.connectorType = type;
            this._isDirty = true;
        }
    }

    /**
     * Set start end style
     * @param {string} endStyle - 'none', 'arrow', 'dot', 'diamond'
     */
    setStartEndStyle(endStyle) {
        if (Object.values(CONNECTOR_ENDS).includes(endStyle)) {
            this.properties.startEnd = endStyle;
            this._isDirty = true;
        }
    }

    /**
     * Set end end style
     * @param {string} endStyle
     */
    setEndEndStyle(endStyle) {
        if (Object.values(CONNECTOR_ENDS).includes(endStyle)) {
            this.properties.endEnd = endStyle;
            this._isDirty = true;
        }
    }

    /**
     * Set color
     * @param {string} color
     */
    setColor(color) {
        this.style.color = color;
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
     * Get SVG path
     * @returns {string}
     */
    getPath() {
        const { startPoint, endPoint, connectorType, startAnchor, endAnchor } = this.properties;
        return generateConnectorPath(startPoint, endPoint, connectorType, startAnchor, endAnchor);
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
     * Check if a point is near this connector
     * @param {Object} point - {x, y}
     * @param {number} threshold - Distance threshold
     * @returns {boolean}
     */
    isPointNear(point, threshold = 10) {
        const { startPoint, endPoint } = this.properties;
        
        // Simple distance to line segment check
        const lineLength = distance(startPoint, endPoint);
        if (lineLength === 0) return distance(point, startPoint) <= threshold;
        
        const t = Math.max(0, Math.min(1, 
            ((point.x - startPoint.x) * (endPoint.x - startPoint.x) + 
             (point.y - startPoint.y) * (endPoint.y - startPoint.y)) / (lineLength * lineLength)
        ));
        
        const nearest = {
            x: startPoint.x + t * (endPoint.x - startPoint.x),
            y: startPoint.y + t * (endPoint.y - startPoint.y)
        };
        
        return distance(point, nearest) <= threshold;
    }

    /**
     * Render connector as SVG
     * @returns {string}
     */
    render() {
        const { startPoint, endPoint, connectorType, startEnd, endEnd } = this.properties;
        const { color, strokeWidth, strokeStyle } = this.style;
        
        // Calculate bounds for SVG viewBox
        const padding = 20;
        const minX = Math.min(startPoint.x, endPoint.x) - padding;
        const minY = Math.min(startPoint.y, endPoint.y) - padding;
        const maxX = Math.max(startPoint.x, endPoint.x) + padding;
        const maxY = Math.max(startPoint.y, endPoint.y) + padding;
        const svgWidth = maxX - minX;
        const svgHeight = maxY - minY;
        
        // Adjust points relative to SVG
        const relStart = { x: startPoint.x - minX, y: startPoint.y - minY };
        const relEnd = { x: endPoint.x - minX, y: endPoint.y - minY };
        
        const path = this._generateRelativePath(relStart, relEnd, connectorType);
        const dashArray = this.getStrokeDashArray();
        const dashAttr = dashArray !== 'none' ? `stroke-dasharray="${dashArray}"` : '';
        
        // Generate marker IDs unique to this connector
        const markerId = `marker-${this.id}`;
        
        return `
            <div class="wb-element wb-connector ${this.locked ? 'locked' : ''}"
                 data-id="${this.id}"
                 data-type="${this.type}"
                 style="position: absolute; left: ${minX}px; top: ${minY}px; pointer-events: none;">
                <svg class="wb-connector-svg" 
                     width="${svgWidth}" 
                     height="${svgHeight}"
                     style="overflow: visible;">
                    <defs>
                        ${this._renderMarkers(markerId, color)}
                    </defs>
                    <path d="${path}"
                          fill="none"
                          stroke="${color}"
                          stroke-width="${strokeWidth}"
                          ${dashAttr}
                          marker-start="${startEnd !== 'none' ? `url(#${markerId}-start)` : 'none'}"
                          marker-end="${endEnd !== 'none' ? `url(#${markerId}-end)` : 'none'}"
                          style="pointer-events: stroke; cursor: pointer;"/>
                </svg>
                ${this._renderEndpoints(relStart, relEnd)}
            </div>
        `;
    }

    /**
     * Generate path relative to SVG origin
     * @param {Object} start
     * @param {Object} end
     * @param {string} type
     * @returns {string}
     */
    _generateRelativePath(start, end, type) {
        if (type === 'straight') {
            return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
        }
        
        if (type === 'elbow') {
            const midX = (start.x + end.x) / 2;
            return `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${end.y} L ${end.x} ${end.y}`;
        }
        
        // Curved (bezier)
        const dx = Math.abs(end.x - start.x);
        const offset = Math.max(50, dx * 0.3);
        
        const cp1 = { x: start.x + offset, y: start.y };
        const cp2 = { x: end.x - offset, y: end.y };
        
        return `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;
    }

    /**
     * Render SVG markers for endpoints
     * @param {string} id
     * @param {string} color
     * @returns {string}
     */
    _renderMarkers(id, color) {
        const { startEnd, endEnd } = this.properties;
        let markers = '';
        
        if (startEnd === 'arrow') {
            markers += `
                <marker id="${id}-start" markerWidth="10" markerHeight="10" refX="0" refY="5" orient="auto-start-reverse">
                    <path d="M 10 0 L 0 5 L 10 10 Z" fill="${color}"/>
                </marker>
            `;
        } else if (startEnd === 'dot') {
            markers += `
                <marker id="${id}-start" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
                    <circle cx="5" cy="5" r="4" fill="${color}"/>
                </marker>
            `;
        } else if (startEnd === 'diamond') {
            markers += `
                <marker id="${id}-start" markerWidth="12" markerHeight="12" refX="6" refY="6" orient="auto">
                    <path d="M 6 0 L 12 6 L 6 12 L 0 6 Z" fill="${color}"/>
                </marker>
            `;
        }
        
        if (endEnd === 'arrow') {
            markers += `
                <marker id="${id}-end" markerWidth="10" markerHeight="10" refX="10" refY="5" orient="auto">
                    <path d="M 0 0 L 10 5 L 0 10 Z" fill="${color}"/>
                </marker>
            `;
        } else if (endEnd === 'dot') {
            markers += `
                <marker id="${id}-end" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
                    <circle cx="5" cy="5" r="4" fill="${color}"/>
                </marker>
            `;
        } else if (endEnd === 'diamond') {
            markers += `
                <marker id="${id}-end" markerWidth="12" markerHeight="12" refX="6" refY="6" orient="auto">
                    <path d="M 6 0 L 12 6 L 6 12 L 0 6 Z" fill="${color}"/>
                </marker>
            `;
        }
        
        return markers;
    }

    /**
     * Render draggable endpoints
     * @param {Object} start
     * @param {Object} end
     * @returns {string}
     */
    _renderEndpoints(start, end) {
        if (this.locked) return '';
        
        return `
            <div class="wb-connector-endpoint start" 
                 style="position: absolute; left: ${start.x - 6}px; top: ${start.y - 6}px; 
                        width: 12px; height: 12px; background: white; border: 2px solid #2563eb;
                        border-radius: 50%; cursor: move; pointer-events: all;"></div>
            <div class="wb-connector-endpoint end" 
                 style="position: absolute; left: ${end.x - 6}px; top: ${end.y - 6}px; 
                        width: 12px; height: 12px; background: white; border: 2px solid #2563eb;
                        border-radius: 50%; cursor: move; pointer-events: all;"></div>
        `;
    }

    /**
     * Override getBounds for connector
     */
    getBounds() {
        const { startPoint, endPoint } = this.properties;
        const padding = 10;
        return {
            x: Math.min(startPoint.x, endPoint.x) - padding,
            y: Math.min(startPoint.y, endPoint.y) - padding,
            width: Math.abs(endPoint.x - startPoint.x) + padding * 2,
            height: Math.abs(endPoint.y - startPoint.y) + padding * 2
        };
    }

    /**
     * Override containsPoint for connector
     */
    containsPoint(point) {
        return this.isPointNear(point, 10);
    }

    /**
     * Get context menu actions
     * @returns {Array}
     */
    getContextMenuActions() {
        return [
            {
                id: 'connectorType',
                label: 'Line Type',
                submenu: [
                    { id: 'type-straight', label: 'Straight', icon: 'connectorStraight' },
                    { id: 'type-curved', label: 'Curved', icon: 'connectorCurved' },
                    { id: 'type-elbow', label: 'Elbow', icon: 'connectorElbow' }
                ]
            },
            {
                id: 'endStyle',
                label: 'End Style',
                submenu: [
                    { id: 'end-none', label: 'None' },
                    { id: 'end-arrow', label: 'Arrow' },
                    { id: 'end-dot', label: 'Dot' },
                    { id: 'end-diamond', label: 'Diamond' }
                ]
            },
            { id: 'divider' },
            { id: 'copy', label: 'Copy', icon: 'copy', shortcut: 'Ctrl+C' },
            { id: 'duplicate', label: 'Duplicate', icon: 'duplicate', shortcut: 'Ctrl+D' },
            { id: 'divider' },
            { id: 'lock', label: this.locked ? 'Unlock' : 'Lock', icon: this.locked ? 'unlock' : 'lock' },
            { id: 'delete', label: 'Delete', icon: 'trash', shortcut: 'Delete', danger: true }
        ];
    }

    /**
     * Connectors don't have resize handles
     */
    getResizeHandles() {
        return [];
    }

    /**
     * Clone with offset
     */
    cloneWithOffset(offsetX = 20, offsetY = 20) {
        const clone = this.clone();
        clone.properties.startPoint.x += offsetX;
        clone.properties.startPoint.y += offsetY;
        clone.properties.endPoint.x += offsetX;
        clone.properties.endPoint.y += offsetY;
        clone.properties.startElementId = null;
        clone.properties.endElementId = null;
        clone._updateBounds();
        return clone;
    }

    /**
     * Serialize
     */
    toJSON() {
        return {
            ...super.toJSON(),
            startPoint: { ...this.properties.startPoint },
            endPoint: { ...this.properties.endPoint },
            startElementId: this.properties.startElementId,
            endElementId: this.properties.endElementId,
            startAnchor: this.properties.startAnchor,
            endAnchor: this.properties.endAnchor
        };
    }
}

// Register element type
window.__whiteboardElementTypes = window.__whiteboardElementTypes || {};
window.__whiteboardElementTypes[ELEMENT_TYPES.CONNECTOR] = ConnectorElement;

export default ConnectorElement;