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
            //             this.updatePanelOrderFromDOM(); // Update order after library move
            //             this.saveLayout(); // Save after reordering
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
                // Ensure dragging the panel itself, not draggable content inside
                if (e.target.classList.contains('panel') && !e.target.querySelector('.panel-content')?.contains(e.explicitOriginalTarget)) {
                    draggedPanel = e.target;
                    setTimeout(() => e.target.classList.add('dragging'), 0);
                     // Set data (panel ID)
                     e.dataTransfer.setData('text/plain', e.target.id);
                     e.dataTransfer.effectAllowed = 'move';
                     console.log(`Dragging panel: ${draggedPanel.id}`);
                }
             });

             this.container.addEventListener('dragend', (e) => {
                if (draggedPanel && e.target === draggedPanel) { // Check if it's the panel we started dragging
                    draggedPanel.classList.remove('dragging'); // Use variable in case e.target is wrong
                    draggedPanel = null;
                    console.log("Panel drag end");
                }
             });

             this.container.addEventListener('dragover', (e) => {
                 e.preventDefault(); // Necessary to allow dropping
                 // Basic visual feedback - which element are we hovering over?
                 // A library provides much better dropzone indication
                 const targetPanel = e.target.closest('.panel');
                 // Add class to container or target for visual feedback if needed
             });

             this.container.addEventListener('drop', (e) => {
                 e.preventDefault();
                 if (draggedPanel) {
                     const targetPanel = e.target.closest('.panel');
                     const droppedOnContainer = e.target === this.container;

                     if (targetPanel && targetPanel !== draggedPanel) {
                         console.log(`Panel ${draggedPanel.id} dropped near ${targetPanel.id}`);
                         // Simple insertion logic (doesn't handle grid columns well)
                         // A library handles grid insertion MUCH better
                         const rect = targetPanel.getBoundingClientRect();
                         const containerRect = this.container.getBoundingClientRect();
                         const offsetX = e.clientX - containerRect.left; // Use clientX relative to container
                         const targetMiddleX = targetPanel.offsetLeft + targetPanel.offsetWidth / 2;

                         // Decide before/after based on horizontal position within the grid flow
                         if (offsetX < targetMiddleX) {
                              targetPanel.parentNode.insertBefore(draggedPanel, targetPanel);
                         } else {
                              targetPanel.parentNode.insertBefore(draggedPanel, targetPanel.nextSibling);
                         }
                         this.updatePanelOrderFromDOM(); // Update state and save
                     } else if (droppedOnContainer && !targetPanel) {
                         // Dropped onto empty container space, append to end
                         this.container.appendChild(draggedPanel);
                         this.updatePanelOrderFromDOM();
                     }
                      // Clean up regardless of where it was dropped
                      draggedPanel.classList.remove('dragging');
                      draggedPanel = null;
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
                         // Find max existing ID to prevent collision after load -> addPanel
                        const currentIdNum = parseInt(panelConfig.id.split('-')[1]);
                         if (!isNaN(currentIdNum) && currentIdNum >= this.panelIdCounter) {
                           this.panelIdCounter = currentIdNum + 1;
                         }
                        this.addPanel(panelConfig.config); // Add panel with saved config using its original ID logic
                    });
                    console.log("Layout Loaded");
                     this.updatePanelOrderFromDOM(); // Ensure order matches loaded state if addPanel appends
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
             // Ensure customStyle is an object even if config didn't provide it well
            if (typeof this.config.customStyle !== 'object' || this.config.customStyle === null) {
                this.config.customStyle = { background: null, rounding: null, padding: null };
            }


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

            // Apply custom styles from config (ensure customStyle exists)
            this.applyStyle('background', this.config.customStyle?.background);
            this.applyStyle('rounding', this.config.customStyle?.rounding);
            this.applyStyle('padding', this.config.customStyle?.padding);


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

            // Ensure customStyle object exists
            if (typeof this.config.customStyle !== 'object' || this.config.customStyle === null) {
                 this.config.customStyle = {};
            }

             // If not applying globally, store as custom style
            if (!isGlobal && value !== null && value !== undefined && value !== '') {
                 this.config.customStyle[property] = value;
            } else if (!isGlobal && (value === null || value === undefined || value === '')) {
                 // Explicitly removing custom style, revert to global/default
                 this.config.customStyle[property] = null;
            }


            // Determine the value to apply (custom overrides global/default)
            let effectiveValue = this.config.customStyle[property]; // Use custom first
             if (effectiveValue === null || effectiveValue === undefined || effectiveValue === '') {
                  // Fallback to global/CSS default if no custom style
                 effectiveValue = this.manager.globalSettings[property] ?? null; // Use global if set
             }


             console.log(`Applying style to ${this.id} - ${property}: ${value} (Effective: ${effectiveValue}, isGlobal: ${isGlobal})`);

             // Apply the style using CSS Variables on the specific panel element
             switch(property) {
                 case 'background':
                     this.element.style.setProperty('--panel-custom-background-image', effectiveValue ? `url('${effectiveValue}')` : null); // null removes override
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
             // Save layout if needed after style change - potential performance hit if done often
             // this.manager.saveLayout();
        }


        openSettings() {
             console.log(`Opening settings for ${this.id}`);

             // Ensure customStyle exists before accessing
            const currentBg = this.config.customStyle?.background || '';
            const currentRounding = this.config.customStyle?.rounding ?? this.manager.globalSettings.rounding;
            const currentPadding = this.config.customStyle?.padding ?? this.manager.globalSettings.padding;


             // Populate modal with current panel's settings
             settingsForm.querySelector('#settings-panel-id').value = this.id;
             settingsForm.querySelector('#settings-title').value = this.config.title;
             settingsForm.querySelector('#settings-background').value = currentBg;
             settingsForm.querySelector('#settings-rounding').value = currentRounding;
             settingsForm.querySelector('#settings-padding').value = currentPadding;
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
                  // Re-initialize drag/drop for this default content
                 this.initContentDragDrop();
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
                     getData: (key) => { /* TODO: Implement data storage/retrieval */ console.warn(`API getData(${key}) not implemented`); return null; },
                     setData: (key, value) => { /* TODO: Implement data storage/retrieval */ console.warn(`API setData(${key}, ${value}) not implemented`);},
                     // Add more API methods as needed (e.g., makeHttpRequest, etc., requiring careful security)
                 };
                 // 'use strict'; might be good to add inside the Function body
                 const func = new Function('panel', `'use strict'; ${this.config.jsCode}`);
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
            //                     let width = event.rect.width;
            //                      this.element.style.width = `${width}px`; // Direct style for feedback
            //                 },
            //                 end: (event) => {
            //                      this.element.style.width = ''; // Remove direct style
            //                     // Snap to nearest width class (1/6, 1/3 etc.)
            //                     const newWidth = event.rect.width;
            //                     const containerWidth = this.manager.container.offsetWidth - (2 * this.manager.globalSettings.spacing); // Account for container padding
            //                     const ratio = newWidth / containerWidth;
            //                     // Logic to determine closest width class...
            //                      const thresholds = { 'width-full': 0.91, 'width-5-6': 0.75, 'width-2-3': 0.58, 'width-1-2': 0.41, 'width-1-3': 0.24, 'width-1-6': 0 };
            //                      let closestClass = 'width-1-6'; // Default smallest
            //                      for (const cls in thresholds) {
            //                           if (ratio > thresholds[cls]) {
            //                               closestClass = cls;
            //                               break;
            //                           }
            //                      }
            //                     console.log(`Resized ratio: ${ratio.toFixed(2)}, Snapped to: ${closestClass}`);
            //                     this.setWidth(closestClass);
            //                     // Save layout
            //                     this.manager.saveLayout();
            //                 }
            //             },
            //             modifiers: [ /* Potential modifiers for snapping during resize */ ],
            //             inertia: true
            //         })
            //         // Chain draggable configuration if using Interact.js for both
            //         // .draggable({/* ... */});
            // } else {
            //     console.warn("Interact.js library not found. Panel resizing disabled.");
            // }
        }

        // --- Content Drag & Drop ---
        initContentDragDrop() {
             if (!this.contentElement) return;

             // Clear existing listeners before adding new ones to prevent duplicates
             // This is a simple approach; more robust solutions might use event delegation
             const oldDraggables = this.contentElement.querySelectorAll('.draggable-item');
             oldDraggables.forEach(item => {
                 // Quick way to remove all listeners: clone and replace node
                 // item.parentNode.replaceChild(item.cloneNode(true), item);
                 // OR track listeners manually if needed (more complex)
             });
             // Re-select potentially new items after JS execution
             const draggableItems = this.contentElement.querySelectorAll('.draggable-item');

            // Make specific items draggable
             draggableItems.forEach(item => {
                 item.draggable = true; // Ensure it's set
                 // Remove old listeners before adding if element persisted (less likely with innerHTML reset)
                 // item.removeEventListener('dragstart', this.handleContentDragStart); // Need named function or tracking
                 item.addEventListener('dragstart', (e) => { // Using anonymous for simplicity here
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
                      try {
                         e.dataTransfer.setData(type, data);
                         e.dataTransfer.effectAllowed = 'copyMove';
                     } catch (error) {
                          console.error("Error setting drag data:", error);
                     }
                 });
                 // Remove old listeners before adding if element persisted
                  // item.removeEventListener('dragend', this.handleContentDragEnd);
                 item.addEventListener('dragend', (e) => {
                      e.stopPropagation();
                  });
             });

             // --- Drop Target Listeners on Content Area ---
             // Remove potential old listeners before adding new ones
            // A more robust way is needed if elements aren't completely replaced
             // this.contentElement.removeEventListener('dragenter', this.handleContentDragEnter);
             this.contentElement.addEventListener('dragenter', (e) => {
                 e.preventDefault();
                 e.stopPropagation();
                 this.contentElement.classList.add('drag-over');
             });

             // this.contentElement.removeEventListener('dragover', this.handleContentDragOver);
             this.contentElement.addEventListener('dragover', (e) => {
                 e.preventDefault(); // MUST preventDefault to allow drop
                 e.stopPropagation();
                 // Check data type compatibility if needed
                 // Example: Only allow text drops
                 // if (e.dataTransfer.types.includes('text/plain')) {
                      e.dataTransfer.dropEffect = 'copy'; // Indicate it's a valid target
                 // } else {
                 //    e.dataTransfer.dropEffect = 'none';
                 // }
             });

             // this.contentElement.removeEventListener('dragleave', this.handleContentDragLeave);
              this.contentElement.addEventListener('dragleave', (e) => {
                 // Check if the leave is to an internal element vs outside the content area
                 if (!this.contentElement.contains(e.relatedTarget)) {
                    this.contentElement.classList.remove
