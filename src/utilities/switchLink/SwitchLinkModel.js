import { DefaultLinkModel } from "@projectstorm/react-diagrams";

export default class SwitchLinkModel extends DefaultLinkModel {
  constructor() {
    super("decision");
    this.switchCondition = null;
  }

  serialize() {
    return {
      ...super.serialize(),
      linkId: this.id,
      switchCondition: this.switchCondition
    };
  }

  deSerialize(data, engine) {
    super.deSerialize(data, engine);
    //this.id = data.linkId;
    this.switchCondition = data.switchCondition;
  }
}
