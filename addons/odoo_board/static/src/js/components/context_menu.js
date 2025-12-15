/** @odoo-module **/

import { getIcon } from '../utils/icons';

/**
 * Context Menu Component
 * Right-click menu for elements and canvas
 */
export class ContextMenu {
    constructor() {
        this.menuEl = null;
        this.isVisible = false;
        this.currentTarget = null;
        
        // Callbacks
        this.callbacks = {
            onAction: null
        };
        
        this._init();
    }

    /**
     * Initialize context menu
     */
    _init() {
        this._createDOM();
        this._attachEventListeners();
    }

    /**
     * Create DOM element
     */
    _createDOM() {
        this.menuEl = document.createElement('div');
        this.menuEl.className = 'wb-context-menu';
        this.menuEl.style.display = 'none';
        document.body.appendChild(this.menuEl);
    }

    /**
     * Attach event listeners
     */
    _attachEventListeners() {
        // Close on outside click
        document.addEventListener('mousedown', (e) => {
            if (this.isVisible && !this.menuEl.contains(e.target)) {
                this.hide();
            }
        });
        
        // Close on scroll
        document.addEventListener('wheel', () => {
            if (this.isVisible) {
                this.hide();
            }
        });
        
        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
        
        // Handle menu item clicks
        this.menuEl.addEventListener('click', (e) => {
            const item = e.target.closest('.wb-context-menu-item');
            if (!item || item.classList.contains('disabled')) return;
            
            const action = item.dataset.action;
            if (action && this.callbacks.onAction) {
                this.callbacks.onAction(action, this.currentTarget);
            }
            
            this.hide();
        });
        
        // Handle submenu hover
        this.menuEl.addEventListener('mouseenter', (e) => {
            const item = e.target.closest('.wb-context-menu-item[data-submenu]');
            if (item) {
                this._showSubmenu(item);
            }
        }, true);
    }

    /**
     * Show context menu
     * @param {number} x - Screen X position
     * @param {number} y - Screen Y position
     * @param {Array} items - Menu items
     * @param {Object} target - Target element/data
     */
    show(x, y, items, target = null) {
        this.currentTarget = target;
        this.menuEl.innerHTML = this._renderItems(items);
        this.menuEl.style.display = 'block';
        
        // Position menu, ensuring it stays within viewport
        const rect = this.menuEl.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let posX = x;
        let posY = y;
        
        if (x + rect.width > viewportWidth) {
            posX = viewportWidth - rect.width - 10;
        }
        
        if (y + rect.height > viewportHeight) {
            posY = viewportHeight - rect.height - 10;
        }
        
        this.menuEl.style.left = `${posX}px`;
        this.menuEl.style.top = `${posY}px`;
        
        this.isVisible = true;
    }

    /**
     * Hide context menu
     */
    hide() {
        if (this.menuEl) {
            this.menuEl.style.display = 'none';
        }
        this.isVisible = false;
        this.currentTarget = null;
    }

    /**
     * Render menu items
     * @param {Array} items
     * @returns {string}
     */
    _renderItems(items) {
        return items.map(item => {
            if (item.id === 'divider') {
                return '<div class="wb-context-menu-divider"></div>';
            }
            
            const icon = item.icon ? getIcon(item.icon, 16) : '';
            const shortcut = item.shortcut ? `<span class="wb-context-menu-shortcut">${item.shortcut}</span>` : '';
            const checkmark = item.checked ? getIcon('check', 14) : '';
            const dangerClass = item.danger ? 'danger' : '';
            const disabledClass = item.disabled ? 'disabled' : '';
            const hasSubmenu = item.submenu ? 'data-submenu="true"' : '';
            const submenuArrow = item.submenu ? '<span style="margin-left: auto;">▸</span>' : '';
            
            return `
                <div class="wb-context-menu-item ${dangerClass} ${disabledClass}" 
                     data-action="${item.id}" ${hasSubmenu}>
                    ${checkmark}
                    ${icon}
                    <span>${item.label}</span>
                    ${shortcut}
                    ${submenuArrow}
                    ${item.submenu ? this._renderSubmenu(item.submenu) : ''}
                </div>
            `;
        }).join('');
    }

    /**
     * Render submenu
     * @param {Array} items
     * @returns {string}
     */
    _renderSubmenu(items) {
        return `
            <div class="wb-context-submenu" style="display: none; position: absolute; left: 100%; top: 0; min-width: 150px; background: white; border-radius: 8px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); padding: 8px 0; z-index: 10001;">
                ${items.map(item => {
                    const icon = item.icon ? getIcon(item.icon, 16) : '';
                    const colorSwatch = item.color ? `<span style="width: 16px; height: 16px; background: ${item.color}; border-radius: 4px; margin-right: 8px;"></span>` : '';
                    
                    return `
                        <div class="wb-context-menu-item" data-action="${item.id}">
                            ${colorSwatch}
                            ${icon}
                            <span>${item.label}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    /**
     * Show submenu
     * @param {HTMLElement} parentItem
     */
    _showSubmenu(parentItem) {
        // Hide all other submenus
        this.menuEl.querySelectorAll('.wb-context-submenu').forEach(sub => {
            sub.style.display = 'none';
        });
        
        const submenu = parentItem.querySelector('.wb-context-submenu');
        if (submenu) {
            submenu.style.display = 'block';
        }
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
     * Get default canvas menu items
     * @returns {Array}
     */
    static getCanvasMenuItems() {
        return [
            { id: 'paste', label: 'Paste', icon: 'clipboard', shortcut: 'Ctrl+V' },
            { id: 'divider' },
            { id: 'selectAll', label: 'Select All', icon: 'grid', shortcut: 'Ctrl+A' },
            { id: 'divider' },
            { id: 'fitToScreen', label: 'Fit to Screen', icon: 'maximize', shortcut: 'Ctrl+1' },
            { id: 'resetZoom', label: 'Reset Zoom', icon: 'zoomIn', shortcut: 'Ctrl+0' }
        ];
    }

    /**
     * Get default element menu items
     * @param {BaseElement} element
     * @returns {Array}
     */
    static getElementMenuItems(element) {
        if (element && typeof element.getContextMenuActions === 'function') {
            return element.getContextMenuActions();
        }
        
        // Default menu
        return [
            { id: 'edit', label: 'Edit', icon: 'pencil' },
            { id: 'divider' },
            { id: 'copy', label: 'Copy', icon: 'copy', shortcut: 'Ctrl+C' },
            { id: 'cut', label: 'Cut', icon: 'scissors', shortcut: 'Ctrl+X' },
            { id: 'duplicate', label: 'Duplicate', icon: 'duplicate', shortcut: 'Ctrl+D' },
            { id: 'divider' },
            { id: 'bringForward', label: 'Bring Forward', icon: 'bringForward', shortcut: 'Ctrl+]' },
            { id: 'sendBackward', label: 'Send Backward', icon: 'sendBackward', shortcut: 'Ctrl+[' },
            { id: 'bringToFront', label: 'Bring to Front', icon: 'bringForward', shortcut: 'Ctrl+Shift+]' },
            { id: 'sendToBack', label: 'Send to Back', icon: 'sendBackward', shortcut: 'Ctrl+Shift+[' },
            { id: 'divider' },
            { id: 'lock', label: element?.locked ? 'Unlock' : 'Lock', icon: element?.locked ? 'unlock' : 'lock', shortcut: 'Ctrl+L' },
            { id: 'divider' },
            { id: 'delete', label: 'Delete', icon: 'trash', shortcut: 'Delete', danger: true }
        ];
    }

    /**
     * Get multi-selection menu items
     * @param {Array} elements
     * @returns {Array}
     */
    static getMultiSelectMenuItems(elements) {
        return [
            { id: 'copy', label: 'Copy', icon: 'copy', shortcut: 'Ctrl+C' },
            { id: 'cut', label: 'Cut', icon: 'scissors', shortcut: 'Ctrl+X' },
            { id: 'duplicate', label: 'Duplicate', icon: 'duplicate', shortcut: 'Ctrl+D' },
            { id: 'divider' },
            { id: 'group', label: 'Group', icon: 'group', shortcut: 'Ctrl+G' },
            { id: 'divider' },
            { 
                id: 'align', 
                label: 'Align', 
                icon: 'alignLeft',
                submenu: [
                    { id: 'alignLeft', label: 'Align Left', icon: 'alignLeft' },
                    { id: 'alignCenter', label: 'Align Center', icon: 'alignCenter' },
                    { id: 'alignRight', label: 'Align Right', icon: 'alignRight' },
                    { id: 'alignTop', label: 'Align Top', icon: 'alignTop' },
                    { id: 'alignMiddle', label: 'Align Middle', icon: 'alignMiddle' },
                    { id: 'alignBottom', label: 'Align Bottom', icon: 'alignBottom' }
                ]
            },
            { 
                id: 'distribute', 
                label: 'Distribute',
                submenu: [
                    { id: 'distributeHorizontal', label: 'Distribute Horizontally' },
                    { id: 'distributeVertical', label: 'Distribute Vertically' }
                ]
            },
            { id: 'divider' },
            { id: 'delete', label: 'Delete All', icon: 'trash', shortcut: 'Delete', danger: true }
        ];
    }

    /**
     * Destroy context menu
     */
    destroy() {
        if (this.menuEl) {
            this.menuEl.remove();
        }
    }
}

export default ContextMenu;