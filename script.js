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
                 this.saveLayout(); // Save after removing a panel
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
            //             // Note: saveLayout is now called within updatePanelOrderFromDOM
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
                 // Check if the event target is the panel or an element inside the header BUT NOT the settings button
                 const isPanelHeader = e.target.closest('.panel-header');
                 const isSettingsButton = e.target.closest('.panel-settings-btn');

                 // Allow drag if directly on panel OR inside header (but not button)
                 if (e.target.classList.contains('panel') || (isPanelHeader && !isSettingsButton)) {
                    // Find the actual panel element if drag started on header
                    const panelElement = e.target.closest('.panel');
                    if (!panelElement) return; // Should not happen if logic is correct

                    draggedPanel = panelElement;
                    setTimeout(() => draggedPanel.classList.add('dragging'), 0);
                     // Set data (panel ID)
                     e.dataTransfer.setData('text/plain', draggedPanel.id);
                     e.dataTransfer.effectAllowed = 'move';
                     console.log(`Dragging panel: ${draggedPanel.id}`);
                 } else {
                    // console.log("Drag blocked - target:", e.target); // Debug logging
                 }
             });

             this.container.addEventListener('dragend', (e) => {
                if (draggedPanel && e.target === draggedPanel) { // Check if it's the panel we started dragging
                    draggedPanel.classList.remove('dragging'); // Use variable in case e.target is wrong
                    draggedPanel = null;
                    console.log("Panel drag end");
                     // No save here, save happens on drop
                } else if (draggedPanel) {
                    // Drag ended unexpectedly or on a different element, ensure cleanup
                    draggedPanel.classList.remove('dragging');
                    draggedPanel = null;
                }
             });

             this.container.addEventListener('dragover', (e) => {
                 e.preventDefault(); // Necessary to allow dropping
                 e.dataTransfer.dropEffect = 'move';
                 // Add visual feedback for drop target here if needed (e.g., highlighting grid gaps)
             });

             this.container.addEventListener('drop', (e) => {
                 e.preventDefault();
                 if (draggedPanel) {
                     const targetElement = document.elementFromPoint(e.clientX, e.clientY); // Find element under cursor
                     const targetPanel = targetElement ? targetElement.closest('.panel') : null;
                     const droppedOnContainer = e.target === this.container; // Check if dropped directly on container bg

                     console.log(`Drop target element:`, targetElement);
                     console.log(`Drop target panel: ${targetPanel ? targetPanel.id : 'None'}`);

                     if (targetPanel && targetPanel !== draggedPanel) {
                         console.log(`Panel ${draggedPanel.id} dropped near ${targetPanel.id}`);
                         // More robust insertion logic for grid: find the element we are dropping before/after
                         const allPanels = [...this.container.querySelectorAll('.panel:not(.dragging)')];
                         let nextSibling = null;
                         // Find the panel in the current DOM order that should come *after* the dragged panel
                         for(let i = 0; i < allPanels.length; i++) {
                             const panel = allPanels[i];
                             const rect = panel.getBoundingClientRect();
                              // Simple check: if drop point Y is above panel center Y, insert before it
                              // More complex logic needed for robust X/Y grid positioning
                             if (e.clientY < rect.top + rect.height / 2) {
                                 nextSibling = panel;
                                 break;
                             }
                         }
                         this.container.insertBefore(draggedPanel, nextSibling); // If nextSibling is null, it appends to end
                         this.updatePanelOrderFromDOM(); // Update state and save
                     } else if (droppedOnContainer || !targetPanel) {
                         // Dropped onto empty container space or outside known panels, append to end
                         this.container.appendChild(draggedPanel);
                         this.updatePanelOrderFromDOM();
                     }

                      // Clean up regardless of where it was dropped
                      if (draggedPanel) { // Check again as it might be nulled by previous logic
                         draggedPanel.classList.remove('dragging');
                         draggedPanel = null;
                      }
                 }
             });
        }


        updatePanelOrderFromDOM() {
            const panelElements = [...this.container.querySelectorAll('.panel')];
            // Reorder the internal panels array to match the DOM order
            this.panels.sort((a, b) => {
                const indexA = panelElements.indexOf(a.element);
                const indexB = panelElements.indexOf(b.element);
                // Handle cases where an element might not be found (shouldn't happen)
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                return indexA - indexB;
            });
            console.log("Internal panel order updated based on DOM.");
            this.saveLayout(); // Save the new order
        }


        // --- Layout Persistence (Basic Example) ---
        saveLayout() {
            try {
                const layout = this.panels.map(p => ({
                    id: p.id, // Save the actual ID generated
                    config: p.getConfig() // Panel needs a method to return its config
                }));
                localStorage.setItem('panlzLayout', JSON.stringify(layout));
                console.log("Layout Saved");
            } catch (error) {
                 console.error("Error saving layout:", error);
                 // Handle potential storage errors (e.g., quota exceeded)
            }
        }

        loadLayout() {
             // *** NOTE: This function is currently NOT called in the initialization ***
             // *** It's kept here for future use if needed                     ***
            const savedLayout = localStorage.getItem('panlzLayout');
            if (savedLayout) {
                try {
                    const layout = JSON.parse(savedLayout);
                    // Clear existing panels before loading
                     this.panels.forEach(p => { try { p.element.remove(); } catch (e) {} }); // Defensive removal
                    this.panels = [];
                    this.panelIdCounter = 0; // Reset counter

                    let maxIdFound = -1;
                    layout.forEach(panelData => {
                         // Find the highest ID number to avoid collisions when adding new panels later
                        const currentIdNum = parseInt(panelData.id.split('-')[1]);
                         if (!isNaN(currentIdNum) && currentIdNum > maxIdFound) {
                           maxIdFound = currentIdNum;
                         }
                        // Use addPanel which increments counter correctly, pass config
                        this.addPanel(panelData.config);
                    });
                    // Set the counter beyond the max loaded ID
                    this.panelIdCounter = maxIdFound + 1;

                    console.log("Layout Loaded");
                    this.updatePanelOrderFromDOM(); // Ensure DOM matches loaded data if addPanel appended differently
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
            this.settingsBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent triggering panel drag
                this.openSettings();
            });

            // Placeholder for panel resizing library hookup
            this.initResizing();

            // Initialize drag/drop listeners for CONTENT within this panel
            this.initContentDragDrop();

             // Run initial JS code if present, otherwise show default content
            this.runJsCode(); // This function now handles the default content case

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


             // console.log(`Applying style to ${this.id} - ${property}: ${value} (Effective: ${effectiveValue}, isGlobal: ${isGlobal})`); // Verbose logging

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
             settingsForm.querySelector('#settings-jscode').value = this.config.jsCode || ''; // Use empty string if null/undefined

             // Populate global setting (spacing) - it's edited here but applied globally
             settingsForm.querySelector('#settings-spacing').value = this.manager.globalSettings.spacing;

             // Reset 'Apply All' checkbox
             settingsForm.querySelector('#settings-apply-all').checked = false;

             settingsModal.hidden = false;
        }

        // --- JS Execution (UNSAFE EXAMPLE - Sandboxing Required) ---
        runJsCode() {
             if (!this.contentElement) return;

             this.contentElement.innerHTML = ''; // Clear previous content regardless

             if (!this.config.jsCode || this.config.jsCode.trim() === '') {
                 // *** Display default content if no JS code ***
                 this.contentElement.innerHTML = '<p style="color: #777; text-align: center; margin-top: 20px;">Empty Panel</p><p draggable="true" class="draggable-item" style="text-align: center; cursor: grab; background-color: #f0f0f0; padding: 5px; margin: 10px auto; display: inline-block;">Drag Content Example</p>';
                  // Re-initialize drag/drop for this default content
                 this.initContentDragDrop();
                 console.log(`Panel ${this.id} has no JS code, showing default.`);
                 return;
             };


             console.log(`Running JS code for panel ${this.id}`);

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
                     getConfig: (key) => { return key ? this.config[key] : this.config; }, // Allow reading config
                     getStyle: (key) => { return key ? this.config.customStyle[key] : this.config.customStyle; }, // Allow reading style
                     getData: (key) => { /* TODO: Implement panel-specific data storage */ console.warn(`API getData(${key}) not implemented`); return null; },
                     setData: (key, value) => { /* TODO: Implement panel-specific data storage */ console.warn(`API setData(${key}, ${value}) not implemented`);},
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
                 this.contentElement.innerHTML = `<div style="color: red; padding: 10px; border: 1px solid red;"><b>Script Error:</b><br><pre style="white-space: pre-wrap; word-wrap: break-word;">${error.message}</pre></div>`;
             }
        }

        updateHeightBasedOnContent() {
            // Using CSS flex-grow on content area handles most cases automatically.
            // Explicit height adjustment might be needed for very specific scenarios or fixed-height requirements from JS.
             // console.log(`Panel ${this.id} content scrollHeight: ${this.contentElement.scrollHeight}`);
        }


        // --- Placeholder for Panel Resizing ---
        initResizing() {
            // console.log(`Placeholder: Initialize Panel Resizing for ${this.id} (e.g., Interact.js)`);
            // Interact.js integration code would go here
        }

        // --- Content Drag & Drop ---
        initContentDragDrop() {
             if (!this.contentElement) return;

             // Event Delegation approach for drag start (more efficient)
             this.contentElement.removeEventListener('dragstart', this.handleContentDragStart); // Remove previous if any
             this.handleContentDragStart = (e) => {
                 // Only act if the drag started on an item marked as draggable-item
                 const draggable = e.target.closest('.draggable-item');
                 if (draggable && this.contentElement.contains(draggable)) {
                     e.stopPropagation();
                     console.log(`Content drag start from ${this.id}:`, draggable);
                     let data = '';
                     let type = 'text/plain';
                     if (draggable.tagName === 'IMG') {
                         data = draggable.src;
                         type = 'text/uri-list';
                     } else {
                         data = draggable.textContent || 'Dragged Content';
                     }
                      try {
                         e.dataTransfer.setData(type, data);
                         e.dataTransfer.effectAllowed = 'copyMove';
                     } catch (error) {
                          console.error("Error setting drag data:", error);
                     }
                 }
             };
             this.contentElement.addEventListener('dragstart', this.handleContentDragStart);


             // --- Drop Target Listeners using Event Delegation ---
             // Remove previous listeners before adding new ones to avoid duplication
             this.contentElement.removeEventListener('dragenter', this.handleContentDragEnter);
             this.contentElement.removeEventListener('dragover', this.handleContentDragOver);
             this.contentElement.removeEventListener('dragleave', this.handleContentDragLeave);
             this.contentElement.removeEventListener('drop', this.handleContentDrop);

             // Store handlers on the instance to allow removal if needed later
             this.handleContentDragEnter = (e) => {
                e.preventDefault();
                e.stopPropagation();
                 // Add class only to the content element, not children
                 if (e.target === this.contentElement) {
                     this.contentElement.classList.add('drag-over');
                 }
             };
             this.handleContentDragOver = (e) => {
                e.preventDefault(); // Allow drop
                e.stopPropagation();
                e.dataTransfer.dropEffect = 'copy';
             };
             this.handleContentDragLeave = (e) => {
                e.stopPropagation();
                 // Remove class only if leaving the content element itself, not just moving over children
                 if (e.target === this.contentElement) {
                     this.contentElement.classList.remove('drag-over');
                 }
             };
             this.handleContentDrop = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.contentElement.classList.remove('drag-over');
                console.log(`Content dropped onto ${this.id}`);
                 // Process dropped data... (same logic as before)
                 const types = e.dataTransfer.types;
                 let droppedContent = 'Received: ';
                 let processed = false;
                 if (types.includes('text/uri-list')) {
                     const uri = e.dataTransfer.getData('text/uri-list');
                     droppedContent += `<img src="${uri}" alt="Dropped Image" style="max-width: 100px; vertical-align: middle;">`;
                     processed = true;
                 } else if (types.includes('text/plain')) {
                     const text = e.dataTransfer.getData('text/plain');
                     droppedContent += text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                     processed = true;
                 } else {
                    droppedContent += "Unhandled data format.";
                 }
                 if (processed) {
                    const p = document.createElement('p');
                    p.innerHTML = droppedContent;
                    this.contentElement.appendChild(p); // Append example content
                 }
                // Ideally, trigger an event for the panel's JS module to handle the drop
             };

             this.contentElement.addEventListener('dragenter', this.handleContentDragEnter);
             this.contentElement.addEventListener('dragover', this.handleContentDragOver);
             this.contentElement.addEventListener('dragleave', this.handleContentDragLeave);
             this.contentElement.addEventListener('drop', this.handleContentDrop);
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
        const newBg = settingsForm.querySelector('#settings-background').value.trim() || null; // null if empty string
        const newRounding = settingsForm.querySelector('#settings-rounding').value;
        const newPadding = settingsForm.querySelector('#settings-padding').value;
        const newSpacing = settingsForm.querySelector('#settings-spacing').value; // Always global
        const newJsCode = settingsForm.querySelector('#settings-jscode').value;

        console.log(`Applying settings - Panel: ${panelId}, ApplyAll: ${applyAll}`);

         // Apply Spacing Globally first
         panelManager.applyGlobalStyle('spacing', newSpacing);

        if (applyAll) {
            // Apply settings to all panels by iterating
             panelManager.applyGlobalStyle('rounding', newRounding); // Set global default
             panelManager.applyGlobalStyle('padding', newPadding);   // Set global default
             panelManager.panels.forEach(p => {
                 // Apply specific styles directly to ensure override or use of new default
                 p.applyStyle('rounding', newRounding, true); // Force update based on new global
                 p.applyStyle('padding', newPadding, true);   // Force update based on new global
                 p.applyStyle('background', newBg);       // Apply specific background to all
                 // Optionally apply title/JS globally too if desired
                 // p.setTitle(newTitle);
                 // p.config.jsCode = newJsCode; p.runJsCode();
             });

        } else if (targetPanel) {
            // Apply to specific panel
            targetPanel.setTitle(newTitle);
            targetPanel.applyStyle('background', newBg);
            targetPanel.applyStyle('rounding', newRounding);
            targetPanel.applyStyle('padding', newPadding);
            if (targetPanel.config.jsCode !== newJsCode) { // Only run code if it changed
                targetPanel.config.jsCode = newJsCode; // Update stored code
                targetPanel.runJsCode(); // Re-run code after update
            }
        }

         // Save layout after changes
         panelManager.saveLayout();

        hideSettingsModal();
    });


    // --- Initialization ---
    const panelManager = new PanelManager(panlzContainer);

    // *** MODIFIED INITIALIZATION: Always create default layout, ignore saved data for now ***
    console.log("Creating initial default panel layout.");

    // Clear any potential lingering panels from previous failed loads or tests
     while (panlzContainer.firstChild) {
        panlzContainer.removeChild(panlzContainer.firstChild);
     }
     panelManager.panels = []; // Clear internal array too
     panelManager.panelIdCounter = 0; // Reset ID counter

    // Clear localStorage for clean start (optional, but helps debugging)
    // localStorage.removeItem('panlzLayout'); // Uncomment to force clear on every page load

    // Initial Setup: 1 full, 6 half-width below in two columns - ALL EMPTY INITIALLY
    panelManager.addPanel({ title: "Top Panel", widthClass: 'width-full' }); // No jsCode initially

    for (let i = 0; i < 6; i++) {
         // No jsCode initially, they will show "Empty Panel"
         panelManager.addPanel({ title: `Panel ${i + 1}`, widthClass: 'width-1-2' });
    }

    // Don't save this very initial layout automatically, let user interactions save it
    // panelManager.saveLayout();

    console.log("PANLZ Initialized with default layout.");

}); // End DOMContentLoaded
