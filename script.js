document.addEventListener('DOMContentLoaded', () => {
    console.log("PANLZ Initializing...");

    const panlzContainer = document.getElementById('panlz-container');
    const panelTemplate = document.getElementById('panel-template');
    const settingsModal = document.getElementById('settings-modal');
    const settingsForm = document.getElementById('settings-form');
    const closeModalBtn = settingsModal.querySelector('.modal-close');

    // --- Central Panel Manager ---
    class PanelManager {
        constructor(container) {
            this.container = container;
            this.panels = [];
            this.panelIdCounter = 0;
            this.globalSettings = { // Defaults mirroring CSS :root
                spacing: 10,
                rounding: 10,
                padding: 10,
                background: '', // No global default texture initially
            };
            this.initGlobalStyles();

            // Placeholder for interaction library setup
            this.initPanelRearrangement();
        }

        initGlobalStyles() {
            this.applyGlobalStyle('spacing', this.globalSettings.spacing);
            // Note: Rounding and Padding are typically per-panel, but we might have a global default
        }

        addPanel(config = {}) {
            const newId = `panel-${this.panelIdCounter++}`;
            const panelInstance = new Panel(newId, this, config);
            this.panels.push(panelInstance);
            this.container.appendChild(panelInstance.render());
            console.log(`Panel added: ${newId}`);
            return panelInstance;
        }

        removePanel(id) {
            const index = this.panels.findIndex(p => p.id === id);
            if (index > -1) {
                const panel = this.panels[index];
                panel.element.remove();
                this.panels.splice(index, 1);
                console.log(`Panel removed: ${id}`);
                // Potentially save layout state here
            }
        }

        getPanelById(id) {
            return this.panels.find(p => p.id === id);
        }

        applyGlobalStyle(property, value) {
             console.log(`Applying global style - ${property}: ${value}`);
             switch (property) {
                case 'spacing':
                    this.globalSettings.spacing = parseInt(value, 10) || 0;
                    document.documentElement.style.setProperty('--panel-spacing', `${this.globalSettings.spacing}px`);
                    break;
                // Add cases for other global styles if needed (e.g., global default rounding/padding)
                case 'background': // Apply to container or all panels without specific bg
                     this.globalSettings.background = value;
                     // Decide if global background applies to container or default panel bg
                     // document.documentElement.style.setProperty('--container-background-image', `url('${value}')`);
                     console.warn("Applying global background - implementation needed.");
                     break;
                case 'rounding':
                     this.globalSettings.rounding = parseInt(value, 10) || 0;
                      this.panels.forEach(p => p.applyStyle('rounding', this.globalSettings.rounding, true)); // Apply if 'applyAll'
                     break;
                case 'padding':
                     this.globalSettings.padding = parseInt(value, 10) || 0;
                      this.panels.forEach(p => p.applyStyle('padding', this.globalSettings.padding, true)); // Apply if 'applyAll'
                     break;

             }
             // Potentially save global settings state
        }

        // --- Interaction Library Placeholder ---
        initPanelRearrangement() {
            console.log("Placeholder: Initialize Panel Rearrangement (e.g., SortableJS)");
            // Example using SortableJS (if included):
            // if (typeof Sortable !== 'undefined') {
            //     new Sortable(this.container, {
            //         animation: 150,
            //         handle: '.panel-header', // Example: Only drag by header
            //         draggable: '.panel', // Specify draggable elements
            //         onEnd: (evt) => {
            //             console.log('Panel moved:', evt.item.id, 'New index:', evt.newIndex);
            //             // Update panel order in this.panels array if needed
            //             // Save new layout state
            //         }
            //     });
            // } else {
            //     console.warn("SortableJS library not found. Panel rearrangement disabled.");
            //     // Fallback to basic HTML drag/drop for panels (less smooth)
            //     this.initBasicPanelDrag();
            // }
             this.initBasicPanelDrag(); // Using basic HTML drag for now
        }

        // Basic HTML Drag/Drop for PANEL REARRANGEMENT (Limited Functionality)
        initBasicPanelDrag() {
             let draggedPanel = null;

             this.container.addEventListener('dragstart', (e) => {
                if (e.target.classList.contains('panel')) {
                    draggedPanel = e.target;
                    setTimeout(() => e.target.classList.add('dragging'), 0);
                     // Set data (panel ID)
                     e.dataTransfer.setData('text/plain', e.target.id);
                     e.dataTransfer.effectAllowed = 'move';
                     console.log(`Dragging panel: ${draggedPanel.id}`);
                }
             });

             this.container.addEventListener('dragend', (e) => {
                if (draggedPanel && e.target.classList.contains('panel')) {
                    e.target.classList.remove('dragging');
                    draggedPanel = null;
                    console.log("Panel drag end");
                    // Save layout might be needed here after drop
                }
             });

             this.container.addEventListener('dragover', (e) => {
                 e.preventDefault(); // Necessary to allow dropping
                 // Basic placeholder logic - doesn't truly reorder smoothly
                 const targetPanel = e.target.closest('.panel');
                 if (targetPanel && draggedPanel && targetPanel !== draggedPanel) {
                     // Determine drop position relative to targetPanel (complex logic needed here)
                 }
             });

             this.container.addEventListener('drop', (e) => {
                 e.preventDefault();
                 if (draggedPanel) {
                     const targetPanel = e.target.closest('.panel');
                     if (targetPanel && targetPanel !== draggedPanel) {
                         console.log(`Panel ${draggedPanel.id} dropped near ${targetPanel.id}`);
                         // Simple insertion logic (doesn't handle grid well)
                         // A library handles this MUCH better
                         const rect = targetPanel.getBoundingClientRect();
                         const offsetY = e.clientY - rect.top;
                         if (offsetY < rect.height / 2) {
                              targetPanel.parentNode.insertBefore(draggedPanel, targetPanel);
                         } else {
                              targetPanel.parentNode.insertBefore(draggedPanel, targetPanel.nextSibling);
                         }
                         // Update internal panel order and save layout
                         this.updatePanelOrderFromDOM();
                     }
                      draggedPanel.classList.remove('dragging');
                      draggedPanel = null; // Reset after drop handled by this listener
                 }
             });
        }

        updatePanelOrderFromDOM() {
            const panelElements = [...this.container.querySelectorAll('.panel')];
            this.panels.sort((a, b) => {
                return panelElements.indexOf(a.element) - panelElements.indexOf(b.element);
            });
            console.log("Panel order updated based on DOM.");
            this.saveLayout(); // Save after reordering
        }


        // --- Layout Persistence (Basic Example) ---
        saveLayout() {
            const layout = this.panels.map(p => ({
                id: p.id,
                config: p.getConfig() // Panel needs a method to return its config
            }));
            localStorage.setItem('panlzLayout', JSON.stringify(layout));
            console.log("Layout Saved");
        }

        loadLayout() {
            const savedLayout = localStorage.getItem('panlzLayout');
            if (savedLayout) {
                try {
                    const layout = JSON.parse(savedLayout);
                    // Clear existing panels before loading
                    this.panels.forEach(p => p.element.remove());
                    this.panels = [];
                    this.panelIdCounter = 0; // Reset counter or manage IDs carefully

                    layout.forEach(panelConfig => {
                        // Ensure loaded IDs don't clash if we didn't reset counter
                        const maxId = parseInt(panelConfig.id.split('-')[1]);
                         if (maxId >= this.panelIdCounter) {
                           this.panelIdCounter = maxId + 1;
                         }
                        this.addPanel(panelConfig.config); // Add panel with saved config
                    });
                    console.log("Layout Loaded");
                    return true;
                } catch (error) {
                    console.error("Error loading layout:", error);
                    localStorage.removeItem('panlzLayout'); // Clear corrupted data
                    return false;
                }
            }
            return false;
        }

    } // End PanelManager Class

    // --- Panel Class ---
    class Panel {
        constructor(id, manager, config = {}) {
            this.id = id;
            this.manager = manager;

            // Default configuration
            this.config = {
                title: 'Panel Title',
                widthClass: 'width-1-2', // Default width
                jsCode: '',
                customStyle: { // Store overrides
                    background: null,
                    rounding: null,
                    padding: null,
                },
                ...config // Merge provided config
            };

            this.element = null; // DOM element ref
            this.headerElement = null;
            this.titleElement = null;
            this.contentElement = null;
            this.settingsBtn = null;

            this.initContentDragDrop = this.initContentDragDrop.bind(this);
            this.runJsCode = this.runJsCode.bind(this);
        }

        render() {
            const templateClone = panelTemplate.content.cloneNode(true);
            this.element = templateClone.querySelector('.panel');
            this.element.id = this.id;
            this.element.style.cssText = ''; // Clear any previous inline styles if re-rendering

            this.headerElement = this.element.querySelector('.panel-header');
            this.titleElement = this.element.querySelector('.panel-title');
            this.contentElement = this.element.querySelector('.panel-content');
            this.settingsBtn = this.element.querySelector('.panel-settings-btn');

            // Apply initial config
            this.setTitle(this.config.title);
            this.setWidth(this.config.widthClass);

            // Apply custom styles from config
            this.applyStyle('background', this.config.customStyle.background);
            this.applyStyle('rounding', this.config.customStyle.rounding);
            this.applyStyle('padding', this.config.customStyle.padding);


            // Attach event listeners
            this.settingsBtn.addEventListener('click', () => this.openSettings());

            // Placeholder for panel resizing library hookup
            this.initResizing();

            // Initialize drag/drop listeners for CONTENT within this panel
            this.initContentDragDrop();

             // Run initial JS code if present
            if (this.config.jsCode) {
                this.runJsCode();
            } else {
                 // Default content if no JS
                 this.contentElement.innerHTML = '<p>Empty Panel</p><p draggable="true" class="draggable-item">Drag Me Too!</p>';
                 // Re-initialize drag/drop for default content
                 this.initContentDragDrop();
            }

            return this.element;
        }

        setTitle(title) {
            this.config.title = title;
            if (this.titleElement) {
                this.titleElement.textContent = title;
            }
        }

        setWidth(widthClass) {
            if (this.element) {
                 // Remove existing width classes
                 this.element.classList.remove('width-1-6', 'width-1-3', 'width-1-2', 'width-2-3', 'width-5-6', 'width-full');
                 // Add new width class
                 if (widthClass) {
                    this.element.classList.add(widthClass);
                    this.config.widthClass = widthClass;
                 }
            }
        }

        applyStyle(property, value, isGlobal = false) {
            if (!this.element) return;

             // If not applying globally, store as custom style
            if (!isGlobal && value !== null && value !== undefined) {
                 this.config.customStyle[property] = value;
            } else if (!isGlobal && (value === null || value === undefined)) {
                 // Explicitly removing custom style, revert to global/default
                 this.config.customStyle[property] = null;
            }


            // Determine the value to apply (custom overrides global/default)
            let effectiveValue = this.config.customStyle[property]; // Use custom first
             if (effectiveValue === null || effectiveValue === undefined) {
                  // Fallback to global/CSS default if no custom style
                 effectiveValue = this.manager.globalSettings[property] ?? null; // Use global if set
             }


             console.log(`Applying style to ${this.id} - ${property}: ${value} (Effective: ${effectiveValue}, isGlobal: ${isGlobal})`);

             // Apply the style using CSS Variables on the specific panel element
             switch(property) {
                 case 'background':
                     this.element.style.setProperty('--panel-custom-background-image', effectiveValue ? `url('${effectiveValue}')` : 'none');
                     break;
                 case 'rounding':
                      // Apply custom or fallback to root default
                      this.element.style.setProperty('--panel-custom-border-radius', effectiveValue !== null ? `${effectiveValue}px` : null); // null removes override
                     break;
                 case 'padding':
                      // Apply custom or fallback to root default
                       this.element.style.setProperty('--panel-custom-padding', effectiveValue !== null ? `${effectiveValue}px` : null); // null removes override
                     break;
                 // Spacing is handled globally by PanelManager
             }
             // Save layout if needed after style change
             // this.manager.saveLayout(); // Potentially save on style change
        }


        openSettings() {
             console.log(`Opening settings for ${this.id}`);
             // Populate modal with current panel's settings
             settingsForm.querySelector('#settings-panel-id').value = this.id;
             settingsForm.querySelector('#settings-title').value = this.config.title;
             settingsForm.querySelector('#settings-background').value = this.config.customStyle.background || '';
             settingsForm.querySelector('#settings-rounding').value = this.config.customStyle.rounding ?? this.manager.globalSettings.rounding;
             settingsForm.querySelector('#settings-padding').value = this.config.customStyle.padding ?? this.manager.globalSettings.padding;
             settingsForm.querySelector('#settings-jscode').value = this.config.jsCode;

             // Populate global setting (spacing) - it's edited here but applied globally
             settingsForm.querySelector('#settings-spacing').value = this.manager.globalSettings.spacing;

             // Reset 'Apply All' checkbox
             settingsForm.querySelector('#settings-apply-all').checked = false;

             settingsModal.hidden = false;
        }

        // --- JS Execution (UNSAFE EXAMPLE) ---
        runJsCode() {
             if (!this.config.jsCode) {
                 this.contentElement.innerHTML = '<p>No JS code provided.</p>'; // Clear content if code removed
                 return;
             };
             if (!this.contentElement) return;

             console.log(`Running JS code for panel ${this.id}`);
             this.contentElement.innerHTML = ''; // Clear previous content

             // !!! SECURITY WARNING !!!
             // Direct execution using Function constructor or eval is DANGEROUS
             // if the code comes from untrusted users.
             // Replace with proper sandboxing (iframe or Web Worker).
             try {
                 // Pass the panel's content element and potentially the panel instance itself
                 // or a limited API for interaction.
                 const panelApi = {
                     element: this.contentElement,
                     id: this.id,
                     setTitle: this.setTitle.bind(this),
                     getData: (key) => { /* TODO: Implement data storage/retrieval */ return null; },
                     setData: (key, value) => { /* TODO: Implement data storage/retrieval */ },
                     // Add more API methods as needed
                 };
                 // 'use strict'; might be good to add inside the Function body
                 const func = new Function('panel', this.config.jsCode);
                 func(panelApi);

                 // After running user JS, re-attach drag/drop listeners to new content
                 this.initContentDragDrop();
                 this.updateHeightBasedOnContent(); // Adjust height after content changes
             } catch (error) {
                 console.error(`Error executing JS in panel ${this.id}:`, error);
                 this.contentElement.innerHTML = `<p style="color: red;">Error executing script: ${error.message}</p>`;
             }
        }

        updateHeightBasedOnContent() {
            // Basic height adjustment - can be complex depending on CSS
             // For now, just ensures minimum height. More sophisticated logic might be needed.
            // this.element.style.minHeight = `${this.contentElement.scrollHeight + this.headerElement.offsetHeight}px`;
            // Using CSS flex-grow on content area is often better
             console.log(`Panel ${this.id} content height: ${this.contentElement.scrollHeight}`);
        }


        // --- Placeholder for Panel Resizing ---
        initResizing() {
            console.log(`Placeholder: Initialize Panel Resizing for ${this.id} (e.g., Interact.js)`);
            // Example using Interact.js (if included):
            // if (typeof interact !== 'undefined') {
            //     interact(this.element)
            //         .resizable({
            //             edges: { left: true, right: true, bottom: false, top: false },
            //             listeners: {
            //                 move: (event) => {
            //                     // Update element width based on event.rect.width
            //                     // Provide visual feedback
            //                 },
            //                 end: (event) => {
            //                     // Snap to nearest width class (1/6, 1/3 etc.)
            //                     const newWidth = event.rect.width;
            //                     const containerWidth = this.manager.container.offsetWidth;
            //                     const ratio = newWidth / containerWidth;
            //                     // Logic to determine closest width class...
            //                     let closestClass = 'width-1-6'; // default smallest
            //                     if (ratio > 0.9) closestClass = 'width-full';
            //                     else if (ratio > 0.75) closestClass = 'width-5-6';
            //                     // ... etc.
            //                     this.setWidth(closestClass);
            //                     // Save layout
            //                     this.manager.saveLayout();
            //                 }
            //             },
            //             modifiers: [ /* Potential modifiers for snapping during resize */ ],
            //             inertia: true
            //         });
            // } else {
            //     console.warn("Interact.js library not found. Panel resizing disabled.");
            // }
        }

        // --- Content Drag & Drop ---
        initContentDragDrop() {
             if (!this.contentElement) return;

            // Make specific items draggable
             const draggableItems = this.contentElement.querySelectorAll('.draggable-item');
             draggableItems.forEach(item => {
                 item.draggable = true; // Ensure it's set
                 item.addEventListener('dragstart', (e) => {
                     e.stopPropagation(); // Prevent panel drag listener interference
                     console.log(`Content drag start from ${this.id}:`, e.target);
                     // Example: Set data based on element type
                     let data = '';
                     let type = 'text/plain';
                     if (e.target.tagName === 'IMG') {
                         data = e.target.src;
                         type = 'text/uri-list'; // Standard for URLs/images
                     } else {
                         data = e.target.textContent || 'Dragged Content';
                     }
                     e.dataTransfer.setData(type, data);
                     e.dataTransfer.effectAllowed = 'copyMove';
                 });
                  item.addEventListener('dragend', (e) => {
                      e.stopPropagation();
                  });
             });

             // Make the content area a drop target
             this.contentElement.addEventListener('dragenter', (e) => {
                 e.preventDefault();
                 e.stopPropagation();
                 this.contentElement.classList.add('drag-over');
             });

             this.contentElement.addEventListener('dragover', (e) => {
                 e.preventDefault(); // MUST preventDefault to allow drop
                 e.stopPropagation();
                 e.dataTransfer.dropEffect = 'copy'; // Indicate it's a valid target
             });

              this.contentElement.addEventListener('dragleave', (e) => {
                 e.preventDefault();
                 e.stopPropagation();
                 this.contentElement.classList.remove('drag-over');
             });

             this.contentElement.addEventListener('drop', (e) => {
                 e.preventDefault();
                 e.stopPropagation();
                 this.contentElement.classList.remove('drag-over');
                 console.log(`Content dropped onto ${this.id}`);

                 // Process dropped data
                 const types = e.dataTransfer.types;
                 console.log("Data types:", types);

                 let droppedContent = 'Received: ';
                 if (types.includes('text/uri-list')) {
                     const uri = e.dataTransfer.getData('text/uri-list');
                     console.log("Dropped URI:", uri);
                     droppedContent += `<img src="${uri}" alt="Dropped Image" style="max-width: 100px;">`;
                 } else if (types.includes('text/plain')) {
                     const text = e.dataTransfer.getData('text/plain');
                     console.log("Dropped Text:", text);
                      droppedContent += text;
                 } else {
                    console.log("Cannot handle dropped data types:", types);
                    droppedContent += "Unhandled data format.";
                 }

                 // Append dropped content (example behavior)
                 // In a real app, the panel's JS module should handle this
                 const p = document.createElement('p');
                 p.innerHTML = droppedContent;
                 this.contentElement.appendChild(p);

                 // Potentially trigger panel's JS to handle the drop event
                 // this.triggerJsEvent('contentDrop', { dataTransfer: e.dataTransfer });
             });
        }

        getConfig() {
             // Return serializable config for saving
            return {
                 title: this.config.title,
                 widthClass: this.config.widthClass,
                 jsCode: this.config.jsCode,
                 customStyle: this.config.customStyle
             };
        }


    } // End Panel Class

    // --- Settings Modal Logic ---
    function hideSettingsModal() {
        settingsModal.hidden = true;
    }

    closeModalBtn.addEventListener('click', hideSettingsModal);
    settingsModal.addEventListener('click', (e) => { // Close on backdrop click
        if (e.target === settingsModal) {
            hideSettingsModal();
        }
    });

    settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const panelId = settingsForm.querySelector('#settings-panel-id').value;
        const applyAll = settingsForm.querySelector('#settings-apply-all').checked;

        const targetPanel = panelManager.getPanelById(panelId);
        if (!targetPanel && !applyAll) {
             console.error("Target panel not found for settings update.");
             hideSettingsModal();
             return;
        }

        // Get values from form
        const newTitle = settingsForm.querySelector('#settings-title').value;
        const newBg = settingsForm.querySelector('#settings-background').value || null; // null if empty
        const newRounding = settingsForm.querySelector('#settings-rounding').value;
        const newPadding = settingsForm.querySelector('#settings-padding').value;
        const newSpacing = settingsForm.querySelector('#settings-spacing').value; // Always global
        const newJsCode = settingsForm.querySelector('#settings-jscode').value;

        console.log(`Applying settings - Panel: ${panelId}, ApplyAll: ${applyAll}`);

         // Apply Spacing Globally
         panelManager.applyGlobalStyle('spacing', newSpacing);

        if (applyAll) {
            // Apply relevant styles globally or to all panels
             panelManager.applyGlobalStyle('rounding', newRounding);
             panelManager.applyGlobalStyle('padding', newPadding);
             // Apply background globally? Or iterate panels? Decided to iterate for override clear.
             panelManager.panels.forEach(p => {
                 p.applyStyle('background', newBg, true); // Apply bg to all
                 // Could potentially set titles or JS code globally too if needed
             });

        } else if (targetPanel) {
            // Apply to specific panel
            targetPanel.setTitle(newTitle);
            targetPanel.applyStyle('background', newBg);
            targetPanel.applyStyle('rounding', newRounding);
            targetPanel.applyStyle('padding', newPadding);
            targetPanel.config.jsCode = newJsCode; // Update stored code
            targetPanel.runJsCode(); // Re-run code after update
        }

         // Save layout after changes
         panelManager.saveLayout();

        hideSettingsModal();
    });


    // --- Initialization ---
    const panelManager = new PanelManager(panlzContainer);

    // Load existing layout or create initial setup
    if (!panelManager.loadLayout()) {
        console.log("No saved layout found, creating initial setup.");
        // Initial Setup: 1 full, 6 half-width below in two columns
        panelManager.addPanel({ title: "Top Panel", widthClass: 'width-full', jsCode: "panel.element.innerHTML = '<h1>Full Width Panel</h1><p>Content here.</p>';" });

        // Add panels that will form two columns (CSS Grid handles placement)
        for (let i = 0; i < 6; i++) {
             panelManager.addPanel({ title: `Panel ${i + 1}`, widthClass: 'width-1-2' });
        }
        panelManager.saveLayout(); // Save the initial layout
    }

     console.log("PANLZ Initialized.");

}); // End DOMContentLoaded
