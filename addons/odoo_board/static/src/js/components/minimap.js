/** @odoo-module **/

import { ELEMENT_TYPES } from '../utils/constants';

/**
 * Minimap Component
 * Shows an overview of the canvas and allows quick navigation
 */
export class Minimap {
    constructor(containerEl, canvasCore) {
        this.container = containerEl;
        this.canvas = canvasCore;
        
        // Minimap dimensions
        this.width = 200;
        this.height = 140;
        
        // Calculated bounds
        this.contentBounds = null;
        this.scale = 1;
        
        // DOM elements
        this.minimapEl = null;
        this.canvasEl = null;
        this.viewportEl = null;
        
        // Drag state
        this.isDragging = false;
        
        this._init();
    }

    /**
     * Initialize minimap
     */
    _init() {
        this._createDOM();
        this._attachEventListeners();
    }

    /**
     * Create DOM structure
     */
    _createDOM() {
        if (!this.container) return;
        
        this.minimapEl = document.createElement('div');
        this.minimapEl.className = 'wb-minimap';
        this.minimapEl.innerHTML = `
            <canvas class="wb-minimap-canvas" width="${this.width}" height="${this.height}"></canvas>
            <div class="wb-minimap-viewport"></div>
        `;
        
        this.container.appendChild(this.minimapEl);
        
        this.canvasEl = this.minimapEl.querySelector('canvas');
        this.viewportEl = this.minimapEl.querySelector('.wb-minimap-viewport');
        this.ctx = this.canvasEl.getContext('2d');
    }

    /**
     * Attach event listeners
     */
    _attachEventListeners() {
        if (!this.minimapEl) return;
        
        // Click to navigate
        this.minimapEl.addEventListener('mousedown', this._onMouseDown.bind(this));
        document.addEventListener('mousemove', this._onMouseMove.bind(this));
        document.addEventListener('mouseup', this._onMouseUp.bind(this));
        
        // Prevent context menu
        this.minimapEl.addEventListener('contextmenu', e => e.preventDefault());
    }

    /**
     * Handle mouse down
     */
    _onMouseDown(e) {
        if (e.button !== 0) return;
        
        this.isDragging = true;
        this._navigateToPoint(e);
        e.preventDefault();
    }

    /**
     * Handle mouse move
     */
    _onMouseMove(e) {
        if (!this.isDragging) return;
        this._navigateToPoint(e);
    }

    /**
     * Handle mouse up
     */
    _onMouseUp() {
        this.isDragging = false;
    }

    /**
     * Navigate canvas to clicked point on minimap
     */
    _navigateToPoint(e) {
        if (!this.contentBounds || !this.canvas) return;
        
        const rect = this.minimapEl.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Convert minimap coordinates to canvas coordinates
        const canvasX = this.contentBounds.minX + (x / this.scale);
        const canvasY = this.contentBounds.minY + (y / this.scale);
        
        // Get container dimensions
        const container = this.canvas.container;
        if (!container) return;
        
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const zoom = this.canvas.transform.zoom;
        
        // Calculate pan to center viewport on clicked point
        const panX = containerWidth / 2 - canvasX * zoom;
        const panY = containerHeight / 2 - canvasY * zoom;
        
        this.canvas.setPan(panX, panY);
    }

    /**
     * Update minimap
     */
    update() {
        if (!this.canvas || !this.ctx) return;
        
        const elements = this.canvas.getAllElements();
        
        // Calculate content bounds
        this._calculateBounds(elements);
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Fill background
        this.ctx.fillStyle = '#f8fafc';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw elements
        this._drawElements(elements);
        
        // Update viewport indicator
        this._updateViewport();
    }

    /**
     * Calculate content bounds
     */
    _calculateBounds(elements) {
        if (elements.length === 0) {
            this.contentBounds = {
                minX: 0,
                minY: 0,
                maxX: 1000,
                maxY: 700,
                width: 1000,
                height: 700
            };
        } else {
            let minX = Infinity, minY = Infinity;
            let maxX = -Infinity, maxY = -Infinity;
            
            for (const el of elements) {
                const bounds = el.getBounds();
                minX = Math.min(minX, bounds.x);
                minY = Math.min(minY, bounds.y);
                maxX = Math.max(maxX, bounds.x + bounds.width);
                maxY = Math.max(maxY, bounds.y + bounds.height);
            }
            
            // Add padding
            const padding = 100;
            minX -= padding;
            minY -= padding;
            maxX += padding;
            maxY += padding;
            
            this.contentBounds = {
                minX, minY, maxX, maxY,
                width: maxX - minX,
                height: maxY - minY
            };
        }
        
        // Calculate scale to fit content in minimap
        const scaleX = this.width / this.contentBounds.width;
        const scaleY = this.height / this.contentBounds.height;
        this.scale = Math.min(scaleX, scaleY);
    }

    /**
     * Draw elements on minimap
     */
    _drawElements(elements) {
        if (!this.contentBounds) return;
        
        const { minX, minY } = this.contentBounds;
        
        for (const element of elements) {
            if (!element.visible) continue;
            
            const bounds = element.getBounds();
            const x = (bounds.x - minX) * this.scale;
            const y = (bounds.y - minY) * this.scale;
            const w = Math.max(2, bounds.width * this.scale);
            const h = Math.max(2, bounds.height * this.scale);
            
            // Different colors for different element types
            switch (element.type) {
                case ELEMENT_TYPES.STICKY:
                    this.ctx.fillStyle = element.style.backgroundColor || '#fef3c7';
                    break;
                case ELEMENT_TYPES.FRAME:
                    this.ctx.fillStyle = 'transparent';
                    this.ctx.strokeStyle = '#94a3b8';
                    this.ctx.lineWidth = 1;
                    this.ctx.setLineDash([2, 2]);
                    this.ctx.strokeRect(x, y, w, h);
                    this.ctx.setLineDash([]);
                    continue;
                case ELEMENT_TYPES.SHAPE:
                    this.ctx.fillStyle = element.style.fill || '#e2e8f0';
                    break;
                case ELEMENT_TYPES.TEXT:
                    this.ctx.fillStyle = '#94a3b8';
                    break;
                case ELEMENT_TYPES.IMAGE:
                    this.ctx.fillStyle = '#cbd5e1';
                    break;
                case ELEMENT_TYPES.CONNECTOR:
                    // Draw as line
                    const start = element.properties.startPoint;
                    const end = element.properties.endPoint;
                    if (start && end) {
                        this.ctx.beginPath();
                        this.ctx.moveTo(
                            (start.x - minX) * this.scale,
                            (start.y - minY) * this.scale
                        );
                        this.ctx.lineTo(
                            (end.x - minX) * this.scale,
                            (end.y - minY) * this.scale
                        );
                        this.ctx.strokeStyle = element.style.color || '#64748b';
                        this.ctx.lineWidth = 1;
                        this.ctx.stroke();
                    }
                    continue;
                default:
                    this.ctx.fillStyle = '#e2e8f0';
            }
            
            // Draw rectangle for most elements
            if (element.type === ELEMENT_TYPES.SHAPE && 
                element.properties.shapeType === 'circle') {
                this.ctx.beginPath();
                this.ctx.ellipse(
                    x + w / 2, y + h / 2,
                    w / 2, h / 2,
                    0, 0, Math.PI * 2
                );
                this.ctx.fill();
            } else {
                this.ctx.fillRect(x, y, w, h);
            }
        }
    }

    /**
     * Update viewport indicator
     */
    _updateViewport() {
        if (!this.viewportEl || !this.canvas || !this.contentBounds) return;
        
        const container = this.canvas.container;
        if (!container) return;
        
        const transform = this.canvas.getTransform();
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // Calculate visible area in canvas coordinates
        const visibleLeft = -transform.panX / transform.zoom;
        const visibleTop = -transform.panY / transform.zoom;
        const visibleWidth = containerWidth / transform.zoom;
        const visibleHeight = containerHeight / transform.zoom;
        
        // Convert to minimap coordinates
        const { minX, minY } = this.contentBounds;
        const x = (visibleLeft - minX) * this.scale;
        const y = (visibleTop - minY) * this.scale;
        const w = visibleWidth * this.scale;
        const h = visibleHeight * this.scale;
        
        // Clamp to minimap bounds
        const clampedX = Math.max(0, Math.min(this.width - 10, x));
        const clampedY = Math.max(0, Math.min(this.height - 10, y));
        const clampedW = Math.min(this.width - clampedX, Math.max(10, w));
        const clampedH = Math.min(this.height - clampedY, Math.max(10, h));
        
        this.viewportEl.style.left = `${clampedX}px`;
        this.viewportEl.style.top = `${clampedY}px`;
        this.viewportEl.style.width = `${clampedW}px`;
        this.viewportEl.style.height = `${clampedH}px`;
    }

    /**
     * Show minimap
     */
    show() {
        if (this.minimapEl) {
            this.minimapEl.style.display = 'block';
        }
    }

    /**
     * Hide minimap
     */
    hide() {
        if (this.minimapEl) {
            this.minimapEl.style.display = 'none';
        }
    }

    /**
     * Toggle visibility
     */
    toggle() {
        if (this.minimapEl) {
            const isVisible = this.minimapEl.style.display !== 'none';
            this.minimapEl.style.display = isVisible ? 'none' : 'block';
        }
    }

    /**
     * Destroy minimap
     */
    destroy() {
        if (this.minimapEl) {
            this.minimapEl.remove();
        }
        
        document.removeEventListener('mousemove', this._onMouseMove);
        document.removeEventListener('mouseup', this._onMouseUp);
    }
}

export default Minimap;