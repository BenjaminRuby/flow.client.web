import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import queryString from "query-string";
import { MultiSelect as Select, Tabs, Tab } from "carbon-components-react";
import { Calendar32 } from "@carbon/icons-react";
import { LoadingAnimation, TextInput } from "@boomerang/carbon-addons-boomerang-react";
import { actions as activityActions } from "State/activity";
import sortByProp from "@boomerang/boomerang-utilities/lib/sortByProp";
import ActivityHeader from "./ActivityHeader";
import ActivityTable from "./ActivityTable";
import ErrorDragon from "Components/ErrorDragon";
import { executionOptions } from "Constants/filterOptions";
import { ACTIVITY_STATUSES, ACTIVITY_STATUSES_TO_INDEX } from "Constants/activityStatuses";
import { BASE_SERVICE_URL, REQUEST_STATUSES } from "Config/servicesConfig";
import styles from "./workflowActivity.module.scss";

const MultiSelect = Select.Filterable;

export class WorkflowActivity extends Component {
  static propTypes = {
    activityActions: PropTypes.object.isRequired,
    activityState: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    teamsState: PropTypes.object.isRequired
  };

  componentDidMount() {
    const { page = 0, size = 10, workflowIds, triggers, statuses, teamIds } = queryString.parse(
      this.props.location.search
    );

    const query = queryString.stringify({
      size,
      page,
      workflowIds,
      triggers,
      statuses,
      teamIds
    });

    this.fetchActivities(`${BASE_SERVICE_URL}/activity?${query}`);
  }

  componentDidUpdate = prevProps => {
    if (prevProps.location.search !== this.props.location.search) {
      const { page = 0, size = 10, workflowIds, triggers, statuses, teamIds } = queryString.parse(
        this.props.location.search
      );

      const query = queryString.stringify({
        size,
        page,
        workflowIds,
        triggers,
        statuses,
        teamIds
      });

      this.updateActivities(`${BASE_SERVICE_URL}/activity?${query}`);
    }
  };

  componentWillUnmount() {
    this.props.activityActions.reset();
  }

  updateHistory = queryStr => {
    this.props.history.push({ search: queryStr });
  };

  fetchActivities = url => {
    this.props.activityActions.fetch(url).catch(err => {
      //noop
    });
  };

  updateActivities = url => {
    this.props.activityActions.update(url).catch(err => {
      //noop
    });
  };

  handleSelectTeams = ({ selectedItems }) => {
    const { triggers, statuses } = queryString.parse(this.props.location.search);

    const queryStr = `?${queryString.stringify({
      page: 0,
      size: 10,
      workflowIds: undefined,
      triggers,
      statuses,
      teamIds: selectedItems.length > 0 ? selectedItems.map(team => team.id).join() : undefined
    })}`;

    this.updateHistory(queryStr);
  };

  handleSelectWorkflows = ({ selectedItems }) => {
    const { teamIds, triggers, statuses } = queryString.parse(this.props.location.search);

    const queryStr = `?${queryString.stringify({
      page: 0,
      size: 10,
      workflowIds: selectedItems.length > 0 ? selectedItems.map(worflow => worflow.id).join() : undefined,
      triggers,
      statuses,
      teamIds
    })}`;

    this.updateHistory(queryStr);
  };

  handleSelectTriggers = ({ selectedItems }) => {
    const { teamIds, workflowIds, statuses } = queryString.parse(this.props.location.search);

    const queryStr = `?${queryString.stringify({
      page: 0,
      size: 10,
      workflowIds,
      triggers: selectedItems.length > 0 ? selectedItems.map(trigger => trigger.value).join() : undefined,
      statuses,
      teamIds
    })}`;

    this.updateHistory(queryStr);
  };

  handleSelectStatuses = statusIndex => {
    const { teamIds, triggers, workflowIds } = queryString.parse(this.props.location.search);

    const queryStr = `?${queryString.stringify({
      page: 0,
      size: 10,
      workflowIds,
      triggers,
      statuses: statusIndex > 0 ? ACTIVITY_STATUSES_TO_INDEX[statusIndex - 1] : undefined,
      teamIds
    })}`;

    this.updateHistory(queryStr);
  };

  getWorkflowFilter(teamsData, selectedTeams) {
    let workflowsList = [];
    if (!selectedTeams.length) {
      workflowsList = teamsData.reduce((acc, team) => {
        acc = acc.concat(team.workflows);
        return acc;
      }, []);
    } else {
      workflowsList = selectedTeams.reduce((acc, team) => {
        acc = acc.concat(team.workflows);
        return acc;
      }, []);
    }
    let workflowsFilter = sortByProp(workflowsList, "name", "ASC");
    return workflowsFilter;
  }

  render() {
    const { activityState, history, location, match, teamsState } = this.props;

    if (activityState.isFetching) {
      return <LoadingAnimation centered />;
    }

    if (
      activityState.status === REQUEST_STATUSES.FAILURE ||
      activityState.updateStatus === REQUEST_STATUSES.FAILURE ||
      teamsState.status === REQUEST_STATUSES.FAILURE
    ) {
      return <ErrorDragon theme="bmrg-flow" />;
    }

    if (activityState.status === REQUEST_STATUSES.SUCCESS && teamsState.status === REQUEST_STATUSES.SUCCESS) {
      const { workflowIds = "", triggers = "", statuses = "", teamIds = "" } = queryString.parse(
        this.props.location.search
      );

      const selectedTeamIds = teamIds.split(",");
      const selectedWorkflowIds = workflowIds.split(",");
      const selectedTriggers = triggers.split(",");
      const selectedStatuses = statuses.split(",");
      const statusIndex = ACTIVITY_STATUSES_TO_INDEX.indexOf(selectedStatuses[0]);

      const teamsData = JSON.parse(JSON.stringify(teamsState.data));

      const selectedTeams = teamsData.filter(team => {
        if (selectedTeamIds.find(id => id === team.id)) {
          return true;
        } else {
          return false;
        }
      });

      const workflowsFilter = this.getWorkflowFilter(teamsData, selectedTeams);

      const activities = activityState.data.records;
      const tableActivities = activityState.tableData.records;
      const sort = activityState.tableData.sort;
      const runActivities = activities.length;
      let inProgressActivities = 0;
      let succeededActivities = 0;
      let failedActivities = 0;
      let invalidActivities = 0;

      activities.forEach(activity => {
        if (activity.status === ACTIVITY_STATUSES.COMPLETED) {
          succeededActivities++;
        } else if (activity.status === ACTIVITY_STATUSES.FAILURE) {
          failedActivities++;
        } else if (activity.status === ACTIVITY_STATUSES.IN_PROGRESS) {
          inProgressActivities++;
        } else if (activity.status === ACTIVITY_STATUSES.INVALID) {
          invalidActivities++;
        }
      });

      return (
        <div className={styles.container}>
          <ActivityHeader
            runActivities={runActivities}
            succeededActivities={succeededActivities}
            failedActivities={failedActivities}
          />
          <div className={styles.content}>
            <Tabs className={styles.tabs} selected={statusIndex + 1} onSelectionChange={this.handleSelectStatuses}>
              <Tab label={`All (${runActivities})`} />
              <Tab label={`In Progress (${inProgressActivities})`} />
              <Tab label={`Succeeded (${succeededActivities})`} />
              <Tab label={`Failed (${failedActivities})`} />
              <Tab label={`Invalid (${invalidActivities})`} />
            </Tabs>
            <section className={styles.filters}>
              <div className={styles.dataFilters}>
                <div style={{ marginRight: "1.4rem", width: "14.125rem" }}>
                  <MultiSelect
                    id="activity-teams-select"
                    label="Choose team(s)"
                    placeholder="Choose team(s)"
                    invalid={false}
                    onChange={this.handleSelectTeams}
                    items={teamsData}
                    itemToString={team => (team ? team.name : "")}
                    initialSelectedItems={selectedTeams}
                    titleText="Filter by team"
                  />
                </div>
                <div style={{ marginRight: "1.4rem", width: "14.125rem" }}>
                  <MultiSelect
                    id="activity-workflows-select"
                    label="Choose Workflow(s)"
                    placeholder="Choose Workflow(s)"
                    invalid={false}
                    onChange={this.handleSelectWorkflows}
                    items={workflowsFilter}
                    itemToString={workflow => {
                      const team = workflow ? teamsData.find(team => team.id === workflow.flowTeamId) : undefined;
                      return workflow ? (team ? `${workflow.name} [${team.name}]` : workflow.name) : "";
                    }}
                    initialSelectedItems={workflowsFilter.filter(workflow => {
                      if (selectedWorkflowIds.find(id => id === workflow.id)) {
                        return true;
                      } else {
                        return false;
                      }
                    })}
                    titleText="Filter by workflow"
                  />
                </div>
                <div style={{ width: "14.125rem" }}>
                  <MultiSelect
                    id="activity-triggers-select"
                    label="Choose trigger type(s)"
                    placeholder="Choose trigger type(s)"
                    invalid={false}
                    onChange={this.handleSelectTriggers}
                    items={executionOptions}
                    itemToString={item => (item ? item.value : "")}
                    initialSelectedItems={executionOptions.filter(option => {
                      if (selectedTriggers.find(trigger => trigger === option.value)) {
                        return true;
                      } else {
                        return false;
                      }
                    })}
                    titleText="Filter by trigger"
                  />
                </div>
              </div>
              <div className={styles.timeFilters}>
                <div className={styles.startDate}>
                  <TextInput id="activity-start-date" labelText="Start date" placeholder="mm/dd/yyyy" type="date" />
                  <Calendar32 aria-label="Calendar-start" className={styles.calendar} />
                </div>
                <div className={styles.endDate}>
                  <TextInput id="activity-end-date" labelText="End date" placeholder="mm/dd/yyyy" type="date" />
                  <Calendar32 aria-label="Calendar-end" className={styles.calendar} />
                </div>
              </div>
            </section>
            <ActivityTable
              activities={tableActivities}
              isUpdating={activityState.isUpdating}
              sort={
                Array.isArray(sort)
                  ? { key: sort[0].property, sortDirection: sort[0].direction }
                  : { key: "creationDate", sortDirection: "desc" }
              }
              history={history}
              match={match}
              location={location}
            />
          </div>
        </div>
      );
    }
    return null;
  }
}

const mapStateToProps = state => ({
  activityState: state.activity,
  teamsState: state.teams
});

const mapDispatchToProps = dispatch => ({
  activityActions: bindActionCreators(activityActions, dispatch)
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WorkflowActivity);
