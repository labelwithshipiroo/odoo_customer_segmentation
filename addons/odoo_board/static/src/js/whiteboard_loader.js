/** @odoo-module **/

import { Component, useState, useRef, onMounted, onWillUnmount, useEffect } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { WhiteboardApp } from "./whiteboard_app";

/**
 * WhiteboardView OWL Component
 * Main component for the whiteboard that integrates with Odoo
 */
export class WhiteboardView extends Component {
    static template = "odoo_board.WhiteboardView";
    static props = {
        action: { type: Object, optional: true },
        actionId: { type: Number, optional: true },
        globalState: { type: Object, optional: true },
    };
    
    setup() {
        console.log('WhiteboardView setup called');
        this.containerRef = useRef("container");
        this.orm = useService("orm");
        this.notification = useService("notification");
        this.action = useService("action");

        this.state = useState({
            loading: false,
            error: null,
            boardId: null,
            boardName: '',
        });

        this.whiteboardApp = null;

        // Get board ID from action context or params
        const context = this.props.action?.context || {};
        const params = this.props.action?.params || {};
        this.state.boardId = context.active_id || params.board_id || null;
        console.log('Board ID from props:', this.state.boardId);
        console.log('Action props:', this.props.action);

        onMounted(async () => {
            console.log('WhiteboardView onMounted called');
            // Create whiteboard app first
            this._createWhiteboardApp();
            // Then initialize with data
            await this._initWhiteboard();
        });

        onWillUnmount(() => {
            this._destroyWhiteboard();
        });
    }

    /**
     * Create the whiteboard app instance
     */
    _createWhiteboardApp() {
        const container = this.containerRef.el;
        if (!container) return;

        // Initialize whiteboard app
        this.whiteboardApp = new WhiteboardApp(container, {
            boardId: this.state.boardId,
            boardName: this.state.boardName,
            readOnly: false,
            showMinimap: true,
            showToolbar: true,
            autoSave: true,
        });

        // Set up RPC function for the whiteboard
        this.whiteboardApp.setRpc(this._rpc.bind(this));
    }

    /**
     * Initialize the whiteboard application
     */
    async _initWhiteboard() {
        console.log('Initializing whiteboard...');
        this.state.loading = true;
        this.state.error = null;

        try {
            console.log('Board ID:', this.state.boardId);

            // If no board ID, create a new board
            if (!this.state.boardId) {
                console.log('No board ID, creating new board...');
                const newBoardIds = await this.orm.create('whiteboard.board', [{
                    name: 'New Board',
                }]);
                this.state.boardId = newBoardIds[0];
                console.log('Created new board with ID:', this.state.boardId);
            }

            console.log('Loading board data for ID:', this.state.boardId);
            // Load board data
            const boards = await this.orm.read('whiteboard.board', [this.state.boardId], ['name', 'board_data', 'canvas_state']);
            console.log('Board data loaded:', boards);

            if (!boards || boards.length === 0) {
                console.error('Board not found');
                this.state.error = 'Board not found';
                this.state.loading = false;
                return;
            }

            const board = boards[0];
            this.state.boardName = board.name;
            console.log('Board name:', board.name);

            // Check if whiteboardApp exists
            if (!this.whiteboardApp) {
                console.error('WhiteboardApp not initialized');
                this.state.error = 'Whiteboard app not initialized';
                this.state.loading = false;
                return;
            }

            // Update whiteboard app with board info
            this.whiteboardApp.options.boardId = this.state.boardId;
            this.whiteboardApp.options.boardName = board.name;
            this.whiteboardApp.boardId = this.state.boardId;
            this.whiteboardApp.boardName = board.name;
            console.log('Updated whiteboard app with board info');

            // Update name input
            const nameInput = this.boardNameContainer?.querySelector('input');
            if (nameInput) {
                nameInput.value = board.name;
            }

            // Load existing board data
            if (board.board_data) {
                console.log('Loading existing board data...');
                try {
                    const boardData = JSON.parse(board.board_data);
                    const canvasState = board.canvas_state ? JSON.parse(board.canvas_state) : null;
                    console.log('Parsed board data:', boardData);
                    this.whiteboardApp.canvas.importData({
                        elements: boardData.elements || [],
                        transform: canvasState
                    });
                    console.log('Imported board data into canvas');
                } catch (e) {
                    console.error('Failed to parse board data:', e);
                }
            }

            console.log('Whiteboard initialization completed successfully');
            this.state.loading = false;
        } catch (error) {
            console.error('Failed to initialize whiteboard:', error);
            console.error('Error details:', error.message, error.stack);
            this.state.error = error.message || 'Failed to load whiteboard';
            this.state.loading = false;
        }
    }

    /**
     * RPC function for the whiteboard app
     */
    async _rpc(route, params) {
        if (route === '/web/dataset/call_kw') {
            // Handle ORM calls
            return this.orm.call(params.model, params.method, params.args || [], params.kwargs || {});
        }
        return null;
    }

    /**
     * Destroy whiteboard
     */
    _destroyWhiteboard() {
        if (this.whiteboardApp) {
            // Auto-save before destroying
            if (this.whiteboardApp.isDirty) {
                this._saveBoard();
            }
            this.whiteboardApp.destroy();
            this.whiteboardApp = null;
        }
    }

    /**
     * Save board to server
     */
    async _saveBoard() {
        if (!this.whiteboardApp || !this.state.boardId) return;
        
        try {
            const data = this.whiteboardApp.getBoardData();
            await this.orm.write('whiteboard.board', [this.state.boardId], {
                name: data.name,
                board_data: JSON.stringify({ elements: data.elements }),
                canvas_state: JSON.stringify(data.transform),
            });
            
            this.whiteboardApp.isDirty = false;
            
            this.notification.add(this.env._t('Board saved'), {
                type: 'success',
                sticky: false,
            });
        } catch (error) {
            console.error('Failed to save board:', error);
            this.notification.add(this.env._t('Failed to save board'), {
                type: 'danger',
                sticky: false,
            });
        }
    }

    /**
     * Handle save button click
     */
    onSave() {
        this._saveBoard();
    }

    /**
     * Handle back button click
     */
    onBack() {
        this.action.doAction({
            type: 'ir.actions.act_window',
            res_model: 'whiteboard.board',
            views: [[false, 'kanban'], [false, 'list'], [false, 'form']],
            target: 'current',
        });
    }
}

WhiteboardView.template = "odoo_board.WhiteboardView";

/**
 * WhiteboardForm Component
 * Embedded whiteboard in form view
 */
export class WhiteboardFormWidget extends Component {
    static template = "odoo_board.WhiteboardFormWidget";
    static props = {
        id: { type: Number, optional: true },
        record: { type: Object, optional: true },
    };
    
    setup() {
        this.containerRef = useRef("container");
        this.orm = useService("orm");

        this.whiteboardApp = null;

        onMounted(async () => {
            // Create whiteboard app first
            this._createWhiteboardApp();
            // Then initialize with data
            await this._initWhiteboard();
        });

        onWillUnmount(() => {
            if (this.whiteboardApp) {
                this.whiteboardApp.destroy();
            }
        });
    }

    /**
     * Create the whiteboard app instance
     */
    _createWhiteboardApp() {
        const container = this.containerRef.el;
        if (!container) return;

        // Initialize whiteboard app
        this.whiteboardApp = new WhiteboardApp(container, {
            boardId: null,
            boardName: 'Form Widget',
            readOnly: false,
            showMinimap: true,
            showToolbar: true,
            autoSave: false,
        });
    }

    async _initWhiteboard() {
        const boardId = this.props.record?.resId || this.props.id;
        if (!boardId || !this.whiteboardApp) return;

        // Load board data
        const boards = await this.orm.read('whiteboard.board', [boardId], ['name', 'board_data', 'canvas_state']);

        if (!boards || boards.length === 0) return;

        const board = boards[0];

        // Update whiteboard app with board info
        this.whiteboardApp.options.boardId = boardId;
        this.whiteboardApp.options.boardName = board.name;
        this.whiteboardApp.boardId = boardId;
        this.whiteboardApp.boardName = board.name;

        // Load existing board data
        if (board.board_data) {
            try {
                const boardData = JSON.parse(board.board_data);
                const canvasState = board.canvas_state ? JSON.parse(board.canvas_state) : null;
                this.whiteboardApp.canvas.importData({
                    elements: boardData.elements || [],
                    transform: canvasState
                });
            } catch (e) {
                console.error('Failed to parse board data:', e);
            }
        }
    }
}

/**
 * Kanban Card Component
 * Preview of whiteboard in kanban view
 */
export class WhiteboardKanbanPreview extends Component {
    static template = "odoo_board.WhiteboardKanbanPreview";
    static props = {
        record: { type: Object },
    };
    
    setup() {
        this.canvasRef = useRef("canvas");
        
        onMounted(() => {
            this._renderPreview();
        });
    }

    _renderPreview() {
        const canvas = this.canvasRef.el;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const record = this.props.record;
        
        // Set canvas size
        canvas.width = 200;
        canvas.height = 120;
        
        // Clear canvas
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Try to render preview from board data
        if (record.data.thumbnail) {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            };
            img.src = record.data.thumbnail;
        } else if (record.data.board_data) {
            try {
                const boardData = JSON.parse(record.data.board_data);
                this._renderMiniElements(ctx, boardData.elements || []);
            } catch (e) {
                // Just show empty preview
            }
        }
    }

    _renderMiniElements(ctx, elements) {
        if (elements.length === 0) return;
        
        // Calculate bounds
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const el of elements) {
            minX = Math.min(minX, el.x || 0);
            minY = Math.min(minY, el.y || 0);
            maxX = Math.max(maxX, (el.x || 0) + (el.width || 100));
            maxY = Math.max(maxY, (el.y || 0) + (el.height || 100));
        }
        
        // Calculate scale to fit
        const padding = 10;
        const scaleX = (ctx.canvas.width - padding * 2) / (maxX - minX || 1);
        const scaleY = (ctx.canvas.height - padding * 2) / (maxY - minY || 1);
        const scale = Math.min(scaleX, scaleY, 1);
        
        ctx.save();
        ctx.translate(padding, padding);
        ctx.scale(scale, scale);
        ctx.translate(-minX, -minY);
        
        // Draw elements
        for (const el of elements) {
            ctx.fillStyle = el.color || '#FFE066';
            ctx.globalAlpha = 0.8;
            
            const x = el.x || 0;
            const y = el.y || 0;
            const w = el.width || 100;
            const h = el.height || 100;
            
            if (el.type === 'shape') {
                switch (el.shapeType) {
                    case 'circle':
                        ctx.beginPath();
                        ctx.ellipse(x + w/2, y + h/2, w/2, h/2, 0, 0, Math.PI * 2);
                        ctx.fill();
                        break;
                    case 'triangle':
                        ctx.beginPath();
                        ctx.moveTo(x + w/2, y);
                        ctx.lineTo(x + w, y + h);
                        ctx.lineTo(x, y + h);
                        ctx.closePath();
                        ctx.fill();
                        break;
                    default:
                        ctx.fillRect(x, y, w, h);
                }
            } else if (el.type === 'connector') {
                ctx.strokeStyle = el.style?.stroke || '#374151';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(el.startX || x, el.startY || y);
                ctx.lineTo(el.endX || x + 100, el.endY || y);
                ctx.stroke();
            } else {
                ctx.fillRect(x, y, w, h);
            }
        }
        
        ctx.restore();
    }
}

// Register the whiteboard action
registry.category("actions").add("whiteboard_view", WhiteboardView);

// Register components
registry.category("view_widgets").add("whiteboard_form_widget", WhiteboardFormWidget);