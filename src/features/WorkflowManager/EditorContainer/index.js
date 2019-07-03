import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { actions as changeLogActions } from "State/changeLog";
import { actions as workflowActions } from "State/workflow";
import { actions as workflowRevisionActions } from "State/workflowRevision";
import LoadingAnimation from "@boomerang/boomerang-components/lib/LoadingAnimation";
import ErrorDragon from "Components/ErrorDragon";
import Editor from "./Editor";
import { BASE_SERVICE_URL, REQUEST_STATUSES } from "Config/servicesConfig";

class WorkflowEditorContainer extends Component {
  static propTypes = {
    changeLog: PropTypes.object.isRequired,
    createNode: PropTypes.func.isRequired,
    createWorkflowRevision: PropTypes.func.isRequired,
    workflow: PropTypes.object.isRequired,
    workflowActions: PropTypes.object.isRequired,
    workflowRevision: PropTypes.object.isRequired,
    workflowRevisionActions: PropTypes.object.isRequired,
    changeLogActions: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired
  };

  async componentDidMount() {
    const { match } = this.props;
    const { workflowId } = match.params;
    try {
      await Promise.all([
        this.props.workflowActions.fetch(`${BASE_SERVICE_URL}/workflow/${workflowId}/summary`),
        this.props.workflowRevisionActions.fetch(`${BASE_SERVICE_URL}/workflow/${workflowId}/revision`),
        this.props.changeLogActions.fetch(
          `${BASE_SERVICE_URL}/workflow/${workflowId}/changelog?size=10&page=0&sort=version&order=DESC`
        )
      ]);
    } catch (e) {
      // noop
    }
  }

  render() {
    if (
      this.props.workflowRevision.fetchingStatus === REQUEST_STATUSES.FAILURE ||
      this.props.workflow.fetchingStatus === REQUEST_STATUSES.FAILURE ||
      this.props.changeLog.status === REQUEST_STATUSES.FAILURE
    ) {
      return <ErrorDragon theme="bmrg-white" />;
    }

    if (
      this.props.workflowRevision.fetchingStatus === REQUEST_STATUSES.SUCCESS &&
      this.props.workflow.fetchingStatus === REQUEST_STATUSES.SUCCESS &&
      this.props.changeLog.status === REQUEST_STATUSES.SUCCESS
    ) {
      return <Editor {...this.props} />;
    }

    if (this.props.workflowRevision.isFetching) {
      return <LoadingAnimation theme="bmrg-white" />;
    }

    return null;
  }
}

const mapStateToProps = state => ({
  changeLog: state.changeLog,
  workflow: state.workflow,
  workflowRevision: state.workflowRevision,
  isModalOpen: state.app.isModalOpen
});

const mapDispatchToProps = dispatch => ({
  changeLogActions: bindActionCreators(changeLogActions, dispatch),
  workflowActions: bindActionCreators(workflowActions, dispatch),
  workflowRevisionActions: bindActionCreators(workflowRevisionActions, dispatch)
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WorkflowEditorContainer);
