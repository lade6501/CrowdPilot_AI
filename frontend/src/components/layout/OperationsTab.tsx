import React from "react";
import { StadiumMap } from "../StadiumMap";
import { TelemetryFeed } from "../TelemetryFeed";
import { Recommendation } from "../Recommendation";
import { ActionQueue } from "../ActionQueue";
import { LiveTimeline } from "../LiveTimeline";

export const OperationsTab: React.FC = () => {
  return (
    <>
      <section className="space-y-2">
        <StadiumMap />
      </section>

      <section className="space-y-2">
        <TelemetryFeed />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <Recommendation />
        </div>
        <div>
          <ActionQueue />
        </div>
        <div>
          <LiveTimeline />
        </div>
      </section>
    </>
  );
};
