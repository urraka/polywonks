const registeredStyles = [];

export function elem(tag, className) {
    const element = document.createElement(tag);

    if (className) {
        if (typeof className === "string") {
            element.classList.add(className);
        } else {
            className.forEach(clss => clss && element.classList.add(clss));
        }
    }

    return element;
}

export function html(source) {
    return document.createRange().createContextualFragment(source).firstElementChild;
}

export function registerStyles(styles) {
    registeredStyles.push(styles);
}

export function initializeStyles() {
    const element = document.head.querySelector("#ui-stylesheet") || elem("style");
    element.id = "ui-stylesheet";
    element.innerHTML = registeredStyles.join("\n");
    document.head.appendChild(element);
}
