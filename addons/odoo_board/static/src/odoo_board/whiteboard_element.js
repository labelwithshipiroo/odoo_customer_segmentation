/** @odoo-module **/

import { Component, useState } from "@odoo/owl";

class WhiteboardElement extends Component {
    static template = "OdooBoard.Element";

    setup() {
        this.state = useState({
            isEditing: false
        });
    }

    get isSelected() {
        return this.props.selectedId === this.props.element.id;
    }

    onMouseDown(event) {
        event.stopPropagation();
        this.props.onSelect(this.props.element.id);
        if (this.state.isEditing) return;

        this.props.onDragStart(this.props.element.id, event);
    }

    onTextChange(event) {
        this.props.onUpdateContent(this.props.element.id, event.target.value);
    }
}

export { WhiteboardElement };