import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { actions as workflowActions } from "State/workflow";
import ModalContentBody from "@boomerang/boomerang-components/lib/ModalContentBody";
import ModalConfirmButton from "@boomerang/boomerang-components/lib/ModalConfirmButton";
import ModalContentFooter from "@boomerang/boomerang-components/lib/ModalContentFooter";
import SelectDropdown from "@boomerang/boomerang-components/lib/SelectDropdown";
import TextArea from "@boomerang/boomerang-components/lib/TextArea";
import TextInput from "@boomerang/boomerang-components/lib/TextInput";
import Toggle from "@boomerang/boomerang-components/lib/Toggle";
import INPUT_TYPES from "Constants/workflowInputTypes";
import "./styles.scss";

class InputsModalContent extends Component {
  static propTypes = {
    updateInputs: PropTypes.func.isRequired,
    input: PropTypes.object,
    isEdit: PropTypes.bool,
    workflowActions: PropTypes.object.isRequired,
    closeModal: PropTypes.func.isRequired,
    inputsNames: PropTypes.array,
    loading: PropTypes.bool.isRequired
  };

  state = {
    key: this.props.input ? this.props.input.key : "",
    description: this.props.input ? this.props.input.description : "",
    label: this.props.input ? this.props.input.label : "",
    required: this.props.input ? this.props.input.required : false,
    type: this.props.input ? this.props.input.type : INPUT_TYPES.TEXT,
    defaultValue: this.props.input ? this.props.input.defaultValue : "",
    validValues: this.props.input && this.props.input.validValues ? this.props.input.validValues : undefined,
    keyError: "",
    labelError: "",
    loading: false
  };

  handleKeyChange = (value, error) => {
    this.props.shouldConfirmExit(true);
    this.setState({ key: value, keyError: error.key });
  };

  handleDescriptionChange = (value, error) => {
    this.props.shouldConfirmExit(true);
    this.setState({ description: value });
  };

  handleLabelChange = (value, error) => {
    this.props.shouldConfirmExit(true);
    this.setState({ label: value, labelError: error.label });
  };

  handleRequiredChange = (checked, event, id) => {
    this.props.shouldConfirmExit(true);
    this.setState({ required: checked });
  };

  handleTypeChange = (value, error, name) => {
    this.props.shouldConfirmExit(true);
    this.setState({ type: value.value, defaultValue: value.value === INPUT_TYPES.BOOLEAN ? false : undefined });
  };

  handleDefaultValueChange = value => {
    this.props.shouldConfirmExit(true);
    switch (this.state.type) {
      case INPUT_TYPES.BOOLEAN:
        this.setState({ defaultValue: value.toString() });
        return;
      case INPUT_TYPES.SELECT:
        this.setState({ defaultValue: value.value }); //save string value from object to simplify sending to service
        return;
      default:
        this.setState({ defaultValue: value });
        return;
    }
  };

  // Only save an array of strings to match api and simplify renderDefaultValue()
  handleValidValuesChange = (values, errors, name) => {
    this.props.shouldConfirmExit(true);
    this.setState({ validValues: values.map(option => option.value) });
  };

  /* Check if key contains space or special characters, only underline is allowed */
  validateKey = key => {
    const regexp = new RegExp("[^a-z|^A-Z|^0-9|^_|/.]");
    return !regexp.test(key);
  };

  // dispatch Redux action to update store
  handleConfirm = e => {
    e.preventDefault();
    let inputProperties = { ...this.state };

    delete inputProperties.keyError;
    delete inputProperties.descriptionError;
    delete inputProperties.labelError;

    //remove in case they are present if the user changed their mind
    if (inputProperties.type !== INPUT_TYPES.SELECT) {
      delete inputProperties.validValues;
    }

    //default state to false if falsy
    if (inputProperties.type === INPUT_TYPES.BOOLEAN) {
      if (!inputProperties.defaultValue) inputProperties.defaultValue = false;
    }

    if (this.props.isEdit) {
      new Promise(resolve => resolve(this.props.workflowActions.updateWorkflowInput(inputProperties)))
        .then(() =>
          this.props.updateInputs({ title: "Edit Input", message: "Successfully edited input", type: "edit" })
        )
        .then(() => {
          this.props.closeModal();
        });
    } else {
      new Promise(resolve => resolve(this.props.workflowActions.createWorkflowInput(inputProperties)))
        .then(() =>
          this.props.updateInputs({ title: "Create Input", message: "Successfully created input", type: "create" })
        )
        .then(() => {
          this.props.closeModal();
        });
    }
  };

  renderDefaultValue = () => {
    let { type, defaultValue, validValues } = this.state;

    //convert to object so it works with SelectDropdown component
    if (Array.isArray(validValues)) {
      validValues = validValues.map(value => ({
        value: value,
        label: value
      }));
    }

    switch (type) {
      case INPUT_TYPES.BOOLEAN:
        return (
          <div className="b-inputs-modal-toggle">
            <div className="b-inputs-modal-toggle__title">Default Value</div>
            <Toggle
              id="input-default-value-toggle"
              onChange={this.handleDefaultValueChange}
              checked={defaultValue === "true"}
              theme="bmrg-flow"
            />
          </div>
        );
      case INPUT_TYPES.SELECT:
        return (
          <>
            <div className="b-inputs-modal-select">
              <SelectDropdown
                multi
                isCreatable
                titleClass="b-inputs-modal-select__title"
                styles={{ width: "100%", marginBottom: "2rem" }}
                onChange={this.handleValidValuesChange}
                options={validValues || []}
                value={validValues || []}
                theme="bmrg-flow"
                title="Options"
                placeholder="Enter option"
                noResultsText="No options entered"
              />
            </div>
            <div className="b-inputs-modal-select">
              <SelectDropdown
                titleClass="b-inputs-modal-select__title"
                styles={{ width: "100%" }}
                onChange={this.handleDefaultValueChange}
                options={validValues || []}
                value={defaultValue || {}}
                theme="bmrg-flow"
                title="Default Option"
                placeholder="Select option"
                noResultsText="No options entered"
                clearable
              />
            </div>
          </>
        );
      case INPUT_TYPES.TEXT_AREA:
        return (
          <div className="b-inputs-modal-text-area">
            <TextArea
              title="Default Value"
              placeholder="Default Value"
              name="default value"
              onChange={this.handleDefaultValueChange}
              value={defaultValue || ""}
              theme="bmrg-flow"
              alwaysShowTitle
            />
          </div>
        );
      default:
        // Fallback to text input here because it covers text, password, and url
        return (
          <div className="b-inputs-modal-text-input">
            <TextInput
              title="Default Value"
              placeholder="Default Value"
              name="default value"
              type={type}
              onChange={this.handleDefaultValueChange}
              value={defaultValue || ""}
              theme="bmrg-flow"
              alwaysShowTitle
            />
          </div>
        );
    }
  };

  render() {
    const { isEdit, inputsKeys, loading } = this.props;
    const { key, description, label, required, type, keyError, labelError } = this.state;

    return (
      <form onSubmit={this.handleConfirm}>
        <fieldset disabled={loading}>
          <ModalContentBody className="c-inputs-modal-body">
            <div className="c-inputs-modal-body-left">
              <TextInput
                alwaysShowTitle
                title="Key"
                placeholder="key.value"
                name="key"
                type="text"
                comparisonData={inputsKeys || []}
                noValueText="Enter a key"
                existValueText="Property key already exist"
                onChange={this.handleKeyChange}
                value={key}
                validationFunction={this.validateKey}
                validationText="Invalid key, space and special characters aren't allowed"
                theme="bmrg-flow"
                required
              />
              <TextInput
                alwaysShowTitle
                title="Label"
                placeholder="Label"
                name="label"
                type="text"
                noValueText="Enter a label"
                onChange={this.handleLabelChange}
                value={label}
                theme="bmrg-flow"
                required
              />
              <TextInput
                alwaysShowTitle
                title="Description"
                placeholder="Description"
                name="description"
                type="text"
                onChange={this.handleDescriptionChange}
                value={description}
                theme="bmrg-flow"
                required={false}
              />
              <div className="b-inputs-modal-toggle">
                <div className="b-inputs-modal-toggle__title">Required</div>
                <Toggle
                  id="input-required-toggle"
                  onChange={this.handleRequiredChange}
                  checked={required}
                  theme="bmrg-flow"
                />
              </div>
            </div>
            <div className="c-inputs-modal-body-right">
              <div className="b-inputs-modal-type">
                <SelectDropdown
                  titleClass="b-inputs-modal-type__title"
                  onChange={this.handleTypeChange}
                  options={[
                    { label: "Boolean", value: "boolean" },
                    { label: "Number", value: "number" },
                    { label: "Password", value: "password" },
                    { label: "Select", value: "select" },
                    { label: "Text", value: "text" },
                    { label: "Text Area", value: "textarea" }
                  ]}
                  value={type}
                  theme="bmrg-flow"
                  title="Type"
                  styles={{ width: "100%" }}
                />
              </div>
              {this.renderDefaultValue()}
            </div>
          </ModalContentBody>
          <ModalContentFooter style={{ paddingTop: "1rem" }}>
            <ModalConfirmButton
              disabled={!(key && label && type) || (!!keyError || !!labelError) || loading}
              text={isEdit ? "SAVE" : "CREATE"}
              theme="bmrg-flow"
              type="submit"
            />
          </ModalContentFooter>
        </fieldset>
      </form>
    );
  }
}

const mapDispatchToProps = dispatch => ({
  workflowActions: bindActionCreators(workflowActions, dispatch)
});

export default connect(
  null,
  mapDispatchToProps
)(InputsModalContent);
