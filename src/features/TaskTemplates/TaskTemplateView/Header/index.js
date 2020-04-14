import React from "react";
import PropTypes from "prop-types";
import { Link, useHistory } from "react-router-dom";
import { useMutation } from "react-query";
import { ConfirmModal, notify, ToastNotification, Loading, Button } from "@boomerang/carbon-addons-boomerang-react";
import FeatureHeader from "Components/FeatureHeader";
import Navigation from "./Navigation";
import VersionSwitcher from "./VersionSwitcher";
import { DocumentExport16
  // , DocumentTasks16 
} from "@carbon/icons-react";
import { resolver } from "Config/servicesConfig";
import { QueryStatus } from "Constants/reactQueryStatuses";
import styles from "./Header.module.scss";

Header.propTypes = {
  currentRevision: PropTypes.object,
  revisionCount: PropTypes.number,
  taskTemplateToEdit: PropTypes.object.isRequired,
  addTemplateInState: PropTypes.func.isRequired,
  updateTemplateInState: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  isValid: PropTypes.bool,
  revisions: PropTypes.array.isRequired,
  values: PropTypes.object.isRequired,
  isDirty: PropTypes.bool,
  isEdit: PropTypes.bool,
  setSubmitting: PropTypes.func.isRequired
};

function Header ({
  loading,
  isValid,
  currentRevision,
  revisionCount,
  taskTemplateToEdit,
  revisions,
  values,
  isDirty,
  isEdit,
  setSubmitting,
  addTemplateInState,
  updateTemplateInState
}) {
  const [CreateTaskTemplateMutation, {status: createTaskTemplateStatus}] = useMutation(resolver.postCreateTaskTemplate);
  const [UploadTaskTemplateMutation, {status: updateTaskTemplateStatus}] = useMutation(resolver.putCreateTaskTemplate);
  const isLoadingCreate = createTaskTemplateStatus === QueryStatus.Loading;
  const isLoadingUpdate = updateTaskTemplateStatus === QueryStatus.Loading;
  const history = useHistory();

  const handleSubmitTaskTemplate = async (setVersion = false) => {
    const newRevisions = [].concat(revisions??[]);
    const newVersion =  revisions?.length > 0 ? revisions[revisions.length - 1].version + 1 : 1;
    // const currentRevisionIndex = !isEdit? 0 : revisions.findIndex(revision => revision.version === currentRevision.version);
    let newRevisionConfig = {
      version: newVersion,
      image: values.image, 
      // image: "container:version", 
      command: values.command,
      // command: "bmrgctl",
      arguments : values.arguments.trim().split(/\s{1,}/),
      config: values.settings
    };
    newRevisions.push(newRevisionConfig);
    const body =  setVersion? {...taskTemplateToEdit, currentVersion:currentRevision.version} :
    {
      ...taskTemplateToEdit,
      name: values.name,
      description: values.description,
      category: values.category,
      key: values.key,
      currentVersion: newVersion,
      revisions:newRevisions,
      nodeType: "templateTask"
    };
    if(!isEdit){
      try {
        const response = await CreateTaskTemplateMutation({ body: body });
        notify(
          <ToastNotification
            kind="success"
            title={"Task Template Created"}
            subtitle={`Request to create ${body.name} succeeded`}
            data-testid="create-update-task-template-notification"
          />
        );
        setSubmitting(true);
        addTemplateInState(response.data);
        history.push("/task-templates");
      } catch (err) {
        notify(
          <ToastNotification
            kind="error"
            title={"Create Task Template Failed"}
            subtitle={"Something's Wrong"}
            data-testid="create-update-task-template-notification"
          />
        );
    }
  }
    else{
      try {
        const response = await UploadTaskTemplateMutation({ body });
        notify(
          <ToastNotification
            kind="success"
            title={"Task Template Updated"}
            subtitle={`Request to update ${body.name} succeeded`}
            data-testid="create-update-task-template-notification"
          />
        );
        updateTemplateInState(response.data);
      } catch (err) {
        notify(
          <ToastNotification
            kind="error"
            title={"Update Task Template Failed"}
            subtitle={"Something's Wrong"}
            data-testid="create-update-task-template-notification"
          />
        );
      }
    }
  };
  const determinePerformActionRender = () => {
    const performActionButtonText=isEdit? "Create New Version" : "Create";
    const message = isEdit? `Version ${currentRevision.version + 1} will be created and users will be prompted to update their workflows.`: `The first version of ${values.name} will be created and available for use in workflows.`;
    // const setVersionMessage = "This will be set as a current version, if you want your changes to be saved, please create a new one.";
    return (
      <>
        <ConfirmModal
          affirmativeAction={handleSubmitTaskTemplate}
          children={message}
          title={`${isEdit?"Create":"Create new version"} - ${values.name}`}
          modalTrigger={({ openModal }) => (
            <Button
              disabled={loading || !isValid || !isDirty}
              iconDescription="Set version to latest"
              kind="ghost"
              onClick={openModal}
              renderIcon={DocumentExport16}
              size="field"
            >
              {performActionButtonText}
            </Button>
          )}
        />
        {/* {
          isEdit &&
          <ConfirmModal
            affirmativeAction={() => handleSubmitTaskTemplate(true)}
            children={setVersionMessage}
            title={`Set current version - ${currentRevision.version}`}
            modalTrigger={({ openModal }) => (
              <Button
                disabled={currentRevision.version === taskTemplateToEdit.currentVersion}
                iconDescription="Set version"
                kind="ghost"
                onClick={openModal}
                renderIcon={DocumentTasks16}
                size="field"
              >
                Set current version
              </Button>
            )}
          />
        } */}
      </>
    );
  }
    return (
      <FeatureHeader includeBorder className={styles.container}>
        {(isLoadingCreate || isLoadingUpdate) && <Loading />}
        <section className={styles.header}>
          <div className={styles.breadcrumbContainer}>
            <Link className={styles.workflowsLink} to="/task-templates">
              Task Templates
            </Link>
            <span className={styles.breadcrumbDivider}>/</span>
            <p className={styles.taskTemplateName}> {taskTemplateToEdit?.name?? "New Task Template"}</p>
          </div>
          <h1 className={styles.title}>Task Template</h1>
        </section>
        <section className={styles.versionButtons}>
          <VersionSwitcher
            currentRevision={currentRevision}
            revisionCount={revisionCount}
            revisions={revisions}
            isDirty={isDirty}
            settings={values.settings}
          />
          {determinePerformActionRender()}
        </section>
        <Navigation />
      </FeatureHeader>
    );
}

export default Header;
