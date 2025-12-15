/** @odoo-module **/

/**
 * OdooBoard Constants
 * Central configuration for the whiteboard application
 */

export const ELEMENT_TYPES = {
    STICKY: 'sticky',
    TEXT: 'text',
    SHAPE: 'shape',
    FRAME: 'frame',
    CONNECTOR: 'connector',
    IMAGE: 'image',
    GROUP: 'group'
};

export const SHAPE_TYPES = {
    RECTANGLE: 'rectangle',
    ROUNDED_RECTANGLE: 'rounded-rectangle',
    CIRCLE: 'circle',
    ELLIPSE: 'ellipse',
    TRIANGLE: 'triangle',
    DIAMOND: 'diamond',
    HEXAGON: 'hexagon',
    STAR: 'star',
    ARROW_RIGHT: 'arrow-right',
    ARROW_LEFT: 'arrow-left',
    ARROW_UP: 'arrow-up',
    ARROW_DOWN: 'arrow-down'
};

export const CONNECTOR_TYPES = {
    STRAIGHT: 'straight',
    CURVED: 'curved',
    ELBOW: 'elbow'
};

export const CONNECTOR_ENDS = {
    NONE: 'none',
    ARROW: 'arrow',
    DOT: 'dot',
    DIAMOND: 'diamond'
};

export const TOOLS = {
    SELECT: 'select',
    PAN: 'pan',
    STICKY: 'sticky',
    TEXT: 'text',
    SHAPE: 'shape',
    FRAME: 'frame',
    CONNECTOR: 'connector',
    IMAGE: 'image',
    DRAW: 'draw',
    ERASER: 'eraser'
};

export const STICKY_COLORS = [
    { name: 'yellow', value: '#fef3c7', textColor: '#92400e' },
    { name: 'blue', value: '#dbeafe', textColor: '#1e40af' },
    { name: 'green', value: '#dcfce7', textColor: '#166534' },
    { name: 'pink', value: '#fce7f3', textColor: '#9d174d' },
    { name: 'purple', value: '#e9d5ff', textColor: '#6b21a8' },
    { name: 'orange', value: '#fed7aa', textColor: '#c2410c' },
    { name: 'red', value: '#fecaca', textColor: '#b91c1c' },
    { name: 'teal', value: '#ccfbf1', textColor: '#0f766e' },
    { name: 'gray', value: '#f1f5f9', textColor: '#475569' }
];

export const SHAPE_COLORS = [
    { name: 'white', fill: '#ffffff', stroke: '#1e293b' },
    { name: 'gray', fill: '#f1f5f9', stroke: '#64748b' },
    { name: 'blue', fill: '#dbeafe', stroke: '#2563eb' },
    { name: 'green', fill: '#dcfce7', stroke: '#16a34a' },
    { name: 'yellow', fill: '#fef3c7', stroke: '#ca8a04' },
    { name: 'red', fill: '#fecaca', stroke: '#dc2626' },
    { name: 'purple', fill: '#e9d5ff', stroke: '#9333ea' },
    { name: 'pink', fill: '#fce7f3', stroke: '#db2777' },
    { name: 'teal', fill: '#ccfbf1', stroke: '#0d9488' }
];

export const CONNECTOR_COLORS = [
    { name: 'black', value: '#1e293b' },
    { name: 'gray', value: '#64748b' },
    { name: 'blue', value: '#2563eb' },
    { name: 'green', value: '#16a34a' },
    { name: 'red', value: '#dc2626' },
    { name: 'purple', value: '#9333ea' },
    { name: 'orange', value: '#ea580c' }
];

export const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72];

export const FONT_FAMILIES = [
    { name: 'Inter', value: 'Inter, sans-serif' },
    { name: 'Roboto', value: 'Roboto, sans-serif' },
    { name: 'Open Sans', value: 'Open Sans, sans-serif' },
    { name: 'Lato', value: 'Lato, sans-serif' },
    { name: 'Poppins', value: 'Poppins, sans-serif' },
    { name: 'Playfair', value: 'Playfair Display, serif' },
    { name: 'Courier', value: 'Courier New, monospace' }
];

export const STROKE_WIDTHS = [1, 2, 3, 4, 6, 8];

export const LINE_STYLES = [
    { name: 'solid', value: 'solid' },
    { name: 'dashed', value: 'dashed' },
    { name: 'dotted', value: 'dotted' }
];

export const CANVAS_CONFIG = {
    MIN_ZOOM: 0.1,
    MAX_ZOOM: 5,
    ZOOM_STEP: 0.1,
    GRID_SIZE: 20,
    SNAP_THRESHOLD: 10,
    DEFAULT_ZOOM: 1,
    SCROLL_ZOOM_SENSITIVITY: 0.001
};

export const ELEMENT_DEFAULTS = {
    sticky: {
        width: 200,
        height: 160,
        color: STICKY_COLORS[0].value,
        textColor: STICKY_COLORS[0].textColor,
        fontSize: 14,
        content: ''
    },
    text: {
        width: 200,
        height: 40,
        fontSize: 16,
        fontFamily: FONT_FAMILIES[0].value,
        color: '#1e293b',
        content: ''
    },
    shape: {
        width: 150,
        height: 100,
        shapeType: SHAPE_TYPES.RECTANGLE,
        fill: SHAPE_COLORS[0].fill,
        stroke: SHAPE_COLORS[0].stroke,
        strokeWidth: 2,
        content: ''
    },
    frame: {
        width: 400,
        height: 300,
        title: 'Frame',
        backgroundColor: 'transparent',
        borderColor: '#e2e8f0'
    },
    connector: {
        connectorType: CONNECTOR_TYPES.CURVED,
        startEnd: CONNECTOR_ENDS.NONE,
        endEnd: CONNECTOR_ENDS.ARROW,
        color: CONNECTOR_COLORS[0].value,
        strokeWidth: 2,
        lineStyle: LINE_STYLES[0].value
    },
    image: {
        width: 300,
        height: 200,
        objectFit: 'contain'
    }
};

export const KEYBOARD_SHORTCUTS = {
    DELETE: ['Delete', 'Backspace'],
    COPY: ['ctrl+c', 'meta+c'],
    CUT: ['ctrl+x', 'meta+x'],
    PASTE: ['ctrl+v', 'meta+v'],
    UNDO: ['ctrl+z', 'meta+z'],
    REDO: ['ctrl+shift+z', 'meta+shift+z', 'ctrl+y', 'meta+y'],
    SELECT_ALL: ['ctrl+a', 'meta+a'],
    DUPLICATE: ['ctrl+d', 'meta+d'],
    GROUP: ['ctrl+g', 'meta+g'],
    UNGROUP: ['ctrl+shift+g', 'meta+shift+g'],
    BRING_FORWARD: ['ctrl+]', 'meta+]'],
    SEND_BACKWARD: ['ctrl+[', 'meta+['],
    BRING_TO_FRONT: ['ctrl+shift+]', 'meta+shift+]'],
    SEND_TO_BACK: ['ctrl+shift+[', 'meta+shift+['],
    LOCK: ['ctrl+l', 'meta+l'],
    ZOOM_IN: ['ctrl+=', 'meta+=', 'ctrl++', 'meta++'],
    ZOOM_OUT: ['ctrl+-', 'meta+-'],
    ZOOM_RESET: ['ctrl+0', 'meta+0'],
    FIT_TO_SCREEN: ['ctrl+1', 'meta+1'],
    SAVE: ['ctrl+s', 'meta+s'],
    ESCAPE: ['Escape']
};

export const ALIGNMENT = {
    LEFT: 'left',
    CENTER: 'center',
    RIGHT: 'right',
    TOP: 'top',
    MIDDLE: 'middle',
    BOTTOM: 'bottom',
    DISTRIBUTE_H: 'distribute-horizontal',
    DISTRIBUTE_V: 'distribute-vertical'
};

export const TEMPLATES = [
    {
        id: 'blank',
        name: 'Blank Board',
        description: 'Start with a clean slate',
        category: 'custom',
        elements: []
    },
    {
        id: 'brainstorm',
        name: 'Brainstorming',
        description: 'Capture ideas with sticky notes',
        category: 'brainstorm',
        elements: [
            {
                type: ELEMENT_TYPES.FRAME,
                x: 100,
                y: 100,
                width: 600,
                height: 400,
                properties: { title: 'Ideas' }
            },
            {
                type: ELEMENT_TYPES.TEXT,
                x: 300,
                y: 50,
                width: 200,
                height: 40,
                content: '💡 Brainstorming Session',
                style: { fontSize: 24, fontWeight: 'bold' }
            }
        ]
    },
    {
        id: 'flowchart',
        name: 'Flowchart',
        description: 'Map out processes and workflows',
        category: 'flowchart',
        elements: [
            {
                type: ELEMENT_TYPES.SHAPE,
                x: 300,
                y: 100,
                width: 150,
                height: 60,
                properties: { shapeType: SHAPE_TYPES.ROUNDED_RECTANGLE },
                content: 'Start'
            },
            {
                type: ELEMENT_TYPES.SHAPE,
                x: 300,
                y: 220,
                width: 150,
                height: 100,
                properties: { shapeType: SHAPE_TYPES.RECTANGLE },
                content: 'Process'
            },
            {
                type: ELEMENT_TYPES.SHAPE,
                x: 300,
                y: 380,
                width: 120,
                height: 80,
                properties: { shapeType: SHAPE_TYPES.DIAMOND },
                content: 'Decision'
            }
        ]
    },
    {
        id: 'kanban',
        name: 'Kanban Board',
        description: 'Organize tasks in columns',
        category: 'kanban',
        elements: [
            {
                type: ELEMENT_TYPES.FRAME,
                x: 50,
                y: 100,
                width: 300,
                height: 500,
                properties: { title: 'To Do' }
            },
            {
                type: ELEMENT_TYPES.FRAME,
                x: 370,
                y: 100,
                width: 300,
                height: 500,
                properties: { title: 'In Progress' }
            },
            {
                type: ELEMENT_TYPES.FRAME,
                x: 690,
                y: 100,
                width: 300,
                height: 500,
                properties: { title: 'Done' }
            }
        ]
    },
    {
        id: 'retrospective',
        name: 'Retrospective',
        description: 'Review what went well and what to improve',
        category: 'retrospective',
        elements: [
            {
                type: ELEMENT_TYPES.FRAME,
                x: 50,
                y: 100,
                width: 350,
                height: 400,
                properties: { title: '✅ What went well' }
            },
            {
                type: ELEMENT_TYPES.FRAME,
                x: 420,
                y: 100,
                width: 350,
                height: 400,
                properties: { title: '🔧 What to improve' }
            },
            {
                type: ELEMENT_TYPES.FRAME,
                x: 790,
                y: 100,
                width: 350,
                height: 400,
                properties: { title: '💡 Action items' }
            }
        ]
    },
    {
        id: 'mindmap',
        name: 'Mind Map',
        description: 'Explore ideas radiating from a central concept',
        category: 'mindmap',
        elements: [
            {
                type: ELEMENT_TYPES.SHAPE,
                x: 400,
                y: 250,
                width: 180,
                height: 80,
                properties: { shapeType: SHAPE_TYPES.ROUNDED_RECTANGLE },
                content: 'Central Idea',
                style: { fill: '#dbeafe', stroke: '#2563eb', fontSize: 18 }
            }
        ]
    }
];

export default {
    ELEMENT_TYPES,
    SHAPE_TYPES,
    CONNECTOR_TYPES,
    CONNECTOR_ENDS,
    TOOLS,
    STICKY_COLORS,
    SHAPE_COLORS,
    CONNECTOR_COLORS,
    FONT_SIZES,
    FONT_FAMILIES,
    STROKE_WIDTHS,
    LINE_STYLES,
    CANVAS_CONFIG,
    ELEMENT_DEFAULTS,
    KEYBOARD_SHORTCUTS,
    ALIGNMENT,
    TEMPLATES
};