/** @odoo-module **/

import { Component, useState, useRef, onMounted, onWillUnmount } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";

class WhiteboardElement extends Component {
    setup() {
        this.state = useState({
            isEditing: false
        });
    }

    onMouseDown(ev) {
        ev.stopPropagation();
        this.props.onSelect(this.props.element.id);
        this.props.onDragStart(ev, this.props.element);
    }

    onTextChange(ev) {
        this.props.onUpdateContent(this.props.element.id, ev.target.value);
    }

    get isSelected() {
        return this.props.selectedId === this.props.element.id;
    }
}

WhiteboardElement.template = "whiteboard.Element";

class OdooWhiteboard extends Component {
    setup() {
        this.canvasRef = useRef("canvas");
        this.state = useState({
            elements: [],
            selectedTool: 'select',
            selectedElement: null,
            dragging: null,
            offset: { x: 0, y: 0 }
        });

        this.colors = ['#FFE66D', '#FF6B6B', '#4ECDC4', '#95E1D3', '#C7CEEA'];

        onMounted(() => {
            this.loadElements();
        });
    }

    loadElements() {
        // Load from local state or backend
        const saved = sessionStorage.getItem('whiteboard_elements');
        if (saved) {
            this.state.elements = JSON.parse(saved);
        }
    }

    saveElements() {
        // Save to backend or session storage
        sessionStorage.setItem('whiteboard_elements', JSON.stringify(this.state.elements));
        this.env.services.notification.add("Whiteboard saved!", { type: "success" });
    }

    addElement(type) {
        const canvas = this.canvasRef.el;
        const rect = canvas.getBoundingClientRect();
        
        const newElement = {
            id: Date.now(),
            type: type,
            x: rect.width / 2 - 100,
            y: rect.height / 2 - 50,
            width: type === 'sticky' ? 200 : 300,
            height: type === 'sticky' ? 200 : 150,
            content: type === 'sticky' ? 'New note...' : 'Enter text...',
            color: this.colors[Math.floor(Math.random() * this.colors.length)],
            fontSize: type === 'sticky' ? 14 : 16
        };

        this.state.elements.push(newElement);
        this.state.selectedElement = newElement.id;
        this.state.selectedTool = 'select';
    }

    onDragStart(ev, element) {
        if (this.state.selectedTool === 'select') {
            this.state.dragging = element.id;
            const rect = ev.currentTarget.getBoundingClientRect();
            this.state.offset = {
                x: ev.clientX - rect.left,
                y: ev.clientY - rect.top
            };

            this.boundMouseMove = this.onMouseMove.bind(this);
            this.boundMouseUp = this.onMouseUp.bind(this);
            
            document.addEventListener('mousemove', this.boundMouseMove);
            document.addEventListener('mouseup', this.boundMouseUp);
        }
    }

    onMouseMove(ev) {
        if (this.state.dragging && this.state.selectedTool === 'select') {
            const canvas = this.canvasRef.el;
            const rect = canvas.getBoundingClientRect();

            const newX = ev.clientX - rect.left - this.state.offset.x;
            const newY = ev.clientY - rect.top - this.state.offset.y;

            const element = this.state.elements.find(el => el.id === this.state.dragging);
            if (element) {
                element.x = newX;
                element.y = newY;
            }
        }
    }

    onMouseUp() {
        this.state.dragging = null;
        if (this.boundMouseMove) {
            document.removeEventListener('mousemove', this.boundMouseMove);
            document.removeEventListener('mouseup', this.boundMouseUp);
        }
    }

    onUpdateContent(id, content) {
        const element = this.state.elements.find(el => el.id === id);
        if (element) {
            element.content = content;
        }
    }

    deleteElement() {
        if (this.state.selectedElement) {
            this.state.elements = this.state.elements.filter(
                el => el.id !== this.state.selectedElement
            );
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

    selectTool(tool) {
        this.state.selectedTool = tool;
    }

    onSelectElement(id) {
        this.state.selectedElement = id;
    }
}

OdooWhiteboard.template = "whiteboard.Board";
OdooWhiteboard.components = { WhiteboardElement };

// Register as Odoo action
registry.category("actions").add("whiteboard.board", OdooWhiteboard);

export default OdooWhiteboard;