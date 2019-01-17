import { DefaultPortModel } from "@boomerang/boomerang-dag";
import CustomLinkModel from "Utilities/customLink/CustomLinkModel";
import merge from "lodash/merge";

export default class CustomTaskPortModel extends DefaultPortModel {
  //position: string | "top" | "bottom" | "left" | "right";

  constructor(pos) {
    super(pos, "custom");
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

  createLinkModel() {
    //return new DefaultLinkModel();
    return new CustomLinkModel();
  }
}
