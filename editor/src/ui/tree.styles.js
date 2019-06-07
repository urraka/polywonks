export const styles = /* css */`
.tree-view {
    overflow: auto;
    padding: 2px 0;
}

.tree-view > ul {
    padding-left: 6px;
}

.tree-view ul ul {
    padding-left: 16px;
}

.tree-view li {
    position: relative;
    pointer-events: none;
    white-space: nowrap;
}

.tree-view li::before {
    content: "";
    display: inline-block;
    pointer-events: all;
    vertical-align: top;
    width: 16px;
    height: 22px;
}

.tree-view li.with-subitems::before {
    mask-image: var(--icon-expanded);
    -webkit-mask-image: var(--icon-expanded);
    background-color: rgb(var(--theme-list-icon));
}

.tree-view li.with-subitems.collapsed::before {
    mask-image: var(--icon-collapsed);
    -webkit-mask-image: var(--icon-collapsed);
}

.tree-view li > span {
    display: inline-block;
    vertical-align: top;
    width: 16px;
    height: 22px;
    margin-right: 2px;
    pointer-events: all;
}

.tree-view li.collapsed > ul {
    display: none;
}

.tree-view label {
    display: inline-block;
    vertical-align: top;
    height: 22px;
    line-height: 22px;
    white-space: nowrap;
    margin-right: 16px;
    padding: 0 3px;
    border-radius: 3px;
    pointer-events: all;
}

.tree-view li.selected > label {
    background-color: rgb(var(--theme-list-highlight));
}

.tree-view span[class*="icon"] {
    background-color: rgb(var(--theme-list-icon));
}
`;
