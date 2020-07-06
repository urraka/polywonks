export const template = /* html */`
<div class="color-picker" tabindex="-1">
    <div class="color-picker-palette">
        <div class="color-picker-preview">
            <button><span></span></button>
            <button><span></span></button>
        </div>
        <div class="color-picker-palette-buttons"></div>
    </div>
    <div class="color-picker-values">
        <div class="color-picker-props"></div>
        <div class="color-picker-ctrls">
            <div class="color-picker-color">
                <div class="color-picker-saturation">
                    <div class="color-picker-value" tabindex="0">
                        <div class="color-picker-crosshair"></div>
                    </div>
                </div>
            </div>
            <div class="color-picker-hue" tabindex="0">
                <div class="color-picker-handle"></div>
            </div>
            <div class="color-picker-alpha">
                <div class="color-picker-alpha-value" tabindex="0">
                    <div class="color-picker-handle"></div>
                </div>
            </div>
        </div>
    </div>
</div>
`;
