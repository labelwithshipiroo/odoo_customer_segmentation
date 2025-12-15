/** @odoo-module **/

import { Component, useState, useRef, onMounted } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { WhiteboardElement } from "./whiteboard_element";

class OdooBoard extends Component {
    static template = "whiteboard.Board";
    static components = { WhiteboardElement };

    setup() {
        const rpc = useService("rpc");
        
        this.state = useState({
            elements: [],
            selectedTool: 'select',
            selectedElement: null,
            isDragging: false,
            dragOffset: { x: 0, y: 0 }
        });

        this.canvasRef = useRef("canvas");
        this.colors = ['#fef3c7', '#dbeafe', '#dcfce7', '#fce7f3', '#fed7d7', '#e0e7ff'];

        const boardId = this.props.action.context.board_id;
        if (boardId) {
            rpc('/web/dataset/call_kw', {
                model: 'whiteboard.board',
                method: 'get_elements',
                args: [boardId],
                kwargs: {}
            }).then(elements => {
                this.state.elements = elements;
            });
        }

        onMounted(() => {
            this.setupCanvas();
        });
    }

    setupCanvas() {
        const canvas = this.canvasRef.el;
        if (!canvas) return;

        canvas.addEventListener('mousedown', this.onCanvasMouseDown.bind(this));
        canvas.addEventListener('mousemove', this.onCanvasMouseMove.bind(this));
        canvas.addEventListener('mouseup', this.onCanvasMouseUp.bind(this));
    }

    selectTool(tool) {
        this.state.selectedTool = tool;
        this.state.selectedElement = null;
    }

    addElement(type) {
        const newElement = {
            id: Date.now(),
            type: type,
            content: type === 'sticky' ? 'New sticky note' : 'New text',
            x: 100,
            y: 100,
            width: type === 'sticky' ? 200 : 300,
            height: type === 'sticky' ? 150 : 100,
            color: this.colors[0],
            fontSize: 14
        };
        this.state.elements.push(newElement);
    }

    onSelectElement(elementId) {
        this.state.selectedElement = elementId;
    }

    deleteElement() {
        if (this.state.selectedElement) {
            this.state.elements = this.state.elements.filter(el => el.id !== this.state.selectedElement);
            this.state.selectedElement = null;
        }
    }

    changeColor(color) {
        if (this.state.selectedElement) {
            const element = this.state.elements.find(el => el.id === this.state.selectedElement);
            if (element) {
                element.color = color;
            }
        }
    }

    onDragStart(elementId, event) {
        this.state.isDragging = true;
        this.state.selectedElement = elementId;
        const element = this.state.elements.find(el => el.id === elementId);
        if (element) {
            this.state.dragOffset.x = event.clientX - element.x;
            this.state.dragOffset.y = event.clientY - element.y;
        }
    }

    onCanvasMouseDown(event) {
        if (this.state.selectedTool === 'select') {
            this.state.selectedElement = null;
        }
    }

    onCanvasMouseMove(event) {
        if (this.state.isDragging && this.state.selectedElement) {
            const element = this.state.elements.find(el => el.id === this.state.selectedElement);
            if (element) {
                element.x = event.clientX - this.state.dragOffset.x;
                element.y = event.clientY - this.state.dragOffset.y;
            }
        }
    }

    onCanvasMouseUp() {
        this.state.isDragging = false;
    }

    onUpdateContent(elementId, content) {
        const element = this.state.elements.find(el => el.id === elementId);
        if (element) {
            element.content = content;
        }
    }

    saveElements() {
        const rpc = useService("rpc");
        const boardId = this.props.action.context.board_id;
        if (boardId) {
            rpc('/web/dataset/call_kw', {
                model: 'whiteboard.board',
                method: 'save_elements',
                args: [boardId, this.state.elements],
                kwargs: {}
            }).then(() => {
                console.log('Saved');
            });
        }
    }
}

registry.category("lazy_components").add("OdooBoard", OdooBoard);

export { OdooBoard };