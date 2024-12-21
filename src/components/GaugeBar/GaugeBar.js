import React, { useState, useRef, useEffect, useCallback } from "react";
import "./GaugeBar.css";

const GaugeBar = ({
  value,
  setValue,
  label,
  min,
  max,
  color,
}) => {
  const segmentCount = 10;

  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(value);

  const trackRef = useRef(null);

  const snapToSegment = useCallback(
    (val) => {
      const segmentWidth = 100 / segmentCount; // =10
      let snappedVal = Math.round(val / segmentWidth) * segmentWidth;
      snappedVal = Math.max(min, Math.min(max, snappedVal));
      return snappedVal;
    },
    [segmentCount, min, max]
  );

  const handleMouseDown = (e) => {
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleTrackClick = (event) => {
    if (!trackRef.current) return;
    const track = trackRef.current.getBoundingClientRect();
    const clickPos = ((event.clientX - track.left) / track.width) * 100;

    const snapped = snapToSegment(clickPos);
    setValue(snapped);
    setDragValue(snapped);
  };

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (event) => {
      if (!trackRef.current) return;
      const track = trackRef.current.getBoundingClientRect();
      const movePos = ((event.clientX - track.left) / track.width) * 100;
      const continuousVal = Math.max(min, Math.min(max, movePos));
      setDragValue(continuousVal);
    };

    const onMouseUp = () => {
      setIsDragging(false);
      // 드래그 끝, 10% 스냅
      const snapped = snapToSegment(dragValue);
      setDragValue(snapped);
      setValue(snapped);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging, dragValue, snapToSegment, setValue, min, max]);
  
  const displayValue = isDragging ? dragValue : value;

  return (
    <div className="gauge-bar-container">
      <div className="gauge-bar-label">{label}</div>

      <div
        className="progress-container"
        ref={trackRef}
        onClick={handleTrackClick}
      >
        <div
          className="progress-bar"
          style={{
            width: `${displayValue}%`,
            background: color || "#9ca19d",
          }}
        ></div>

        {Array.from({ length: segmentCount }).map((_, i) =>
          i === 0 ? null : (
            <div
              key={i}
              className="progress-segment"
              style={{
                left: `${(i * 100) / segmentCount}%`,
              }}
            ></div>
          )
        )}

        <div
          className="progress-handle"
          style={{
            left: `${displayValue}%`,
            background: color || "#9ca19d",
          }}
          onMouseDown={handleMouseDown}
        ></div>
      </div>

      <div className="gauge-bar-percentage">
        {Math.round(displayValue)}%
      </div>
    </div>
  );
};

export default GaugeBar;
