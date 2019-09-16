import merge from "lodash/merge";
import { PortModel } from "@projectstorm/react-diagrams";
import CustomLinkModel from "Utilities/customLink/CustomLinkModel";

export default class StartEndPortModel extends PortModel {
  //position: string | "top" | "bottom" | "left" | "right";

  constructor(pos) {
    super(pos, "startend");
    this.position = pos;
  }

  serialize() {
    return merge(super.serialize(), {
      position: this.position,
      nodePortId: this.id
    });
  }

  deSerialize(data, engine) {
    super.deSerialize(data, engine);
    this.position = data.position;
    this.id = data.nodePortId;
  }

  canLinkToPort(target) {
    console.log(this, target);
    if (this.position === "right" && target.position === "left") {
      return true;
    }
    return false;
  }

  createLinkModel() {
    return new CustomLinkModel();
  }
}
