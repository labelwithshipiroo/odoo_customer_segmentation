/** @odoo-module **/

/**
 * History Manager for Undo/Redo functionality
 * Manages state history with snapshot-based approach
 */

export class HistoryManager {
    constructor(maxHistory = 50) {
        this.history = [];
        this.currentIndex = -1;
        this.maxHistory = maxHistory;
        this.isUndoing = false;
        this.isRedoing = false;
        this.batchMode = false;
        this.batchStart = -1;
    }

    /**
     * Push a new state to history
     * @param {Object} state - The state snapshot to save
     * @param {string} action - Description of the action
     */
    push(state, action = '') {
        if (this.isUndoing || this.isRedoing) return;
        
        // If we're in batch mode, only track the batch start
        if (this.batchMode) {
            if (this.batchStart === -1) {
                this.batchStart = this.currentIndex;
            }
            return;
        }
        
        // Remove any future states if we're not at the end
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }
        
        // Deep clone the state to prevent reference issues
        const snapshot = {
            state: JSON.parse(JSON.stringify(state)),
            action,
            timestamp: Date.now()
        };
        
        this.history.push(snapshot);
        this.currentIndex++;
        
        // Limit history size
        if (this.history.length > this.maxHistory) {
            this.history.shift();
            this.currentIndex--;
        }
    }

    /**
     * Start batching multiple changes into a single history entry
     */
    startBatch() {
        this.batchMode = true;
        this.batchStart = this.currentIndex;
    }

    /**
     * End batch mode and create a single history entry
     * @param {Object} state - Final state after batch
     * @param {string} action - Description of the batched action
     */
    endBatch(state, action = 'Batch operation') {
        if (!this.batchMode) return;
        
        this.batchMode = false;
        
        // Remove any states added during batch
        if (this.batchStart !== -1 && this.batchStart < this.currentIndex) {
            this.history = this.history.slice(0, this.batchStart + 1);
            this.currentIndex = this.batchStart;
        }
        
        this.batchStart = -1;
        this.push(state, action);
    }

    /**
     * Cancel batch mode without saving
     */
    cancelBatch() {
        this.batchMode = false;
        this.batchStart = -1;
    }

    /**
     * Undo to previous state
     * @returns {Object|null} The previous state or null if at beginning
     */
    undo() {
        if (!this.canUndo()) return null;
        
        this.isUndoing = true;
        this.currentIndex--;
        const snapshot = this.history[this.currentIndex];
        this.isUndoing = false;
        
        return snapshot ? snapshot.state : null;
    }

    /**
     * Redo to next state
     * @returns {Object|null} The next state or null if at end
     */
    redo() {
        if (!this.canRedo()) return null;
        
        this.isRedoing = true;
        this.currentIndex++;
        const snapshot = this.history[this.currentIndex];
        this.isRedoing = false;
        
        return snapshot ? snapshot.state : null;
    }

    /**
     * Check if undo is possible
     * @returns {boolean}
     */
    canUndo() {
        return this.currentIndex > 0;
    }

    /**
     * Check if redo is possible
     * @returns {boolean}
     */
    canRedo() {
        return this.currentIndex < this.history.length - 1;
    }

    /**
     * Get current state
     * @returns {Object|null}
     */
    getCurrentState() {
        if (this.currentIndex < 0 || this.currentIndex >= this.history.length) {
            return null;
        }
        return this.history[this.currentIndex].state;
    }

    /**
     * Get history info for display
     * @returns {Object} History information
     */
    getInfo() {
        return {
            canUndo: this.canUndo(),
            canRedo: this.canRedo(),
            historyLength: this.history.length,
            currentIndex: this.currentIndex,
            lastAction: this.currentIndex >= 0 ? this.history[this.currentIndex]?.action : null
        };
    }

    /**
     * Clear all history
     */
    clear() {
        this.history = [];
        this.currentIndex = -1;
        this.batchMode = false;
        this.batchStart = -1;
    }

    /**
     * Get full history for debugging
     * @returns {Array}
     */
    getFullHistory() {
        return this.history.map((snapshot, index) => ({
            index,
            action: snapshot.action,
            timestamp: snapshot.timestamp,
            isCurrent: index === this.currentIndex
        }));
    }
}

/**
 * Action Types for better history descriptions
 */
export const ACTION_TYPES = {
    CREATE_ELEMENT: 'Create element',
    DELETE_ELEMENT: 'Delete element',
    DELETE_ELEMENTS: 'Delete elements',
    MOVE_ELEMENT: 'Move element',
    MOVE_ELEMENTS: 'Move elements',
    RESIZE_ELEMENT: 'Resize element',
    ROTATE_ELEMENT: 'Rotate element',
    EDIT_CONTENT: 'Edit content',
    CHANGE_STYLE: 'Change style',
    CHANGE_COLOR: 'Change color',
    GROUP_ELEMENTS: 'Group elements',
    UNGROUP_ELEMENTS: 'Ungroup elements',
    COPY_ELEMENTS: 'Copy elements',
    PASTE_ELEMENTS: 'Paste elements',
    DUPLICATE_ELEMENTS: 'Duplicate elements',
    BRING_FORWARD: 'Bring forward',
    SEND_BACKWARD: 'Send backward',
    BRING_TO_FRONT: 'Bring to front',
    SEND_TO_BACK: 'Send to back',
    LOCK_ELEMENT: 'Lock element',
    UNLOCK_ELEMENT: 'Unlock element',
    ALIGN_ELEMENTS: 'Align elements',
    DISTRIBUTE_ELEMENTS: 'Distribute elements',
    LOAD_TEMPLATE: 'Load template',
    CLEAR_BOARD: 'Clear board'
};

export default { HistoryManager, ACTION_TYPES };