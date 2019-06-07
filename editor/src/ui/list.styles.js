export const styles = /* css */`
.list-view {
    display: block;
    overflow: auto;
    padding: 2px 0;
}

.list-view li {
    display: flex;
    white-space: nowrap;
    height: 22px;
    line-height: 22px;
    padding: 0 16px;
}

.list-view li > label {
    flex: 1;
}

.list-view li > label + label {
    text-align: right;
}

.list-view li:hover {
    background-color: rgb(var(--theme-list-hover));
}

.list-view li.active {
    color: rgb(var(--theme-text-active));
    background-color: rgb(var(--theme-list-highlight));
}
`;
