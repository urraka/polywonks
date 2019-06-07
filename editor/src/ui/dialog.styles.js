export const styles = /* css */`
.dialog {
    display: none;
    width: auto;
    height: auto;
    margin: auto;
    max-width: 100%;
    max-height: 100%;
    flex-direction: column;
    background-color: rgb(var(--theme-dialog));
    box-shadow: var(--theme-dialog-shadow);
}

.dialog-overlay {
    display: flex;
    align-items: center;
    cursor: default;
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
}

.dialog-overlay.active {
    background-color: rgb(var(--theme-dialog-overlay));
}

.dialog-overlay.active > .dialog {
    display: flex;
}

.dialog-header {
    flex-shrink: 0;
    height: 22px;
    line-height: 22px;
    padding: 0 8px;
    font-size: 10px;
    font-weight: bold;
    text-transform: uppercase;
    background-color: rgb(var(--theme-dialog-header));
}

.dialog.flicker .dialog-header {
    animation: flicker 0.8s;
}

.dialog-body {
    min-width: 450px;
}

.dialog-body.message {
    padding: 20px;
}

.dialog-buttons {
    flex-shrink: 0;
    display: flex;
    justify-content: flex-end;
    padding: 0 8px 8px 8px;
}

.dialog-buttons button {
    line-height: 22px;
    margin-right: 8px;
    padding: 0 20px;
    background-color: rgb(var(--theme-dialog-button));
}

.dialog-buttons button:hover, .dialog-buttons button:active {
    background-color: rgb(var(--theme-dialog-button-active));
}

.dialog-buttons button:focus {
    outline: 1px solid rgb(var(--theme-focus));
}

.dialog-buttons button:last-child {
    margin-right: 0;
}

@keyframes flicker {
    0% { opacity: 1.0; }
   10% { opacity: 0.5; }
   20% { opacity: 1.0; }
   30% { opacity: 0.5; }
   40% { opacity: 1.0; }
   50% { opacity: 0.5; }
   60% { opacity: 1.0; }
   70% { opacity: 0.5; }
   80% { opacity: 1.0; }
   90% { opacity: 0.5; }
  100% { opacity: 1.0; }
}
`;
