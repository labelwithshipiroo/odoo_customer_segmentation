/** @odoo-module **/

import { CanvasCore } from './canvas/canvas_core';
import { CanvasInteractions } from './canvas/canvas_interactions';
import { CanvasRenderer } from './canvas/canvas_renderer';
import { Toolbar, SecondaryToolbar } from './components/toolbar';
import { Minimap } from './components/minimap';
import { ContextMenu } from './components/context_menu';
import { PropertiesPanel } from './components/properties_panel';
import { TemplatePicker } from './components/template_picker';
import { TOOLS, ELEMENT_TYPES, ALIGNMENT } from './utils/constants';
import { getIcon } from './utils/icons';
import { getBoundingBox } from './utils/geometry';

/**
 * Main Whiteboard Application
 * Orchestrates all components and handles integration
 */
export class WhiteboardApp {
    constructor(containerEl, options = {}) {
        this.container = containerEl;
        this.options = {
            boardId: null,
            boardName: 'Untitled Board',
            readOnly: false,
            showMinimap: true,
            showToolbar: true,
            autoSave: true,
            autoSaveInterval: 30000, // 30 seconds
            ...options
        };
        
        // Components
        this.canvas = null;
        this.interactions = null;
        this.renderer = null;
        this.toolbar = null;
        this.secondaryToolbar = null;
        this.minimap = null;
        this.contextMenu = null;
        this.propertiesPanel = null;
        this.templatePicker = null;
        
        // DOM containers
        this.toolbarContainer = null;
        this.secondaryToolbarContainer = null;
        this.boardNameContainer = null;
        this.canvasContainer = null;
        this.minimapContainer = null;
        this.zoomControlsContainer = null;
        this.propertiesPanelContainer = null;
        
        // State
        this.boardId = options.boardId;
        this.boardName = options.boardName;
        this.isDirty = false;
        this.autoSaveTimer = null;
        
        // RPC function (will be set by Odoo component)
        this.rpc = options.rpc || null;
        
        // Initialize
        this._init();
    }

    /**
     * Initialize the whiteboard
     */
    _init() {
        this._createLayout();
        this._initComponents();
        this._setupEventHandlers();
        this._setupAutoSave();
    }

    /**
     * Create the main layout
     */
    _createLayout() {
        if (!this.container) return;
        
        this.container.innerHTML = '';
        this.container.className = 'whiteboard-container';
        
        // Board name input (top left)
        this.boardNameContainer = document.createElement('div');
        this.boardNameContainer.className = 'wb-board-name';
        this.boardNameContainer.innerHTML = `
            <input type="text" value="${this._escapeHtml(this.boardName)}" 
                   placeholder="Board name" ${this.options.readOnly ? 'disabled' : ''}/>
        `;
        this.container.appendChild(this.boardNameContainer);
        
        // Toolbar container (top center)
        this.toolbarContainer = document.createElement('div');
        this.toolbarContainer.className = 'wb-toolbar-container';
        this.container.appendChild(this.toolbarContainer);
        
        // Secondary toolbar (top right)
        this.secondaryToolbarContainer = document.createElement('div');
        this.secondaryToolbarContainer.className = 'wb-secondary-toolbar-container';
        this.container.appendChild(this.secondaryToolbarContainer);
        
        // Canvas container
        this.canvasContainer = document.createElement('div');
        this.canvasContainer.className = 'wb-canvas-container';
        this.canvasContainer.style.cssText = 'flex: 1; position: relative; overflow: hidden;';
        this.container.appendChild(this.canvasContainer);
        
        // Zoom controls (bottom left)
        this.zoomControlsContainer = document.createElement('div');
        this.zoomControlsContainer.className = 'wb-zoom-controls';
        this._renderZoomControls();
        this.container.appendChild(this.zoomControlsContainer);
        
        // Minimap container (bottom right)
        this.minimapContainer = document.createElement('div');
        this.minimapContainer.className = 'wb-minimap-container';
        this.minimapContainer.style.cssText = 'position: absolute; bottom: 16px; right: 16px;';
        this.container.appendChild(this.minimapContainer);
        
        // Properties panel container
        this.propertiesPanelContainer = document.createElement('div');
        this.propertiesPanelContainer.className = 'wb-properties-panel-container';
        this.propertiesPanelContainer.style.cssText = 'position: absolute; top: 80px; right: 16px;';
        this.container.appendChild(this.propertiesPanelContainer);
    }

    /**
     * Render zoom controls
     */
    _renderZoomControls() {
        const zoom = this.canvas?.transform.zoom || 1;
        const zoomPercent = Math.round(zoom * 100);
        
        this.zoomControlsContainer.innerHTML = `
            <button class="wb-zoom-btn" data-action="zoomOut" title="Zoom Out">
                ${getIcon('minus', 18)}
            </button>
            <span class="wb-zoom-level">${zoomPercent}%</span>
            <button class="wb-zoom-btn" data-action="zoomIn" title="Zoom In">
                ${getIcon('plus', 18)}
            </button>
            <button class="wb-zoom-btn" data-action="fitToContent" title="Fit to Content">
                ${getIcon('maximize', 18)}
            </button>
        `;
        
        // Attach event listeners
        this.zoomControlsContainer.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this._handleZoomAction(action);
            });
        });
    }

    /**
     * Initialize all components
     */
    _initComponents() {
        // Canvas core
        this.canvas = new CanvasCore(this.canvasContainer, {
            snapToGrid: false
        });
        
        // Renderer
        this.renderer = new CanvasRenderer(this.canvas, this.canvasContainer);
        
        // Interactions
        this.interactions = new CanvasInteractions(this.canvas, this.renderer.canvasWrapper);
        
        // Toolbar
        if (this.options.showToolbar && !this.options.readOnly) {
            this.toolbar = new Toolbar(this.toolbarContainer);
            this.secondaryToolbar = new SecondaryToolbar(this.secondaryToolbarContainer);
        }
        
        // Minimap
        if (this.options.showMinimap) {
            this.minimap = new Minimap(this.minimapContainer, this.canvas);
        }
        
        // Context menu
        this.contextMenu = new ContextMenu();
        
        // Properties panel
        if (!this.options.readOnly) {
            this.propertiesPanel = new PropertiesPanel(this.propertiesPanelContainer);
        }
        
        // Template picker
        this.templatePicker = new TemplatePicker();
        
        // Start renderer
        this.renderer.startRenderLoop();
    }

    /**
     * Setup event handlers
     */
    _setupEventHandlers() {
        // Canvas events
        this.canvas.on('onElementsChange', () => {
            this.isDirty = true;
            this.renderer.requestRender();
            this.minimap?.update();
        });
        
        this.canvas.on('onSelectionChange', (elements) => {
            this.propertiesPanel?.updateSelection(elements);
            this.renderer.requestRender();
        });
        
        this.canvas.on('onTransformChange', (transform) => {
            this._renderZoomControls();
            this.renderer.requestRender();
            this.minimap?.update();
        });
        
        this.canvas.on('onHistoryChange', (info) => {
            this.toolbar?.setHistoryState(info.canUndo, info.canRedo);
        });
        
        // Interaction events
        this.interactions.on('onToolChange', (tool, options) => {
            this.toolbar?.setTool(tool, options);
        });
        
        this.interactions.on('onContextMenu', (data) => {
            this._showContextMenu(data);
        });
        
        this.interactions.on('onDoubleClick', (data) => {
            if (data.element) {
                this.renderer.focusElement(data.element.id);
            }
        });
        
        this.interactions.on('onSelectionRectChange', (rect) => {
            if (rect) {
                this.renderer.showSelectionRect(rect);
            } else {
                this.renderer.hideSelectionRect();
            }
        });
        
        // Toolbar events
        this.toolbar?.on('onToolSelect', (tool, options) => {
            console.log('Toolbar tool select:', tool, options);
            this.interactions.setTool(tool, options);
        });

        this.toolbar?.on('onUndo', () => {
            console.log('Toolbar undo');
            this.canvas.undo();
        });

        this.toolbar?.on('onRedo', () => {
            console.log('Toolbar redo');
            this.canvas.redo();
        });

        this.toolbar?.on('onTemplates', () => {
            console.log('Toolbar templates');
            this.templatePicker.show();
        });
        
        // Secondary toolbar events
        this.secondaryToolbar?.on('onSave', () => {
            this.saveBoard();
        });
        
        this.secondaryToolbar?.on('onExport', () => {
            this.exportBoard();
        });
        
        // Context menu events
        this.contextMenu.on('onAction', (action, target) => {
            this._handleContextMenuAction(action, target);
        });
        
        // Properties panel events
        this.propertiesPanel?.on('onPropertyChange', (property, value, elements) => {
            this._handlePropertyChange(property, value, elements);
        });
        
        // Template picker events
        this.templatePicker.on('onSelect', (template) => {
            this._loadTemplate(template);
        });
        
        // Board name input
        const nameInput = this.boardNameContainer?.querySelector('input');
        if (nameInput) {
            nameInput.addEventListener('blur', () => {
                this.boardName = nameInput.value || 'Untitled Board';
                this.isDirty = true;
            });
        }
        
        // Handle content editable changes
        this.canvasContainer.addEventListener('input', (e) => {
            if (e.target.classList.contains('content-editable') || e.target.tagName === 'TEXTAREA') {
                const elementEl = e.target.closest('[data-id]');
                if (elementEl) {
                    const elementId = elementEl.dataset.id;
                    const element = this.canvas.getElement(elementId);
                    if (element) {
                        element.setContent(e.target.textContent || e.target.value);
                        this.isDirty = true;
                    }
                }
            }
        });

        // Debug: check if canvas container receives clicks
        this.canvasContainer.addEventListener('click', (e) => {
            console.log('Canvas container clicked at:', e.clientX, e.clientY);
        });
        
        // Handle frame title input
        this.canvasContainer.addEventListener('change', (e) => {
            if (e.target.classList.contains('wb-frame-title')) {
                const elementEl = e.target.closest('[data-id]');
                if (elementEl) {
                    const elementId = elementEl.dataset.id;
                    const element = this.canvas.getElement(elementId);
                    if (element && element.type === ELEMENT_TYPES.FRAME) {
                        element.setTitle(e.target.value);
                        this.isDirty = true;
                        this.renderer.requestRender();
                    }
                }
            }
        });
    }

    /**
     * Setup auto-save
     */
    _setupAutoSave() {
        if (!this.options.autoSave || !this.boardId) return;
        
        this.autoSaveTimer = setInterval(() => {
            if (this.isDirty) {
                this.saveBoard(true); // silent save
            }
        }, this.options.autoSaveInterval);
    }

    /**
     * Show context menu
     */
    _showContextMenu(data) {
        const { screenX, screenY, element, selectedElements } = data;
        
        let items;
        if (selectedElements.length > 1) {
            items = ContextMenu.getMultiSelectMenuItems(selectedElements);
        } else if (element) {
            items = ContextMenu.getElementMenuItems(element);
        } else {
            items = ContextMenu.getCanvasMenuItems();
        }
        
        this.contextMenu.show(screenX, screenY, items, { element, selectedElements, ...data });
    }

    /**
     * Handle context menu action
     */
    _handleContextMenuAction(action, target) {
        const { element, selectedElements } = target || {};
        
        switch (action) {
            case 'copy':
                this.canvas.copy();
                break;
            case 'cut':
                this.canvas.cut();
                break;
            case 'paste':
                this.canvas.paste();
                break;
            case 'duplicate':
                this.canvas.duplicate();
                break;
            case 'delete':
                this.canvas.deleteSelected();
                break;
            case 'selectAll':
                this.canvas.selectAll();
                break;
            case 'bringForward':
                if (element) this.canvas.bringForward(element.id);
                break;
            case 'sendBackward':
                if (element) this.canvas.sendBackward(element.id);
                break;
            case 'bringToFront':
                if (element) this.canvas.bringToFront(element.id);
                break;
            case 'sendToBack':
                if (element) this.canvas.sendToBack(element.id);
                break;
            case 'lock':
                if (element) {
                    element.setLocked(!element.locked);
                    this.renderer.requestRender();
                }
                break;
            case 'fitToScreen':
                this.canvas.fitToContent();
                break;
            case 'resetZoom':
                this.canvas.resetZoom();
                break;
            // Alignment actions
            case 'alignLeft':
            case 'alignCenter':
            case 'alignRight':
            case 'alignTop':
            case 'alignMiddle':
            case 'alignBottom':
                this._alignElements(action.replace('align', '').toLowerCase(), selectedElements);
                break;
            case 'distributeHorizontal':
            case 'distributeVertical':
                this._distributeElements(action.replace('distribute', '').toLowerCase(), selectedElements);
                break;
            // Color changes
            default:
                if (action.startsWith('color-') && element) {
                    const colorName = action.replace('color-', '');
                    if (element.setColor) {
                        element.setColor(colorName);
                        this.renderer.requestRender();
                    }
                }
        }
    }

    /**
     * Handle property change from properties panel
     */
    _handlePropertyChange(property, value, elements) {
        if (!elements || elements.length === 0) return;
        
        for (const element of elements) {
            switch (property) {
                case 'x':
                    element.x = value;
                    break;
                case 'y':
                    element.y = value;
                    break;
                case 'width':
                    element.resize(value, element.height);
                    break;
                case 'height':
                    element.resize(element.width, value);
                    break;
                case 'opacity':
                    element.opacity = value;
                    break;
                case 'color':
                    if (element.setColor) element.setColor(value);
                    break;
                case 'fontSize':
                    element.setStyle('fontSize', parseInt(value));
                    break;
                case 'fontFamily':
                    element.setStyle('fontFamily', value);
                    break;
                case 'textAlign':
                    element.setStyle('textAlign', value);
                    break;
                case 'bold':
                    if (element.toggleBold) element.toggleBold();
                    break;
                case 'italic':
                    if (element.toggleItalic) element.toggleItalic();
                    break;
                case 'underline':
                    if (element.toggleUnderline) element.toggleUnderline();
                    break;
                case 'textColor':
                    element.setStyle('textColor', value);
                    break;
                case 'fill':
                    element.setStyle('fill', value);
                    break;
                case 'stroke':
                    element.setStyle('stroke', value);
                    break;
                case 'strokeWidth':
                    element.setStyle('strokeWidth', value);
                    break;
                case 'strokeStyle':
                    element.setStyle('strokeStyle', value);
                    break;
                case 'borderStyle':
                    element.setStyle('borderStyle', value);
                    break;
                case 'borderColor':
                    element.setStyle('borderColor', value);
                    break;
                case 'title':
                    if (element.setTitle) element.setTitle(value);
                    break;
                case 'showTitle':
                    element.setProperty('showTitle', value);
                    break;
                case 'connectorType':
                    element.setProperty('connectorType', value);
                    break;
                case 'startEnd':
                    element.setProperty('startEnd', value);
                    break;
                case 'endEnd':
                    element.setProperty('endEnd', value);
                    break;
                case 'objectFit':
                    element.setStyle('objectFit', value);
                    break;
                case 'borderRadius':
                    element.setStyle('borderRadius', value);
                    break;
                case 'lockAspectRatio':
                    element.setProperty('lockAspectRatio', value);
                    break;
                case 'action':
                    // Handle action from properties panel
                    if (value === 'resetSize' && element.resetToOriginalSize) {
                        element.resetToOriginalSize();
                    }
                    break;
                case 'align':
                    this._alignElements(value, elements);
                    return;
                case 'distribute':
                    this._distributeElements(value, elements);
                    return;
            }
            
            element._isDirty = true;
        }
        
        this.isDirty = true;
        this.canvas._recordHistory('Property change');
        this.renderer.requestRender();
    }

    /**
     * Align elements
     */
    _alignElements(alignment, elements) {
        if (!elements || elements.length < 2) return;
        
        const bounds = getBoundingBox(elements);
        
        for (const element of elements) {
            if (element.locked) continue;
            
            switch (alignment) {
                case 'left':
                    element.x = bounds.x;
                    break;
                case 'center':
                    element.x = bounds.x + (bounds.width - element.width) / 2;
                    break;
                case 'right':
                    element.x = bounds.x + bounds.width - element.width;
                    break;
                case 'top':
                    element.y = bounds.y;
                    break;
                case 'middle':
                    element.y = bounds.y + (bounds.height - element.height) / 2;
                    break;
                case 'bottom':
                    element.y = bounds.y + bounds.height - element.height;
                    break;
            }
            
            element._isDirty = true;
        }
        
        this.canvas._recordHistory('Align elements');
        this.renderer.requestRender();
    }

    /**
     * Distribute elements evenly
     */
    _distributeElements(direction, elements) {
        if (!elements || elements.length < 3) return;
        
        const sorted = [...elements].sort((a, b) => 
            direction === 'horizontal' ? a.x - b.x : a.y - b.y
        );
        
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        
        if (direction === 'horizontal') {
            const totalWidth = sorted.reduce((sum, el) => sum + el.width, 0);
            const totalSpace = (last.x + last.width) - first.x - totalWidth;
            const gap = totalSpace / (elements.length - 1);
            
            let currentX = first.x + first.width + gap;
            for (let i = 1; i < sorted.length - 1; i++) {
                if (!sorted[i].locked) {
                    sorted[i].x = currentX;
                    sorted[i]._isDirty = true;
                }
                currentX += sorted[i].width + gap;
            }
        } else {
            const totalHeight = sorted.reduce((sum, el) => sum + el.height, 0);
            const totalSpace = (last.y + last.height) - first.y - totalHeight;
            const gap = totalSpace / (elements.length - 1);
            
            let currentY = first.y + first.height + gap;
            for (let i = 1; i < sorted.length - 1; i++) {
                if (!sorted[i].locked) {
                    sorted[i].y = currentY;
                    sorted[i]._isDirty = true;
                }
                currentY += sorted[i].height + gap;
            }
        }
        
        this.canvas._recordHistory('Distribute elements');
        this.renderer.requestRender();
    }

    /**
     * Handle zoom action
     */
    _handleZoomAction(action) {
        switch (action) {
            case 'zoomIn':
                this.canvas.zoomIn();
                break;
            case 'zoomOut':
                this.canvas.zoomOut();
                break;
            case 'fitToContent':
                this.canvas.fitToContent();
                break;
        }
    }

    /**
     * Load template
     */
    _loadTemplate(template) {
        if (template.id === 'blank') {
            this.canvas.clearBoard();
            return;
        }
        
        if (template.elements && template.elements.length > 0) {
            this.canvas.clearBoard();
            
            for (const elementData of template.elements) {
                const element = this.canvas.createElement(elementData.type, elementData);
                if (element) {
                    this.canvas.addElement(element, false);
                }
            }
            
            this.canvas._recordHistory('Load template');
            this.canvas.fitToContent();
        }
    }

    // ==================== Public API ====================

    /**
     * Load board from server
     * @param {number} boardId
     */
    async loadBoard(boardId) {
        if (!this.rpc) {
            console.warn('RPC not available, cannot load board');
            return;
        }
        
        try {
            const result = await this.rpc('/web/dataset/call_kw', {
                model: 'whiteboard.board',
                method: 'get_board_data',
                args: [boardId],
                kwargs: {}
            });
            
            if (result) {
                this.boardId = boardId;
                this.boardName = result.name;
                
                // Update name input
                const nameInput = this.boardNameContainer?.querySelector('input');
                if (nameInput) {
                    nameInput.value = result.name;
                }
                
                // Load elements
                if (result.elements) {
                    this.canvas.importData({
                        elements: result.elements,
                        transform: result.canvasState
                    });
                }
                
                this.isDirty = false;
            }
        } catch (error) {
            console.error('Failed to load board:', error);
        }
    }

    /**
     * Save board to server
     * @param {boolean} silent - Don't show notifications
     */
    async saveBoard(silent = false) {
        if (!this.rpc || !this.boardId) {
            console.warn('Cannot save: RPC or board ID not available');
            return;
        }
        
        try {
            const data = {
                name: this.boardName,
                elements: this.canvas.exportData().elements,
                canvasState: this.canvas.getTransform()
            };
            
            await this.rpc('/web/dataset/call_kw', {
                model: 'whiteboard.board',
                method: 'save_board_data',
                args: [this.boardId, data],
                kwargs: {}
            });
            
            this.isDirty = false;
            
            if (!silent) {
                this._showToast('Board saved successfully', 'success');
            }
        } catch (error) {
            console.error('Failed to save board:', error);
            if (!silent) {
                this._showToast('Failed to save board', 'error');
            }
        }
    }

    /**
     * Export board as image
     * @param {string} format - 'png' or 'svg'
     */
    async exportBoard(format = 'png') {
        try {
            const dataUrl = await this.renderer.exportAsImage(format);
            if (dataUrl) {
                const link = document.createElement('a');
                link.download = `${this.boardName}.${format}`;
                link.href = dataUrl;
                link.click();
            }
        } catch (error) {
            console.error('Failed to export board:', error);
            this._showToast('Failed to export board', 'error');
        }
    }

    /**
     * Show toast notification
     */
    _showToast(message, type = 'info') {
        let container = document.querySelector('.wb-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'wb-toast-container';
            document.body.appendChild(container);
        }
        
        const toast = document.createElement('div');
        toast.className = `wb-toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
            if (container.children.length === 0) {
                container.remove();
            }
        }, 3000);
    }

    /**
     * Escape HTML
     */
    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Get board data
     * @returns {Object}
     */
    getBoardData() {
        return {
            id: this.boardId,
            name: this.boardName,
            ...this.canvas.exportData()
        };
    }

    /**
     * Set RPC function (called by Odoo component)
     * @param {Function} rpcFn
     */
    setRpc(rpcFn) {
        this.rpc = rpcFn;
    }

    /**
     * Destroy the whiteboard
     */
    destroy() {
        // Stop auto-save
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        
        // Destroy components
        this.renderer?.destroy();
        this.interactions?.destroy();
        this.canvas?.destroy();
        this.toolbar?.destroy();
        this.secondaryToolbar?.destroy();
        this.minimap?.destroy();
        this.contextMenu?.destroy();
        this.propertiesPanel?.destroy();
        this.templatePicker?.destroy();
        
        // Clear container
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

export default WhiteboardApp;