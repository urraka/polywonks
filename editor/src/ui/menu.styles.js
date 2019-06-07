export const styles = /* css */`
.titlebar {
    height: 30px;
    line-height: 30px;
    flex-shrink: 0;
    overflow: visible;
    background-color: rgb(var(--theme-titlebar));
}

.titlebar-icon {
    width: 35px;
    height: 100%;
    flex-shrink: 0;
    background-color: rgb(var(--theme-alt));
    mask-image: var(--theme-app-icon);
    mask-size: 18px 18px;
    -webkit-mask-image: var(--theme-app-icon);
    -webkit-mask-size: 18px 18px;
}

.menubar {
    height: 30px;
    line-height: 30px;
    display: flex;
    overflow: visible;
}

.menubar > .menu-item > label {
    padding: 0 8px;
    white-space: nowrap;
}

.menubar > .menu-item:hover,
.menubar > .menu-item.active {
    background-color: rgb(var(--theme-menubar-highlight));
}

.menubar > .menu-item > .menu {
    left: 0;
    top: 100%;
}

.menu-overlay {
    position: absolute;
    left: 0;
    top: 0;
}

.menu {
    position: absolute;
    padding: .5em 1px;
    line-height: 1.8em;
    background-color: rgb(var(--theme-menu));
    box-shadow: var(--theme-menu-shadow);
}

.menu > .menu-item {
    position: relative;
    margin-bottom: 2px;
    display: flex;
}

.menu > .menu-item:last-child {
    margin-bottom: 1px;
}

.menu > .menu-item > label {
    padding: 0 2em;
    white-space: nowrap;
    flex: 1;
}

.menu > .menu-item > label + label {
    text-align: right;
}

.menu > .menu-item:not(.separator):not(.disabled):hover,
.menu > .menu-item.active {
    color: rgb(var(--theme-text-active));
    background-color: rgb(var(--theme-menu-highlight));
}

.menu > .menu-item.disabled {
    opacity: var(--theme-disabled-alpha);
}

.menu > .menu-item.separator {
    border-bottom: 1px solid;
    padding-top: .2em;
    margin: .3em .8em;
    border-color: rgb(var(--theme-text));
    opacity: var(--theme-disabled-alpha);
}

.menu > .menu-item.checked::before {
    content: '';
    display: block;
    position: absolute;
    left: 0;
    top: 0;
    width: 16px;
    height: 100%;
    padding-right: .8em;
    box-sizing: content-box;
    mask-position: 50% 56%;
    -webkit-mask-position: 50% 56%;
    mask-size: 15px 15px;
    -webkit-mask-size: 15px 15px;
    mask-image: var(--icon-check);
    -webkit-mask-image: var(--icon-check);
    background-color: rgb(var(--theme-text));
}

.menu > .menu-item.has-submenu::after {
    content: '';
    display: block;
    position: absolute;
    right: 0;
    top: 0;
    width: 13px;
    height: 100%;
    padding-right: .8em;
    box-sizing: content-box;
    mask-position: 0 50%;
    -webkit-mask-position: 0 50%;
    mask-image: var(--icon-submenu);
    -webkit-mask-image: var(--icon-submenu);
    background-color: rgb(var(--theme-text));
}

.menu > .menu-item.checked.active::before,
.menu > .menu-item.checked:hover::before,
.menu > .menu-item.has-submenu.active::after,
.menu > .menu-item.has-submenu:hover::after {
    background-color: rgb(var(--theme-text-active));
}
`;
