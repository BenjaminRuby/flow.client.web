import React, { Component } from "react";
import PropTypes from "prop-types";
// import axios from "axios";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { actions as insightsActions } from "State/insights";
import { actions as teamsActions } from "State/teams";
// import sortBy from "lodash/sortBy";
import LoadingAnimation from "@boomerang/boomerang-components/lib/LoadingAnimation";
import SelectDropdown from "@boomerang/boomerang-components/lib/SelectDropdown";
// import NoDisplay from "@boomerang/boomerang-components/lib/NoDisplay";
import NavigateBack from "Components/NavigateBack";
// import { notify, Notification } from "@boomerang/boomerang-components/lib/Notifications";
import ErrorDragon from "Components/ErrorDragon";
// import SearchFilterBar from "Components/SearchFilterBar";
// import WorkflowsSection from "./WorkflowsSection";
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

class WorkflowsInsights extends Component {
  static propTypes = {
    // insights: PropTypes.object.isRequired,
    // insightsActions: PropTypes.object.isRequired,
    // teams: PropTypes.object.isRequired,
    // teamsActions: PropTypes.object.isRequired
  };
  state = {
    selectedTimeframe: timeframeOptions[3],
    selectedTeam: { value: "", label: "All" }
  };

  handleChangeTimeframe = timeframe => {
    this.setState({ selectedTimeframe: timeframe });
  };
  handleChangeTeam = team => {
    this.setState({ selectedTeam: team });
  };
  componentDidMount() {
    this.props.insightsActions.fetch(`${BASE_SERVICE_URL}/activity`);
    this.props.teamsActions.fetch(`${BASE_SERVICE_URL}/teams`);
  }

  render() {
    const { insights, teams } = this.props;
    console.log(this.props, "WOOOOW");

    if (insights.status === REQUEST_STATUSES.FAILURE || teams.status === REQUEST_STATUSES.FAILURE) {
      return <ErrorDragon theme="bmrg-white" />;
    }

    if (insights.isFetching || teams.isFetching) {
      return (
        <div className="c-workflow-insights">
          <div className="c-workflow-insights-content">
            <LoadingAnimation theme="bmrg-white" />
          </div>
        </div>
      );
    }

    if (insights.status === REQUEST_STATUSES.SUCCESS && teams.status === REQUEST_STATUSES.SUCCESS) {
      // const filteredTeams = this.filterTeams();
      // const sortedTeams = sortBy(filteredTeams, ["name"]);
      const teamsList = [{ value: "", label: "All" }].concat(
        teams.data.map(team => ({ label: team.name, value: team.id }))
      );
      const chartData = parseChartsData(insights.data.executions);

      return (
        <div className="c-workflow-insights">
          <nav className="s-workflow-insights-navigation">
            <NavigateBack to="/workflows" text="Back to Workflows" />
          </nav>
          <div className="c-workflow-insights__header">
            <SelectDropdown
              options={teamsList}
              theme="bmrg-white"
              styles={{ width: "22rem", marginTop: "1rem" }}
              title="TEAM"
              placeholder="Select a team"
              value={this.state.selectedTeam}
              onChange={this.handleChangeTeam}
            />
            <SelectDropdown
              options={timeframeOptions}
              theme="bmrg-white"
              styles={{ width: "22rem", marginTop: "1rem" }}
              value={this.state.selectedTimeframe}
              title="TIMEFRAME"
              onChange={this.handleChangeTimeframe}
            />
          </div>
          <div className="c-workflow-insights__stats-widgets">
            <div className="c-workflow-insights__stats">
              <WidgetCard title="Total Executed">
                {insights.data.length === 0 ? (
                  <label className="b-workflow-insights__stats-label --no-data">No Data</label>
                ) : (
                  <label className="b-workflow-insights__stats-label">{chartData.totalExecuted}</label>
                )}
              </WidgetCard>
            </div>
            <div className="c-workflow-insights__stats">
              <WidgetCard title="Median Duration">
                {insights.data.length === 0 ? (
                  <label className="b-workflow-insights__stats-label --no-data">No Data</label>
                ) : (
                  <label className="b-workflow-insights__stats-label">
                    {timeSecondsToTimeUnit(parseInt(insights.data.medianExecutionTime / 1000, 10))}
                  </label>
                )}
              </WidgetCard>
            </div>
            <div className="c-workflow-insights__stats">
              <WidgetCard title="Success Executions">
                {insights.data.length === 0 ? (
                  <label className="b-workflow-insights__stats-label --no-data">No Data</label>
                ) : (
                  <CustomPieChart data={chartData.pieData} percentageSuccessful={chartData.percentageSuccessful} />
                )}
              </WidgetCard>
            </div>
          </div>
          <div className="c-workflow-insights__graphs-widgets">
            <div className="c-workflow-insights__graph">
              <WidgetCard title="Executions">
                {insights.data.length === 0 ? (
                  <label className="b-workflow-insights__graphs-label --no-data">No Data</label>
                ) : (
                  <CustomAreaChart
                    areaData={executeDataLines}
                    data={chartData.timeData}
                    toolTipDateFormat="MMM DD - YYYY"
                    xAxisKey="date"
                    yAxisText={`Activities`}
                  />
                )}
              </WidgetCard>
            </div>
            <div className="c-workflow-insights__graph">
              <WidgetCard title="Average Execution Time">
                {insights.data.length === 0 ? (
                  <label className="b-workflow-insights__graphs-label --no-data">No Data</label>
                ) : (
                  <CustomScatterChart data={chartData.scatterData} yAxisText="duration" yAxisDataKey="duration" />
                )}
              </WidgetCard>
            </div>
          </div>
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
)(WorkflowsInsights);
