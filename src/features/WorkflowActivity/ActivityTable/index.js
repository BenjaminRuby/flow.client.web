import React, { Component } from "react";
import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";
import moment from "moment";
import cx from "classnames";
import { settings } from "carbon-components";
import getHumanizedDuration from "@boomerang/boomerang-utilities/lib/getHumanizedDuration";
import isAccessibleEvent from "@boomerang/boomerang-utilities/lib/isAccessibleEvent";
import { DataTableSkeleton, DataTable, Pagination } from "carbon-components-react";
import { NoDisplay } from "@boomerang/carbon-addons-boomerang-react";
import { arrayPagination } from "Utilities/arrayHelper";
import { ACTIVITY_STATUSES_TO_TEXT, ACTIVITY_STATUSES_TO_ICON } from "Constants/activityStatuses";
import styles from "./activityTable.module.scss";

const { prefix } = settings;

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZES = [DEFAULT_PAGE_SIZE, 25, 50];

class ActivityTable extends Component {
  static propTypes = {
    activities: PropTypes.array.isRequired,
    isUpdating: PropTypes.bool,
    history: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired,
    sort: PropTypes.object.isRequired
  };

  state = {
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    activities: this.props.activities,
    sort: this.props.sort
  };

  headers = [
    {
      header: "Team",
      key: "teamName"
    },
    {
      header: "Workflow",
      key: "workflowName"
    },
    {
      header: "Trigger",
      key: "trigger"
    },
    {
      header: "Initiated By",
      key: "initiatedByUserName"
    },
    {
      header: "Start Time",
      key: "creationDate"
    },
    {
      header: "Duration",
      key: "duration"
    },
    {
      header: "Status",
      key: "status"
    }
  ];

  handlePaginationChange = ({ page, pageSize }) => {
    this.setState({ page, pageSize });
  };

  renderCell = (cellIndex, value) => {
    const column = this.headers[cellIndex];

    switch (column.header) {
      case "Trigger":
        return (
          <p className={styles.tableTextarea} style={{ textTransform: "capitalize" }}>
            {value || "---"}
          </p>
        );
      case "Start Time":
        return <time className={styles.tableTextarea}>{moment(value).format("YYYY-MM-DD hh:mm A")}</time>;
      case "Duration":
        return (
          <time className={styles.tableTextarea}>
            {value ? getHumanizedDuration(parseInt(value / 1000, 10)) : "---"}
          </time>
        );
      case "Status":
        const Icon = ACTIVITY_STATUSES_TO_ICON[value ? value : "notstarted"];
        return (
          <div className={`${styles.status} ${styles[value]}`}>
            <Icon aria-label={value} className={styles.statusIcon} />
            <p className={styles.statusText}>{ACTIVITY_STATUSES_TO_TEXT[value ? value : "notstarted"]}</p>
          </div>
        );
      default:
        return <p className={styles.tableTextarea}>{value || "---"}</p>;
    }
  };

  handleSort = (valueA, valueB, config) => {
    this.setState({ sort: config });
  };

  executionViewRedirect = activityId => {
    const activity = this.props.activities.find(activity => activity.id === activityId);
    this.props.history.push({
      pathname: `/activity/${activity.workflowId}/execution/${activity.id}`,
      state: { fromUrl: `${this.props.match.url}${this.props.location.search}`, fromText: "Activity" }
    });
  };

  render() {
    const { page, pageSize, activities, sort } = this.state;
    const { TableContainer, Table, TableHead, TableRow, TableBody, TableCell, TableHeader } = DataTable;

    const totalItems = activities.length;

    if (this.props.isUpdating) {
      return (
        <div style={{ marginTop: "1rem" }}>
          <DataTableSkeleton
            className={cx(`${prefix}--skeleton`, `${prefix}--data-table`, styles.tableSkeleton)}
            rowCount={pageSize}
            columnCount={this.headers.length}
            headers={this.headers.map(header => header.header)}
          />
        </div>
      );
    }

    return (
      <>
        <div className={styles.tableContainer}>
          {totalItems > 0 ? (
            <>
              <DataTable
                rows={arrayPagination(activities, page, pageSize, sort)}
                sortRow={this.handleSort}
                headers={this.headers}
                render={({ rows, headers, getHeaderProps }) => (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow className={styles.tableHeadRow}>
                          {headers.map(header => (
                            <TableHeader
                              id={header.key}
                              {...getHeaderProps({
                                header,
                                className: `${styles.tableHeadHeader} ${styles[header.key]}`
                              })}
                            >
                              {header.header}
                            </TableHeader>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody className={styles.tableBody}>
                        {rows.map(row => (
                          <TableRow
                            key={row.id}
                            className={`${styles.tableRow} ${styles[row.cells[6].value]}`}
                            data-testid="configuration-property-table-row"
                            onClick={() => this.executionViewRedirect(row.id)}
                            onKeyDown={e => isAccessibleEvent(e) && this.executionViewRedirect(row.id)}
                            tabIndex={0}
                          >
                            {row.cells.map((cell, cellIndex) => (
                              <TableCell key={cell.id} style={{ padding: "0" }}>
                                <div className={styles.tableCell}>{this.renderCell(cellIndex, cell.value)}</div>
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              />
              <Pagination
                onChange={this.handlePaginationChange}
                page={page}
                pageSize={pageSize}
                pageSizes={PAGE_SIZES}
                totalItems={totalItems}
              />
            </>
          ) : (
            <>
              <DataTable
                rows={activities}
                headers={this.headers}
                render={({ headers }) => (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow className={styles.tableHeadRow}>
                          {headers.map(header => (
                            <TableHeader
                              key={header.key}
                              id={header.key}
                              className={`${styles.tableHeadHeader} ${styles[header.key]}`}
                            >
                              {header.header}
                            </TableHeader>
                          ))}
                        </TableRow>
                      </TableHead>
                    </Table>
                  </TableContainer>
                )}
              />
              <NoDisplay
                style={{ marginTop: "5.5rem" }}
                textLocation="below"
                text="Looks like you need to run some workflows!"
              />
            </>
          )}
        </div>
      </>
    );
  }
}

export default withRouter(ActivityTable);
