import * as ui from "./ui.base.js";

export class TitleBar extends ui.Panel {
    constructor() {
        super("titlebar");
        this.append(ui.elem("div", "titlebar-icon"));
        this.menu = this.append(new MenuBar());
    }
}

export class MenuBar extends ui.Panel {
    constructor() {
        super("menubar");
        this.shouldClose = false;
        this.onBarMouseDown = this.onBarMouseDown.bind(this);
        this.onBarMouseUp = this.onBarMouseUp.bind(this);
        this.onBarMouseOver = this.onBarMouseOver.bind(this);
        this.onWindowMouseDown = this.onWindowMouseDown.bind(this);
        this.element.addEventListener("mousedown", this.onBarMouseDown);
    }

    activeItem() {
        return this.element.querySelector(".menu-item.active");
    }

    open(menuItem) {
        const activeItem = this.activeItem();

        if (!activeItem) {
            this.shouldClose = false;
            this.element.addEventListener("mouseover", this.onBarMouseOver);
            this.element.addEventListener("mouseup", this.onBarMouseUp);
            window.addEventListener("mousedown", this.onWindowMouseDown, true);
        } else if (activeItem !== menuItem) {
            Menu.close(activeItem);
        }

        if (activeItem !== menuItem) {
            Menu.open(menuItem);
        }
    }

    close() {
        const activeItem = this.activeItem();
        if (activeItem) {
            Menu.close(activeItem);
        }
        this.element.removeEventListener("mouseover", this.onBarMouseOver);
        this.element.removeEventListener("mouseup", this.onBarMouseUp);
        window.removeEventListener("mousedown", this.onWindowMouseDown, true);
    }

    onBarMouseDown(event) {
        const menuItem = MenuItem.from(event);
        const activeItem = this.activeItem();
        this.shouldClose = true;
        if (menuItem && menuItem !== activeItem) {
            this.open(menuItem);
        } else if (!menuItem) {
            this.close();
        }
    }

    onBarMouseUp(event) {
        const menuItem = MenuItem.from(event);
        if (menuItem && this.shouldClose) {
            this.close();
        }
    }

    onBarMouseOver(event) {
        const menuItem = MenuItem.from(event);
        const activeItem = this.activeItem();
        if (menuItem && menuItem !== activeItem) {
            this.open(menuItem);
        }
    }

    onWindowMouseDown(event) {
        const isMenu = e => e && (["menu", "menubar"].some(cls => e.classList.contains(cls) || isMenu(e.parentElement)));
        if (!isMenu(event.target)) {
            this.close();
        } else {
            this.shouldClose = true;
        }
    }

    addItem(item) {
        this.append(item.element);
        return item;
    }
}

export class Menu {
    constructor() {
        this.element = ui.elem("div", "menu");
        this.onMouseOver = this.onMouseOver.bind(this);
        this.onMouseOut = this.onMouseOut.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
    }

    addItem(item) {
        this.element.append(item.element);
        return item;
    }

    activeItem() {
        return this.element.querySelector(".menu-item.active");
    }

    onShow() {
        this.element.addEventListener("mouseover", this.onMouseOver);
        this.element.addEventListener("mouseout", this.onMouseOut);
        this.element.addEventListener("mousedown", this.onMouseDown);
        this.element.addEventListener("mouseup", this.onMouseUp);
    }

    onClose() {
        this.element.removeEventListener("mouseover", this.onMouseOver);
        this.element.removeEventListener("mouseout", this.onMouseOut);
        this.element.removeEventListener("mousedown", this.onMouseDown);
        this.element.removeEventListener("mouseup", this.onMouseUp);
    }

    onShowSubmenu(menuItem) {
        const items = Array.from(this.element.querySelectorAll(".menu-item.has-submenu"));
        items.forEach(item => item !== menuItem && Menu.close(item));
        Menu.open(menuItem);
    }

    onMouseOver(event) {
        const menuItem = MenuItem.from(event);
        if (menuItem) {
            const activeItem = this.activeItem();
            if (activeItem && activeItem !== menuItem) {
                activeItem.classList.remove("active");
            }
            Menu.timeout(() => this.onShowSubmenu(menuItem));
        }
        event.stopPropagation();
    }

    onMouseOut(event) {
        const menuItem = MenuItem.from(event);
        if (menuItem) {
            const submenu = Menu.from(menuItem);
            const isMenu = e => submenu && e && (e === submenu.element || isMenu(e.parentElement));
            if (!isMenu(event.relatedTarget)) {
                Menu.timeout(() => Menu.close(menuItem));
            }
        }
        event.stopPropagation();
    }

    onMouseDown(event) {
        const menuItem = MenuItem.from(event);
        if (menuItem) {
            if (menuItem.classList.contains("has-submenu")) {
                Menu.timeout(null);
                this.onShowSubmenu(menuItem);
            }
        }
    }

    onMouseUp(event) {
        const menuItem = MenuItem.from(event);
        if (menuItem) {
            if (menuItem.classList.contains("has-submenu")) {
                Menu.timeout(null);
                this.onShowSubmenu(menuItem);
            }
        }
    }

    static timeout(func) {
        if (Menu.timer) {
            clearTimeout(Menu.timer);
        }
        Menu.timer = func ? setTimeout(func, 300) : null;
    }

    static associate(menuItem, menu) {
        const menus = Menu.menuByMenuItem || (Menu.menuByMenuItem = new WeakMap());
        menus.set(menuItem, menu);
    }

    static from(menuItem) {
        const menus = Menu.menuByMenuItem || (Menu.menuByMenuItem = new WeakMap());
        return menus.get(menuItem);
    }

    static overlay(create = false) {
        let element = document.querySelector("body > .menu-overlay");
        if (!element && create) {
            element = ui.elem("div", "menu-overlay");
            document.body.append(element);
        }
        return element;
    }

    static removeOverlay() {
        const overlay = Menu.overlay();
        if (!overlay.hasChildNodes()) {
            overlay.remove();
        }
    }

    static open(menuItem) {
        const menu = Menu.from(menuItem);

        if (menu && !menu.element.parentElement) {
            menuItem.classList.add("active");

            const overlay = Menu.overlay(true);
            const rect = menuItem.getBoundingClientRect();

            if (menuItem.parentElement.classList.contains("menubar")) {
                menu.element.style.left = rect.left + "px";
                menu.element.style.top = (rect.top + rect.height) + "px";
            } else {
                menu.element.style.left = (rect.left + rect.width + 1) + "px";
                menu.element.style.top = (rect.top - 1) + "px";
            }

            overlay.append(menu.element);
            menu.onShow();
        }
    }

    static close(menuItem) {
        const menu = Menu.from(menuItem);
        const overlay = Menu.overlay();
        menuItem.classList.remove("active");

        if (menu && overlay && menu.element.parentElement) {
            const items = Array.from(menu.element.querySelectorAll(".menu-item.has-submenu"));
            items.forEach(menuItem => Menu.close(menuItem));
            menu.element.remove();
            menu.onClose();
            Menu.removeOverlay();
        }
    }
}

export class MenuItem {
    constructor(title) {
        this.element = ui.elem("div", "menu-item");
        this.label = ui.elem("label");
        this.label.textContent = title;
        this.element.append(this.label);
        this.submenu = null;
    }

    addItem(item) {
        if (!this.submenu) {
            this.submenu = new Menu();
            this.element.classList.add("has-submenu");
            Menu.associate(this.element, this.submenu);
        }

        this.submenu.addItem(item);
        return item;
    }

    static from(event) {
        let menuItem = event.target;
        if (menuItem.tagName === "LABEL") {
            menuItem = menuItem.parentElement;
        }
        if (menuItem.classList.contains("menu-item")) {
            return menuItem;
        }
        return null;
    }
}

export class MenuSeparator {
    constructor() {
        this.element = ui.elem("div", "menu-item");
        this.element.classList.add("separator");
    }
}
