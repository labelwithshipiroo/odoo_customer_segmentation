/** @odoo-module **/

import { CANVAS_CONFIG, ELEMENT_TYPES } from '../utils/constants';
import { screenToCanvas, canvasToScreen, clamp, generateId } from '../utils/geometry';
import { HistoryManager, ACTION_TYPES } from '../utils/history';

// Import all element types
import { StickyNoteElement } from '../elements/sticky_note';
import { TextElement } from '../elements/text_element';
import { ShapeElement } from '../elements/shape_element';
import { FrameElement } from '../elements/frame_element';
import { ConnectorElement } from '../elements/connector_element';
import { ImageElement } from '../elements/image_element';

/**
 * Canvas Core
 * Manages the whiteboard canvas state and rendering
 */
export class CanvasCore {
    constructor(containerEl, options = {}) {
        this.container = containerEl;
        this.options = {
            gridSize: CANVAS_CONFIG.GRID_SIZE,
            minZoom: CANVAS_CONFIG.MIN_ZOOM,
            maxZoom: CANVAS_CONFIG.MAX_ZOOM,
            snapToGrid: false,
            ...options
        };
        
        // Transform state
        this.transform = {
            zoom: CANVAS_CONFIG.DEFAULT_ZOOM,
            panX: 0,
            panY: 0
        };
        
        // Elements
        this.elements = new Map();
        this.elementOrder = []; // Z-order tracking
        
        // Selection state
        this.selectedIds = new Set();
        this.hoveredId = null;
        
        // Clipboard
        this.clipboard = [];
        
        // History
        this.history = new HistoryManager(50);
        
        // Event callbacks
        this.callbacks = {
            onElementsChange: null,
            onSelectionChange: null,
            onTransformChange: null,
            onHistoryChange: null
        };
        
        // Element type classes
        this.elementClasses = {
            [ELEMENT_TYPES.STICKY]: StickyNoteElement,
            [ELEMENT_TYPES.TEXT]: TextElement,
            [ELEMENT_TYPES.SHAPE]: ShapeElement,
            [ELEMENT_TYPES.FRAME]: FrameElement,
            [ELEMENT_TYPES.CONNECTOR]: ConnectorElement,
            [ELEMENT_TYPES.IMAGE]: ImageElement
        };
        
        // Initialize
        this._initContainer();
    }

    /**
     * Initialize container
     */
    _initContainer() {
        if (this.container) {
            this.container.style.overflow = 'hidden';
            this.container.style.position = 'relative';
        }
    }

    // ==================== Element Management ====================

    /**
     * Create element from type
     * @param {string} type - Element type
     * @param {Object} data - Element data
     * @returns {BaseElement}
     */
    createElement(type, data = {}) {
        const ElementClass = this.elementClasses[type];
        if (!ElementClass) {
            console.error(`Unknown element type: ${type}`);
            return null;
        }
        
        return new ElementClass({
            ...data,
            id: data.id || generateId()
        });
    }

    /**
     * Add element to canvas
     * @param {BaseElement} element
     * @param {boolean} recordHistory
     */
    addElement(element, recordHistory = true) {
        if (!element) return;
        
        this.elements.set(element.id, element);
        this.elementOrder.push(element.id);
        
        // Ensure proper z-index
        element.zIndex = this.elementOrder.length;
        
        if (recordHistory) {
            this._recordHistory(ACTION_TYPES.CREATE_ELEMENT);
        }
        
        this._notifyElementsChange();
    }

    /**
     * Remove element
     * @param {string} elementId
     * @param {boolean} recordHistory
     */
    removeElement(elementId, recordHistory = true) {
        const element = this.elements.get(elementId);
        if (!element) return;
        
        this.elements.delete(elementId);
        this.elementOrder = this.elementOrder.filter(id => id !== elementId);
        this.selectedIds.delete(elementId);
        
        // Remove from any frames
        this.elements.forEach(el => {
            if (el.type === ELEMENT_TYPES.FRAME && el.containsElement) {
                el.removeElement(elementId);
            }
        });
        
        if (recordHistory) {
            this._recordHistory(ACTION_TYPES.DELETE_ELEMENT);
        }
        
        this._notifyElementsChange();
        this._notifySelectionChange();
    }

    /**
     * Remove multiple elements
     * @param {Array} elementIds
     */
    removeElements(elementIds) {
        if (!elementIds.length) return;
        
        this.history.startBatch();
        
        for (const id of elementIds) {
            this.removeElement(id, false);
        }
        
        this.history.endBatch(this._getStateSnapshot(), ACTION_TYPES.DELETE_ELEMENTS);
        this._notifyElementsChange();
    }

    /**
     * Get element by ID
     * @param {string} elementId
     * @returns {BaseElement|null}
     */
    getElement(elementId) {
        return this.elements.get(elementId) || null;
    }

    /**
     * Get all elements
     * @returns {Array}
     */
    getAllElements() {
        return this.elementOrder.map(id => this.elements.get(id)).filter(Boolean);
    }

    /**
     * Get elements map
     * @returns {Object}
     */
    getElementsMap() {
        const map = {};
        this.elements.forEach((el, id) => {
            map[id] = el;
        });
        return map;
    }

    /**
     * Update element
     * @param {string} elementId
     * @param {Object} updates
     * @param {boolean} recordHistory
     */
    updateElement(elementId, updates, recordHistory = true) {
        const element = this.elements.get(elementId);
        if (!element) return;
        
        // Apply updates
        Object.entries(updates).forEach(([key, value]) => {
            if (key === 'style' && typeof value === 'object') {
                element.setStyles(value);
            } else if (key === 'properties' && typeof value === 'object') {
                Object.entries(value).forEach(([prop, val]) => {
                    element.setProperty(prop, val);
                });
            } else if (typeof element[key] !== 'undefined') {
                element[key] = value;
            }
        });
        
        element._isDirty = true;
        
        if (recordHistory) {
            this._recordHistory(ACTION_TYPES.CHANGE_STYLE);
        }
        
        this._notifyElementsChange();
    }

    // ==================== Selection Management ====================

    /**
     * Select element
     * @param {string} elementId
     * @param {boolean} addToSelection
     */
    selectElement(elementId, addToSelection = false) {
        if (!addToSelection) {
            this.selectedIds.clear();
        }
        
        if (elementId && this.elements.has(elementId)) {
            this.selectedIds.add(elementId);
            const element = this.elements.get(elementId);
            element.onSelect();
        }
        
        this._notifySelectionChange();
    }

    /**
     * Deselect element
     * @param {string} elementId
     */
    deselectElement(elementId) {
        if (this.selectedIds.has(elementId)) {
            this.selectedIds.delete(elementId);
            const element = this.elements.get(elementId);
            if (element) element.onDeselect();
        }
        
        this._notifySelectionChange();
    }

    /**
     * Clear selection
     */
    clearSelection() {
        this.selectedIds.forEach(id => {
            const element = this.elements.get(id);
            if (element) element.onDeselect();
        });
        this.selectedIds.clear();
        this._notifySelectionChange();
    }

    /**
     * Select all elements
     */
    selectAll() {
        this.elements.forEach((element, id) => {
            this.selectedIds.add(id);
            element.onSelect();
        });
        this._notifySelectionChange();
    }

    /**
     * Select elements within rectangle
     * @param {Object} rect - Selection rectangle in canvas coordinates
     */
    selectInRect(rect) {
        this.clearSelection();
        
        this.elements.forEach((element, id) => {
            if (element.intersects(rect)) {
                this.selectedIds.add(id);
                element.onSelect();
            }
        });
        
        this._notifySelectionChange();
    }

    /**
     * Get selected elements
     * @returns {Array}
     */
    getSelectedElements() {
        return Array.from(this.selectedIds)
            .map(id => this.elements.get(id))
            .filter(Boolean);
    }

    /**
     * Check if element is selected
     * @param {string} elementId
     * @returns {boolean}
     */
    isSelected(elementId) {
        return this.selectedIds.has(elementId);
    }

    /**
     * Get selection count
     * @returns {number}
     */
    getSelectionCount() {
        return this.selectedIds.size;
    }

    // ==================== Transform / Zoom ====================

    /**
     * Set zoom level
     * @param {number} zoom
     * @param {Object} center - Center point for zooming
     */
    setZoom(zoom, center = null) {
        const oldZoom = this.transform.zoom;
        const newZoom = clamp(zoom, this.options.minZoom, this.options.maxZoom);
        
        if (center) {
            // Zoom towards center point
            const scale = newZoom / oldZoom;
            this.transform.panX = center.x - (center.x - this.transform.panX) * scale;
            this.transform.panY = center.y - (center.y - this.transform.panY) * scale;
        }
        
        this.transform.zoom = newZoom;
        this._notifyTransformChange();
    }

    /**
     * Zoom in
     * @param {Object} center
     */
    zoomIn(center = null) {
        this.setZoom(this.transform.zoom + CANVAS_CONFIG.ZOOM_STEP, center);
    }

    /**
     * Zoom out
     * @param {Object} center
     */
    zoomOut(center = null) {
        this.setZoom(this.transform.zoom - CANVAS_CONFIG.ZOOM_STEP, center);
    }

    /**
     * Reset zoom to 100%
     */
    resetZoom() {
        this.setZoom(1);
    }

    /**
     * Fit content to view
     */
    fitToContent() {
        if (this.elements.size === 0) {
            this.resetZoom();
            this.transform.panX = 0;
            this.transform.panY = 0;
            this._notifyTransformChange();
            return;
        }
        
        // Get bounding box of all elements
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        this.elements.forEach(element => {
            const bounds = element.getBounds();
            minX = Math.min(minX, bounds.x);
            minY = Math.min(minY, bounds.y);
            maxX = Math.max(maxX, bounds.x + bounds.width);
            maxY = Math.max(maxY, bounds.y + bounds.height);
        });
        
        const contentWidth = maxX - minX;
        const contentHeight = maxY - minY;
        const padding = 50;
        
        if (!this.container) return;
        
        const containerWidth = this.container.clientWidth;
        const containerHeight = this.container.clientHeight;
        
        const scaleX = (containerWidth - padding * 2) / contentWidth;
        const scaleY = (containerHeight - padding * 2) / contentHeight;
        const scale = Math.min(scaleX, scaleY, 1);
        
        this.transform.zoom = clamp(scale, this.options.minZoom, this.options.maxZoom);
        this.transform.panX = (containerWidth - contentWidth * this.transform.zoom) / 2 - minX * this.transform.zoom;
        this.transform.panY = (containerHeight - contentHeight * this.transform.zoom) / 2 - minY * this.transform.zoom;
        
        this._notifyTransformChange();
    }

    /**
     * Pan the canvas
     * @param {number} dx
     * @param {number} dy
     */
    pan(dx, dy) {
        this.transform.panX += dx;
        this.transform.panY += dy;
        this._notifyTransformChange();
    }

    /**
     * Set pan position
     * @param {number} x
     * @param {number} y
     */
    setPan(x, y) {
        this.transform.panX = x;
        this.transform.panY = y;
        this._notifyTransformChange();
    }

    /**
     * Get current transform
     * @returns {Object}
     */
    getTransform() {
        return { ...this.transform };
    }

    /**
     * Convert screen coordinates to canvas coordinates
     * @param {number} screenX
     * @param {number} screenY
     * @returns {Object}
     */
    screenToCanvas(screenX, screenY) {
        return screenToCanvas({ x: screenX, y: screenY }, this.transform);
    }

    /**
     * Convert canvas coordinates to screen coordinates
     * @param {number} canvasX
     * @param {number} canvasY
     * @returns {Object}
     */
    canvasToScreen(canvasX, canvasY) {
        return canvasToScreen({ x: canvasX, y: canvasY }, this.transform);
    }

    // ==================== Z-Order Management ====================

    /**
     * Bring element forward
     * @param {string} elementId
     */
    bringForward(elementId) {
        const index = this.elementOrder.indexOf(elementId);
        if (index < this.elementOrder.length - 1) {
            this.elementOrder.splice(index, 1);
            this.elementOrder.splice(index + 1, 0, elementId);
            this._updateZIndices();
            this._recordHistory(ACTION_TYPES.BRING_FORWARD);
            this._notifyElementsChange();
        }
    }

    /**
     * Send element backward
     * @param {string} elementId
     */
    sendBackward(elementId) {
        const index = this.elementOrder.indexOf(elementId);
        if (index > 0) {
            this.elementOrder.splice(index, 1);
            this.elementOrder.splice(index - 1, 0, elementId);
            this._updateZIndices();
            this._recordHistory(ACTION_TYPES.SEND_BACKWARD);
            this._notifyElementsChange();
        }
    }

    /**
     * Bring element to front
     * @param {string} elementId
     */
    bringToFront(elementId) {
        const index = this.elementOrder.indexOf(elementId);
        if (index < this.elementOrder.length - 1) {
            this.elementOrder.splice(index, 1);
            this.elementOrder.push(elementId);
            this._updateZIndices();
            this._recordHistory(ACTION_TYPES.BRING_TO_FRONT);
            this._notifyElementsChange();
        }
    }

    /**
     * Send element to back
     * @param {string} elementId
     */
    sendToBack(elementId) {
        const index = this.elementOrder.indexOf(elementId);
        if (index > 0) {
            this.elementOrder.splice(index, 1);
            this.elementOrder.unshift(elementId);
            this._updateZIndices();
            this._recordHistory(ACTION_TYPES.SEND_TO_BACK);
            this._notifyElementsChange();
        }
    }

    /**
     * Update z-indices based on order
     */
    _updateZIndices() {
        this.elementOrder.forEach((id, index) => {
            const element = this.elements.get(id);
            if (element) {
                element.zIndex = index;
                element._isDirty = true;
            }
        });
    }

    // ==================== Clipboard Operations ====================

    /**
     * Copy selected elements
     */
    copy() {
        this.clipboard = this.getSelectedElements().map(el => el.toJSON());
    }

    /**
     * Cut selected elements
     */
    cut() {
        this.copy();
        this.deleteSelected();
    }

    /**
     * Paste elements
     * @param {number} offsetX
     * @param {number} offsetY
     */
    paste(offsetX = 20, offsetY = 20) {
        if (this.clipboard.length === 0) return;
        
        this.clearSelection();
        this.history.startBatch();
        
        const newElements = [];
        
        for (const data of this.clipboard) {
            const element = this.createElement(data.type, {
                ...data,
                id: generateId(),
                x: data.x + offsetX,
                y: data.y + offsetY
            });
            
            if (element) {
                this.addElement(element, false);
                this.selectedIds.add(element.id);
                newElements.push(element);
            }
        }
        
        this.history.endBatch(this._getStateSnapshot(), ACTION_TYPES.PASTE_ELEMENTS);
        this._notifyElementsChange();
        this._notifySelectionChange();
        
        return newElements;
    }

    /**
     * Duplicate selected elements
     */
    duplicate() {
        const selected = this.getSelectedElements();
        if (selected.length === 0) return;
        
        this.clearSelection();
        this.history.startBatch();
        
        for (const element of selected) {
            const clone = element.cloneWithOffset(20, 20);
            this.addElement(clone, false);
            this.selectedIds.add(clone.id);
        }
        
        this.history.endBatch(this._getStateSnapshot(), ACTION_TYPES.DUPLICATE_ELEMENTS);
        this._notifyElementsChange();
        this._notifySelectionChange();
    }

    /**
     * Delete selected elements
     */
    deleteSelected() {
        const ids = Array.from(this.selectedIds);
        if (ids.length === 0) return;
        
        this.removeElements(ids);
    }

    // ==================== History ====================

    /**
     * Undo last action
     */
    undo() {
        const state = this.history.undo();
        if (state) {
            this._restoreState(state);
            this._notifyHistoryChange();
        }
    }

    /**
     * Redo last undone action
     */
    redo() {
        const state = this.history.redo();
        if (state) {
            this._restoreState(state);
            this._notifyHistoryChange();
        }
    }

    /**
     * Check if can undo
     * @returns {boolean}
     */
    canUndo() {
        return this.history.canUndo();
    }

    /**
     * Check if can redo
     * @returns {boolean}
     */
    canRedo() {
        return this.history.canRedo();
    }

    /**
     * Record current state to history
     * @param {string} action
     */
    _recordHistory(action) {
        this.history.push(this._getStateSnapshot(), action);
        this._notifyHistoryChange();
    }

    /**
     * Get current state snapshot
     * @returns {Object}
     */
    _getStateSnapshot() {
        return {
            elements: this.getAllElements().map(el => el.toJSON()),
            elementOrder: [...this.elementOrder],
            selectedIds: Array.from(this.selectedIds)
        };
    }

    /**
     * Restore state from snapshot
     * @param {Object} state
     */
    _restoreState(state) {
        // Clear current elements
        this.elements.clear();
        this.elementOrder = [];
        this.selectedIds.clear();
        
        // Restore elements
        for (const data of state.elements) {
            const element = this.createElement(data.type, data);
            if (element) {
                this.elements.set(element.id, element);
            }
        }
        
        // Restore order
        this.elementOrder = state.elementOrder.filter(id => this.elements.has(id));
        
        // Restore selection
        for (const id of state.selectedIds) {
            if (this.elements.has(id)) {
                this.selectedIds.add(id);
            }
        }
        
        this._notifyElementsChange();
        this._notifySelectionChange();
    }

    // ==================== Serialization ====================

    /**
     * Export board data
     * @returns {Object}
     */
    exportData() {
        return {
            elements: this.getAllElements().map(el => el.toJSON()),
            elementOrder: [...this.elementOrder],
            transform: { ...this.transform },
            version: '2.0'
        };
    }

    /**
     * Import board data
     * @param {Object} data
     */
    importData(data) {
        this.clearSelection();
        this.elements.clear();
        this.elementOrder = [];
        
        if (data.elements) {
            for (const elementData of data.elements) {
                const element = this.createElement(elementData.type, elementData);
                if (element) {
                    this.elements.set(element.id, element);
                }
            }
        }
        
        if (data.elementOrder) {
            this.elementOrder = data.elementOrder.filter(id => this.elements.has(id));
        } else {
            this.elementOrder = Array.from(this.elements.keys());
        }
        
        if (data.transform) {
            this.transform = { ...this.transform, ...data.transform };
        }
        
        // Clear history after import
        this.history.clear();
        this._recordHistory('Import');
        
        this._notifyElementsChange();
        this._notifyTransformChange();
    }

    /**
     * Clear all elements
     */
    clearBoard() {
        this.clearSelection();
        this.elements.clear();
        this.elementOrder = [];
        this._recordHistory(ACTION_TYPES.CLEAR_BOARD);
        this._notifyElementsChange();
    }

    // ==================== Event Callbacks ====================

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
     * Remove callback
     * @param {string} event
     */
    off(event) {
        if (this.callbacks.hasOwnProperty(event)) {
            this.callbacks[event] = null;
        }
    }

    _notifyElementsChange() {
        if (this.callbacks.onElementsChange) {
            this.callbacks.onElementsChange(this.getAllElements());
        }
    }

    _notifySelectionChange() {
        if (this.callbacks.onSelectionChange) {
            this.callbacks.onSelectionChange(this.getSelectedElements(), this.selectedIds);
        }
    }

    _notifyTransformChange() {
        if (this.callbacks.onTransformChange) {
            this.callbacks.onTransformChange(this.transform);
        }
    }

    _notifyHistoryChange() {
        if (this.callbacks.onHistoryChange) {
            this.callbacks.onHistoryChange(this.history.getInfo());
        }
    }

    // ==================== Cleanup ====================

    /**
     * Destroy canvas
     */
    destroy() {
        this.elements.clear();
        this.elementOrder = [];
        this.selectedIds.clear();
        this.clipboard = [];
        this.history.clear();
        this.callbacks = {};
    }
}

export default CanvasCore;