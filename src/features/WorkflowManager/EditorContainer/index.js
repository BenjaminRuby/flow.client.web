import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { actions as appActions } from "State/app";
import { actions as changeLogActions } from "State/changeLog";
import { actions as workflowActions } from "State/workflow";
import { actions as workflowRevisionActions } from "State/workflowRevision";
import { LoadingAnimation } from "@boomerang/carbon-addons-boomerang-react";
import ErrorDragon from "Components/ErrorDragon";
import Editor from "./Editor";
import { BASE_SERVICE_URL, REQUEST_STATUSES } from "Config/servicesConfig";

class WorkflowEditorContainer extends Component {
  static propTypes = {
    activeTeamId: PropTypes.string,
    changeLog: PropTypes.object.isRequired,
    changeLogActions: PropTypes.object.isRequired,
    createNode: PropTypes.func.isRequired,
    createWorkflowRevision: PropTypes.func.isRequired,
    match: PropTypes.object.isRequired,
    teamsState: PropTypes.object.isRequired,
    workflow: PropTypes.object.isRequired,
    workflowActions: PropTypes.object.isRequired,
    workflowRevision: PropTypes.object.isRequired,
    workflowRevisionActions: PropTypes.object.isRequired
  };

  async componentDidMount() {
    const { activeTeamId, match } = this.props;
    const { workflowId } = match.params;

    // If you come directly to this route, the active team isn't set and needs to be found
    if (!activeTeamId) {
      this.setActiveTeamId(workflowId);
    }
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
  /**
   * Find the matching team for the workflowId and set that to the active team
   * That path param is the only thing available to the app
   * @param {string} workflowId
   */
  setActiveTeamId(workflowId) {
    const { appActions, teamsState } = this.props;
    const activeTeam = teamsState.data.find(team => {
      return team.workflows.find(workflow => workflow.id === workflowId);
    });

    appActions.setActiveTeam({ teamId: activeTeam ? activeTeam.id : "" });
  }

  render() {
    if (
      this.props.workflowRevision.fetchingStatus === REQUEST_STATUSES.FAILURE ||
      this.props.workflow.fetchingStatus === REQUEST_STATUSES.FAILURE ||
      this.props.changeLog.status === REQUEST_STATUSES.FAILURE
    ) {
      return <ErrorDragon theme="bmrg-flow" />;
    }

    if (
      this.props.workflowRevision.fetchingStatus === REQUEST_STATUSES.SUCCESS &&
      this.props.workflow.fetchingStatus === REQUEST_STATUSES.SUCCESS &&
      this.props.changeLog.status === REQUEST_STATUSES.SUCCESS
    ) {
      return <Editor {...this.props} />;
    }

    if (this.props.workflowRevision.isFetching) {
      return <LoadingAnimation centered message="Retrieving your workflow. Please hold." />;
    }

    return null;
  }
}

const mapStateToProps = state => ({
  activeTeamId: state.app.activeTeamId,
  changeLog: state.changeLog,
  isModalOpen: state.app.isModalOpen,
  teamsState: state.teams,
  workflow: state.workflow,
  workflowRevision: state.workflowRevision
});

const mapDispatchToProps = dispatch => ({
  appActions: bindActionCreators(appActions, dispatch),
  changeLogActions: bindActionCreators(changeLogActions, dispatch),
  workflowActions: bindActionCreators(workflowActions, dispatch),
  workflowRevisionActions: bindActionCreators(workflowRevisionActions, dispatch)
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WorkflowEditorContainer);
