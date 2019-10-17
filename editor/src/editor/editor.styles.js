export const styles = /* css */`
.editor {
    box-shadow: var(--theme-canvas-shadow);
}

.editor-sidebar-panels:not(.active) {
    display: none;
}

.editor-sidebar-panels li.tool-properties {
    height: auto;
    display: none;
    background-color: transparent;
}

.editor-sidebar-panels li.active + li.tool-properties {
    display: block;
}

.editor-sidebar-panels li.active-layer > label {
    color: rgb(var(--theme-text-active));
}

.cursor-default {
    cursor: default;
}

.cursor-move {
    cursor: move;
}
`;
