export const styles = /* css */`
.select {
    display: flex;
    position: relative;
    flex: 1;
    width: 100%;
    height: fit-content;
    background-color: rgb(var(--theme-control));
}

.select:focus, .select:focus-within, .select.active, .select-options {
    outline: 1px solid rgb(var(--theme-focus));
}

.select > label {
    display: block;
    white-space: nowrap;
    text-overflow: ellipsis;
    height: 22px;
    line-height: 22px;
    padding: 0 4px;
    flex: 1;
    width: 0;
    overflow: hidden;
}

.select::after {
    content: '';
    display: block;
    width: 16px;
    height: 22px;
    flex-shrink: 0;
    mask-size: 14px 15px;
    -webkit-mask-size: 14px 15px;
    mask-image: var(--icon-options);
    -webkit-mask-image: var(--icon-options);
    background-color: rgb(var(--theme-text));
}

.select-options {
    position: absolute;
    overflow-x: hidden;
    overflow-y: auto;
    background-color: rgb(var(--theme-control));
}

.select-options > .select-item {
    white-space: nowrap;
    line-height: 22px;
    padding: 0 4px;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
}

.select-options > .select-item.current {
    background-color: rgb(var(--theme-control-highlight));
}

`;
