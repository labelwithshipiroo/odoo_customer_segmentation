/** @odoo-module **/

import { TOOLS, ELEMENT_TYPES, CANVAS_CONFIG, KEYBOARD_SHORTCUTS, ELEMENT_DEFAULTS } from '../utils/constants';
import { normalizeRect, getBoundingBox, snapToGrid, calculateResize } from '../utils/geometry';

/**
 * Canvas Interactions
 * Handles all mouse, touch, and keyboard interactions
 */
export class CanvasInteractions {
    constructor(canvasCore, containerEl) {
        this.canvas = canvasCore;
        this.container = containerEl;
        
        // Current tool
        this.currentTool = TOOLS.SELECT;
        this.shapeType = 'rectangle';
        
        // Interaction state
        this.state = {
            isPanning: false,
            isDragging: false,
            isResizing: false,
            isRotating: false,
            isSelecting: false,
            isDrawingConnector: false,
            isCreatingElement: false
        };
        
        // Mouse/touch tracking
        this.pointer = {
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            button: 0
        };
        
        // Interaction context
        this.context = {
            targetElement: null,
            resizeHandle: null,
            selectionRect: null,
            connectorStart: null,
            initialPositions: new Map(),
            initialBounds: null
        };
        
        // Key state
        this.keys = {
            shift: false,
            ctrl: false,
            alt: false,
            space: false
        };
        
        // Callbacks
        this.callbacks = {
            onToolChange: null,
            onContextMenu: null,
            onDoubleClick: null,
            onSelectionRectChange: null
        };
        
        // Bind methods
        this._bindMethods();
        
        // Initialize
        this._initEventListeners();
    }

    /**
     * Bind class methods
     */
    _bindMethods() {
        this._onMouseDown = this._onMouseDown.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);
        this._onWheel = this._onWheel.bind(this);
        this._onKeyDown = this._onKeyDown.bind(this);
        this._onKeyUp = this._onKeyUp.bind(this);
        this._onContextMenu = this._onContextMenu.bind(this);
        this._onDoubleClick = this._onDoubleClick.bind(this);
        this._onDragOver = this._onDragOver.bind(this);
        this._onDrop = this._onDrop.bind(this);
    }

    /**
     * Initialize event listeners
     */
    _initEventListeners() {
        console.log('_initEventListeners called, container:', this.container);
        alert('_initEventListeners called! Container: ' + (this.container ? 'EXISTS' : 'NULL'));
        if (!this.container) {
            console.error('Container is null, cannot attach event listeners');
            alert('ERROR: Container is null!');
            return;
        }
        
        console.log('Attaching event listeners to container');
        alert('About to attach mousedown listener');
        // Mouse events
        this.container.addEventListener('mousedown', this._onMouseDown);
        console.log('Attached mousedown listener');
        this.container.addEventListener('mousemove', this._onMouseMove);
        console.log('Attached mousemove listener');
        this.container.addEventListener('mouseup', this._onMouseUp);
        console.log('Attached mouseup listener');
        this.container.addEventListener('mouseleave', this._onMouseUp);
        console.log('Attached mouseleave listener');
        this.container.addEventListener('wheel', this._onWheel, { passive: false });
        console.log('Attached wheel listener');
        this.container.addEventListener('contextmenu', this._onContextMenu);
        console.log('Attached contextmenu listener');
        this.container.addEventListener('dblclick', this._onDoubleClick);
        console.log('Attached dblclick listener');
        
        // Drag and drop for images
        this.container.addEventListener('dragover', this._onDragOver);
        console.log('Attached dragover listener');
        this.container.addEventListener('drop', this._onDrop);
        console.log('Attached drop listener');
        
        // Keyboard events (on document)
        document.addEventListener('keydown', this._onKeyDown);
        console.log('Attached keydown listener');
        document.addEventListener('keyup', this._onKeyUp);
        console.log('Attached keyup listener');
        
        // Touch events
        this.container.addEventListener('touchstart', this._onTouchStart.bind(this), { passive: false });
        console.log('Attached touchstart listener');
        this.container.addEventListener('touchmove', this._onTouchMove.bind(this), { passive: false });
        console.log('Attached touchmove listener');
        this.container.addEventListener('touchend', this._onTouchEnd.bind(this));
        console.log('Attached touchend listener');
        
        console.log('All event listeners attached successfully');
    }

    /**
     * Remove event listeners
     */
    destroy() {
        if (!this.container) return;
        
        this.container.removeEventListener('mousedown', this._onMouseDown);
        this.container.removeEventListener('mousemove', this._onMouseMove);
        this.container.removeEventListener('mouseup', this._onMouseUp);
        this.container.removeEventListener('mouseleave', this._onMouseUp);
        this.container.removeEventListener('wheel', this._onWheel);
        this.container.removeEventListener('contextmenu', this._onContextMenu);
        this.container.removeEventListener('dblclick', this._onDoubleClick);
        this.container.removeEventListener('dragover', this._onDragOver);
        this.container.removeEventListener('drop', this._onDrop);
        
        document.removeEventListener('keydown', this._onKeyDown);
        document.removeEventListener('keyup', this._onKeyUp);
    }

    // ==================== Tool Management ====================

    /**
     * Set current tool
     * @param {string} tool
     * @param {Object} options
     */
    setTool(tool, options = {}) {
        this.currentTool = tool;
        
        if (options.shapeType) {
            this.shapeType = options.shapeType;
        }
        
        // Update cursor
        this._updateCursor();
        
        if (this.callbacks.onToolChange) {
            this.callbacks.onToolChange(tool, options);
        }
    }

    /**
     * Get current tool
     * @returns {string}
     */
    getTool() {
        return this.currentTool;
    }

    /**
     * Update cursor based on tool and state
     */
    _updateCursor() {
        if (!this.container) return;
        
        if (this.state.isPanning || this.currentTool === TOOLS.PAN) {
            this.container.style.cursor = this.state.isPanning ? 'grabbing' : 'grab';
        } else if (this.currentTool === TOOLS.SELECT) {
            this.container.style.cursor = 'default';
        } else if ([TOOLS.STICKY, TOOLS.TEXT, TOOLS.SHAPE, TOOLS.FRAME].includes(this.currentTool)) {
            this.container.style.cursor = 'crosshair';
        } else if (this.currentTool === TOOLS.CONNECTOR) {
            this.container.style.cursor = 'crosshair';
        } else {
            this.container.style.cursor = 'default';
        }
    }

    // ==================== Mouse Events ====================

    /**
     * Handle mouse down
     * @param {MouseEvent} e
     */
    _onMouseDown(e) {
        console.log('_onMouseDown called, button:', e.button, 'target:', e.target);
        const rect = this.container.getBoundingClientRect();
        this.pointer.startX = e.clientX - rect.left;
        this.pointer.startY = e.clientY - rect.top;
        this.pointer.currentX = this.pointer.startX;
        this.pointer.currentY = this.pointer.startY;
        this.pointer.button = e.button;
        
        console.log('Pointer:', this.pointer);
        
        // Middle mouse button or space + left click = pan
        if (e.button === 1 || (this.keys.space && e.button === 0)) {
            console.log('Starting pan (middle mouse or space+left)');
            this._startPan();
            e.preventDefault();
            return;
        }
        
        // Right click handled by context menu
        if (e.button === 2) {
            console.log('Right click, skipping');
            return;
        }
        
        // Left click
        if (e.button === 0) {
            console.log('Left click, calling _handleLeftClick');
            this._handleLeftClick(e);
        }
    }

    /**
     * Handle left click based on tool
     * @param {MouseEvent} e
     */
    _handleLeftClick(e) {
        console.log('_handleLeftClick called, currentTool:', this.currentTool);
        const canvasPoint = this.canvas.screenToCanvas(this.pointer.startX, this.pointer.startY);
        console.log('Canvas point:', canvasPoint);
        
        // Check if clicking on an element
        const target = this._getElementAtPoint(canvasPoint);
        const targetElement = target?.element;
        const hitType = target?.hitType;
        console.log('Target at point:', { targetElement: targetElement?.id, hitType });
        
        switch (this.currentTool) {
            case TOOLS.SELECT:
                console.log('Handling SELECT tool click');
                this._handleSelectToolClick(e, targetElement, hitType, canvasPoint);
                break;
                
            case TOOLS.PAN:
                console.log('Handling PAN tool click');
                this._startPan();
                break;
                
            case TOOLS.STICKY:
                console.log('Handling STICKY tool click');
                this._createElementAtPoint(ELEMENT_TYPES.STICKY, canvasPoint);
                break;
                
            case TOOLS.TEXT:
                console.log('Handling TEXT tool click');
                this._createElementAtPoint(ELEMENT_TYPES.TEXT, canvasPoint);
                break;
                
            case TOOLS.SHAPE:
                console.log('Handling SHAPE tool click with shapeType:', this.shapeType);
                this._createElementAtPoint(ELEMENT_TYPES.SHAPE, canvasPoint, { shapeType: this.shapeType });
                break;
                
            case TOOLS.FRAME:
                console.log('Handling FRAME tool click');
                this._createElementAtPoint(ELEMENT_TYPES.FRAME, canvasPoint);
                break;
                
            case TOOLS.CONNECTOR:
                console.log('Handling CONNECTOR tool click');
                this._startConnector(canvasPoint, targetElement);
                break;
                
            case TOOLS.IMAGE:
                console.log('Handling IMAGE tool click');
                this._createImageElement(canvasPoint);
                break;
                
            default:
                console.log('Unknown tool:', this.currentTool);
        }
    }

    /**
     * Handle select tool click
     */
    _handleSelectToolClick(e, targetElement, hitType, canvasPoint) {
        console.log('Select tool click:', { targetElement: targetElement?.id, hitType, canvasPoint, shiftKey: this.keys.shift });

        if (hitType === 'resize') {
            console.log('Starting resize for element:', targetElement.id);
            this._startResize(targetElement, this.context.resizeHandle);
        } else if (hitType === 'rotate') {
            console.log('Starting rotate for element:', targetElement.id);
            this._startRotate(targetElement);
        } else if (targetElement) {
            // Click on element
            console.log('Element clicked:', targetElement.id, 'currently selected:', this.canvas.isSelected(targetElement.id));

            if (this.keys.shift) {
                // Toggle selection
                if (this.canvas.isSelected(targetElement.id)) {
                    console.log('Deselecting element:', targetElement.id);
                    this.canvas.deselectElement(targetElement.id);
                } else {
                    console.log('Adding to selection:', targetElement.id);
                    this.canvas.selectElement(targetElement.id, true);
                }
            } else if (!this.canvas.isSelected(targetElement.id)) {
                console.log('Selecting element:', targetElement.id);
                this.canvas.selectElement(targetElement.id);
            }

            console.log('Current selection after click:', Array.from(this.canvas.getSelectedElements()).map(el => el.id));
            this._startDrag(canvasPoint);
        } else {
            // Click on empty space
            console.log('Clicked on empty space');
            if (!this.keys.shift) {
                console.log('Clearing selection');
                this.canvas.clearSelection();
            }
            this._startSelection(canvasPoint);
        }
    }

    /**
     * Handle mouse move
     * @param {MouseEvent} e
     */
    _onMouseMove(e) {
        const rect = this.container.getBoundingClientRect();
        this.pointer.currentX = e.clientX - rect.left;
        this.pointer.currentY = e.clientY - rect.top;
        
        const dx = this.pointer.currentX - this.pointer.startX;
        const dy = this.pointer.currentY - this.pointer.startY;
        
        if (this.state.isPanning) {
            this._doPan(dx, dy);
            this.pointer.startX = this.pointer.currentX;
            this.pointer.startY = this.pointer.currentY;
        } else if (this.state.isDragging) {
            this._doDrag(dx, dy);
        } else if (this.state.isResizing) {
            this._doResize(dx, dy);
        } else if (this.state.isRotating) {
            this._doRotate();
        } else if (this.state.isSelecting) {
            this._doSelection();
        } else if (this.state.isDrawingConnector) {
            this._doDrawConnector();
        } else {
            // Hover detection
            this._updateHover();
        }
    }

    /**
     * Handle mouse up
     * @param {MouseEvent} e
     */
    _onMouseUp(e) {
        if (this.state.isPanning) {
            this._endPan();
        } else if (this.state.isDragging) {
            this._endDrag();
        } else if (this.state.isResizing) {
            this._endResize();
        } else if (this.state.isRotating) {
            this._endRotate();
        } else if (this.state.isSelecting) {
            this._endSelection();
        } else if (this.state.isDrawingConnector) {
            this._endConnector();
        }
        
        this._resetState();
    }

    /**
     * Handle wheel event (zoom)
     * @param {WheelEvent} e
     */
    _onWheel(e) {
        e.preventDefault();
        
        const rect = this.container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const delta = -e.deltaY * CANVAS_CONFIG.SCROLL_ZOOM_SENSITIVITY;
        const newZoom = this.canvas.transform.zoom * (1 + delta);
        
        this.canvas.setZoom(newZoom, { x: mouseX, y: mouseY });
    }

    /**
     * Handle context menu
     * @param {MouseEvent} e
     */
    _onContextMenu(e) {
        e.preventDefault();
        
        const rect = this.container.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const canvasPoint = this.canvas.screenToCanvas(screenX, screenY);
        
        const target = this._getElementAtPoint(canvasPoint);
        
        if (target?.element && !this.canvas.isSelected(target.element.id)) {
            this.canvas.selectElement(target.element.id);
        }
        
        if (this.callbacks.onContextMenu) {
            this.callbacks.onContextMenu({
                screenX: e.clientX,
                screenY: e.clientY,
                canvasX: canvasPoint.x,
                canvasY: canvasPoint.y,
                element: target?.element,
                selectedElements: this.canvas.getSelectedElements()
            });
        }
    }

    /**
     * Handle double click
     * @param {MouseEvent} e
     */
    _onDoubleClick(e) {
        const rect = this.container.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const canvasPoint = this.canvas.screenToCanvas(screenX, screenY);
        
        const target = this._getElementAtPoint(canvasPoint);
        
        if (target?.element) {
            target.element.onStartEdit();
            
            if (this.callbacks.onDoubleClick) {
                this.callbacks.onDoubleClick({
                    element: target.element,
                    canvasX: canvasPoint.x,
                    canvasY: canvasPoint.y
                });
            }
        }
    }

    // ==================== Touch Events ====================

    _onTouchStart(e) {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const rect = this.container.getBoundingClientRect();
            this.pointer.startX = touch.clientX - rect.left;
            this.pointer.startY = touch.clientY - rect.top;
            this.pointer.currentX = this.pointer.startX;
            this.pointer.currentY = this.pointer.startY;
            
            // Simulate left click
            this._handleLeftClick({ button: 0 });
        } else if (e.touches.length === 2) {
            // Two-finger pan/zoom
            e.preventDefault();
            this._startPan();
        }
    }

    _onTouchMove(e) {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const rect = this.container.getBoundingClientRect();
            this.pointer.currentX = touch.clientX - rect.left;
            this.pointer.currentY = touch.clientY - rect.top;
            
            this._onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
        }
        e.preventDefault();
    }

    _onTouchEnd(e) {
        this._onMouseUp({});
    }

    // ==================== Keyboard Events ====================

    /**
     * Handle key down
     * @param {KeyboardEvent} e
     */
    _onKeyDown(e) {
        // Update modifier keys
        this.keys.shift = e.shiftKey;
        this.keys.ctrl = e.ctrlKey || e.metaKey;
        this.keys.alt = e.altKey;
        
        if (e.code === 'Space' && !this.keys.space) {
            this.keys.space = true;
            this._updateCursor();
        }
        
        // Don't process shortcuts if typing in input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
            return;
        }
        
        const key = e.key.toLowerCase();
        const combo = `${this.keys.ctrl ? 'ctrl+' : ''}${this.keys.shift ? 'shift+' : ''}${key}`;
        
        // Handle shortcuts
        if (KEYBOARD_SHORTCUTS.DELETE.includes(e.key)) {
            this.canvas.deleteSelected();
            e.preventDefault();
        } else if (this._matchShortcut(combo, KEYBOARD_SHORTCUTS.COPY)) {
            this.canvas.copy();
            e.preventDefault();
        } else if (this._matchShortcut(combo, KEYBOARD_SHORTCUTS.CUT)) {
            this.canvas.cut();
            e.preventDefault();
        } else if (this._matchShortcut(combo, KEYBOARD_SHORTCUTS.PASTE)) {
            this.canvas.paste();
            e.preventDefault();
        } else if (this._matchShortcut(combo, KEYBOARD_SHORTCUTS.UNDO)) {
            this.canvas.undo();
            e.preventDefault();
        } else if (this._matchShortcut(combo, KEYBOARD_SHORTCUTS.REDO)) {
            this.canvas.redo();
            e.preventDefault();
        } else if (this._matchShortcut(combo, KEYBOARD_SHORTCUTS.SELECT_ALL)) {
            this.canvas.selectAll();
            e.preventDefault();
        } else if (this._matchShortcut(combo, KEYBOARD_SHORTCUTS.DUPLICATE)) {
            this.canvas.duplicate();
            e.preventDefault();
        } else if (KEYBOARD_SHORTCUTS.ESCAPE.includes(e.key)) {
            this.canvas.clearSelection();
            this.setTool(TOOLS.SELECT);
            e.preventDefault();
        } else if (this._matchShortcut(combo, KEYBOARD_SHORTCUTS.ZOOM_IN)) {
            this.canvas.zoomIn();
            e.preventDefault();
        } else if (this._matchShortcut(combo, KEYBOARD_SHORTCUTS.ZOOM_OUT)) {
            this.canvas.zoomOut();
            e.preventDefault();
        } else if (this._matchShortcut(combo, KEYBOARD_SHORTCUTS.ZOOM_RESET)) {
            this.canvas.resetZoom();
            e.preventDefault();
        } else if (this._matchShortcut(combo, KEYBOARD_SHORTCUTS.FIT_TO_SCREEN)) {
            this.canvas.fitToContent();
            e.preventDefault();
        }
        
        // Tool shortcuts
        if (key === 'v' && !this.keys.ctrl) this.setTool(TOOLS.SELECT);
        if (key === 'h' && !this.keys.ctrl) this.setTool(TOOLS.PAN);
        if (key === 's' && !this.keys.ctrl) this.setTool(TOOLS.STICKY);
        if (key === 't' && !this.keys.ctrl) this.setTool(TOOLS.TEXT);
        if (key === 'r' && !this.keys.ctrl) this.setTool(TOOLS.SHAPE, { shapeType: 'rectangle' });
        if (key === 'o' && !this.keys.ctrl) this.setTool(TOOLS.SHAPE, { shapeType: 'circle' });
        if (key === 'f' && !this.keys.ctrl) this.setTool(TOOLS.FRAME);
        if (key === 'l' && !this.keys.ctrl) this.setTool(TOOLS.CONNECTOR);
    }

    /**
     * Handle key up
     * @param {KeyboardEvent} e
     */
    _onKeyUp(e) {
        this.keys.shift = e.shiftKey;
        this.keys.ctrl = e.ctrlKey || e.metaKey;
        this.keys.alt = e.altKey;
        
        if (e.code === 'Space') {
            this.keys.space = false;
            this._updateCursor();
        }
    }

    /**
     * Match keyboard shortcut
     * @param {string} combo
     * @param {Array} shortcuts
     * @returns {boolean}
     */
    _matchShortcut(combo, shortcuts) {
        return shortcuts.some(s => s.toLowerCase() === combo.toLowerCase());
    }

    // ==================== Drag & Drop ====================

    _onDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }

    _onDrop(e) {
        e.preventDefault();
        
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            const rect = this.container.getBoundingClientRect();
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;
            const canvasPoint = this.canvas.screenToCanvas(screenX, screenY);
            
            this._createImageFromFile(files[0], canvasPoint);
        }
    }

    // ==================== Interaction Helpers ====================

    /**
     * Get element at point
     * @param {Object} point - Canvas coordinates
     * @returns {Object|null}
     */
    _getElementAtPoint(point) {
        // Check in reverse order (top to bottom)
        const elements = this.canvas.getAllElements().reverse();
        
        for (const element of elements) {
            if (!element.visible) continue;
            
            // Check resize handles first (for selected elements)
            if (this.canvas.isSelected(element.id)) {
                const handle = this._getResizeHandleAtPoint(element, point);
                if (handle) {
                    this.context.resizeHandle = handle;
                    return { element, hitType: 'resize' };
                }
            }
            
            // Check element body
            if (element.containsPoint(point)) {
                return { element, hitType: 'body' };
            }
        }
        
        return null;
    }

    /**
     * Get resize handle at point
     * @param {BaseElement} element
     * @param {Object} point
     * @returns {string|null}
     */
    _getResizeHandleAtPoint(element, point) {
        const handleSize = 12 / this.canvas.transform.zoom;
        const handles = element.getResizeHandles();
        const bounds = element.getBounds();
        
        for (const handle of handles) {
            let hx, hy;
            
            switch (handle) {
                case 'nw': hx = bounds.x; hy = bounds.y; break;
                case 'n': hx = bounds.x + bounds.width / 2; hy = bounds.y; break;
                case 'ne': hx = bounds.x + bounds.width; hy = bounds.y; break;
                case 'e': hx = bounds.x + bounds.width; hy = bounds.y + bounds.height / 2; break;
                case 'se': hx = bounds.x + bounds.width; hy = bounds.y + bounds.height; break;
                case 's': hx = bounds.x + bounds.width / 2; hy = bounds.y + bounds.height; break;
                case 'sw': hx = bounds.x; hy = bounds.y + bounds.height; break;
                case 'w': hx = bounds.x; hy = bounds.y + bounds.height / 2; break;
            }
            
            if (Math.abs(point.x - hx) <= handleSize && Math.abs(point.y - hy) <= handleSize) {
                return handle;
            }
        }
        
        return null;
    }

    /**
     * Update hover state
     */
    _updateHover() {
        const canvasPoint = this.canvas.screenToCanvas(this.pointer.currentX, this.pointer.currentY);
        const target = this._getElementAtPoint(canvasPoint);
        
        if (target?.element) {
            this.canvas.hoveredId = target.element.id;
            
            // Update cursor for resize handles
            if (target.hitType === 'resize') {
                this.container.style.cursor = this._getResizeCursor(this.context.resizeHandle);
            } else if (!this.state.isPanning && this.currentTool === TOOLS.SELECT) {
                this.container.style.cursor = 'move';
            }
        } else {
            this.canvas.hoveredId = null;
            this._updateCursor();
        }
    }

    /**
     * Get cursor for resize handle
     * @param {string} handle
     * @returns {string}
     */
    _getResizeCursor(handle) {
        const cursors = {
            'nw': 'nw-resize', 'n': 'n-resize', 'ne': 'ne-resize',
            'e': 'e-resize', 'se': 'se-resize', 's': 's-resize',
            'sw': 'sw-resize', 'w': 'w-resize'
        };
        return cursors[handle] || 'default';
    }

    // ==================== Pan Operations ====================

    _startPan() {
        this.state.isPanning = true;
        this.container.style.cursor = 'grabbing';
    }

    _doPan(dx, dy) {
        this.canvas.pan(dx, dy);
    }

    _endPan() {
        this.state.isPanning = false;
        this._updateCursor();
    }

    // ==================== Drag Operations ====================

    _startDrag(canvasPoint) {
        const selected = this.canvas.getSelectedElements();
        console.log('Starting drag with selected elements:', selected.map(el => el.id));
        if (selected.length === 0) return;

        this.state.isDragging = true;
        this.context.initialPositions.clear();

        for (const element of selected) {
            this.context.initialPositions.set(element.id, {
                x: element.x,
                y: element.y
            });
        }
    }

    _doDrag(dx, dy) {
        const scaledDx = dx / this.canvas.transform.zoom;
        const scaledDy = dy / this.canvas.transform.zoom;
        
        for (const element of this.canvas.getSelectedElements()) {
            if (element.locked) continue;
            
            const initial = this.context.initialPositions.get(element.id);
            if (initial) {
                let newX = initial.x + scaledDx;
                let newY = initial.y + scaledDy;
                
                if (this.keys.shift) {
                    newX = snapToGrid(newX, CANVAS_CONFIG.GRID_SIZE);
                    newY = snapToGrid(newY, CANVAS_CONFIG.GRID_SIZE);
                }
                
                element.setPosition(newX, newY);
            }
        }
    }

    _endDrag() {
        console.log('Ending drag operation');
        this.state.isDragging = false;
        this.canvas._recordHistory('Move elements');
        this.context.initialPositions.clear();
    }

    // ==================== Resize Operations ====================

    _startResize(element, handle) {
        this.state.isResizing = true;
        this.context.targetElement = element;
        this.context.resizeHandle = handle;
        this.context.initialBounds = {
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height
        };
    }

    _doResize(dx, dy) {
        const element = this.context.targetElement;
        if (!element || element.locked) return;
        
        const handle = this.context.resizeHandle;
        const initial = this.context.initialBounds;
        const scaledDx = dx / this.canvas.transform.zoom;
        const scaledDy = dy / this.canvas.transform.zoom;
        
        const result = calculateResize(
            initial,
            { dx: scaledDx, dy: scaledDy },
            handle,
            this.keys.shift
        );
        
        element.setPosition(result.x, result.y);
        element.resize(result.width, result.height);
    }

    _endResize() {
        this.state.isResizing = false;
        this.canvas._recordHistory('Resize element');
        this.context.targetElement = null;
        this.context.initialBounds = null;
    }

    // ==================== Rotate Operations ====================

    _startRotate(element) {
        this.state.isRotating = true;
        this.context.targetElement = element;
    }

    _doRotate() {
        const element = this.context.targetElement;
        if (!element || element.locked) return;
        
        const center = element.getCenter();
        const centerScreen = this.canvas.canvasToScreen(center.x, center.y);
        
        const angle = Math.atan2(
            this.pointer.currentY - centerScreen.y,
            this.pointer.currentX - centerScreen.x
        );
        
        let degrees = (angle * 180 / Math.PI) + 90;
        
        if (this.keys.shift) {
            degrees = Math.round(degrees / 15) * 15;
        }
        
        element.setRotation(degrees);
    }

    _endRotate() {
        this.state.isRotating = false;
        this.canvas._recordHistory('Rotate element');
        this.context.targetElement = null;
    }

    // ==================== Selection Rectangle ====================

    _startSelection(canvasPoint) {
        this.state.isSelecting = true;
        this.context.selectionRect = {
            x: canvasPoint.x,
            y: canvasPoint.y,
            width: 0,
            height: 0
        };
    }

    _doSelection() {
        const currentPoint = this.canvas.screenToCanvas(this.pointer.currentX, this.pointer.currentY);
        const startPoint = this.canvas.screenToCanvas(this.pointer.startX, this.pointer.startY);
        
        this.context.selectionRect = normalizeRect({
            x: startPoint.x,
            y: startPoint.y,
            width: currentPoint.x - startPoint.x,
            height: currentPoint.y - startPoint.y
        });
        
        if (this.callbacks.onSelectionRectChange) {
            this.callbacks.onSelectionRectChange(this.context.selectionRect);
        }
    }

    _endSelection() {
        if (this.context.selectionRect && 
            this.context.selectionRect.width > 5 && 
            this.context.selectionRect.height > 5) {
            this.canvas.selectInRect(this.context.selectionRect);
        }
        
        this.state.isSelecting = false;
        this.context.selectionRect = null;
        
        if (this.callbacks.onSelectionRectChange) {
            this.callbacks.onSelectionRectChange(null);
        }
    }

    // ==================== Connector Drawing ====================

    _startConnector(canvasPoint, targetElement) {
        this.state.isDrawingConnector = true;
        this.context.connectorStart = {
            point: canvasPoint,
            element: targetElement
        };
    }

    _doDrawConnector() {
        // Visual feedback handled in renderer
    }

    _endConnector() {
        const currentPoint = this.canvas.screenToCanvas(this.pointer.currentX, this.pointer.currentY);
        const target = this._getElementAtPoint(currentPoint);
        
        const connector = this.canvas.createElement(ELEMENT_TYPES.CONNECTOR, {
            properties: {
                startPoint: this.context.connectorStart.point,
                endPoint: currentPoint,
                startElementId: this.context.connectorStart.element?.id || null,
                endElementId: target?.element?.id || null
            }
        });
        
        this.canvas.addElement(connector);
        
        this.state.isDrawingConnector = false;
        this.context.connectorStart = null;
        
        // Switch back to select tool
        this.setTool(TOOLS.SELECT);
    }

    // ==================== Element Creation ====================

    _createElementAtPoint(type, canvasPoint, options = {}) {
        console.log('Creating element:', type, 'at point:', canvasPoint, 'with options:', options);
        console.log('Canvas:', this.canvas);
        console.log('Canvas createElement method exists:', typeof this.canvas.createElement);

        const defaults = ELEMENT_DEFAULTS[type] || {};
        console.log('Element defaults:', defaults);

        try {
            const element = this.canvas.createElement(type, {
                x: canvasPoint.x - (defaults.width || 100) / 2,
                y: canvasPoint.y - (defaults.height || 100) / 2,
                properties: options
            });

            console.log('Element created:', element);

            if (element) {
                console.log('Element created with ID:', element.id);
                const addResult = this.canvas.addElement(element);
                console.log('addElement result:', addResult);

                const selectResult = this.canvas.selectElement(element.id);
                console.log('selectElement result:', selectResult);

                console.log('Element added and selected');

                // Switch back to select tool
                this.setTool(TOOLS.SELECT);
            } else {
                console.error('createElement returned null/undefined');
            }
        } catch (error) {
            console.error('Error in _createElementAtPoint:', error);
            console.error('Error stack:', error.stack);
        }
    }

    _createImageElement(canvasPoint) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this._createImageFromFile(file, canvasPoint);
            }
        };
        input.click();
    }

    async _createImageFromFile(file, canvasPoint) {
        const element = this.canvas.createElement(ELEMENT_TYPES.IMAGE, {
            x: canvasPoint.x,
            y: canvasPoint.y
        });
        
        try {
            await element.loadFromFile(file);
            element.x = canvasPoint.x - element.width / 2;
            element.y = canvasPoint.y - element.height / 2;
            this.canvas.addElement(element);
            this.canvas.selectElement(element.id);
        } catch (error) {
            console.error('Failed to load image:', error);
        }
        
        this.setTool(TOOLS.SELECT);
    }

    // ==================== State Reset ====================

    _resetState() {
        Object.keys(this.state).forEach(key => {
            this.state[key] = false;
        });
        this.context.resizeHandle = null;
        this._updateCursor();
    }

    // ==================== Callbacks ====================

    on(event, callback) {
        if (this.callbacks.hasOwnProperty(event)) {
            this.callbacks[event] = callback;
        }
    }

    off(event) {
        if (this.callbacks.hasOwnProperty(event)) {
            this.callbacks[event] = null;
        }
    }
}

export default CanvasInteractions;