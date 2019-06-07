import { Dialog } from "./dialog.js";

export function msgbox(title, message, onclose) {
    const dialog = new Dialog();
    dialog.header.textContent = title;
    dialog.body.textContent = message;
    dialog.body.classList.add("message");
    dialog.addButton("ok", "Ok", true);
    dialog.on("buttonclick", () => dialog.close());
    if (onclose) dialog.on("close", onclose);
    dialog.show();
}

export function confirm(title, message, defaultButton, onclose) {
    const dialog = new Dialog();
    dialog.header.textContent = title;
    dialog.body.textContent = message;
    dialog.body.classList.add("message");
    dialog.addButton("yes", "Yes", defaultButton === "yes");
    dialog.addButton("no", "No", defaultButton === "no");
    dialog.addButton("cancel", "Cancel", defaultButton === "cancel");
    dialog.result = "cancel";

    dialog.on("buttonclick", e => {
        dialog.result = e.button;
        dialog.close();
    });

    dialog.on("close", () => {
        onclose(dialog.result);
    });

    dialog.show();
}
