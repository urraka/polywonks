import * as ui from "../ui/ui.js";
import * as PMS from "../pms/pms.js";
import { ValueType } from "../common/type.js";
import { Node } from "../map/map.js";

export class Property {
    static item(key, label, valueType, value, owner = null, map = null) {
        const options = Property.itemOptions(key, valueType, owner, map);
        if (ValueType.typeOf(valueType) === "boolean") {
            return new ui.PropertyBooleanItem(key, label, value);
        } else if (ValueType.typeOf(valueType) === "color") {
            return new ui.PropertyColorItem(key, label, value);
        } else if (options) {
            return new ui.PropertyListItem(key, label, value, options);
        } else {
            return new ui.PropertyTextItem(key, label, value, {
                valueEquals: (a, b) => ValueType.equals(valueType, a, b),
                valueFromString: str => ValueType.fromString(valueType, str),
                valueToString: value => ValueType.toString(valueType, value),
            });
        }
    }

    static itemOptions(key, valueType, owner, map) {
        switch (ValueType.typeOf(valueType)) {
            case "enum": {
                const layer = (owner instanceof Node) ? owner.closest("layer") : null;
                const enumType = layer && valueType === PMS.PolyType ? layer.polyTypes() : valueType;
                return Property.toOptions([...enumType.names()]);
            }
            case "node": {
                switch (key) {
                    case "image": return Property.toOptions([...map.resources.descendants("image")]);
                    case "texture": return Property.toOptions([null, ...map.resources.descendants("texture")]);
                    case "waypoint": return Property.toOptions([...map.waypoints.children("waypoint")]);
                }
            }
            default: return null;
        }
    }

    static toOptions(items) {
        return items.map(item => ({ text: item ? item.toString() : "None", value: item }));
    }
}
