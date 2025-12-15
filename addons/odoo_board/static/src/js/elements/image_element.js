/** @odoo-module **/

import { BaseElement } from './base_element';
import { ELEMENT_TYPES, ELEMENT_DEFAULTS } from '../utils/constants';

/**
 * Image Element
 * Insert images, screenshots, diagrams, and references
 */
export class ImageElement extends BaseElement {
    constructor(data = {}) {
        const defaults = ELEMENT_DEFAULTS.image;
        
        super({
            ...data,
            type: ELEMENT_TYPES.IMAGE,
            width: data.width || defaults.width,
            height: data.height || defaults.height,
            style: {
                borderRadius: data.style?.borderRadius || 8,
                borderWidth: data.style?.borderWidth || 0,
                borderColor: data.style?.borderColor || '#e2e8f0',
                shadow: data.style?.shadow !== false,
                objectFit: data.style?.objectFit || defaults.objectFit,
                ...data.style
            },
            properties: {
                src: data.properties?.src || null,
                alt: data.properties?.alt || 'Image',
                originalWidth: data.properties?.originalWidth || null,
                originalHeight: data.properties?.originalHeight || null,
                aspectRatio: data.properties?.aspectRatio || null,
                lockAspectRatio: data.properties?.lockAspectRatio !== false,
                ...data.properties
            }
        });
    }

    /**
     * Check if image has source
     * @returns {boolean}
     */
    hasImage() {
        return !!this.properties.src;
    }

    /**
     * Set image source
     * @param {string} src - Image URL or data URI
     */
    setImageSource(src) {
        this.properties.src = src;
        this._isDirty = true;
    }

    /**
     * Load image from file
     * @param {File} file
     * @returns {Promise}
     */
    loadFromFile(file) {
        return new Promise((resolve, reject) => {
            if (!file.type.startsWith('image/')) {
                reject(new Error('File is not an image'));
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target.result;
                
                // Get original dimensions
                const img = new Image();
                img.onload = () => {
                    this.properties.originalWidth = img.naturalWidth;
                    this.properties.originalHeight = img.naturalHeight;
                    this.properties.aspectRatio = img.naturalWidth / img.naturalHeight;
                    
                    // Auto-size based on original dimensions (max 600px)
                    const maxSize = 600;
                    if (img.naturalWidth > maxSize || img.naturalHeight > maxSize) {
                        if (img.naturalWidth > img.naturalHeight) {
                            this.width = maxSize;
                            this.height = maxSize / this.properties.aspectRatio;
                        } else {
                            this.height = maxSize;
                            this.width = maxSize * this.properties.aspectRatio;
                        }
                    } else {
                        this.width = img.naturalWidth;
                        this.height = img.naturalHeight;
                    }
                    
                    this.properties.src = dataUrl;
                    this.properties.alt = file.name;
                    this._isDirty = true;
                    resolve();
                };
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = dataUrl;
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    /**
     * Load image from URL
     * @param {string} url
     * @returns {Promise}
     */
    loadFromUrl(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                this.properties.originalWidth = img.naturalWidth;
                this.properties.originalHeight = img.naturalHeight;
                this.properties.aspectRatio = img.naturalWidth / img.naturalHeight;
                
                // Auto-size
                const maxSize = 600;
                if (img.naturalWidth > maxSize || img.naturalHeight > maxSize) {
                    if (img.naturalWidth > img.naturalHeight) {
                        this.width = maxSize;
                        this.height = maxSize / this.properties.aspectRatio;
                    } else {
                        this.height = maxSize;
                        this.width = maxSize * this.properties.aspectRatio;
                    }
                } else {
                    this.width = img.naturalWidth;
                    this.height = img.naturalHeight;
                }
                
                this.properties.src = url;
                this._isDirty = true;
                resolve();
            };
            img.onerror = () => reject(new Error('Failed to load image from URL'));
            img.src = url;
        });
    }

    /**
     * Set alt text
     * @param {string} alt
     */
    setAlt(alt) {
        this.properties.alt = alt;
        this._isDirty = true;
    }

    /**
     * Set object fit
     * @param {string} fit - 'contain', 'cover', 'fill', 'none', 'scale-down'
     */
    setObjectFit(fit) {
        this.style.objectFit = fit;
        this._isDirty = true;
    }

    /**
     * Toggle aspect ratio lock
     */
    toggleAspectRatioLock() {
        this.properties.lockAspectRatio = !this.properties.lockAspectRatio;
        this._isDirty = true;
    }

    /**
     * Set border radius
     * @param {number} radius
     */
    setBorderRadius(radius) {
        this.style.borderRadius = radius;
        this._isDirty = true;
    }

    /**
     * Add border
     * @param {number} width
     * @param {string} color
     */
    setBorder(width, color) {
        this.style.borderWidth = width;
        this.style.borderColor = color;
        this._isDirty = true;
    }

    /**
     * Toggle shadow
     */
    toggleShadow() {
        this.style.shadow = !this.style.shadow;
        this._isDirty = true;
    }

    /**
     * Reset to original size
     */
    resetToOriginalSize() {
        if (this.properties.originalWidth && this.properties.originalHeight) {
            this.width = this.properties.originalWidth;
            this.height = this.properties.originalHeight;
            this._isDirty = true;
        }
    }

    /**
     * Fit to specific size while maintaining aspect ratio
     * @param {number} maxWidth
     * @param {number} maxHeight
     */
    fitToSize(maxWidth, maxHeight) {
        if (!this.properties.aspectRatio) return;
        
        const aspectRatio = this.properties.aspectRatio;
        
        if (maxWidth / maxHeight > aspectRatio) {
            this.height = maxHeight;
            this.width = maxHeight * aspectRatio;
        } else {
            this.width = maxWidth;
            this.height = maxWidth / aspectRatio;
        }
        this._isDirty = true;
    }

    /**
     * Override resize to handle aspect ratio
     * @param {number} width
     * @param {number} height
     */
    resize(width, height) {
        if (this.locked) return;
        
        if (this.properties.lockAspectRatio && this.properties.aspectRatio) {
            // Maintain aspect ratio
            const aspectRatio = this.properties.aspectRatio;
            const newAspect = width / height;
            
            if (newAspect > aspectRatio) {
                this.width = Math.max(50, width);
                this.height = this.width / aspectRatio;
            } else {
                this.height = Math.max(50, height);
                this.width = this.height * aspectRatio;
            }
        } else {
            this.width = Math.max(50, width);
            this.height = Math.max(50, height);
        }
        
        this._isDirty = true;
    }

    /**
     * Override getCSSStyles
     */
    getCSSStyles() {
        const baseStyles = super.getCSSStyles();
        return {
            ...baseStyles,
            borderRadius: `${this.style.borderRadius}px`,
            border: this.style.borderWidth ? `${this.style.borderWidth}px solid ${this.style.borderColor}` : 'none',
            boxShadow: this.style.shadow ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)' : 'none',
            overflow: 'hidden'
        };
    }

    /**
     * Render image element
     * @returns {string}
     */
    render() {
        const styles = this.getStyleString();
        
        if (!this.hasImage()) {
            return this._renderPlaceholder(styles);
        }
        
        return `
            <div class="wb-element wb-image ${this.locked ? 'locked' : ''}"
                 data-id="${this.id}"
                 data-type="${this.type}"
                 style="${styles}">
                <div class="selection-box"></div>
                <img src="${this.properties.src}" 
                     alt="${this.escapeAttr(this.properties.alt)}"
                     style="width: 100%; height: 100%; object-fit: ${this.style.objectFit}; pointer-events: none;"/>
                ${this._renderResizeHandles()}
            </div>
        `;
    }

    /**
     * Render placeholder for empty image
     * @param {string} styles
     * @returns {string}
     */
    _renderPlaceholder(styles) {
        return `
            <div class="wb-element wb-image wb-image-placeholder ${this.locked ? 'locked' : ''}"
                 data-id="${this.id}"
                 data-type="${this.type}"
                 style="${styles}; display: flex; align-items: center; justify-content: center; flex-direction: column;
                        background: #f8fafc; border: 2px dashed #e2e8f0; cursor: pointer;">
                <div class="selection-box"></div>
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" 
                     stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                    <circle cx="9" cy="9" r="2"/>
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                </svg>
                <span style="margin-top: 12px; color: #64748b; font-size: 14px;">Click to add image</span>
                ${this._renderResizeHandles()}
            </div>
        `;
    }

    /**
     * Render resize handles
     * @returns {string}
     */
    _renderResizeHandles() {
        if (this.locked) return '';
        
        const handles = this.getResizeHandles();
        return handles.map(pos => 
            `<div class="wb-resize-handle ${pos}" data-handle="${pos}"></div>`
        ).join('');
    }

    /**
     * Escape HTML attribute
     * @param {string} text
     * @returns {string}
     */
    escapeAttr(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    /**
     * Get context menu actions
     * @returns {Array}
     */
    getContextMenuActions() {
        return [
            { id: 'replaceImage', label: 'Replace Image', icon: 'image' },
            { id: 'divider' },
            { id: 'resetSize', label: 'Reset to Original Size', icon: 'maximize' },
            { id: 'lockRatio', label: this.properties.lockAspectRatio ? 'Unlock Aspect Ratio' : 'Lock Aspect Ratio', icon: this.properties.lockAspectRatio ? 'unlock' : 'lock' },
            { id: 'divider' },
            {
                id: 'objectFit',
                label: 'Fit Mode',
                submenu: [
                    { id: 'fit-contain', label: 'Contain' },
                    { id: 'fit-cover', label: 'Cover' },
                    { id: 'fit-fill', label: 'Fill' }
                ]
            },
            { id: 'divider' },
            { id: 'copy', label: 'Copy', icon: 'copy', shortcut: 'Ctrl+C' },
            { id: 'duplicate', label: 'Duplicate', icon: 'duplicate', shortcut: 'Ctrl+D' },
            { id: 'divider' },
            { id: 'bringForward', label: 'Bring Forward', icon: 'bringForward' },
            { id: 'sendBackward', label: 'Send Backward', icon: 'sendBackward' },
            { id: 'divider' },
            { id: 'lock', label: this.locked ? 'Unlock' : 'Lock', icon: this.locked ? 'unlock' : 'lock' },
            { id: 'delete', label: 'Delete', icon: 'trash', shortcut: 'Delete', danger: true }
        ];
    }

    /**
     * Get minimum dimensions
     */
    getMinDimensions() {
        return { width: 50, height: 50 };
    }

    /**
     * Clone with offset
     */
    cloneWithOffset(offsetX = 20, offsetY = 20) {
        const clone = this.clone();
        clone.x += offsetX;
        clone.y += offsetY;
        return clone;
    }

    /**
     * Serialize
     */
    toJSON() {
        return {
            ...super.toJSON(),
            imageSrc: this.properties.src,
            imageAlt: this.properties.alt,
            originalDimensions: {
                width: this.properties.originalWidth,
                height: this.properties.originalHeight
            },
            aspectRatio: this.properties.aspectRatio,
            lockAspectRatio: this.properties.lockAspectRatio
        };
    }
}

// Register element type
window.__whiteboardElementTypes = window.__whiteboardElementTypes || {};
window.__whiteboardElementTypes[ELEMENT_TYPES.IMAGE] = ImageElement;

export default ImageElement;