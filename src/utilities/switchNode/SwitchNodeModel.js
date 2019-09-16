import { NodeModel } from "@projectstorm/react-diagrams";
import SwitchPortModel from "./SwitchPortModel";
import merge from "lodash/merge";

export default class SwitchNodeModel extends NodeModel {
  //list all three params
  constructor({ taskId, taskName }) {
    super("decision");
    this.addPort(new SwitchPortModel("left"));
    this.addPort(new SwitchPortModel("right"));
    this.taskId = taskId;
    this.taskName = taskName;
  }

  serialize() {
    return merge(super.serialize(), {
      taskId: this.taskId,
      nodeId: this.id,
      taskName: this.taskName
    });
  }

  deSerialize(data, engine) {
    super.deSerialize(data, engine);
    this.taskId = data.taskId;
    this.id = data.nodeId;
    this.taskName = data.taskName;
  }
}
