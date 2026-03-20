// @vitest-environment jsdom

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CampaignMilestones } from "../../components/campaign-milestones";

describe("CampaignMilestones", () => {
  it("renders reached and upcoming milestone states", () => {
    render(
      <CampaignMilestones
        milestones={[
          {
            id: "m-1",
            title: "Launch the first kit",
            description: "Buy the initial hardware set.",
            targetAmount: 5000,
            displayOrder: 1
          },
          {
            id: "m-2",
            title: "Fund the workshop series",
            description: null,
            targetAmount: 12000,
            displayOrder: 2
          }
        ]}
        raisedAmount={7000}
      />
    );

    expect(screen.getByText("Stretch goals")).toBeTruthy();
    expect(screen.getByText("Launch the first kit")).toBeTruthy();
    expect(screen.getByText("Fund the workshop series")).toBeTruthy();
    expect(screen.getByText("Reached")).toBeTruthy();
    expect(screen.getByText("Upcoming")).toBeTruthy();
  });
});
