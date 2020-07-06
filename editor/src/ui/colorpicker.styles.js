export const styles = /* css */`
.color-picker {
    display: flex;
    flex-direction: column;
    position: absolute;
    background-color: rgb(var(--theme-dialog));
    outline: 1px solid rgb(var(--theme-focus));
    box-shadow: var(--theme-popup-shadow);
}

.color-picker > div {
    display: flex;
}

.color-picker-palette {
    display: flex;
}

.color-picker-palette:first-child {
    margin-top: 8px;
}

.color-picker-palette:last-child {
    margin-bottom: 8px;
}

.color-picker-palette button {
    border: 1px solid rgb(var(--theme-dialog));
}

.color-picker-palette button:hover, .color-picker-palette button:focus {
    border: 1px solid rgb(var(--theme-control-border-active));
}

.color-picker-palette button.active {
    border: 2px solid rgb(var(--theme-focus));
}

.color-picker-preview {
    display: flex;
    margin-left: 8px;
}

.color-picker-preview > button {
    width: 32px;
    height: 32px;
    margin-right: 8px;
    background: var(--alpha-pattern) repeat;
}

.color-picker-preview > button > span {
    display: block;
    height: 100%;
}

.color-picker-palette-buttons {
    display: flex;
    flex-wrap: wrap;
    width: 160px;
    margin-left: -1px;
    margin-right: 8px;
}

.color-picker-palette-buttons > button {
    display: block;
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    background: var(--alpha-pattern) repeat;
}

.color-picker-palette-buttons > button > span {
    display: block;
    height: 100%;
}

.color-picker-props {
    width: 88px;
    flex-shrink: 0;
}

.color-picker-ctrls {
    display: flex;
    flex-shrink: 0;
    width: fit-content;
}

.color-picker-ctrls > :focus-within {
    outline: 1px solid rgb(var(--theme-focus));
}

.color-picker-ctrls > div {
    margin: 8px 8px 8px 0;
}

.color-picker-ctrls > div.color-picker-color {
    margin-right: 10px;
}

.color-picker-ctrls > div.color-picker-hue {
    margin-right: 12px;
}

.color-picker-color {
    position: relative;
    width: fit-content;
    height: calc(100% - 16px);
    overflow: hidden;
    flex-shrink: 0;
}

.color-picker-hue, .color-picker-alpha {
    position: relative;
    width: 12px;
}

.color-picker-alpha > .color-picker-alpha-value {
    height: 100%;
}

.color-picker-saturation, .color-picker-value {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
}

.color-picker-handle {
    display: block;
    position: absolute;
    width: 100%;
    transform: translateY(-2px);
}

.color-picker-handle::before, .color-picker-handle::after {
    content: '';
    display: block;
    position: absolute;
    top: -50%;
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 2px 0 2px 0;
    border-color: transparent;
}

.color-picker-handle::before {
    left: -4px;
    border-left-width: 3.5px;
    border-left-color: rgb(var(--theme-text));
}

.color-picker-handle::after {
    left: 100%;
    border-right-width: 3.5px;
    border-right-color: rgb(var(--theme-text));
}

.color-picker-crosshair {
    display: block;
    position: absolute;
    width: 16px;
    height: 16px;
    transform: translate(-8px, -8px);
    mix-blend-mode: difference;
}

.color-picker-crosshair::before, .color-picker-crosshair::after {
    content: '';
    display: block;
    position: absolute;
    background-color: #fff;
}

.color-picker-crosshair::before {
    left: 0;
    top: calc(50% - 1px);
    width: 100%;
    height: 2px;
}

.color-picker-crosshair::after {
    left: calc(50% - 1px);
    top: 0;
    width: 2px;
    height: 100%;
}

.color-picker-alpha {
    background: var(--alpha-pattern) repeat;
}

.color-picker-hue {
    background: linear-gradient(to top, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%);
}

.color-picker-saturation {
    background: linear-gradient(to right, #fff, rgba(204, 154, 129, 0));
}

.color-picker-value {
    background: linear-gradient(to top, #000, rgba(204, 154, 129, 0));
}
`;
