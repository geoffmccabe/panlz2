document.addEventListener('DOMContentLoaded', () => {
    // console.log("PANLZ Initializing..."); // Keep console clean unless debugging

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
                background: '',
            };
            this.initGlobalStyles();
            this.initPanelRearrangement(); // Initialize drag/drop for panels
        }

        initGlobalStyles() {
            this.applyGlobalStyle('spacing', this.globalSettings.spacing);
        }

        addPanel(config = {}) {
            const newId = `panel-${this.panelIdCounter++}`;
            const panelInstance = new Panel(newId, this, config);
            this.panels.push(panelInstance);
            const panelElement = panelInstance.render(); // Get the rendered element
            if (panelElement) { // Check if render was successful
               this.container.appendChild(panelElement);
            } else {
                console.error(`Failed to render panel with config:`, config);
            }
            // console.log(`Panel added: ${newId}`);
            return panelInstance;
        }

        removePanel(id) {
            const index = this.panels.findIndex(p => p.id === id);
            if (index > -1) {
                const panel = this.panels[index];
                if (panel.element) { // Check if element exists before removing
                   panel.element.remove();
                }
                this.panels.splice(index, 1);
                console.log(`Panel removed: ${id}`);
                this.saveLayout();
            }
        }

        getPanelById(id) {
            return this.panels.find(p => p.id === id);
        }

        applyGlobalStyle(property, value) {
             // console.log(`Applying global style - ${property}: ${value}`);
             const rootStyle = document.documentElement.style;
             switch (property) {
                case 'spacing':
                    this.globalSettings.spacing = parseInt(value, 10) || 0;
                    rootStyle.setProperty('--panel-spacing', `${this.globalSettings.spacing}px`);
                    break;
                case 'background':
                     this.globalSettings.background = value;
                     // rootStyle.setProperty('--container-background-image', `url('${value}')`); // Example
                     console.warn("Applying global background - implementation needed.");
                     break;
                case 'rounding':
                     this.globalSettings.rounding = parseInt(value, 10) || 0;
                     // Update panels that use the global default
                     this.panels.forEach(p => p.applyStyle('rounding', this.globalSettings.rounding, true));
                     break;
                case 'padding':
                     this.globalSettings.padding = parseInt(value, 10) || 0;
                     // Update panels that use the global default
                     this.panels.forEach(p => p.applyStyle('padding', this.globalSettings.padding, true));
                     break;
             }
        }

        initPanelRearrangement() {
            // console.log("Placeholder: Initialize Panel Rearrangement (e.g., SortableJS)");
            // SortableJS integration code recommended here...
            this.initBasicPanelDrag(); // Using basic HTML drag for now
        }

        initBasicPanelDrag() {
             let draggedPanel = null;
             this.container.addEventListener('dragstart', (e) => {
                 const isPanelHeader = e.target.closest('.panel-header');
                 const isSettingsButton = e.target.closest('.panel-settings-btn');
                 const isDraggableContent = e.target.closest('.draggable-item');
                 if ((e.target.classList.contains('panel') || (isPanelHeader && !isSettingsButton)) && !isDraggableContent) {
                    const panelElement = e.target.closest('.panel');
                    if (!panelElement) return;
                    draggedPanel = panelElement;
                    setTimeout(() => { if (draggedPanel) draggedPanel.classList.add('dragging'); }, 0);
                    try {
                        e.dataTransfer.setData('text/plain', draggedPanel.id);
                        e.dataTransfer.effectAllowed = 'move';
                    } catch (error) { console.error("Drag start error:", error); }
                 }
             });
             this.container.addEventListener('dragend', (e) => {
                if (draggedPanel) {
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
                     const currentDraggedPanel = draggedPanel;
                     draggedPanel = null; // Prevent multi-drop issues
                     const targetElement = document.elementFromPoint(e.clientX, e.clientY);
                     const targetPanel = targetElement ? targetElement.closest('.panel') : null;
                     let moved = false;
                     if (targetPanel && targetPanel !== currentDraggedPanel) {
                         const rect = targetPanel.getBoundingClientRect();
                         if (e.clientY < rect.top + rect.height / 2) {
                              this.container.insertBefore(currentDraggedPanel, targetPanel);
                         } else {
                              this.container.insertBefore(currentDraggedPanel, targetPanel.nextSibling);
                         }
                         moved = true;
                     } else if (!targetPanel && e.target === this.container) {
                         this.container.appendChild(currentDraggedPanel);
                         moved = true;
                     }
                     currentDraggedPanel.classList.remove('dragging');
                     if (moved) {
                         this.updatePanelOrderFromDOM(); // Save only if moved
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
            this.saveLayout();
        }

        saveLayout() {
            try {
                const layout = this.panels.map(p => ({ id: p.id, config: p.getConfig() }));
                localStorage.setItem('panlzLayout', JSON.stringify(layout));
                // console.log("Layout Saved");
            } catch (error) { console.error("Error saving layout:", error); }
        }

        loadLayout() { // Kept for potential future use, but not called on init now
            const savedLayout = localStorage.getItem('panlzLayout');
            if (savedLayout) {
                try {
                    const layout = JSON.parse(savedLayout);
                    this.panels.forEach(p => { if(p.element) p.element.remove(); });
                    this.panels = []; this.panelIdCounter = 0;
                    let maxIdFound = -1;
                    layout.forEach(panelData => {
                        const currentIdNum = parseInt(panelData.id.split('-')[1]);
                        if (!isNaN(currentIdNum) && currentIdNum > maxIdFound) maxIdFound = currentIdNum;
                        this.addPanel(panelData.config);
                    });
                    this.panelIdCounter = maxIdFound + 1;
                    console.log("Layout Loaded");
                    this.updatePanelOrderFromDOM();
                    return true;
                } catch (error) { console.error("Error loading layout:", error); localStorage.removeItem('panlzLayout'); return false; }
            } return false;
        }
    } // End PanelManager Class

    // --- Panel Class ---
    class Panel {
        constructor(id, manager, config = {}) {
            this.id = id;
            this.manager = manager;
            // Ensure config is always an object
            const safeConfig = (typeof config === 'object' && config !== null) ? config : {};
            // Ensure customStyle exists and is an object
            const customStyle = (typeof safeConfig.customStyle === 'object' && safeConfig.customStyle !== null) ? safeConfig.customStyle : {};

            this.config = {
                title: safeConfig.title || 'Panel Title',
                widthClass: safeConfig.widthClass || 'width-1-2',
                jsCode: safeConfig.jsCode || '',
                customStyle: {
                    background: customStyle.background || null,
                    rounding: customStyle.rounding || null,
                    padding: customStyle.padding || null,
                }
            };

            this.element = null; this.headerElement = null; this.titleElement = null;
            this.contentElement = null; this.settingsBtn = null;

            // Bind methods to ensure 'this' context is correct, especially for event listeners
            this.handleSettingsClick = this.handleSettingsClick.bind(this);
            this.handleContentDragStart = this.handleContentDragStart.bind(this);
            this.handleContentDrop = this.handleContentDrop.bind(this);
            this.handleContentDragEnter = this.handleContentDragEnter.bind(this);
            this.handleContentDragOver = this.handleContentDragOver.bind(this);
            this.handleContentDragLeave = this.handleContentDragLeave.bind(this);
            this.runJsCode = this.runJsCode.bind(this);
        }

        handleSettingsClick(e) { e.stopPropagation(); this.openSettings(); }
        handleContentDragStart(e) { /* Defined in initContentDragDrop */ }
        handleContentDrop(e) { /* Defined in initContentDragDrop */ }
        handleContentDragEnter(e) { /* Defined in initContentDragDrop */ }
        handleContentDragOver(e) { /* Defined in initContentDragDrop */ }
        handleContentDragLeave(e) { /* Defined in initContentDragDrop */ }


        render() {
            try {
                const templateClone = panelTemplate.content.cloneNode(true);
                this.element = templateClone.querySelector('.panel');
                if (!this.element) throw new Error("Panel template query failed");
                this.element.id = this.id;
                this.element.style.cssText = ''; // Clear inline styles

                this.headerElement = this.element.querySelector('.panel-header');
                this.titleElement = this.element.querySelector('.panel-title');
                this.contentElement = this.element.querySelector('.panel-content');
                this.settingsBtn = this.element.querySelector('.panel-settings-btn');

                if (!this.headerElement || !this.titleElement || !this.contentElement || !this.settingsBtn) {
                    throw new Error("Panel template structure incorrect");
                }

                this.setTitle(this.config.title);
                this.setWidth(this.config.widthClass);
                this.applyStyle('background', this.config.customStyle.background);
                this.applyStyle('rounding', this.config.customStyle.rounding);
                this.applyStyle('padding', this.config.customStyle.padding);

                this.settingsBtn.removeEventListener('click', this.handleSettingsClick); // Prevent duplicates
                this.settingsBtn.addEventListener('click', this.handleSettingsClick);

                this.initResizing();
                this.initContentDragDrop(); // Initialize content D&D listeners
                this.runJsCode(); // Run JS code (or show default)

                return this.element;
            } catch (error) {
                console.error(`Error rendering panel ${this.id}:`, error);
                // Return a placeholder or null to prevent breaking the loop in addPanel
                const errorDiv = document.createElement('div');
                errorDiv.textContent = `Error rendering panel ${this.id}. Check console.`;
                errorDiv.style.border = '2px solid red';
                errorDiv.style.padding = '10px';
                return errorDiv; // Return error indicator instead of null
            }
        }

        setTitle(title) {
            this.config.title = title || '';
            if (this.titleElement) this.titleElement.textContent = this.config.title;
        }

        setWidth(widthClass) {
            if (this.element) {
                const currentClasses = Array.from(this.element.classList);
                currentClasses.forEach(cls => {
                    if (cls.startsWith('width-')) this.element.classList.remove(cls);
                });
                if (widthClass) this.element.classList.add(widthClass);
                this.config.widthClass = widthClass;
            }
        }

        applyStyle(property, value, isGlobal = false) {
            if (!this.element) return;
            if (typeof this.config.customStyle !== 'object' || this.config.customStyle === null) this.config.customStyle = {};

            const isEmpty = (val) => (val === null || val === undefined || val === '');

            if (!isGlobal && !isEmpty(value)) this.config.customStyle[property] = value;
            else if (!isGlobal && isEmpty(value)) this.config.customStyle[property] = null;

            let effectiveValue = this.config.customStyle[property];
            if (isEmpty(effectiveValue)) effectiveValue = this.manager.globalSettings[property] ?? null;

            const elementStyle = this.element.style; // Cache style object
            switch(property) {
                 case 'background': elementStyle.setProperty('--panel-custom-background-image', !isEmpty(effectiveValue) ? `url('${effectiveValue}')` : null); break;
                 case 'rounding': elementStyle.setProperty('--panel-custom-border-radius', !isEmpty(effectiveValue) ? `${effectiveValue}px` : null); break;
                 case 'padding': elementStyle.setProperty('--panel-custom-padding', !isEmpty(effectiveValue) ? `${effectiveValue}px` : null); break;
            }
        }

        openSettings() {
            // console.log(`Opening settings for ${this.id}`); // Less verbose
            const currentBg = this.config.customStyle?.background || '';
            const currentRounding = this.config.customStyle?.rounding ?? this.manager.globalSettings.rounding;
            const currentPadding = this.config.customStyle?.padding ?? this.manager.globalSettings.padding;

            settingsForm.querySelector('#settings-panel-id').value = this.id;
            settingsForm.querySelector('#settings-title').value = this.config.title;
            settingsForm.querySelector('#settings-background').value = currentBg;
            settingsForm.querySelector('#settings-rounding').value = currentRounding;
            settingsForm.querySelector('#settings-padding').value = currentPadding;
            settingsForm.querySelector('#settings-jscode').value = this.config.jsCode || '';
            settingsForm.querySelector('#settings-spacing').value = this.manager.globalSettings.spacing;
            settingsForm.querySelector('#settings-apply-all').checked = false;

            settingsModal.style.display = 'flex'; // Show modal
        }

        runJsCode() { // !!! SECURITY WARNING: Needs proper sandboxing !!!
            if (!this.contentElement) return;
            this.contentElement.innerHTML = ''; // Clear first
            if (!this.config.jsCode || this.config.jsCode.trim() === '') {
                this.contentElement.innerHTML = '<p style="color: #777; text-align: center; margin-top: 20px;">Empty Panel</p><p draggable="true" class="draggable-item" style="text-align: center; cursor: grab; background-color: #f0f0f0; padding: 5px; margin: 10px auto; display: inline-block;">Drag Content Example</p>';
            } else {
                try {
                    const panelApi = { /* API definition as before */
                        element: this.contentElement, id: this.id, setTitle: this.setTitle.bind(this),
                        getConfig: (key) => key ? this.config[key] : this.config,
                        getStyle: (key) => key ? this.config.customStyle[key] : this.config.customStyle,
                        getData: (key) => console.warn(`API getData(${key}) not implemented`),
                        setData: (key, value) => console.warn(`API setData(${key}, ${value}) not implemented`)
                    };
                    const func = new Function('panel', `'use strict'; ${this.config.jsCode}`);
                    func(panelApi);
                } catch (error) {
                    console.error(`Error executing JS in panel ${this.id}:`, error);
                    this.contentElement.innerHTML = `<div style="color: red; padding: 10px; border: 1px solid red;"><b>Script Error:</b><br><pre style="white-space: pre-wrap; word-wrap: break-word;">${error.message}</pre></div>`;
                }
            }
            // Always re-initialize D&D for content area after innerHTML changes
            this.initContentDragDrop();
            this.updateHeightBasedOnContent();
        }

        updateHeightBasedOnContent() { /* Flex handles this */ }
        initResizing() { /* Placeholder */ }

        // Define bound handlers for content D&D
        handleContentDragEnter(e) { e.preventDefault(); e.stopPropagation(); if (e.target === this.contentElement) this.contentElement.classList.add('drag-over'); }
        handleContentDragOver(e) { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'copy'; }
        handleContentDragLeave(e) { e.stopPropagation(); if (!this.contentElement.contains(e.relatedTarget)) this.contentElement.classList.remove('drag-over'); }
        handleContentDrop(e) {
            e.preventDefault(); e.stopPropagation();
            this.contentElement.classList.remove('drag-over');
            const types = e.dataTransfer.types; let droppedContent = 'Received: '; let processed = false;
            if (types.includes('text/uri-list')) { const uri = e.dataTransfer.getData('text/uri-list'); droppedContent += `<img src="${uri}" alt="Dropped Image" style="max-width: 100px; vertical-align: middle;">`; processed = true; }
            else if (types.includes('text/plain')) { const text = e.dataTransfer.getData('text/plain'); droppedContent += text.replace(/</g, "&lt;").replace(/>/g, "&gt;"); processed = true; }
            else { droppedContent += "Unhandled data format."; }
            if (processed) { const p = document.createElement('p'); p.innerHTML = droppedContent; this.contentElement.appendChild(p); }
        }
        handleContentDragStart(e) {
            const draggable = e.target.closest('.draggable-item');
            if (draggable && this.contentElement.contains(draggable)) {
                e.stopPropagation(); let data = ''; let type = 'text/plain';
                if (draggable.tagName === 'IMG') { data = draggable.src; type = 'text/uri-list'; }
                else { data = draggable.textContent || 'Dragged Content'; }
                try { e.dataTransfer.setData(type, data); e.dataTransfer.effectAllowed = 'copyMove'; }
                catch (error) { console.error("Error setting drag data:", error); }
            }
        }


        initContentDragDrop() { // This function now correctly defines and assigns the bound handlers
            if (!this.contentElement) return;
            // Use the bound handlers defined in the constructor or here
            this.contentElement.removeEventListener('dragstart', this.handleContentDragStart); // Remove previous listeners first
            this.contentElement.removeEventListener('dragenter', this.handleContentDragEnter);
            this.contentElement.removeEventListener('dragover', this.handleContentDragOver);
            this.contentElement.removeEventListener('dragleave', this.handleContentDragLeave);
            this.contentElement.removeEventListener('drop', this.handleContentDrop);

            this.contentElement.addEventListener('dragstart', this.handleContentDragStart); // Add the single listener for starting drags
            this.contentElement.addEventListener('dragenter', this.handleContentDragEnter); // Add listener for entering the drop zone
            this.contentElement.addEventListener('dragover', this.handleContentDragOver);   // Add listener for dragging over the zone
            this.contentElement.addEventListener('dragleave', this.handleContentDragLeave); // Add listener for leaving the zone
            this.contentElement.addEventListener('drop', this.handleContentDrop);     // Add listener for the actual drop
        }

        getConfig() { return { title: this.config.title, widthClass: this.config.widthClass, jsCode: this.config.jsCode, customStyle: this.config.customStyle }; }
    } // End Panel Class

    // --- Settings Modal Logic ---
    function hideSettingsModal() { settingsModal.style.display = 'none'; } // Hide modal using style
    closeModalBtn.addEventListener('click', hideSettingsModal);
    settingsModal.addEventListener('click', (e) => { if (e.target === settingsModal) hideSettingsModal(); });
    settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const panelId = settingsForm.querySelector('#settings-panel-id').value;
        const applyAll = settingsForm.querySelector('#settings-apply-all').checked;
        const targetPanel = panelManager.getPanelById(panelId);
        if (!targetPanel && !applyAll) { console.error("Target panel not found."); hideSettingsModal(); return; }

        const newTitle = settingsForm.querySelector('#settings-title').value;
        const newBg = settingsForm.querySelector('#settings-background').value.trim() || null;
        const newRounding = settingsForm.querySelector('#settings-rounding').value;
        const newPadding = settingsForm.querySelector('#settings-padding').value;
        const newSpacing = settingsForm.querySelector('#settings-spacing').value;
        const newJsCode = settingsForm.querySelector('#settings-jscode').value;

        panelManager.applyGlobalStyle('spacing', newSpacing); // Apply spacing globally

        if (applyAll) {
            panelManager.applyGlobalStyle('rounding', newRounding);
            panelManager.applyGlobalStyle('padding', newPadding);
            panelManager.panels.forEach(p => {
                p.setTitle(newTitle); // Update all titles
                p.applyStyle('rounding', newRounding, true);
                p.applyStyle('padding', newPadding, true);
                p.applyStyle('background', newBg); // Apply bg to all directly
                // Optionally update JS code for all panels too
                // if(p.config.jsCode !== newJsCode) { p.config.jsCode = newJsCode; p.runJsCode(); }
            });
        } else if (targetPanel) {
            targetPanel.setTitle(newTitle);
            targetPanel.applyStyle('background', newBg);
            targetPanel.applyStyle('rounding', newRounding);
            targetPanel.applyStyle('padding', newPadding);
            if (targetPanel.config.jsCode !== newJsCode) { targetPanel.config.jsCode = newJsCode; targetPanel.runJsCode(); }
        }
        panelManager.saveLayout(); // Save after applying settings
        hideSettingsModal();
    });

    // --- Initialization ---
    const panelManager = new PanelManager(panlzContainer);
    console.log("Creating initial default panel layout.");
    while (panlzContainer.firstChild) { panlzContainer.removeChild(panlzContainer.firstChild); }
    panelManager.panels = []; panelManager.panelIdCounter = 0;

    // Initial Setup: 1 full, 6 half-width below in two columns - ALL EMPTY INITIALLY
    panelManager.addPanel({ title: "Top Panel", widthClass: 'width-full' });
    for (let i = 0; i < 6; i++) { panelManager.addPanel({ title: `Panel ${i + 1}`, widthClass: 'width-1-2' }); }
    console.log("PANLZ Initialized with default layout.");

}); // End DOMContentLoaded
