import { sortBy } from "lodash";
import moment from "moment";
import { ACTIVITY_STATUSES } from "Constants/activityStatuses";
import { timeSecondsToTimeUnit } from "Utilities/timeSecondsToTimeUnit";
import { chartInfo, chartColors } from "./constants";

export const parseChartsData = (data, teams) => {
  let dateName = [];
  let failure = [];
  let success = [];
  let inprogress = [];
  let invalid = [];
  let finalData = [];

  let scatterData = [];
  let sumDuration = 0;

  let failureData = [];
  let successData = [];
  let inprogressData = [];
  let invalidData = [];
  let totalData = [];

  data.map(item => {
    scatterData.push({
      value: parseInt(item.duration / 1000, 10),
      date: new Date(item.creationDate)
    });
    sumDuration += item.duration;
    if (item.status === ACTIVITY_STATUSES.COMPLETED) {
      success.push(item);
    }
    if (item.status === ACTIVITY_STATUSES.FAILURE) {
      failure.push(item);
    }
    if (item.status === ACTIVITY_STATUSES.IN_PROGRESS || item.status === undefined) {
      inprogress.push(item);
    }
    if (item.status === ACTIVITY_STATUSES.INVALID || item.status === null) {
      invalid.push(item);
    }
    if (dateName.find(date => moment(date).format("DD-MM-YY") === moment(item.creationDate).format("DD-MM-YY"))) {
      return null;
    } else {
      return dateName.push(item.creationDate);
    }
  });
  const dataByStatus = {
    success: successData,
    failed: failureData,
    invalid: invalidData,
    inProgress: inprogressData,
    total: totalData
  };
  const dataByDuration = sortBy(data, ({ duration }) => duration || "");
  dateName.map(date => {
    let fail = failure.filter(item => moment(item.creationDate).format("DD-MM-YY") === moment(date).format("DD-MM-YY"))
      .length;
    let succeeded = success.filter(
      item => moment(item.creationDate).format("DD-MM-YY") === moment(date).format("DD-MM-YY")
    ).length;
    let inProgress = inprogress.filter(
      item => moment(item.creationDate).format("DD-MM-YY") === moment(date).format("DD-MM-YY")
    ).length;
    let invalidStatus = invalid.filter(
      item => moment(item.creationDate).format("DD-MM-YY") === moment(date).format("DD-MM-YY")
    ).length;
    return finalData.push({
      date: parseInt(moment(date).format("x"), 10),
      failed: fail,
      success: succeeded,
      inProgress,
      invalid: invalidStatus,
      total: fail + succeeded + inProgress + invalidStatus
    });
  });
  const dataByTeams = teams.reduce((acc, team) => {
    const teamData = data.filter(item => item.teamName === team);
    return acc.concat({ label: team, value: teamData.length });
  }, []);
  const totalExecutions = data.length;
  const successExecutions = success.length;
  const failExecutions = failure.length;
  const inProgressExecutions = inprogress.length;
  const invalidExecutions = invalid.length;
  const avarageDuration = parseInt(sumDuration / totalExecutions, 10);
  const medianDuration = dataByDuration[parseInt((data.length - 1) / 2, 10)]
    ? dataByDuration[parseInt((data.length - 1) / 2, 10)].duration
    : 0;
  const maximumDuration = dataByDuration[dataByDuration.length - 1]
    ? dataByDuration[dataByDuration.length - 1].duration
    : 0;
  const minimumDuration = dataByDuration[0] ? dataByDuration[0].duration || 0 : 0;
  const percentageSuccessful = parseFloat(((success.length / totalExecutions) * 100).toFixed(2));

  finalData.forEach(data => {
    failureData.push({ date: new Date(data.date), value: data.failed });
    successData.push({ date: new Date(data.date), value: data.success });
    inprogressData.push({ date: new Date(data.date), value: data.inProgress });
    invalidData.push({ date: new Date(data.date), value: data.invalid });
    totalData.push({ date: new Date(data.date), value: data.total });
  });

  const carbonLineData = chartInfo.map(chart => {
    return {
      label: chart.label,
      fillColors: [chart.color],
      data: dataByStatus[chart.value]
    };
  });
  const carbonScatterData = [
    {
      label: "Duration",
      fillColors: [chartColors.TOTAL],
      data: scatterData
    }
  ];
  const carbonDonutData = [
    {
      label: "Status",
      fillColors: [chartColors.SUCCESS, chartColors.FAILED, chartColors.INVALID, chartColors.IN_PROGRESS],
      data: [successExecutions, failExecutions, invalidExecutions, inProgressExecutions]
    }
  ];
  return {
    carbonLineData,
    carbonScatterData,
    carbonDonutData,
    durationData: [
      { value: timeSecondsToTimeUnit(parseInt(minimumDuration / 1000, 10)), label: "Minimum" },
      { value: timeSecondsToTimeUnit(parseInt(maximumDuration / 1000, 10)), label: "Maximum" },
      { value: timeSecondsToTimeUnit(parseInt(avarageDuration / 1000, 10)), label: "Avarage" }
    ],
    medianDuration: parseInt(medianDuration / 1000, 10),
    percentageSuccessful,
    totalExecutions,
    dataByTeams
  };
};
