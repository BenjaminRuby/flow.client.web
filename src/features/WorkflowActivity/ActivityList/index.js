import React, { Component } from "react";
import PropTypes from "prop-types";
// import axios from "axios";
// import ActivityTable from "./ActivityTable";
import LoadingAnimation from "@boomerang/boomerang-components/lib/LoadingAnimation";
import NoDisplay from "@boomerang/boomerang-components/lib/NoDisplay";
import InfiniteScroll from "react-infinite-scroller";
import ActivityCard from "./ActivityCard";
import ScrollUp from "Components/ScrollUp";
import "./styles.scss";

class ActivityList extends Component {
  static propTypes = {
    activities: PropTypes.array.isRequired,
    history: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired,
    nextPage: PropTypes.number,
    loadMoreActivities: PropTypes.func.isRequired,
    setMoreActivities: PropTypes.func.isRequired,
    isLoading: PropTypes.bool,
    hasMoreActivities: PropTypes.bool
  };

  loadMoreActivities = () => {
    this.props.loadMoreActivities(this.props.nextPage);
    this.props.setMoreActivities(false);
  };

  render() {
    return (
      <>
        <InfiniteScroll
          className="c-activity-list"
          pageStart={0}
          loadMore={this.loadMoreActivities}
          hasMore={this.props.hasMoreActivities && !this.props.isLoading}
          loader={<LoadingAnimation className="s-activities-loading" />}
          useWindow={true}
        >
          {!this.props.activities.length ? (
            <NoDisplay style={{ marginTop: "2rem" }} text="Looks like you need to run some workflows!" />
          ) : (
            this.props.activities.map(activity => {
              return (
                <ActivityCard
                  activity={activity}
                  history={this.props.history}
                  key={activity.id}
                  match={this.props.match}
                />
              );
            })
          )}
        </InfiniteScroll>
        <ScrollUp />
      </>
    );
  }
}

export default ActivityList;
