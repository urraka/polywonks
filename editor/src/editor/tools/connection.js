import { iter } from "../../common/iter.js";
import { ConnectionNode, WaypointNode } from "../../map/map.js";
import { SnapSource } from "../snapping.js";
import { CreateTool } from "./create.js";
import { Tool } from "./tool.js";

export class ConnectionTool extends CreateTool {
    constructor() {
        super();
        this.selectedWaypoint = null;
        this.dummyWaypoints = [new WaypointNode(), new WaypointNode()];
        this.snapFilter = this.snapFilter.bind(this);
    }

    get text() {
        return "Connections";
    }

    get statusText() {
        return "Create waypoint connections";
    }

    onActivate() {
        super.onActivate();
        this.selectedWaypoint = null;
        this.handle.snapToGrid = false;
        this.handle.snapToObjects = true;
        this.handle.snapSources = [new SnapSource(this.editor.map.waypoints, this.snapFilter)];
    }

    onEdit() {
        if (this.handle.snapResult) {
            if (!this.selectedWaypoint) {
                this.beginEditing();
                this.selectedWaypoint = this.handle.snapResult.node;
                this.dummyWaypoints[0].attr("x", this.selectedWaypoint.attr("x"));
                this.dummyWaypoints[0].attr("y", this.selectedWaypoint.attr("y"));
                this.dummyWaypoints[0].append(this.node);
            } else {
                this.node.remove();
                this.node.attr("waypoint", this.handle.snapResult.node);
                this.endEditing();
                this.selectedWaypoint = null;

            }
        }
    }

    onNodeRemove(event) {
        super.onNodeRemove(event);
        if (this.selectedWaypoint) {
            for (const node of event.node.tree()) {
                if (node === this.selectedWaypoint) {
                    this.reset();
                    break;
                }
            }
        }
    }

    insertNode(command) {
        command.insert(this.selectedWaypoint, null, this.node);
    }

    createNode() {
        const connection = new ConnectionNode();
        connection.attr("waypoint", this.dummyWaypoints[1]);
        return connection;
    }

    updateNode() {
        this.dummyWaypoints[1].attr("x", this.handle.x);
        this.dummyWaypoints[1].attr("y", this.handle.y);
    }

    snapFilter(node) {
        const sel = this.selectedWaypoint;
        return (node instanceof WaypointNode) && sel !== node &&
            (!sel || !iter(sel.children("connection")).map(cn => cn.attr("waypoint")).includes(node));
    }

    updateTargetLayer() {
        this.targetLayer = this.editor.map.waypoints;
    }
}

Tool.register(ConnectionTool);
