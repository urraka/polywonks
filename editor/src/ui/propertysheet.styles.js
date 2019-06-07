export const styles = /* css */`
.property-sheet {
    overflow-y: auto;
    height: auto;
    padding: 8px 8px 0 8px;
    max-width: 100%;
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 8px 8px;
}

.property-sheet > label {
    display: block;
    white-space: nowrap;
    height: 22px;
    line-height: 22px;
}

.property-sheet > :last-child {
    margin-bottom: 8px;
}

.property-sheet .invalid {
    outline: 1px solid rgb(var(--theme-invalid));
}

.property-sheet .modified {
    color: rgb(var(--theme-text-active));
}

.property-sheet > .readonly {
    opacity: var(--theme-disabled-alpha);
}
`;
