import React from "react";
import { shallow } from "enzyme";
import renderer from "react-test-renderer";
import { MemoryRouter } from "react-router";
import Main from "./index";

jest.mock("Components/NavigateBack", () => "NavigateBack");
jest.mock("@boomerang/boomerang-components", () => ({
  LoadingAnimation: "LoadingAnimation"
}));

const mockfn = jest.fn();

const dag = {};
const taskId = "test";
const workflowData = {};
const workflowExecutionData = {};
const version = 1;
const activityState = {
  status: "success"
};

const teamsState = {
  status: "success"
};

describe("Main --- Snapshot", () => {
  it("Capturing Snapshot of Main", () => {
    const renderedValue = renderer.create(
      <MemoryRouter>
        <Main
          activityState={activityState}
          dag={dag}
          taskId={taskId}
          teamsState={teamsState}
          workflowData={workflowData}
          workflowExecutionData={workflowExecutionData}
          updateActiveNode={mockfn}
          version={version}
        />
      </MemoryRouter>
    );
    expect(renderedValue).toMatchSnapshot();
  });
});

describe("Main --- Shallow render", () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(
      <MemoryRouter>
        <Main
          activityState={activityState}
          dag={dag}
          taskId={taskId}
          teamsState={teamsState}
          workflowData={workflowData}
          workflowExecutionData={workflowExecutionData}
          updateActiveNode={mockfn}
          version={version}
        />
      </MemoryRouter>
    );
  });

  it("Render the DUMB component", () => {
    expect(wrapper.length).toEqual(1);
  });
});
