import React, { Component } from "react";
import PropTypes from "prop-types";
import { transformAll } from "@overgear/yup-ast";
import { AutoSuggest, DynamicFormik, TextInput } from "@boomerang/carbon-addons-boomerang-react";
import { TextInput as CarbonTextInput } from "carbon-components-react";
import { Button, ModalFooter } from "carbon-components-react";
import TextEditorModal from "Components/TextEditorModal";
import formatAutoSuggestProperties from "Utilities/formatAutoSuggestProperties";
import { TEXT_AREA_TYPES, SELECT_TYPES } from "Constants/formInputTypes";
import styles from "./DisplayForm.module.scss";

const AutoSuggestInput = props => {
  return (
    <div key={props.id} style={{ paddingBottom: "1rem", position: "relative" }}>
      <AutoSuggest {...props}>
        <CarbonTextInput />
      </AutoSuggest>
    </div>
  );
};

const TextEditorInput = props => {
  return (
    <div key={props.id} style={{ position: "relative", cursor: "pointer", paddingBottom: "1rem" }}>
      <TextEditorModal {...props} />
    </div>
  );
};

const NameTextInput = props => {
  return (
    <>
      <TextInput {...props} />
      <hr className={styles.divider} />
      <h2 className={styles.inputsTitle}>Specifics</h2>
    </>
  );
};

class DisplayForm extends Component {
  static propTypes = {
    closeModal: PropTypes.func,
    inputProperties: PropTypes.array,
    node: PropTypes.object.isRequired,
    nodeConfig: PropTypes.object.isRequired,
    onSave: PropTypes.func.isRequired,
    setIsModalOpen: PropTypes.func.isRequired,
    setShouldConfirmModalClose: PropTypes.func,
    task: PropTypes.object.isRequired,
    taskNames: PropTypes.array.isRequired
  };

  componentDidMount() {
    this.props.setIsModalOpen({ isModalOpen: true });
    this.props.setShouldConfirmModalClose(false);
  }
  componentWillUnmount() {
    this.props.setIsModalOpen({ isModalOpen: false });
  }

  formikSetFieldValue = (value, id, setFieldValue) => {
    this.props.setShouldConfirmModalClose(true);
    setFieldValue(id, value);
  };

  formikHandleChange = (e, handleChange) => {
    this.props.setShouldConfirmModalClose(true);
    handleChange(e);
  };

  handleOnSave = values => {
    this.props.node.taskName = values.taskName;
    this.props.onSave(values);
    this.props.setShouldConfirmModalClose(false);
    this.props.closeModal();
  };

  validateInput = ({ value, maxValueLength, minValueLength, validationFunction, validationText }) => {
    if (maxValueLength !== undefined && value.length > maxValueLength) {
      return { message: `Must be less than ${maxValueLength} characters` };
    } else if (minValueLength !== undefined && value.length < minValueLength) {
      return { message: `Must be more than ${minValueLength} characters` };
    } else if (validationFunction && !validationFunction(value)) {
      return { message: validationText };
    } else {
      return { message: "" };
    }
  };

  yupAST = (taskConfig, taskNames) => {
    let yupShape = {
      taskName: [
        ["yup.string"],
        ["yup.required", "Name is required"],
        ["yup.notOneOf", taskNames, "Task name must be unique per workflow"]
      ]
    };

    taskConfig.forEach(item => {
      let yupValidationArray = [];
      const type = item.type;

      if (
        type === "text" ||
        type === "PASSWORD" ||
        Object.keys(TEXT_AREA_TYPES).includes(type) ||
        type === SELECT_TYPES.select.type
      ) {
        yupValidationArray.push(["yup.string"]);
      } else if (type === "url") {
        yupValidationArray.push(["yup.string"], ["yup.url"]);
      } else if (type === SELECT_TYPES.multiselect.type) {
        yupValidationArray.push(["yup.array"]);
      } else {
        yupValidationArray.push(["yup.boolean"]);
      }

      if (item.minValueLength) {
        yupValidationArray.push(["yup.required", `${item.label} is required`]);
        yupValidationArray.push([
          "yup.min",
          item.minValueLength,
          `${item.label} must be at least ${item.minValueLength} characters`
        ]);
      }
      if (item.maxValueLength) {
        yupValidationArray.push([
          "yup.max",
          item.maxValueLength,
          `${item.label} must be less than ${item.maxValueLength} characters`
        ]);
      }

      if (yupValidationArray.length > 0) {
        yupShape[item.key] = yupValidationArray;
      }
    });

    return [["yup.object"], ["yup.shape", yupShape]];
  };

  customProps = (input, formikProps) => {
    const { handleChange } = formikProps;
    return {
      onChange: e => this.formikHandleChange(e, handleChange),
      type: "text",
      labelText: "Name"
    };
  };

  selectProps = (input, formikProps) => {
    const { setFieldValue } = formikProps;
    const { key } = input;

    return {
      onChange: ({ selectedItem }) => this.formikSetFieldValue(selectedItem ? selectedItem : "", key, setFieldValue),
      shouldFilterItem: () => true
    };
  };

  multiSelectProps = (input, formikProps) => {
    const { setFieldValue } = formikProps;
    const { key } = input;

    return {
      onChange: ({ selectedItems }) => this.formikSetFieldValue(selectedItems.map(item => item.key), key, setFieldValue)
    };
  };

  textAreaProps = (input, formikProps) => {
    const { values, setFieldValue } = formikProps;
    const { key, language, maxValueLength, minValueLength, type } = input;
    const itemConfig = TEXT_AREA_TYPES[type];

    return {
      autoSuggestions: formatAutoSuggestProperties(this.props.inputProperties),
      formikSetFieldValue: value => this.formikSetFieldValue(value, key, setFieldValue),
      initialValue: values[key],
      inputProperties: this.props.inputProperties,
      item: input,
      itemConfig,
      language,
      minValueLength,
      maxValueLength,
      validateInput: this.validateInput
    };
  };

  textInputProps = (input, formikProps) => {
    const { errors, handleBlur, touched, values, setFieldValue } = formikProps;
    const { description, key, label, type } = input;

    return {
      autoSuggestions: formatAutoSuggestProperties(this.props.inputProperties),
      onChange: value => this.formikSetFieldValue(value, key, setFieldValue),
      initialValue: values[key],
      inputProps: {
        id: key,
        placeholder: description,
        labelText: label,
        onBlur: handleBlur,
        type,
        invalid: touched[key] && errors[key],
        invalidText: errors[key]
      }
    };
  };

  toggleProps = (input, formikProps) => {
    const { values, setFieldValue } = formikProps;
    const { description, key, label } = input;

    return {
      checked: values[key],
      onChange: (checked, event, id) => this.formikSetFieldValue(checked, id, setFieldValue),
      label,
      description
    };
  };

  submitButton = ({ form, isValid }) => (
    <ModalFooter>
      <Button kind="secondary" onClick={this.props.closeModal}>
        Cancel
      </Button>
      <Button type="submit" disabled={!isValid}>
        Apply
      </Button>
    </ModalFooter>
  );

  render() {
    const { node, nodeConfig, task, taskNames } = this.props;

    const otherTaskNames = taskNames.filter(name => name !== node.taskName);
    const inputs = [
      { key: "taskName", labelText: "Task Name", placeholder: "Enter a task name", type: "taskName" },
      ...task.config
    ];

    return (
      <DynamicFormik
        customType="taskName"
        customProps={this.customProps}
        CustomComponent={NameTextInput}
        dataDrivenProps={{
          TextInput: AutoSuggestInput,
          TextEditor: TextEditorInput
        }}
        formProps={{ className: styles.container, id: "display-form" }}
        initialValues={{ taskName: node.taskName, ...nodeConfig.inputs }}
        inputs={inputs}
        inputsWrapperProps={{ className: styles.inputsContainer }}
        multiSelectProps={this.multiSelectProps}
        onSubmit={this.handleOnSave}
        selectProps={this.selectProps}
        submitButton={this.submitButton}
        textAreaProps={this.textAreaProps}
        textEditorProps={this.textAreaProps}
        textInputProps={this.textInputProps}
        toggleProps={this.toggleProps}
        validationSchema={transformAll(this.yupAST(task.config, otherTaskNames))}
      />
    );
  }
}

export default DisplayForm;
