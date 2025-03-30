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
            // console.log(`Panel added: ${newId}`); // Less verbose logging
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
             // console.log(`Applying global style - ${property}: ${value}`); // Less verbose
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
            // console.log("Placeholder: Initialize Panel Rearrangement (e.g., SortableJS)"); // Less verbose
            // SortableJS integration code here...
             this.initBasicPanelDrag(); // Using basic HTML drag for now
        }

        // Basic HTML Drag/Drop for PANEL REARRANGEMENT (Limited Functionality)
        initBasicPanelDrag() {
             let draggedPanel = null;

             this.container.addEventListener('dragstart', (e) => {
                 const isPanelHeader = e.target.closest('.panel-header');
                 const isSettingsButton = e.target.closest('.panel-settings-btn');
                 const isDraggableContent = e.target.closest('.draggable-item'); // Don't drag panel if dragging content

                 // Allow drag if directly on panel OR inside header (but not button or draggable content)
                 if ((e.target.classList.contains('panel') || (isPanelHeader && !isSettingsButton)) && !isDraggableContent) {
                    const panelElement = e.target.closest('.panel');
                    if (!panelElement) return;

                    draggedPanel = panelElement;
                    setTimeout(() => draggedPanel.classList.add('dragging'), 0);
                     e.dataTransfer.setData('text/plain', draggedPanel.id);
                     e.dataTransfer.effectAllowed = 'move';
                    //  console.log(`Dragging panel: ${draggedPanel.id}`); // Less verbose
                 }
             });

             this.container.addEventListener('dragend', (e) => {
                if (draggedPanel && e.target === draggedPanel) {
                    draggedPanel.classList.remove('dragging');
                    draggedPanel = null;
                    // console.log("Panel drag end"); // Less verbose
                } else if (draggedPanel) {
                    draggedPanel.classList.remove('dragging');
                    draggedPanel = null;
                }
             });

             this.container.addEventListener('dragover', (e) => {
                 e.preventDefault();
                 e.dataTransfer.dropEffect = 'move';
             });

             this.container.addEventListener('drop', (e) => {
                 e.preventDefault();
                 if (draggedPanel) {
                     const currentDraggedPanel = draggedPanel; // Store ref because it might be nulled early
                     draggedPanel = null; // Nullify early to prevent issues with rapid events

                     const targetElement = document.elementFromPoint(e.clientX, e.clientY);
                     const targetPanel = targetElement ? targetElement.closest('.panel') : null;

                     // console.log(`Drop target element:`, targetElement); // Debug
                     // console.log(`Drop target panel: ${targetPanel ? targetPanel.id : 'None'}`); // Debug

                     if (targetPanel && targetPanel !== currentDraggedPanel) {
                         // Insert based on drop position relative to target center
                         const rect = targetPanel.getBoundingClientRect();
                         if (e.clientY < rect.top + rect.height / 2) {
                              targetPanel.parentNode.insertBefore(currentDraggedPanel, targetPanel);
                         } else {
                              targetPanel.parentNode.insertBefore(currentDraggedPanel, targetPanel.nextSibling);
                         }
                     } else if (!targetPanel && e.target === this.container) {
                         // Dropped onto empty container space, append to end
                         this.container.appendChild(currentDraggedPanel);
                     } else {
                        // Drop occurred on the original panel or invalid area, don't move
                        // but ensure class is removed
                     }

                      // Clean up class regardless
                     currentDraggedPanel.classList.remove('dragging');
                     // Update internal order and save only if move happened
                     if(targetPanel !== currentDraggedPanel) {
                         this.updatePanelOrderFromDOM();
                     }
                 }
             });
        }


        updatePanelOrderFromDOM() {
            const panelElements = [...this.container.querySelectorAll('.panel')];
            this.panels.sort((a, b) => {
                const indexA = panelElements.indexOf(a.element);
                const indexB = panelElements.indexOf(b.element);
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                return indexA - indexB;
            });
            // console.log("Internal panel order updated based on DOM."); // Less verbose
            this.saveLayout(); // Save the new order
        }


        // --- Layout Persistence (Basic Example) ---
        saveLayout() {
            try {
                const layout = this.panels.map(p => ({
                    id: p.id,
                    config: p.getConfig()
                }));
                localStorage.setItem('panlzLayout', JSON.stringify(layout));
                // console.log("Layout Saved"); // Less verbose
            } catch (error) {
                 console.error("Error saving layout:", error);
            }
        }

        loadLayout() {
             // *** NOTE: This function is currently NOT called in the initialization ***
            const savedLayout = localStorage.getItem('panlzLayout');
            if (savedLayout) {
                try {
                    const layout = JSON.parse(savedLayout);
                    this.panels.forEach(p => { try { p.element.remove(); } catch (e) {} });
                    this.panels = [];
                    this.panelIdCounter = 0;

                    let maxIdFound = -1;
                    layout.forEach(panelData => {
                        const currentIdNum = parseInt(panelData.id.split('-')[1]);
                         if (!isNaN(currentIdNum) && currentIdNum > maxIdFound) {
                           maxIdFound = currentIdNum;
                         }
                        this.addPanel(panelData.config);
                    });
                    this.panelIdCounter = maxIdFound + 1;
                    console.log("Layout Loaded");
                    this.updatePanelOrderFromDOM(); // Ensure order matches
                    return true;
                } catch (error) {
                    console.error("Error loading layout:", error);
                    localStorage.removeItem('panlzLayout');
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
            this.config = {
                title: 'Panel Title',
                widthClass: 'width-1-2',
                jsCode: '',
                customStyle: { background: null, rounding: null, padding: null },
                ...config
            };
            if (typeof this.config.customStyle !== 'object' || this.config.customStyle === null) {
                this.config.customStyle = { background: null, rounding: null, padding: null };
            }
            this.element = null;
            this.headerElement = null;
            this.titleElement = null;
            this.contentElement = null;
            this.settingsBtn = null;
            this.initContentDragDrop = this.initContentDragDrop.bind(this);
            this.runJsCode = this.runJsCode.bind(this);
            // Bind event handlers for potential removal later if needed
            this.handleSettingsClick = this.handleSettingsClick.bind(this);
        }

        handleSettingsClick(e) {
            e.stopPropagation(); // Prevent triggering panel drag
            this.openSettings();
        }

        render() {
            const templateClone = panelTemplate.content.cloneNode(true);
            this.element = templateClone.querySelector('.panel');
            this.element.id = this.id;
            this.element.style.cssText = '';
            this.headerElement = this.element.querySelector('.panel-header');
            this.titleElement = this.element.querySelector('.panel-title');
            this.contentElement = this.element.querySelector('.panel-content');
            this.settingsBtn = this.element.querySelector('.panel-settings-btn');

            this.setTitle(this.config.title);
            this.setWidth(this.config.widthClass);
            this.applyStyle('background', this.config.customStyle?.background);
            this.applyStyle('
