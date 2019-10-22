import { lazy } from "react";

export const AsyncActivity = lazy(() => import(/* webpackChunkName: "Activity" */ "Features/WorkflowActivity"));
export const AsyncHome = lazy(() => import(/* webpackChunkName: "Home" */ "Features/WorkflowsHome"));
export const AsyncManager = lazy(() => import(/* webpackChunkName: "Manager" */ "Features/WorkflowManager"));
export const AsyncInsights = lazy(() => import(/* webpackChunkName: "Insights" */ "Features/WorkflowInsights"));
export const AsyncExecution = lazy(() => import(/* webpackChunkName: "Execution" */ "Features/WorkflowExecution"));
export const AsyncGlobalConfiguration = lazy(() =>
  import(/* webpackChunkName: "GlobalConfiguration" */ "Features/GlobalConfiguration")
);
export const AsyncTeamProperties = lazy(() =>
  import(/* webpackChunkName: "TeamProperties" */ "Features/TeamProperties")
);
