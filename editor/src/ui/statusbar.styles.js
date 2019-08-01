export const styles = /* css */`
.statusbar {
    height: 22px;
    line-height: 22px;
    flex-shrink: 0;
    background-color: rgb(var(--theme-statusbar));
}

.statusbar > .panel > .statusbar-item:not(button) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.statusbar > .panel:last-child {
    justify-content: flex-end;
}

.statusbar > .panel:first-child > .statusbar-item:not(button),
.statusbar > .panel:first-child > .statusbar-item:not(button) + button,
.statusbar > .panel:last-child > button + .statusbar-item:not(button) {
    margin-left: 10px;
}

.statusbar > .panel:last-child > .statusbar-item:not(button) {
    margin-right: 10px;
}

.statusbar > .panel:first-child > button.statusbar-item:first-child {
    margin-left: 5px;
}

.statusbar > .panel:last-child > button.statusbar-item:last-child {
    margin-right: 5px;
}

.statusbar > .panel > button {
    display: block;
    width: 22px;
    height: 22px;
    mask-size: 16px 16px;
    -webkit-mask-size: 16px 16px;
    background-color: rgb(var(--theme-text-active), var(--theme-disabled-alpha));
}

.statusbar > .panel > button.active {
    background-color: rgb(var(--theme-text-active));
}

.statusbar > .panel > .separator {
    width: 5px;
}
`;
