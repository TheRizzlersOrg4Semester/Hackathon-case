// @vitest-environment jsdom

import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DonorBlobVisualization } from "../../components/donor-blob-visualization";

afterEach(() => {
  cleanup();
});

const donations = [
  {
    id: "d1",
    amount: 300,
    donorName: "Alex",
    isAnonymous: false,
    donationType: "ONE_TIME" as const,
    blobColor: "#4DD2FF",
    campaignImageUrl: "https://example.com/campaign-a.png",
    campaignTitle: "Campaign A",
    createdAt: new Date("2026-03-17T10:00:00Z")
  },
  {
    id: "d2",
    amount: 1000,
    donorName: "Private Donor",
    isAnonymous: true,
    donationType: "RECURRING" as const,
    blobColor: "#2FD39A",
    campaignImageUrl: "https://example.com/campaign-b.png",
    campaignTitle: "Campaign B",
    createdAt: new Date("2026-03-17T12:30:00Z")
  }
];

describe("DonorBlobVisualization", () => {
  it("renders fallback table rows for all donations", () => {
    render(<DonorBlobVisualization donations={donations} />);

    expect(screen.getByRole("table")).toBeTruthy();
    expect(screen.getAllByText("Alex").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Anonymous").length).toBeGreaterThan(0);
  });

  it("updates details when a blob is clicked", () => {
    render(<DonorBlobVisualization donations={donations} />);

    const anonymousBlob = screen.getAllByLabelText(/Anonymous/i)[0];
    fireEvent.click(anonymousBlob);

    const detailPanel = screen.getByTestId("blob-detail-panel");
    expect(anonymousBlob.getAttribute("aria-pressed")).toBe("true");
    expect(within(detailPanel).getByText("Anonymous")).toBeTruthy();
    expect(within(detailPanel).getByText("Recurring donation")).toBeTruthy();
  });

  it("supports keyboard focus updates for detail panel", () => {
    render(<DonorBlobVisualization donations={donations} />);

    const anonymousBlob = screen.getAllByLabelText(/Anonymous/i)[0];
    fireEvent.focus(anonymousBlob);

    const detailPanel = screen.getByTestId("blob-detail-panel");
    expect(within(detailPanel).getByText("Anonymous")).toBeTruthy();
  });

  it("renders cleanly when campaign image is missing", () => {
    render(
      <DonorBlobVisualization
        donations={[
          {
            ...donations[0],
            campaignImageUrl: null
          }
        ]}
      />
    );

    expect(screen.getByRole("table")).toBeTruthy();
    expect(screen.getByTestId("blob-fallback-d1")).toBeTruthy();
  });

  it("uses text fallback when campaign image URL is invalid", () => {
    render(
      <DonorBlobVisualization
        donations={[
          {
            ...donations[0],
            campaignImageUrl: "invalid-url"
          }
        ]}
      />
    );

    expect(screen.getByTestId("blob-fallback-d1")).toBeTruthy();
  });
});
