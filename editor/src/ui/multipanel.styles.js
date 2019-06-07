export const styles = /* css */`
.panel-header {
    font-size: 11px;
    font-weight: bold;
    text-transform: uppercase;
    padding-left: 20px;
    height: 22px;
    line-height: 22px;
    overflow: hidden;
    white-space: nowrap;
    flex-shrink: 0;
    display: flex;
    background-color: rgb(var(--theme-panel-header));
}

.panel-header > label {
    flex: 1;
}

.panel-header > .toolbar {
    flex: 0;
}

.panel-header > .toolbar {
    display: flex;
}

.panel-header > .toolbar > button {
    width: 28px;
    height: 22px;
    mask-size: 16px 16px;
    -webkit-mask-size: 16px 16px;
}

.panel-header > .toolbar > button:active {
    mask-size: 20px 20px;
    -webkit-mask-size: 20px 20px;
}

.multi-panel-view {
    flex-direction: column;
}

.multi-panel-view > .panel-view {
    min-height: 22px;
    flex-direction: column;
}

.multi-panel-view > .panel-view.collapsed > .panel {
    display: none;
}

.multi-panel-view > .panel-view.collapsed {
    flex: 0 0;
}

.multi-panel-view > .panel-view > .panel-header::before {
    content: "";
    display: block;
    position: absolute;
    left: 0;
    top: 0;
    width: 16px;
    height: 22px;
    mask-image: var(--icon-expanded);
    -webkit-mask-image: var(--icon-expanded);
    background-color: rgb(var(--theme-list-icon));
}

.multi-panel-view > .panel-view.collapsed > .panel-header::before {
    mask-image: var(--icon-collapsed);
    -webkit-mask-image: var(--icon-collapsed);
}
`;
