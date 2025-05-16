import { createMemo } from "solid-js";
import { rulaScores, rulaFinalScore } from "./store.js";

const RulaScorePanel = () => {
  const scores = createMemo(() => rulaScores() || {});
  const finalScore = createMemo(() => rulaFinalScore());

  return (
    <div
      style={{
        padding: "1rem",
        overflow: "auto",
        height: "100%",
      }}
    >
      <div class="plotTitle" style={{ "margin-bottom": "1rem" }}>
        RULA Scores <span class="selectedRowColor"></span>
      </div>

      <table
        style={{
          width: "100%",
          "border-collapse": "collapse",
        }}
      >
        <thead>
          <tr>
            <th style={{ "text-align": "left" }}>Body Part</th>
            <th style={{ "text-align": "left" }}>Score</th>
            <th style={{ "text-align": "left" }}>Angle (°)</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(scores()).map(([part, rawData]) => {
            if (!rawData || typeof rawData !== "object") return null;

            const score =
              typeof (rawData as any).score === "number"
                ? (rawData as any).score
                : parseFloat((rawData as any).score as any);

            const angle =
              typeof (rawData as any).angle === "number"
                ? (rawData as any).angle
                : parseFloat((rawData as any).angle as any);

            return (
              <tr>
                <td><b>{part}</b></td>
                <td>{!isNaN(score) ? score : "--"}</td>
                <td>{!isNaN(angle) ? angle.toFixed(1) : "--"}</td>
              </tr>
            );
          })}

          {finalScore() != null && (
            <tr>
              <td><b>FINAL</b></td>
              <td>{finalScore()}</td>
              <td>--</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default RulaScorePanel; 