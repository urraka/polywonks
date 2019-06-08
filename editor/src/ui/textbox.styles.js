export const styles = /* css */`
.textbox {
    flex: 1;
    display: flex;
    background-color: rgb(var(--theme-control));
}

.textbox:focus, .textbox:focus-within, .textbox.active {
    outline: 1px solid rgb(var(--theme-focus));
}

.textbox > input {
    display: block;
    white-space: nowrap;
    height: 22px;
    line-height: 22px;
    padding: 0 4px;
    width: 0;
    flex: 1;
}

.textbox > button {
    display: block;
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    margin: 4px 4px 4px 0;
}

.textbox > button.color-icon-button {
    background: var(--alpha-pattern) repeat;
    border: 1px solid rgb(var(--theme-control-border));
}

.textbox > button:not(:disabled).color-icon-button:hover,
.textbox > button:not(:disabled).color-icon-button:focus,
.textbox.active > button:not(:disabled).color-icon-button {
    border: 1px solid rgb(var(--theme-control-border-active));
}

.textbox > button.color-icon-button > span {
    display: block;
    height: 100%;
}
`;
