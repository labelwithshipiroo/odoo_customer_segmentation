/** @odoo-module **/

import { ELEMENT_TYPES } from '../utils/constants';

/**
 * Canvas Renderer
 * Handles rendering of all canvas elements and UI
 * Optimized for Miro-like smooth performance with GPU acceleration
 */
export class CanvasRenderer {
    constructor(canvasCore, containerEl) {
        this.canvas = canvasCore;
        this.container = containerEl;
        
        // DOM elements
        this.canvasWrapper = null;
        this.canvasElement = null;
        this.gridElement = null;
        this.svgLayer = null;
        this.elementsLayer = null;
        this.selectionRectEl = null;
        
        // Element DOM cache for fast access
        this._elementDOMCache = new Map();
        
        // Animation frame
        this.rafId = null;
        this.needsRender = true;
        
        // Drag/resize state for GPU-accelerated updates
        this._dragTransforms = new Map();
        this._resizeState = null;
        
        // Initialize
        this._initDOM();
    }

    /**
     * Initialize DOM structure
     */
    _initDOM() {
        if (!this.container) return;
        
        // Clear existing content
        this.container.innerHTML = '';
        
        // Create wrapper
        this.canvasWrapper = document.createElement('div');
        this.canvasWrapper.className = 'wb-canvas-wrapper';
        this.container.appendChild(this.canvasWrapper);
        
        // Create grid background
        this.gridElement = document.createElement('div');
        this.gridElement.className = 'wb-canvas-grid';
        this.canvasWrapper.appendChild(this.gridElement);
        
        // Create main canvas element
        this.canvasElement = document.createElement('div');
        this.canvasElement.className = 'wb-canvas';
        this.canvasWrapper.appendChild(this.canvasElement);
        
        // Create SVG layer for connectors
        this.svgLayer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svgLayer.setAttribute('class', 'wb-svg-canvas');
        this.svgLayer.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible;';
        this.canvasElement.appendChild(this.svgLayer);
        
        // Create elements layer
        this.elementsLayer = document.createElement('div');
        this.elementsLayer.className = 'wb-elements-layer';
        this.elementsLayer.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%;';
        this.canvasElement.appendChild(this.elementsLayer);
        
        // Create selection rectangle
        this.selectionRectEl = document.createElement('div');
        this.selectionRectEl.className = 'wb-selection-rect';
        this.selectionRectEl.style.display = 'none';
        this.canvasWrapper.appendChild(this.selectionRectEl);
    }

    /**
     * Start render loop
     */
    startRenderLoop() {
        const renderFrame = () => {
            if (this.needsRender) {
                this.render();
                this.needsRender = false;
            }
            this.rafId = requestAnimationFrame(renderFrame);
        };
        
        this.rafId = requestAnimationFrame(renderFrame);
    }

    /**
     * Stop render loop
     */
    stopRenderLoop() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    /**
     * Request a render
     */
    requestRender() {
        this.needsRender = true;
    }

    /**
     * Force immediate render
     */
    forceRender() {
        this.render();
    }

    /**
     * Main render function
     */
    render() {
        if (!this.canvas || !this.canvasElement) return;
        
        const transform = this.canvas.getTransform();
        
        // Update canvas transform using GPU-accelerated properties
        this.canvasElement.style.transform = `translate3d(${transform.panX}px, ${transform.panY}px, 0) scale(${transform.zoom})`;
        
        // Update grid
        this._renderGrid(transform);
        
        // Render elements
        this._renderElements();
    }

    // ==================== GPU-Accelerated Drag/Resize ====================

    /**
     * Handle drag updates with GPU-accelerated transforms
     * Called from canvas_interactions via callback
     * @param {string} elementId
     * @param {string} action - 'start', 'move', or 'end'
     * @param {Object} offset - {x, y} offset
     */
    handleDragUpdate(elementId, action, offset) {
        const domEl = this._getElementDOMCached(elementId);
        if (!domEl) return;
        
        switch (action) {
            case 'start':
                // Prepare element for GPU-accelerated dragging
                domEl.classList.add('wb-dragging');
                domEl.style.willChange = 'transform';
                // Disable transitions during drag
                domEl.style.transition = 'none';
                this._dragTransforms.set(elementId, { x: 0, y: 0 });
                break;
                
            case 'move':
                // Apply transform offset (GPU accelerated)
                this._dragTransforms.set(elementId, offset);
                const element = this.canvas.getElement(elementId);
                if (element) {
                    const rotation = element.rotation || 0;
                    // Use translate3d for GPU acceleration
                    domEl.style.transform = `translate3d(${offset.x}px, ${offset.y}px, 0) rotate(${rotation}deg)`;
                }
                break;
                
            case 'end':
                // Clear GPU optimization hints
                domEl.classList.remove('wb-dragging');
                domEl.style.willChange = '';
                domEl.style.transition = '';
                domEl.style.transform = '';
                this._dragTransforms.delete(elementId);
                // Force re-render to update position
                this.requestRender();
                break;
        }
    }

    /**
     * Handle resize updates with optimized rendering
     * @param {string} elementId
     * @param {string} action - 'start', 'resize', or 'end'
     * @param {Object} bounds - {x, y, width, height}
     */
    handleResizeUpdate(elementId, action, bounds) {
        const domEl = this._getElementDOMCached(elementId);
        if (!domEl) return;
        
        switch (action) {
            case 'start':
                domEl.classList.add('wb-resizing');
                domEl.style.willChange = 'transform, width, height';
                domEl.style.transition = 'none';
                this._resizeState = { elementId, originalBounds: { ...bounds } };
                break;
                
            case 'resize':
                // Apply resize using transforms for smooth updates
                const original = this._resizeState?.originalBounds;
                if (original) {
                    const element = this.canvas.getElement(elementId);
                    const rotation = element?.rotation || 0;
                    
                    // Calculate scale and translation
                    const scaleX = bounds.width / original.width;
                    const scaleY = bounds.height / original.height;
                    const translateX = bounds.x - original.x;
                    const translateY = bounds.y - original.y;
                    
                    // Use transform for GPU-accelerated resize preview
                    domEl.style.transformOrigin = 'top left';
                    domEl.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${scaleX}, ${scaleY}) rotate(${rotation}deg)`;
                }
                break;
                
            case 'end':
                domEl.classList.remove('wb-resizing');
                domEl.style.willChange = '';
                domEl.style.transition = '';
                domEl.style.transform = '';
                domEl.style.transformOrigin = '';
                this._resizeState = null;
                // Force re-render with actual dimensions
                this.requestRender();
                break;
        }
    }

    /**
     * Get cached DOM element for element ID
     * @param {string} elementId
     * @returns {HTMLElement|null}
     */
    _getElementDOMCached(elementId) {
        let domEl = this._elementDOMCache.get(elementId);
        if (!domEl || !domEl.isConnected) {
            domEl = this.elementsLayer?.querySelector(`[data-id="${elementId}"]`);
            if (domEl) {
                this._elementDOMCache.set(elementId, domEl);
            }
        }
        return domEl;
    }

    /**
     * Clear DOM cache for element
     * @param {string} elementId
     */
    clearElementCache(elementId) {
        this._elementDOMCache.delete(elementId);
    }

    /**
     * Render grid background
     * @param {Object} transform
     */
    _renderGrid(transform) {
        const gridSize = 20 * transform.zoom;
        const offsetX = transform.panX % gridSize;
        const offsetY = transform.panY % gridSize;
        
        this.gridElement.style.backgroundSize = `${gridSize}px ${gridSize}px`;
        this.gridElement.style.backgroundPosition = `${offsetX}px ${offsetY}px`;
        this.gridElement.style.opacity = transform.zoom > 0.3 ? 0.8 : 0.3;
    }

    /**
     * Render all elements
     */
    _renderElements() {
        const elements = this.canvas.getAllElements();
        const selectedIds = this.canvas.selectedIds;
        
        // Separate connectors from other elements
        const connectors = elements.filter(el => el.type === ELEMENT_TYPES.CONNECTOR);
        const otherElements = elements.filter(el => el.type !== ELEMENT_TYPES.CONNECTOR);
        
        // Render connectors in SVG layer
        this._renderConnectors(connectors, selectedIds);
        
        // Render other elements
        this._renderRegularElements(otherElements, selectedIds);
    }

    /**
     * Render connectors in SVG
     * @param {Array} connectors
     * @param {Set} selectedIds
     */
    _renderConnectors(connectors, selectedIds) {
        // Clear SVG layer
        this.svgLayer.innerHTML = '';
        
        // Add defs for markers
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        this.svgLayer.appendChild(defs);
        
        for (const connector of connectors) {
            if (!connector.visible) continue;
            
            const isSelected = selectedIds.has(connector.id);
            const { startPoint, endPoint, connectorType, startEnd, endEnd } = connector.properties;
            const { color, strokeWidth, strokeStyle } = connector.style;
            
            // Create group for connector
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('class', `wb-connector ${isSelected ? 'selected' : ''}`);
            g.setAttribute('data-id', connector.id);
            
            // Generate path
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', this._getConnectorPath(startPoint, endPoint, connectorType));
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', isSelected ? '#2563eb' : color);
            path.setAttribute('stroke-width', strokeWidth);
            
            if (strokeStyle === 'dashed') {
                path.setAttribute('stroke-dasharray', '8,4');
            } else if (strokeStyle === 'dotted') {
                path.setAttribute('stroke-dasharray', '2,4');
            }
            
            // Add arrow markers
            const markerId = `marker-${connector.id}`;
            
            if (startEnd !== 'none') {
                const marker = this._createMarker(markerId + '-start', startEnd, isSelected ? '#2563eb' : color, true);
                defs.appendChild(marker);
                path.setAttribute('marker-start', `url(#${markerId}-start)`);
            }
            
            if (endEnd !== 'none') {
                const marker = this._createMarker(markerId + '-end', endEnd, isSelected ? '#2563eb' : color, false);
                defs.appendChild(marker);
                path.setAttribute('marker-end', `url(#${markerId}-end)`);
            }
            
            g.appendChild(path);
            
            // Add endpoint handles if selected
            if (isSelected) {
                g.appendChild(this._createEndpointHandle(startPoint, 'start'));
                g.appendChild(this._createEndpointHandle(endPoint, 'end'));
            }
            
            this.svgLayer.appendChild(g);
        }
    }

    /**
     * Get connector path
     */
    _getConnectorPath(start, end, type) {
        if (type === 'straight') {
            return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
        }
        
        if (type === 'elbow') {
            const midX = (start.x + end.x) / 2;
            return `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${end.y} L ${end.x} ${end.y}`;
        }
        
        // Curved
        const dx = Math.abs(end.x - start.x);
        const offset = Math.max(50, dx * 0.3);
        const cp1 = { x: start.x + offset, y: start.y };
        const cp2 = { x: end.x - offset, y: end.y };
        
        return `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;
    }

    /**
     * Create SVG marker for arrows
     */
    _createMarker(id, type, color, isStart) {
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', id);
        marker.setAttribute('markerWidth', '10');
        marker.setAttribute('markerHeight', '10');
        marker.setAttribute('refY', '5');
        marker.setAttribute('orient', 'auto');
        
        if (type === 'arrow') {
            marker.setAttribute('refX', isStart ? '0' : '10');
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', isStart ? 'M 10 0 L 0 5 L 10 10 Z' : 'M 0 0 L 10 5 L 0 10 Z');
            path.setAttribute('fill', color);
            marker.appendChild(path);
        } else if (type === 'dot') {
            marker.setAttribute('refX', '5');
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', '5');
            circle.setAttribute('cy', '5');
            circle.setAttribute('r', '4');
            circle.setAttribute('fill', color);
            marker.appendChild(circle);
        } else if (type === 'diamond') {
            marker.setAttribute('refX', '6');
            marker.setAttribute('markerWidth', '12');
            marker.setAttribute('markerHeight', '12');
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', 'M 6 0 L 12 6 L 6 12 L 0 6 Z');
            path.setAttribute('fill', color);
            marker.appendChild(path);
        }
        
        return marker;
    }

    /**
     * Create endpoint handle
     */
    _createEndpointHandle(point, type) {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', point.x);
        circle.setAttribute('cy', point.y);
        circle.setAttribute('r', '6');
        circle.setAttribute('fill', 'white');
        circle.setAttribute('stroke', '#2563eb');
        circle.setAttribute('stroke-width', '2');
        circle.setAttribute('class', 'wb-connector-endpoint');
        circle.setAttribute('data-endpoint', type);
        circle.style.cursor = 'move';
        circle.style.pointerEvents = 'all';
        return circle;
    }

    /**
     * Render regular elements
     * Optimized to minimize DOM operations and support GPU-accelerated transforms
     * @param {Array} elements
     * @param {Set} selectedIds
     */
    _renderRegularElements(elements, selectedIds) {
        // Create a map of existing DOM elements
        const existingEls = new Map();
        for (const child of this.elementsLayer.children) {
            const id = child.getAttribute('data-id');
            if (id) existingEls.set(id, child);
        }
        
        const renderedIds = new Set();
        
        // Sort by z-index
        elements.sort((a, b) => a.zIndex - b.zIndex);
        
        // Use DocumentFragment for batch DOM insertions
        const fragment = document.createDocumentFragment();
        const toAppend = [];
        
        for (const element of elements) {
            if (!element.visible) continue;
            
            renderedIds.add(element.id);
            const isSelected = selectedIds.has(element.id);
            const isDragging = this._dragTransforms.has(element.id);
            const isResizing = this._resizeState?.elementId === element.id;
            
            let domEl = existingEls.get(element.id);
            
            // Skip re-render during drag/resize - transforms handle visual updates
            if ((isDragging || isResizing) && domEl) {
                // Just update selection state
                domEl.classList.toggle('selected', isSelected);
                continue;
            }
            
            if (!domEl || element.isDirty()) {
                // Create or update element
                const html = element.render();
                
                if (domEl) {
                    // Update existing element
                    const temp = document.createElement('div');
                    temp.innerHTML = html;
                    const newEl = temp.firstElementChild;
                    
                    // Preserve transform if dragging
                    if (isDragging) {
                        const offset = this._dragTransforms.get(element.id);
                        if (offset) {
                            newEl.style.transform = `translate3d(${offset.x}px, ${offset.y}px, 0)`;
                        }
                    }
                    
                    domEl.replaceWith(newEl);
                    domEl = newEl;
                    
                    // Update cache
                    this._elementDOMCache.set(element.id, domEl);
                } else {
                    const temp = document.createElement('div');
                    temp.innerHTML = html;
                    domEl = temp.firstElementChild;
                    toAppend.push(domEl);
                    
                    // Cache the new element
                    this._elementDOMCache.set(element.id, domEl);
                }
                
                element.markClean();
            }
            
            // Update selection state
            if (domEl) {
                domEl.classList.toggle('selected', isSelected);
            }
        }
        
        // Batch append new elements
        if (toAppend.length > 0) {
            toAppend.forEach(el => fragment.appendChild(el));
            this.elementsLayer.appendChild(fragment);
        }
        
        // Remove elements that no longer exist
        existingEls.forEach((el, id) => {
            if (!renderedIds.has(id)) {
                el.remove();
                this._elementDOMCache.delete(id);
            }
        });
    }

    /**
     * Show selection rectangle
     * @param {Object} rect - {x, y, width, height} in canvas coordinates
     */
    showSelectionRect(rect) {
        if (!rect || !this.selectionRectEl) {
            this.hideSelectionRect();
            return;
        }
        
        const transform = this.canvas.getTransform();
        
        // Convert to screen coordinates
        const screenX = rect.x * transform.zoom + transform.panX;
        const screenY = rect.y * transform.zoom + transform.panY;
        const screenWidth = rect.width * transform.zoom;
        const screenHeight = rect.height * transform.zoom;
        
        this.selectionRectEl.style.display = 'block';
        this.selectionRectEl.style.left = `${screenX}px`;
        this.selectionRectEl.style.top = `${screenY}px`;
        this.selectionRectEl.style.width = `${screenWidth}px`;
        this.selectionRectEl.style.height = `${screenHeight}px`;
    }

    /**
     * Hide selection rectangle
     */
    hideSelectionRect() {
        if (this.selectionRectEl) {
            this.selectionRectEl.style.display = 'none';
        }
    }

    /**
     * Get element DOM by ID
     * @param {string} elementId
     * @returns {HTMLElement|null}
     */
    getElementDOM(elementId) {
        return this.elementsLayer?.querySelector(`[data-id="${elementId}"]`) || null;
    }

    /**
     * Focus element for editing
     * @param {string} elementId
     */
    focusElement(elementId) {
        const domEl = this.getElementDOM(elementId);
        if (domEl) {
            const editable = domEl.querySelector('[contenteditable="true"]') ||
                           domEl.querySelector('textarea') ||
                           domEl.querySelector('input');
            if (editable) {
                editable.focus();
                // Select all text
                if (editable.select) {
                    editable.select();
                } else if (window.getSelection) {
                    const range = document.createRange();
                    range.selectNodeContents(editable);
                    const selection = window.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            }
        }
    }

    /**
     * Export canvas as image
     * @param {string} format - 'png' or 'svg'
     * @returns {Promise<string>} Data URL or SVG string
     */
    async exportAsImage(format = 'png') {
        // Get bounds of all elements
        const elements = this.canvas.getAllElements();
        if (elements.length === 0) return null;
        
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        elements.forEach(el => {
            const bounds = el.getBounds();
            minX = Math.min(minX, bounds.x);
            minY = Math.min(minY, bounds.y);
            maxX = Math.max(maxX, bounds.x + bounds.width);
            maxY = Math.max(maxY, bounds.y + bounds.height);
        });
        
        const padding = 50;
        const width = maxX - minX + padding * 2;
        const height = maxY - minY + padding * 2;
        
        if (format === 'svg') {
            return this._exportAsSVG(minX - padding, minY - padding, width, height);
        } else {
            return this._exportAsPNG(minX - padding, minY - padding, width, height);
        }
    }

    /**
     * Export as SVG
     */
    _exportAsSVG(offsetX, offsetY, width, height) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', width);
        svg.setAttribute('height', height);
        svg.setAttribute('viewBox', `${offsetX} ${offsetY} ${width} ${height}`);
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        
        // Add white background
        const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bg.setAttribute('x', offsetX);
        bg.setAttribute('y', offsetY);
        bg.setAttribute('width', width);
        bg.setAttribute('height', height);
        bg.setAttribute('fill', 'white');
        svg.appendChild(bg);
        
        // Clone SVG layer content
        const svgContent = this.svgLayer.cloneNode(true);
        svg.appendChild(svgContent);
        
        // TODO: Convert HTML elements to SVG
        
        return new XMLSerializer().serializeToString(svg);
    }

    /**
     * Export as PNG
     */
    async _exportAsPNG(offsetX, offsetY, width, height) {
        // Use html2canvas or similar library if available
        // For now, return a simple canvas export
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        
        // Note: Full implementation would require html2canvas
        // This is a placeholder
        
        return canvas.toDataURL('image/png');
    }

    /**
     * Cleanup
     */
    destroy() {
        this.stopRenderLoop();
        
        if (this.canvasWrapper) {
            this.canvasWrapper.remove();
        }
        
        this.canvasWrapper = null;
        this.canvasElement = null;
        this.gridElement = null;
        this.svgLayer = null;
        this.elementsLayer = null;
        this.selectionRectEl = null;
        this._elementDOMCache.clear();
        this._dragTransforms.clear();
        this._resizeState = null;
    }
}

export default CanvasRenderer;