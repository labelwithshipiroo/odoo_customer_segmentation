/** @odoo-module **/

import { TOOLS, SHAPE_TYPES, STICKY_COLORS } from '../utils/constants';
import { Icons, getIcon } from '../utils/icons';

/**
 * Toolbar Component
 * Main toolbar with all tools and actions
 */
export class Toolbar {
    constructor(containerEl, options = {}) {
        this.container = containerEl;
        this.options = options;
        
        // Current state
        this.currentTool = TOOLS.SELECT;
        this.currentShapeType = SHAPE_TYPES.RECTANGLE;
        this.canUndo = false;
        this.canRedo = false;
        
        // Callbacks
        this.callbacks = {
            onToolSelect: null,
            onUndo: null,
            onRedo: null,
            onSave: null,
            onZoomIn: null,
            onZoomOut: null,
            onZoomReset: null,
            onFitToContent: null,
            onExport: null,
            onTemplates: null
        };
        
        // DOM elements
        this.toolbarEl = null;
        this.shapeMenuEl = null;
        
        this._init();
    }

    /**
     * Initialize toolbar
     */
    _init() {
        this._render();
        this._attachEventListeners();
    }

    /**
     * Render toolbar
     */
    _render() {
        if (!this.container) return;
        
        this.container.innerHTML = '';
        
        // Main toolbar
        this.toolbarEl = document.createElement('div');
        this.toolbarEl.className = 'wb-toolbar';
        this.toolbarEl.innerHTML = this._getToolbarHTML();
        this.container.appendChild(this.toolbarEl);
        
        // Shape submenu (hidden by default)
        this.shapeMenuEl = document.createElement('div');
        this.shapeMenuEl.className = 'wb-shape-menu';
        this.shapeMenuEl.style.cssText = `
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            margin-top: 8px;
            display: none;
            background: white;
            border-radius: 8px;
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
            padding: 8px;
            z-index: 1000;
        `;
        this.shapeMenuEl.innerHTML = this._getShapeMenuHTML();
        this.toolbarEl.appendChild(this.shapeMenuEl);
    }

    /**
     * Get main toolbar HTML
     */
    _getToolbarHTML() {
        return `
            <!-- History Actions -->
            <div class="wb-toolbar-group">
                <button class="wb-toolbar-btn" data-action="undo" title="Undo (Ctrl+Z)" ${!this.canUndo ? 'disabled' : ''}>
                    ${getIcon('undo', 20)}
                    <span class="tooltip">Undo</span>
                </button>
                <button class="wb-toolbar-btn" data-action="redo" title="Redo (Ctrl+Y)" ${!this.canRedo ? 'disabled' : ''}>
                    ${getIcon('redo', 20)}
                    <span class="tooltip">Redo</span>
                </button>
            </div>
            
            <div class="wb-toolbar-divider"></div>
            
            <!-- Selection Tools -->
            <div class="wb-toolbar-group">
                <button class="wb-toolbar-btn ${this.currentTool === TOOLS.SELECT ? 'active' : ''}" 
                        data-tool="${TOOLS.SELECT}" title="Select (V)">
                    ${getIcon('mousePointer', 20)}
                    <span class="tooltip">Select</span>
                </button>
                <button class="wb-toolbar-btn ${this.currentTool === TOOLS.PAN ? 'active' : ''}" 
                        data-tool="${TOOLS.PAN}" title="Pan (H)">
                    ${getIcon('hand', 20)}
                    <span class="tooltip">Pan</span>
                </button>
            </div>
            
            <div class="wb-toolbar-divider"></div>
            
            <!-- Creation Tools -->
            <div class="wb-toolbar-group">
                <button class="wb-toolbar-btn ${this.currentTool === TOOLS.STICKY ? 'active' : ''}" 
                        data-tool="${TOOLS.STICKY}" title="Sticky Note (S)">
                    ${getIcon('stickyNote', 20)}
                    <span class="tooltip">Sticky Note</span>
                </button>
                <button class="wb-toolbar-btn ${this.currentTool === TOOLS.TEXT ? 'active' : ''}" 
                        data-tool="${TOOLS.TEXT}" title="Text (T)">
                    ${getIcon('type', 20)}
                    <span class="tooltip">Text</span>
                </button>
                <button class="wb-toolbar-btn ${this.currentTool === TOOLS.SHAPE ? 'active' : ''}" 
                        data-tool="${TOOLS.SHAPE}" 
                        data-has-submenu="true"
                        title="Shape (R)">
                    ${this._getShapeIcon()}
                    <span class="tooltip">Shape</span>
                </button>
                <button class="wb-toolbar-btn ${this.currentTool === TOOLS.FRAME ? 'active' : ''}" 
                        data-tool="${TOOLS.FRAME}" title="Frame (F)">
                    ${getIcon('frame', 20)}
                    <span class="tooltip">Frame</span>
                </button>
                <button class="wb-toolbar-btn ${this.currentTool === TOOLS.CONNECTOR ? 'active' : ''}" 
                        data-tool="${TOOLS.CONNECTOR}" title="Connector (L)">
                    ${getIcon('arrowRight', 20)}
                    <span class="tooltip">Connector</span>
                </button>
                <button class="wb-toolbar-btn ${this.currentTool === TOOLS.IMAGE ? 'active' : ''}" 
                        data-tool="${TOOLS.IMAGE}" title="Image">
                    ${getIcon('image', 20)}
                    <span class="tooltip">Image</span>
                </button>
            </div>
            
            <div class="wb-toolbar-divider"></div>
            
            <!-- Templates -->
            <div class="wb-toolbar-group">
                <button class="wb-toolbar-btn" data-action="templates" title="Templates">
                    ${getIcon('template', 20)}
                    <span class="tooltip">Templates</span>
                </button>
            </div>
        `;
    }

    /**
     * Get shape icon based on current shape type
     */
    _getShapeIcon() {
        const iconMap = {
            [SHAPE_TYPES.RECTANGLE]: 'square',
            [SHAPE_TYPES.ROUNDED_RECTANGLE]: 'roundedSquare',
            [SHAPE_TYPES.CIRCLE]: 'circle',
            [SHAPE_TYPES.TRIANGLE]: 'triangle',
            [SHAPE_TYPES.DIAMOND]: 'diamond',
            [SHAPE_TYPES.HEXAGON]: 'hexagon',
            [SHAPE_TYPES.STAR]: 'star'
        };
        return getIcon(iconMap[this.currentShapeType] || 'square', 20);
    }

    /**
     * Get shape submenu HTML
     */
    _getShapeMenuHTML() {
        const shapes = [
            { type: SHAPE_TYPES.RECTANGLE, icon: 'square', label: 'Rectangle' },
            { type: SHAPE_TYPES.ROUNDED_RECTANGLE, icon: 'roundedSquare', label: 'Rounded Rectangle' },
            { type: SHAPE_TYPES.CIRCLE, icon: 'circle', label: 'Circle' },
            { type: SHAPE_TYPES.ELLIPSE, icon: 'ellipse', label: 'Ellipse' },
            { type: SHAPE_TYPES.TRIANGLE, icon: 'triangle', label: 'Triangle' },
            { type: SHAPE_TYPES.DIAMOND, icon: 'diamond', label: 'Diamond' },
            { type: SHAPE_TYPES.HEXAGON, icon: 'hexagon', label: 'Hexagon' },
            { type: SHAPE_TYPES.STAR, icon: 'star', label: 'Star' }
        ];
        
        return `
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px;">
                ${shapes.map(s => `
                    <button class="wb-toolbar-btn ${this.currentShapeType === s.type ? 'active' : ''}"
                            data-shape="${s.type}"
                            title="${s.label}"
                            style="width: 40px; height: 40px;">
                        ${getIcon(s.icon, 20)}
                    </button>
                `).join('')}
            </div>
        `;
    }

    /**
     * Attach event listeners
     */
    _attachEventListeners() {
        if (!this.toolbarEl) return;
        
        // Tool buttons
        this.toolbarEl.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-tool]');
            if (btn) {
                const tool = btn.dataset.tool;
                
                // Handle shape submenu
                if (tool === TOOLS.SHAPE && btn.dataset.hasSubmenu) {
                    this._toggleShapeMenu();
                    return;
                }
                
                this._selectTool(tool);
            }
            
            // Action buttons
            const actionBtn = e.target.closest('[data-action]');
            if (actionBtn) {
                this._handleAction(actionBtn.dataset.action);
            }
            
            // Shape selection
            const shapeBtn = e.target.closest('[data-shape]');
            if (shapeBtn) {
                this._selectShape(shapeBtn.dataset.shape);
            }
        });
        
        // Close shape menu on outside click
        document.addEventListener('click', (e) => {
            if (!this.toolbarEl.contains(e.target)) {
                this._hideShapeMenu();
            }
        });
    }

    /**
     * Select tool
     * @param {string} tool
     */
    _selectTool(tool) {
        console.log('Toolbar _selectTool called with tool:', tool);
        alert('Sticky button clicked! Selected tool: ' + tool);
        this.currentTool = tool;
        this._updateToolButtons();
        this._hideShapeMenu();
        
        console.log('Calling onToolSelect callback with tool:', tool, 'shapeType:', tool === TOOLS.SHAPE ? this.currentShapeType : null);
        if (this.callbacks.onToolSelect) {
            this.callbacks.onToolSelect(tool, {
                shapeType: tool === TOOLS.SHAPE ? this.currentShapeType : null
            });
        } else {
            console.log('onToolSelect callback not set');
        }
    }

    /**
     * Select shape type
     * @param {string} shapeType
     */
    _selectShape(shapeType) {
        this.currentShapeType = shapeType;
        this.currentTool = TOOLS.SHAPE;
        this._updateToolButtons();
        this._hideShapeMenu();
        
        // Update shape button icon
        const shapeBtn = this.toolbarEl.querySelector(`[data-tool="${TOOLS.SHAPE}"]`);
        if (shapeBtn) {
            shapeBtn.innerHTML = `
                ${this._getShapeIcon()}
                <span class="tooltip">Shape</span>
            `;
        }
        
        if (this.callbacks.onToolSelect) {
            this.callbacks.onToolSelect(TOOLS.SHAPE, { shapeType });
        }
    }

    /**
     * Handle action button click
     * @param {string} action
     */
    _handleAction(action) {
        switch (action) {
            case 'undo':
                if (this.callbacks.onUndo) this.callbacks.onUndo();
                break;
            case 'redo':
                if (this.callbacks.onRedo) this.callbacks.onRedo();
                break;
            case 'save':
                if (this.callbacks.onSave) this.callbacks.onSave();
                break;
            case 'templates':
                if (this.callbacks.onTemplates) this.callbacks.onTemplates();
                break;
        }
    }

    /**
     * Update tool button states
     */
    _updateToolButtons() {
        this.toolbarEl.querySelectorAll('[data-tool]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === this.currentTool);
        });
    }

    /**
     * Toggle shape menu
     */
    _toggleShapeMenu() {
        const isVisible = this.shapeMenuEl.style.display !== 'none';
        this.shapeMenuEl.style.display = isVisible ? 'none' : 'block';
    }

    /**
     * Hide shape menu
     */
    _hideShapeMenu() {
        if (this.shapeMenuEl) {
            this.shapeMenuEl.style.display = 'none';
        }
    }

    /**
     * Set tool externally
     * @param {string} tool
     * @param {Object} options
     */
    setTool(tool, options = {}) {
        this.currentTool = tool;
        if (options.shapeType) {
            this.currentShapeType = options.shapeType;
        }
        this._updateToolButtons();
    }

    /**
     * Update undo/redo state
     * @param {boolean} canUndo
     * @param {boolean} canRedo
     */
    setHistoryState(canUndo, canRedo) {
        this.canUndo = canUndo;
        this.canRedo = canRedo;
        
        const undoBtn = this.toolbarEl?.querySelector('[data-action="undo"]');
        const redoBtn = this.toolbarEl?.querySelector('[data-action="redo"]');
        
        if (undoBtn) undoBtn.disabled = !canUndo;
        if (redoBtn) redoBtn.disabled = !canRedo;
    }

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
     * Destroy toolbar
     */
    destroy() {
        if (this.toolbarEl) {
            this.toolbarEl.remove();
        }
    }
}

/**
 * Secondary Toolbar (top right)
 */
export class SecondaryToolbar {
    constructor(containerEl) {
        this.container = containerEl;
        
        this.callbacks = {
            onSave: null,
            onShare: null,
            onExport: null,
            onSettings: null
        };
        
        this._init();
    }

    _init() {
        this._render();
        this._attachEventListeners();
    }

    _render() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="wb-toolbar-secondary">
                <button class="wb-btn" data-action="export">
                    ${getIcon('export', 18)}
                    Export
                </button>
                <button class="wb-btn wb-btn-primary" data-action="save">
                    ${getIcon('save', 18)}
                    Save
                </button>
            </div>
        `;
    }

    _attachEventListeners() {
        this.container.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            
            const action = btn.dataset.action;
            if (this.callbacks[`on${action.charAt(0).toUpperCase() + action.slice(1)}`]) {
                this.callbacks[`on${action.charAt(0).toUpperCase() + action.slice(1)}`]();
            }
        });
    }

    on(event, callback) {
        if (this.callbacks.hasOwnProperty(event)) {
            this.callbacks[event] = callback;
        }
    }

    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

export default Toolbar;