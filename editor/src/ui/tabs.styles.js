export const styles = /* css */`
.tab-view {
    flex-direction: column;
}

.tab-view > .tab-content > .tab-panel {
    display: none;
}

.tab-view > .tab-content > .tab-panel.active {
    display: block;
}

.tab-view > .tab-container {
    flex-shrink: 0;
    height: auto;
    background-color: rgb(var(--theme-tab-back));
}

.tab-view > .tab-container > .tab {
    width: 120px;
    min-width: fit-content;
    height: 35px;
    line-height: 35px;
    padding-left: 10px;
    white-space: nowrap;
    display: flex;
    border-right: 1px solid rgb(var(--theme-tab-back));
    color: rgb(var(--theme-tab-text));
    background-color: rgb(var(--theme-tab));
}

.tab-view > .tab-container > .tab.active {
    color: rgb(var(--theme-tab-active-text));
    background-color: rgb(var(--theme-tab-active));
}

.tab-view > .tab-container > .tab > label {
    text-overflow: ellipsis;
}

.tab-view > .tab-container > .tab > .close {
    visibility: hidden;
    width: 28px;
    height: 16px;
    margin: auto 0 auto auto;
    mask-image: var(--icon-close);
    -webkit-mask-image: var(--icon-close);
}

.tab-view > .tab-container > .tab.modified > .close {
    visibility: visible;
    mask-image: var(--icon-modified);
    -webkit-mask-image: var(--icon-modified);
}

.tab-view > .tab-container > .tab.modified > .close:hover {
    mask-image: var(--icon-close);
    -webkit-mask-image: var(--icon-close);
}

.tab-view > .tab-container > .tab:hover > .close {
    visibility: visible;
}

.tab-view > .tab-container > .tab > .close:active {
    mask-size: 20px 20px;
    -webkit-mask-size: 20px 20px;
}
`;
