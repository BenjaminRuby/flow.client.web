import React, { Component } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { actions as teamsActions } from "State/teams";
import { actions as importWorkflowActions } from "State/importWorkflow";
import { actions as appActions } from "State/app";
import sortBy from "lodash/sortBy";
import LoadingAnimation from "@boomerang/boomerang-components/lib/LoadingAnimation";
import NoDisplay from "@boomerang/boomerang-components/lib/NoDisplay";
import { notify, Notification } from "@boomerang/boomerang-components/lib/Notifications";
import ErrorDragon from "Components/ErrorDragon";
import SearchFilterBar from "Components/SearchFilterBar";
import WorkflowsSection from "./WorkflowsSection";
import { BASE_SERVICE_URL, REQUEST_STATUSES } from "Config/servicesConfig";
import "./styles.scss";

export class WorkflowsHome extends Component {
  static propTypes = {
    teams: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
    importWorkflow: PropTypes.object.isRequired,
    appActions: PropTypes.object.isRequired,
    importWorkflowActions: PropTypes.object.isRequired,
    teamsActions: PropTypes.object.isRequired
  };

  state = {
    searchQuery: "",
    teamsFilter: []
  };

  componentDidMount() {
    this.fetchTeams();
    this.props.appActions.setActiveTeam({ teamId: undefined });
  }

  handleSearchFilter = (searchQuery, teams) => {
    this.setState({ searchQuery, teamsFilter: Array.isArray(teams) && teams.length ? teams : [] });
  };

  fetchTeams = () => {
    this.props.teamsActions.fetch(`${BASE_SERVICE_URL}/teams`).catch(err => {
      // noop
    });
  };

  filterTeams = () => {
    const { teams } = this.props;
    const { teamsFilter } = this.state;

    if (teamsFilter.length > 0) {
      return teams.data.filter(team => teamsFilter.find(filter => filter.text === team.name));
    } else {
      return teams.data;
    }
  };

  updateWorkflows = data => {
    this.props.teamsActions.updateWorkflows(data);
  };

  setActiveTeamAndRedirect = selectedTeamId => {
    this.props.appActions.setActiveTeam({ teamId: selectedTeamId });
    this.props.history.push(`/creator/overview`);
  };
  setActiveTeam = selectedTeamId => {
    this.props.appActions.setActiveTeam({ teamId: selectedTeamId });
  };

  handleExecuteWorkflow = ({ workflowId, redirect = false, properties = {} }) => {
    return axios
      .post(`${BASE_SERVICE_URL}/execute/${workflowId}`, { properties })
      .then(response => {
        notify(<Notification type="success" title="Run Workflow" message="Successfully ran workflow" />);
        if (redirect) {
          this.props.history.push({
            pathname: `/activity/${workflowId}/execution/${response.data.id}`,
            state: { fromUrl: "/workflows", fromText: "Workflows" }
          });
        }
      })
      .catch(error => {
        notify(<Notification type="error" title="Something's wrong" message="Failed to run workflow" />);
      });
  };

  handleDeleteWorkflow = ({ workflowId, teamId }) => {
    axios
      .delete(`${BASE_SERVICE_URL}/workflow/${workflowId}`)
      .then(() => {
        notify(<Notification type="remove" title="SUCCESS" message="Workflow successfully deleted" />);
        this.updateWorkflows({ workflowId, teamId });
        return;
      })
      .catch(() => {
        notify(<Notification type="error" title="SOMETHING'S WRONG" message="Your delete request has failed" />);
        return;
      });
  };

  handleImportWorkflow = (data, isUpdate) => {
    this.props.importWorkflowActions
      .post(`${BASE_SERVICE_URL}/workflow/import?update=${isUpdate}`, JSON.parse(data))
      .catch(err => {
        // noop
      });
  };

  render() {
    const { teams, importWorkflow } = this.props;
    const { searchQuery } = this.state;

    if (teams.status === REQUEST_STATUSES.FAILURE) {
      return <ErrorDragon theme="bmrg-white" />;
    }

    if (teams.isFetching) {
      return (
        <div className="c-workflow-home">
          <div className="c-workflow-home-content">
            <LoadingAnimation theme="bmrg-white" />
          </div>
        </div>
      );
    }

    if (teams.status === REQUEST_STATUSES.SUCCESS) {
      const filteredTeams = this.filterTeams();
      const sortedTeams = sortBy(filteredTeams, ["name"]);

      if (!sortedTeams.length) {
        return (
          <div className="c-workflow-home">
            <div className="c-workflow-home-content">
              <SearchFilterBar handleSearchFilter={this.handleSearchFilter} options={[]} />
              <NoDisplay style={{ marginTop: "5rem" }} text="Looks like you don't have any workflow teams" />
            </div>
          </div>
        );
      }
      return (
        <div className="c-workflow-home">
          <div className="c-workflow-home-content">
            <SearchFilterBar handleSearchFilter={this.handleSearchFilter} options={teams.data} />
            {sortedTeams.map(team => {
              return (
                <WorkflowsSection
                  team={team}
                  importWorkflow={importWorkflow}
                  searchQuery={searchQuery}
                  updateWorkflows={this.updateWorkflows}
                  fetchTeams={this.fetchTeams}
                  setActiveTeamAndRedirect={this.setActiveTeamAndRedirect}
                  setActiveTeam={this.setActiveTeam}
                  key={team.id}
                  handleImportWorkflow={this.handleImportWorkflow}
                  executeWorkflow={this.handleExecuteWorkflow}
                  deleteWorkflow={this.handleDeleteWorkflow}
                />
              );
            })}
          </div>
        </div>
      );
    }

    return null;
  }
}

const mapStateToProps = state => ({
  teams: state.teams,
  importWorkflow: state.importWorkflow
});

const mapDispatchToProps = dispatch => ({
  appActions: bindActionCreators(appActions, dispatch),
  importWorkflowActions: bindActionCreators(importWorkflowActions, dispatch),
  teamsActions: bindActionCreators(teamsActions, dispatch)
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WorkflowsHome);
