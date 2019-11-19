import React, { Component } from "react";
import PropTypes from "prop-types";
import { Formik } from "formik";
import * as Yup from "yup";
import {
  ModalBody,
  ModalFooter,
  Button,
  FileUploaderDropContainer,
  FileUploaderItem,
  ComboBox,
  TextInput
} from "carbon-components-react";
import { ModalFlowForm } from "@boomerang/carbon-addons-boomerang-react";
import { ErrorFilled32 } from "@carbon/icons-react";
import Loading from "Components/Loading";
import { requiredWorkflowProps } from "./constants";
import styles from "./importWorkflowContent.module.scss";

class ImportWorkflowContent extends Component {
  state = {
    files: this.props.formData.files.length > 0 ? this.props.formData.files : [],
    isBiggerThanLimit: false,
    processedFile: {},
    isValidWorkflow: undefined,
    selectedTeam: this.props.team || {},
    names: this.props.names || []
  };

  static propTypes = {
    formData: PropTypes.object,
    closeModal: PropTypes.func,
    isLoading: PropTypes.bool,
    handleImportWorkflow: PropTypes.func,
    title: PropTypes.string.isRequired,
    confirmButtonText: PropTypes.string.isRequired,
    teams: PropTypes.array.isRequired,
    names: PropTypes.array.isRequired,
    team: PropTypes.object
  };

  addFile = file => {
    this.setState({ isBiggerThanLimit: false });

    if (file.addedFiles[0].size > 1000000) {
      this.setState({ isBiggerThanLimit: true });
    }
    this.setState({ files: [...file.addedFiles] });

    const fileTest = file.addedFiles[0];

    let reader = new FileReader();
    reader.onload = e => {
      let contents = JSON.parse(e.target.result);
      let isValidWorkflow = this.checkIsValidWorkflow(contents);
      this.setState({
        processedFile: contents,
        isValidWorkflow
      });
    };
    reader.readAsText(fileTest);
  };

  handleChangeTeam = selectedItem => {
    let names = [];
    if (selectedItem?.workflows && selectedItem.workflows.length) {
      names = selectedItem.workflows.map(item => item.name);
    }
    this.setState({ selectedTeam: selectedItem, names: names });
  };

  checkIsValidWorkflow = data => {
    // Only check if the .json file contain the required key data
    // This validate can be improved
    let isValid = true;
    requiredWorkflowProps.forEach(prop => {
      if (!data.hasOwnProperty(prop)) {
        isValid = false;
      }
    });
    //Validate if workflow has the latest structure for dag
    if (!data.latestRevision?.dag?.tasks) {
      isValid = false;
    }
    return isValid;
  };

  deleteFile = () => {
    this.setState({ files: [], isBiggerThanLimit: false });
  };

  handleSubmit = values => {
    const { processedFile } = this.state;

    this.props.handleImportWorkflow(
      {
        ...this.state.processedFile,
        shortDescription: values.summary,
        name: values.name,
        flowTeamId: values.selectedTeam?.id ?? processedFile.flowTeamId
      },
      this.props.closeModal,
      values.selectedTeam
    );
  };

  render() {
    const buttonMessage = "Choose a file or drag one here";
    // const validText = "All set! This Workflow is valid, and will fully replace the existing Workflow.";
    const invalidText = "Whoops! This Workflow is invalid, please choose a different file.";
    const { isLoading, title, confirmButtonText, team, teams } = this.props;
    const { files, isBiggerThanLimit, isValidWorkflow } = this.state;

    if (isLoading) {
      return <Loading />;
    }

    return (
      <Formik
        initialValues={{
          selectedTeam: team,
          name: "",
          summary: ""
        }}
        onSubmit={this.handleSubmit}
        validationSchema={Yup.object().shape({
          selectedTeam: Yup.string().required("Team is required"),
          name: Yup.string()
            .required("Please enter a name for your Workflow")
            .max(64, "Name must not be greater than 64 characters")
            .notOneOf(
              this.state.names,
              "There’s already a Workflow with that name in this team, you'll need to give this workflow a unique name."
            ),
          summary: Yup.string().max(128, "Summary must not be greater than 128 characters")
        })}
        initialErrors={{ name: "Please enter a name for your Workflow" }}
      >
        {props => {
          const { values, touched, errors, isValid, handleChange, handleBlur, handleSubmit, setFieldValue } = props;

          return (
            <ModalFlowForm title={title} onSubmit={handleSubmit}>
              <ModalBody
                style={{
                  height: "20.25rem",
                  width: "100%"
                }}
              >
                <FileUploaderDropContainer
                  accept={[".json"]}
                  labelText={buttonMessage}
                  name="Workflow"
                  multiple={false}
                  onAddFiles={(event, file) => {
                    this.addFile(file);
                  }}
                />
                {files.length ? (
                  <FileUploaderItem
                    name={files[0].name}
                    status="edit"
                    invalid={isBiggerThanLimit}
                    errorSubject="Please select a file less than 1MB"
                    onDelete={() => {
                      this.deleteFile();
                    }}
                  />
                ) : (
                  ""
                )}
                {files.length ? (
                  isValidWorkflow === true ? (
                    //Form
                    <div className={styles.confirmInfoForm}>
                      {/* <CheckmarkFilled32 aria-label="success-import-icon" className={styles.successIcon} />           
                      <p className={styles.message}>{validText}</p> */}
                      <ComboBox
                        id="selectedTeam"
                        styles={{ marginBottom: "2.5rem" }}
                        onChange={({ selectedItem }) => {
                          setFieldValue("selectedTeam", selectedItem ? selectedItem : "");
                          this.handleChangeTeam(selectedItem);
                        }}
                        items={teams}
                        initialSelectedItem={values.selectedTeam}
                        value={values.selectedTeam}
                        itemToString={item => (item ? item.name : "")}
                        titleText="Team"
                        placeholder="Select a team"
                        invalid={errors.selectedTeam}
                        invalidText={errors.selectedTeam}
                      />
                      <TextInput
                        id="name"
                        labelText="Workflow Name"
                        placeholder="Workflow Name"
                        name="name"
                        value={values.name}
                        onBlur={handleBlur}
                        onChange={handleChange}
                        invalid={errors.name}
                        invalidText={errors.name}
                      />
                      <TextInput
                        id="summary"
                        labelText="Summary"
                        placeholder="Summary"
                        value={values.summary}
                        onBlur={handleBlur}
                        onChange={handleChange}
                        invalid={errors.summary && touched.summary}
                        invalidText={errors.summary}
                      />
                    </div>
                  ) : isValidWorkflow === false ? (
                    <div className={styles.validMessage}>
                      <ErrorFilled32 aria-label="error-import-icon" className={styles.errorIcon} />
                      <p className={styles.message}>{invalidText}</p>
                    </div>
                  ) : null
                ) : null}
              </ModalBody>
              <ModalFooter>
                <Button onClick={this.props.closeModal} kind="secondary">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!isValid || !this.state.files.length || isBiggerThanLimit}
                  kind="primary"
                >
                  {confirmButtonText}
                </Button>
              </ModalFooter>
            </ModalFlowForm>
          );
        }}
      </Formik>
    );
  }
}

export default ImportWorkflowContent;
