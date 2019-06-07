export const styles = /* css */`
.sidebar {
    width: 350px;
    flex-shrink: 0;
}

.sidebar-toolbar {
    width: 50px;
    flex-shrink: 0;
    flex-direction: column;
    background-color: rgb(var(--theme-sidebar-toolbar));
}

.sidebar-toolbar > button {
    height: 40px;
    mask-size: 28px 28px;
    -webkit-mask-size: 28px 28px;
}

.sidebar-panel {
    flex: 1;
    flex-direction: column;
    display: none;
    background-color: rgb(var(--theme-sidebar));
}

.sidebar-panel.active {
    display: flex;
}

.sidebar-header {
    height: 35px;
    line-height: 35px;
    flex-shrink: 0;
    padding: 0 20px;
    font-size: 11px;
    text-transform: uppercase;
}
`;
