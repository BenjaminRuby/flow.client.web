import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { actions as insightsActions } from "State/insights";
import { actions as teamsActions } from "State/teams";
import moment from "moment";
import queryString from "query-string";
import LoadingAnimation from "@boomerang/boomerang-components/lib/LoadingAnimation";
import sortByProp from "@boomerang/boomerang-utilities/lib/sortByProp";
import ErrorDragon from "Components/ErrorDragon";
import NavigateBack from "Components/NavigateBack";
import SearchFilterBar from "Components/SearchFilterBar";
import SimpleSelectFilter from "Components/SimpleSelectFilter";
import WidgetCard from "./WidgetCard";
import CustomAreaChart from "./CustomAreaChart";
import CustomScatterChart from "./CustomScatterChart";
import CustomPieChart from "./CustomPieChart";
import { BASE_SERVICE_URL, REQUEST_STATUSES } from "Config/servicesConfig";
import { executeDataLines } from "Constants/chartsConfig";
import { timeframeOptions } from "Constants/filterOptions";
import { parseChartsData } from "Utilities/formatChartData";
import { timeSecondsToTimeUnit } from "Utilities/timeSecondsToTimeUnit";
import "./styles.scss";

export class WorkflowInsights extends Component {
  static propTypes = {
    insights: PropTypes.object.isRequired,
    insightsActions: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    teams: PropTypes.object.isRequired,
    teamsActions: PropTypes.object.isRequired
  };

  state = {
    selectedTimeframe: timeframeOptions[3],
    selectedWorkflow: { value: "none", label: "All workflows" },
    selectedTeam: { value: "none", label: "All teams" },
    executionsList: []
  };

  handleChangeTimeframe = timeframe => {
    const timeframeValue = timeframe.target.value;
    this.setState({ selectedTimeframe: timeframeOptions.find(tf => tf.value.toString() === timeframeValue) }, () => {
      this.fetchInsights(`${BASE_SERVICE_URL}/insights?${this.getFetchQuery()}`);
    });
  };
  handleChangeTeam = team => {
    const teamId = team.target.value;
    const selectedTeam = this.props.teams.data.find(team => team.id === teamId);
    this.setState(
      {
        selectedTeam:
          teamId === "none"
            ? { value: "none", label: "All teams" }
            : { value: selectedTeam.id, label: selectedTeam.name },
        selectedWorkflow: { value: "none", label: "All workflows" }
      },
      () => {
        this.fetchInsights(`${BASE_SERVICE_URL}/insights?${this.getFetchQuery()}`);
      }
    );
  };
  handleChangeWorkflow = (query, workflow) => {
    let workflows = [];
    this.props.teams.data.forEach(team => (workflows = workflows.concat(team.workflows)));
    let workflowsList = [{ value: "none", label: "All workflows" }].concat(
      sortByProp(workflows.map(workflow => ({ ...workflow, value: workflow.id, label: workflow.name })), "label")
    );
    this.setState({ selectedWorkflow: workflowsList.find(wf => wf.value === workflow) }, () => {
      const { selectedWorkflow } = this.state;
      const { insights } = this.props;
      if (selectedWorkflow.value === "none") this.setState({ executionsList: insights.data.executions });
      else
        this.setState({
          executionsList: insights.data.executions.filter(execution => execution.workflowId === selectedWorkflow.value)
        });
    });
  };
  componentDidMount() {
    this.fetchInsights(`${BASE_SERVICE_URL}/insights?${this.getFetchQuery()}`);
    this.props.teamsActions.fetch(`${BASE_SERVICE_URL}/teams`).catch(err => {
      // noop
    });
  }

  getFetchQuery = () => {
    const { selectedTeam, selectedTimeframe } = this.state;
    const query = queryString.stringify({
      fromDate: moment()
        .subtract("days", selectedTimeframe.value)
        .format("x"),
      toDate: moment().format("x"),
      teamId: selectedTeam.value === "none" ? undefined : selectedTeam.value
    });
    return query;
  };

  fetchInsights = url => {
    const { selectedWorkflow } = this.state;
    this.props.insightsActions
      .fetch(url)
      .then(response => {
        if (response.status === 200) {
          if (selectedWorkflow.value === "none") this.setState({ executionsList: response.data.executions });
          else
            this.setState({
              executionsList: response.data.executions.filter(
                execution => execution.workflowId === selectedWorkflow.value
              )
            });
        }
      })
      .catch(err => {
        // noop
      });
  };

  renderWidgets = () => {
    const { insights } = this.props;

    if (insights.status === REQUEST_STATUSES.FAILURE) {
      return <ErrorDragon theme="bmrg-white" />;
    }

    if (insights.isFetching) {
      return <LoadingAnimation theme="bmrg-white" />;
    }

    if (insights.status === REQUEST_STATUSES.SUCCESS) {
      const { executionsList } = this.state;
      const chartData = parseChartsData(executionsList);
      return (
        <>
          <div className="c-workflow-insights-stats-widgets">
            <WidgetCard title="Total Executed" type="stat">
              {chartData.totalExecutions === 0 ? (
                <p className="b-workflow-insights__stats-label --no-data">No Data</p>
              ) : (
                <p className="b-workflow-insights__stats-label">{chartData.totalExecutions}</p>
              )}
            </WidgetCard>
            <WidgetCard title="Median Duration" type="stat">
              {chartData.totalExecutions === 0 ? (
                <p className="b-workflow-insights__stats-label --no-data">No Data</p>
              ) : (
                <p className="b-workflow-insights__stats-label">
                  {chartData.medianDuration === 0 ? "0" : timeSecondsToTimeUnit(chartData.medianDuration)}
                </p>
              )}
            </WidgetCard>
            <WidgetCard title="Success Rate" type="stat">
              {chartData.totalExecutions === 0 ? (
                <p className="b-workflow-insights__stats-label --no-data">No Data</p>
              ) : (
                <CustomPieChart data={chartData.pieData} percentageSuccessful={chartData.percentageSuccessful} />
              )}
            </WidgetCard>
          </div>
          <div className="c-workflow-insights-graphs-widgets">
            <WidgetCard title="Executions" type="graph">
              {chartData.totalExecutions === 0 ? (
                <p className="b-workflow-insights__graphs-label --no-data">No Data</p>
              ) : (
                <CustomAreaChart
                  areaData={executeDataLines}
                  data={chartData.timeData}
                  toolTipDateFormat="MMM DD - YYYY"
                  xAxisKey="date"
                  yAxisText="Count"
                />
              )}
            </WidgetCard>
            <WidgetCard title="Execution Time" type="graph">
              {chartData.totalExecutions === 0 ? (
                <p className="b-workflow-insights__graphs-label --no-data">No Data</p>
              ) : (
                <CustomScatterChart
                  data={chartData.scatterData}
                  yAxisText="Duration (seconds)"
                  yAxisDataKey="duration"
                />
              )}
            </WidgetCard>
          </div>
        </>
      );
    }

    return null;
  };

  render() {
    const { teams } = this.props;

    if (teams.status === REQUEST_STATUSES.FAILURE) {
      return <ErrorDragon theme="bmrg-white" />;
    }

    if (teams.isFetching) {
      return (
        <div className="c-workflow-insights">
          <div className="c-workflow-insights-content">
            <LoadingAnimation theme="bmrg-white" />
          </div>
        </div>
      );
    }

    if (teams.status === REQUEST_STATUSES.SUCCESS) {
      const { selectedTeam } = this.state;
      const teamsList = [{ value: "none", label: "All teams" }].concat(
        teams.data.map(team => ({ label: team.name, value: team.id }))
      );
      let workflows = [];
      if (selectedTeam.value === "none") teams.data.forEach(team => (workflows = workflows.concat(team.workflows)));
      else workflows = teams.data.find(team => team.id === selectedTeam.value).workflows;
      let workflowsList = [{ value: "none", label: "All workflows" }].concat(
        sortByProp(workflows.map(workflow => ({ ...workflow, value: workflow.id, label: workflow.name })), "label")
      );
      const workflowsFilter = sortByProp(workflowsList, "name", "ASC");

      return (
        <div className="c-workflow-insights">
          <nav className="s-workflow-insights-navigation">
            <NavigateBack
              to={this.props.location.state ? this.props.location.state.fromUrl : "/workflows"}
              text={`Back to ${this.props.location.state ? this.props.location.state.fromText : "Workflows"}`}
            />
          </nav>
          <div className="c-workflow-insights-header">
            <SimpleSelectFilter onChange={this.handleChangeTeam} selectedOption={selectedTeam} options={teamsList} />
            <SearchFilterBar
              handleSearchFilter={this.handleChangeWorkflow}
              options={
                selectedTeam.value !== "none" ? teams.data.filter(team => team.id === selectedTeam.value) : teams.data
              }
              filterItems={workflowsFilter}
              debounceTimeout={300}
              multiselect={false}
              selectedOption={this.state.selectedWorkflow.value}
              searchbar={false}
            />
            <SimpleSelectFilter
              onChange={this.handleChangeTimeframe}
              selectedOption={this.state.selectedTimeframe}
              options={timeframeOptions}
            />
          </div>
          {this.renderWidgets()}
        </div>
      );
    }

    return null;
  }
}

const mapStateToProps = state => ({
  insights: state.insights,
  teams: state.teams
});

const mapDispatchToProps = dispatch => ({
  insightsActions: bindActionCreators(insightsActions, dispatch),
  teamsActions: bindActionCreators(teamsActions, dispatch)
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WorkflowInsights);
