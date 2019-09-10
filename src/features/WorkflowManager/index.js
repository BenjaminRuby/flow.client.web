import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { Route, Switch, Prompt, Redirect } from "react-router-dom";
import { actions as tasksActions } from "State/tasks";
import { actions as workflowActions } from "State/workflow";
import { actions as workflowRevisionActions } from "State/workflowRevision";
import LoadingAnimation from "@boomerang/boomerang-components/lib/LoadingAnimation";
import { notify, Notification } from "@boomerang/boomerang-components/lib/Notifications";
import ErrorDragon from "Components/ErrorDragon";
// import Creator from "./Creator";
import EditorContainer from "./EditorContainer";
import { BASE_SERVICE_URL, REQUEST_STATUSES } from "Config/servicesConfig";
import CustomTaskNodeModel from "Utilities/customTaskNode/CustomTaskNodeModel";
import SwitchNodeModel from "Utilities/switchNode/SwitchNodeModel";
import "./styles.scss";

export class WorkflowManagerContainer extends Component {
  static propTypes = {
    activeTeamId: PropTypes.string,
    teams: PropTypes.object.isRequired,
    tasks: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
    tasksActions: PropTypes.object.isRequired,
    workflowActions: PropTypes.object.isRequired,
    workflowRevision: PropTypes.object.isRequired,
    workflowRevisionActions: PropTypes.object.isRequired,
    workflow: PropTypes.object
  };

  changeLogReason = "Update workflow"; //default changelog value

  async componentDidMount() {
    try {
      await this.props.tasksActions.fetch(`${BASE_SERVICE_URL}/tasktemplate`);
    } catch (e) {
      // noop
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.match.url !== prevProps.match.url) {
      this.props.workflowActions.reset();
      this.props.workflowRevisionActions.reset();
    }
  }

  componentWillUnmount() {
    this.props.tasksActions.reset();
    this.props.workflowActions.reset();
    this.props.workflowRevisionActions.reset();
  }

  handleChangeLogReasonChange = changeLogReason => {
    this.changeLogReason = changeLogReason;
  };

  createWorkflowRevision = diagramApp => {
    const { workflow, workflowRevisionActions } = this.props;

    const workflowId = workflow.data.id;
    const body = this.createWorkflowRevisionBody(diagramApp);

    return workflowRevisionActions
      .create(`${BASE_SERVICE_URL}/workflow/${workflowId}/revision`, body)
      .then(response => {
        notify(<Notification type="success" title="Create Version" message="Successfully created workflow version" />);
        return Promise.resolve();
      })
      .catch(() => {
        notify(<Notification type="error" title="Something's wrong" message="Failed to create workflow version" />);
        return Promise.reject();
      })
      .then(() => {
        this.props.workflowActions.fetch(`${BASE_SERVICE_URL}/workflow/${workflowId}/summary`).catch(err => {
          // noop
        });
      });
  };

  updateWorkflow = () => {
    const { workflow, workflowActions } = this.props;
    const workflowId = workflow.data.id;
    const workflowData = { ...this.props.workflow.data };
    delete workflowData.properties; //delete properties property so its not updated - for situation where user updates inputs, but doesn't save them

    return workflowActions
      .update(`${BASE_SERVICE_URL}/workflow`, { ...this.props.workflow.data, id: workflowId })
      .then(response => {
        notify(<Notification type="success" title="Update Workflow" message="Successfully updated workflow" />);
        workflowActions.setHasUnsavedWorkflowUpdates({ hasUpdates: false });
        return workflowActions.fetch(`${BASE_SERVICE_URL}/workflow/${workflowId}/summary`);
      })
      .then(response => Promise.resolve(response))
      .catch(error => {
        notify(<Notification type="error" title="Something's wrong" message="Failed to update workflow" />);
        return Promise.reject(error);
      });
  };

  updateInputs = ({ title = "Update Inputs", message = "Successfully updated inputs", type = "update" }) => {
    const { workflow, workflowActions } = this.props;

    return workflowActions
      .update(`${BASE_SERVICE_URL}/workflow/${workflow.data.id}/properties`, this.props.workflow.data.properties)
      .then(response => {
        notify(<Notification type="success" title={title} message={message} />);
        return Promise.resolve(response);
      })
      .catch(error => {
        notify(<Notification type="error" title="Something's wrong" message={`Failed to ${type} input`} />);
        return Promise.reject(error);
      });
  };

  fetchWorkflowRevisionNumber = revision => {
    const { workflow, workflowRevisionActions } = this.props;
    const workflowId = workflow.data.id;
    workflowRevisionActions.fetch(`${BASE_SERVICE_URL}/workflow/${workflowId}/revision/${revision}`).catch(err => {
      // noop
    });
  };

  createWorkflowRevisionBody(diagramApp) {
    const dagProps = {};
    dagProps["dag"] = this.getDiagramSerialization(diagramApp);
    dagProps["config"] = this.formatWorkflowConfigNodes();
    dagProps["changelog"] = {
      reason: this.changeLogReason
    };
    return dagProps;
  }

  getDiagramSerialization(diagramApp) {
    return diagramApp
      .getDiagramEngine()
      .getDiagramModel()
      .serializeDiagram();
  }

  formatWorkflowConfigNodes() {
    return { nodes: Object.values(this.props.workflowRevision.config) };
  }

  createNode = (diagramApp, event) => {
    const { taskData } = JSON.parse(event.dataTransfer.getData("storm-diagram-node"));

    // For naming purposes
    const nodesOfSameTypeCount = Object.values(
      diagramApp
        .getDiagramEngine()
        .getDiagramModel()
        .getNodes()
    ).filter(node => node.taskId === taskData.id).length;

    //check for type and create switchNode if type===switch

    let node;
    let nodeType;

    //TODO: probably should be a case staement or an object that maps the type to the model to support more types and set that to a variable and only have one call
    if (taskData.key === "switch") {
      nodeType = "decision"; //TODO: should this have to be manually set or should it be a part of the taskData? a part of a mapping?
      node = new SwitchNodeModel({
        taskId: taskData.id,
        taskName: `${taskData.name} ${nodesOfSameTypeCount + 1}`
      });
    } else {
      nodeType = "custom"; //TODO: should this have to be manually set or should it be a part of the taskData? a part of a mapping?
      node = new CustomTaskNodeModel({
        taskId: taskData.id,
        taskName: `${taskData.name} ${nodesOfSameTypeCount + 1}`
      });
    }
    const { id, taskId } = node;

    // Create inputs object with empty string values by default for service to process easily
    const inputs =
      taskData.config && taskData.config.length
        ? taskData.config.reduce((accu, item) => {
            accu[item.key] = "";
            return accu;
          }, {})
        : {};

    this.props.workflowRevisionActions.addNode({ nodeId: id, taskId, inputs, type: nodeType });

    const points = diagramApp.getDiagramEngine().getRelativeMousePoint(event);
    node.x = points.x - 120;
    node.y = points.y - 80;
    diagramApp
      .getDiagramEngine()
      .getDiagramModel()
      .addNode(node);
    this.forceUpdate();
  };

  render() {
    const { tasks, teams } = this.props;
    if (tasks.isFetching || teams.isFetching) {
      return <LoadingAnimation theme="bmrg-flow" />;
    }

    if (tasks.status === REQUEST_STATUSES.FAILURE || teams.status === REQUEST_STATUSES.FAILURE) {
      return <ErrorDragon theme="bmrg-flow" />;
    }

    if (tasks.status === REQUEST_STATUSES.SUCCESS && teams.status === REQUEST_STATUSES.SUCCESS) {
      const { hasUnsavedWorkflowUpdates } = this.props.workflow;
      const { hasUnsavedWorkflowRevisionUpdates } = this.props.workflowRevision;
      return (
        <>
          <Prompt
            when={hasUnsavedWorkflowUpdates || hasUnsavedWorkflowRevisionUpdates}
            message={location =>
              location.pathname === this.props.match.url || location.pathname.includes("editor") //Return true to navigate if going to the same route we are currently on
                ? true
                : `Are you sure? You have unsaved changes that will be lost on:\n${
                    hasUnsavedWorkflowUpdates ? "- Overview\n" : ""
                  }${hasUnsavedWorkflowRevisionUpdates ? "- Design\n" : ""}`
            }
          />
          <div className="c-workflow-designer">
            <Switch>
              <Route
                path="/editor/:workflowId"
                render={props => (
                  <EditorContainer
                    workflow={this.props.workflow}
                    createNode={this.createNode}
                    createWorkflowRevision={this.createWorkflowRevision}
                    fetchWorkflowRevisionNumber={this.fetchWorkflowRevisionNumber}
                    handleChangeLogReasonChange={this.handleChangeLogReasonChange}
                    updateInputs={this.updateInputs}
                    updateWorkflow={this.updateWorkflow}
                    {...props}
                  />
                )}
              />
              <Redirect from="/creator" to="/creator/overview" />
            </Switch>
          </div>
        </>
      );
    }

    return null;
  }
}

const mapStateToProps = state => ({
  tasks: state.tasks,
  teams: state.teams,
  workflow: state.workflow,
  workflowRevision: state.workflowRevision,
  activeTeamId: state.app.activeTeamId
});

const mapDispatchToProps = dispatch => ({
  tasksActions: bindActionCreators(tasksActions, dispatch),
  workflowActions: bindActionCreators(workflowActions, dispatch),
  workflowRevisionActions: bindActionCreators(workflowRevisionActions, dispatch)
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WorkflowManagerContainer);
