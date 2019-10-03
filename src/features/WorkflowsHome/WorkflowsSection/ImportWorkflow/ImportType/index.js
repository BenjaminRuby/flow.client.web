import React, { Component } from "react";
import { Button, ModalBody, ModalFooter } from "carbon-components-react";
import { ModalFlowForm } from "@boomerang/carbon-addons-boomerang-react";
import "./styles.scss";

class ImportType extends Component {
  handleNextStep = ({ isUpdate }) => {
    const formData = {
      isUpdate
    };
    this.props.saveValues(formData);
    this.props.requestNextStep();
  };

  render() {
    return (
      <ModalFlowForm onSubmit={e => e.preventDefault()}>
        <ModalBody>
          <button
            className="bmrg--b-flow-export-options-button --bmrg-flow"
            onClick={() => this.handleNextStep({ isUpdate: false })}
          >
            NEW WORKFLOW
          </button>
          <button
            className="bmrg--b-flow-export-options-button --bmrg-flow"
            onClick={() => this.handleNextStep({ isUpdate: true })}
          >
            UPDATE WORKFLOW
          </button>
        </ModalBody>
        <ModalFooter>
          <Button kind="secondary" type="button">
            Cancel
          </Button>
        </ModalFooter>
      </ModalFlowForm>
    );
  }
}

export default ImportType;
