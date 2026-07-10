type SplitBarProps = {
  leftValue: number;
  rightValue: number;
  middleValue?: number;
  leftLabel: string;
  rightLabel: string;
  title?: string;
};

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, value));
}

export function SplitBar({
  leftValue,
  rightValue,
  middleValue = 0,
  leftLabel,
  rightLabel,
  title,
}: SplitBarProps) {
  const safeLeft = clampPercent(leftValue);
  const safeMiddle = clampPercent(middleValue);
  const safeRight = clampPercent(rightValue);

  return (
    <div
      className="split-bar"
      title={title}
    >
      <div className="split-bar__labels">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
      <div className="split-bar__track">
        <div
          className="split-bar__segment split-bar__segment--left"
          style={{ width: `${safeLeft}%` }}
        />
        {safeMiddle > 0 ? (
          <div
            className="split-bar__segment split-bar__segment--middle"
            style={{ width: `${safeMiddle}%` }}
          />
        ) : null}
        <div
          className="split-bar__segment split-bar__segment--right"
          style={{ width: `${safeRight}%` }}
        />
      </div>
    </div>
  );
}
