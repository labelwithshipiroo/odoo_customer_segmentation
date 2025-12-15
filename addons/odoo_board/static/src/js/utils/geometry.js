/** @odoo-module **/

/**
 * Geometry utilities for the whiteboard
 * Handles calculations for positions, intersections, and transformations
 */

/**
 * Generate a unique ID
 * @returns {string} UUID-like string
 */
export function generateId() {
    return 'el_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Calculate distance between two points
 * @param {Object} p1 - First point {x, y}
 * @param {Object} p2 - Second point {x, y}
 * @returns {number} Distance
 */
export function distance(p1, p2) {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Check if a point is inside a rectangle
 * @param {Object} point - Point {x, y}
 * @param {Object} rect - Rectangle {x, y, width, height}
 * @returns {boolean}
 */
export function pointInRect(point, rect) {
    return point.x >= rect.x &&
           point.x <= rect.x + rect.width &&
           point.y >= rect.y &&
           point.y <= rect.y + rect.height;
}

/**
 * Check if two rectangles intersect
 * @param {Object} rect1 - First rectangle {x, y, width, height}
 * @param {Object} rect2 - Second rectangle {x, y, width, height}
 * @returns {boolean}
 */
export function rectsIntersect(rect1, rect2) {
    return !(rect2.x > rect1.x + rect1.width ||
             rect2.x + rect2.width < rect1.x ||
             rect2.y > rect1.y + rect1.height ||
             rect2.y + rect2.height < rect1.y);
}

/**
 * Check if rect1 fully contains rect2
 * @param {Object} rect1 - Container rectangle
 * @param {Object} rect2 - Inner rectangle
 * @returns {boolean}
 */
export function rectContainsRect(rect1, rect2) {
    return rect2.x >= rect1.x &&
           rect2.y >= rect1.y &&
           rect2.x + rect2.width <= rect1.x + rect1.width &&
           rect2.y + rect2.height <= rect1.y + rect1.height;
}

/**
 * Get bounding box of multiple elements
 * @param {Array} elements - Array of elements with x, y, width, height
 * @returns {Object} Bounding box {x, y, width, height}
 */
export function getBoundingBox(elements) {
    if (!elements.length) return { x: 0, y: 0, width: 0, height: 0 };
    
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    for (const el of elements) {
        minX = Math.min(minX, el.x);
        minY = Math.min(minY, el.y);
        maxX = Math.max(maxX, el.x + el.width);
        maxY = Math.max(maxY, el.y + el.height);
    }
    
    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
    };
}

/**
 * Snap value to grid
 * @param {number} value - Value to snap
 * @param {number} gridSize - Grid size
 * @returns {number} Snapped value
 */
export function snapToGrid(value, gridSize) {
    return Math.round(value / gridSize) * gridSize;
}

/**
 * Clamp value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation
 * @param {number} start - Start value
 * @param {number} end - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
export function lerp(start, end, t) {
    return start + (end - start) * t;
}

/**
 * Convert degrees to radians
 * @param {number} degrees
 * @returns {number} Radians
 */
export function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 * @param {number} radians
 * @returns {number} Degrees
 */
export function radiansToDegrees(radians) {
    return radians * (180 / Math.PI);
}

/**
 * Rotate a point around a center
 * @param {Object} point - Point to rotate {x, y}
 * @param {Object} center - Center of rotation {x, y}
 * @param {number} angle - Angle in radians
 * @returns {Object} Rotated point {x, y}
 */
export function rotatePoint(point, center, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    
    return {
        x: center.x + dx * cos - dy * sin,
        y: center.y + dx * sin + dy * cos
    };
}

/**
 * Get center point of a rectangle
 * @param {Object} rect - Rectangle {x, y, width, height}
 * @returns {Object} Center point {x, y}
 */
export function getRectCenter(rect) {
    return {
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2
    };
}

/**
 * Get anchor points on a rectangle edge
 * @param {Object} rect - Rectangle {x, y, width, height}
 * @returns {Object} Anchor points {top, right, bottom, left}
 */
export function getRectAnchors(rect) {
    return {
        top: { x: rect.x + rect.width / 2, y: rect.y },
        right: { x: rect.x + rect.width, y: rect.y + rect.height / 2 },
        bottom: { x: rect.x + rect.width / 2, y: rect.y + rect.height },
        left: { x: rect.x, y: rect.y + rect.height / 2 }
    };
}

/**
 * Find the closest anchor point on a rectangle to a given point
 * @param {Object} rect - Rectangle
 * @param {Object} point - Target point
 * @returns {Object} Closest anchor point and its name
 */
export function getClosestAnchor(rect, point) {
    const anchors = getRectAnchors(rect);
    let closestAnchor = null;
    let closestName = null;
    let minDist = Infinity;
    
    for (const [name, anchor] of Object.entries(anchors)) {
        const dist = distance(anchor, point);
        if (dist < minDist) {
            minDist = dist;
            closestAnchor = anchor;
            closestName = name;
        }
    }
    
    return { point: closestAnchor, name: closestName };
}

/**
 * Calculate control points for a curved connector
 * @param {Object} start - Start point {x, y}
 * @param {Object} end - End point {x, y}
 * @param {string} startDir - Start direction ('top', 'right', 'bottom', 'left')
 * @param {string} endDir - End direction
 * @returns {Object} Control points {cp1, cp2}
 */
export function getConnectorControlPoints(start, end, startDir, endDir) {
    const dx = Math.abs(end.x - start.x);
    const dy = Math.abs(end.y - start.y);
    const offset = Math.max(50, Math.min(dx, dy) * 0.5);
    
    const dirVectors = {
        top: { x: 0, y: -1 },
        right: { x: 1, y: 0 },
        bottom: { x: 0, y: 1 },
        left: { x: -1, y: 0 }
    };
    
    const startVec = dirVectors[startDir] || dirVectors.right;
    const endVec = dirVectors[endDir] || dirVectors.left;
    
    return {
        cp1: {
            x: start.x + startVec.x * offset,
            y: start.y + startVec.y * offset
        },
        cp2: {
            x: end.x + endVec.x * offset,
            y: end.y + endVec.y * offset
        }
    };
}

/**
 * Generate SVG path for a curved connector
 * @param {Object} start - Start point
 * @param {Object} end - End point
 * @param {string} type - Connector type ('straight', 'curved', 'elbow')
 * @returns {string} SVG path d attribute
 */
export function generateConnectorPath(start, end, type = 'curved') {
    if (type === 'straight') {
        return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
    }
    
    if (type === 'elbow') {
        const midX = (start.x + end.x) / 2;
        return `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${end.y} L ${end.x} ${end.y}`;
    }
    
    // Curved (bezier)
    const { cp1, cp2 } = getConnectorControlPoints(start, end, 'right', 'left');
    return `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;
}

/**
 * Generate SVG path for arrow marker
 * @param {number} size - Arrow size
 * @returns {string} SVG path d attribute
 */
export function generateArrowPath(size = 10) {
    return `M 0 0 L ${size} ${size / 2} L 0 ${size} Z`;
}

/**
 * Get shape path for various shapes
 * @param {string} shapeType - Type of shape
 * @param {number} width - Width
 * @param {number} height - Height
 * @returns {string} SVG path d attribute
 */
export function getShapePath(shapeType, width, height) {
    const cx = width / 2;
    const cy = height / 2;
    
    switch (shapeType) {
        case 'triangle':
            return `M ${cx} 0 L ${width} ${height} L 0 ${height} Z`;
            
        case 'diamond':
            return `M ${cx} 0 L ${width} ${cy} L ${cx} ${height} L 0 ${cy} Z`;
            
        case 'hexagon':
            const hx = width / 4;
            return `M ${hx} 0 L ${width - hx} 0 L ${width} ${cy} L ${width - hx} ${height} L ${hx} ${height} L 0 ${cy} Z`;
            
        case 'star':
            const outerRadius = Math.min(width, height) / 2;
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
            
        case 'arrow-right':
            const aw = width * 0.6;
            const ah = height * 0.3;
            return `M 0 ${ah} L ${aw} ${ah} L ${aw} 0 L ${width} ${cy} L ${aw} ${height} L ${aw} ${height - ah} L 0 ${height - ah} Z`;
            
        case 'ellipse':
            return `M ${cx} 0 A ${cx} ${cy} 0 1 1 ${cx} ${height} A ${cx} ${cy} 0 1 1 ${cx} 0`;
            
        default:
            return '';
    }
}

/**
 * Calculate resize with aspect ratio lock
 * @param {Object} original - Original dimensions {width, height}
 * @param {Object} delta - Change in dimensions {dx, dy}
 * @param {string} handle - Resize handle position
 * @param {boolean} lockAspect - Whether to lock aspect ratio
 * @returns {Object} New dimensions and position adjustments
 */
export function calculateResize(original, delta, handle, lockAspect = false) {
    let { width, height, x, y } = original;
    let { dx, dy } = delta;
    
    const aspectRatio = original.width / original.height;
    
    // Apply deltas based on handle
    if (handle.includes('e')) width += dx;
    if (handle.includes('w')) { width -= dx; x += dx; }
    if (handle.includes('s')) height += dy;
    if (handle.includes('n')) { height -= dy; y += dy; }
    
    // Lock aspect ratio if needed
    if (lockAspect) {
        if (handle === 'n' || handle === 's') {
            width = height * aspectRatio;
        } else if (handle === 'e' || handle === 'w') {
            height = width / aspectRatio;
        } else {
            // Corner handles
            const newAspect = width / height;
            if (newAspect > aspectRatio) {
                width = height * aspectRatio;
            } else {
                height = width / aspectRatio;
            }
        }
    }
    
    // Enforce minimum dimensions
    width = Math.max(20, width);
    height = Math.max(20, height);
    
    return { x, y, width, height };
}

/**
 * Normalize selection rectangle (handle negative dimensions)
 * @param {Object} rect - Rectangle that may have negative dimensions
 * @returns {Object} Normalized rectangle
 */
export function normalizeRect(rect) {
    let { x, y, width, height } = rect;
    
    if (width < 0) {
        x += width;
        width = Math.abs(width);
    }
    
    if (height < 0) {
        y += height;
        height = Math.abs(height);
    }
    
    return { x, y, width, height };
}

/**
 * Transform screen coordinates to canvas coordinates
 * @param {Object} screenPoint - Screen coordinates {x, y}
 * @param {Object} transform - Canvas transform {zoom, panX, panY}
 * @returns {Object} Canvas coordinates
 */
export function screenToCanvas(screenPoint, transform) {
    return {
        x: (screenPoint.x - transform.panX) / transform.zoom,
        y: (screenPoint.y - transform.panY) / transform.zoom
    };
}

/**
 * Transform canvas coordinates to screen coordinates
 * @param {Object} canvasPoint - Canvas coordinates {x, y}
 * @param {Object} transform - Canvas transform {zoom, panX, panY}
 * @returns {Object} Screen coordinates
 */
export function canvasToScreen(canvasPoint, transform) {
    return {
        x: canvasPoint.x * transform.zoom + transform.panX,
        y: canvasPoint.y * transform.zoom + transform.panY
    };
}

export default {
    generateId,
    distance,
    pointInRect,
    rectsIntersect,
    rectContainsRect,
    getBoundingBox,
    snapToGrid,
    clamp,
    lerp,
    degreesToRadians,
    radiansToDegrees,
    rotatePoint,
    getRectCenter,
    getRectAnchors,
    getClosestAnchor,
    getConnectorControlPoints,
    generateConnectorPath,
    generateArrowPath,
    getShapePath,
    calculateResize,
    normalizeRect,
    screenToCanvas,
    canvasToScreen
};