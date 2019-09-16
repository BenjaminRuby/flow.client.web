import React from "react";
import { DefaultLinkFactory } from "@projectstorm/react-diagrams";
import CustomLinkModel from "./CustomLinkModel";
import CustomLink from "Components/WorkflowLink";

export default class CustomLinkFactory extends DefaultLinkFactory {
  constructor(diagramEngine) {
    super();
    this.type = "custom";
    this.diagramEngine = diagramEngine;
  }

  getNewInstance = () => {
    return new CustomLinkModel();
  };

  generateLinkSegment(model, widget, selected, path) {
    return (
      <g>
        <CustomLink model={model} path={path} diagramEngine={this.diagramEngine} />
      </g>
    );
  }
}
