import React from "react";
import { WorkflowsHome } from "./index";

const mockfn = jest.fn();
jest.mock("@boomerang/carbon-addons-boomerang-react", () => ({
  NoDisplay: "NoDisplay",
  LoadingAnimation: "LoadingAnimation",
  notify: "notify",
  Notification: "Notification"
}));

const props = {
  teamsActions: {
    fetch: () => new Promise(() => {}),
    setActiveTeam: mockfn,
    updateWorkflows: mockfn
  },
  appActions: {
    setActiveTeam: mockfn
  },
  teamsState: {
    isFetching: false,
    status: "success",
    error: "",
    data: []
  },
  history: {},
  importWorkflow: {},
  importWorkflowActions: {}
};

describe("WorkflowsHome --- Snapshot", () => {
  it("Capturing Snapshot of WorkflowsHome", () => {
    const { baseElement } = rtlRouterRender(<WorkflowsHome {...props} />);
    expect(baseElement).toMatchSnapshot();
  });
});
