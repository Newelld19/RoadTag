import { useEffect, useMemo, useRef, useState } from "react";
import mapSvg from "../assets/us-map.svg?raw";
import { JURISDICTION_BY_CODE, NORTHEAST_CODES } from "../data/jurisdictions";
import type { Trip } from "../models/types";
import { isSpotted } from "../services/scoring";

interface MapPath {
  code: string;
  d: string;
}

interface Props {
  trip: Trip;
  selectedCode?: string;
  onMissing: (code: string) => void;
  onOpen: (code: string) => void;
}

const STATE_CLASS = /^[a-z]{2}$/;

function parseMap(svg: string): {
  paths: MapPath[];
  dcCircle: { cx: string; cy: string; r: string } | null;
  separators: string[];
} {
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
  const paths: MapPath[] = [];
  const separators: string[] = [];
  for (const path of Array.from(doc.querySelectorAll("path"))) {
    const className = path.getAttribute("class") ?? "";
    const d = path.getAttribute("d") ?? "";
    if (className === "separator1") {
      separators.push(d);
      continue;
    }
    if (STATE_CLASS.test(className) && className !== "dc") {
      paths.push({ code: className.toUpperCase(), d });
    }
  }
  const circle = doc.querySelector("circle.dc");
  const dcCircle = circle
    ? {
        cx: circle.getAttribute("cx") ?? "801.6",
        cy: circle.getAttribute("cy") ?? "252.1",
        r: circle.getAttribute("r") ?? "5",
      }
    : null;
  return { paths, dcCircle, separators };
}

export function UsMap({ trip, selectedCode, onMissing, onOpen }: Props) {
  const parsed = useMemo(() => parseMap(mapSvg), []);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [showNortheast, setShowNortheast] = useState(false);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ distance: number; k: number } | null>(null);

  const dcEnabled = trip.packIds.includes("dc");
  const usEnabled = trip.packIds.includes("us");

  function activate(code: string) {
    if (code === "DC" && !dcEnabled) {
      return;
    }
    if (code !== "DC" && !usEnabled) {
      return;
    }
    if (trip.finished || isSpotted(trip, code)) {
      onOpen(code);
      return;
    }
    onMissing(code);
  }

  useEffect(() => {
    const node = wrapRef.current;
    if (!node) {
      return;
    }
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const factor = event.deltaY < 0 ? 1.08 : 0.92;
      setTransform((prev) => ({
        ...prev,
        k: Math.min(8, Math.max(1, prev.k * factor)),
      }));
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, []);

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    wrapRef.current?.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values());
      pinch.current = {
        distance: Math.hypot(a.x - b.x, a.y - b.y),
        k: transform.k,
      };
    }
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId)) {
      return;
    }
    const prevPoint = pointers.current.get(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = Array.from(pointers.current.values());
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const nextK = Math.min(
        8,
        Math.max(1, (pinch.current.k * distance) / pinch.current.distance),
      );
      setTransform((prev) => ({ ...prev, k: nextK }));
      return;
    }
    if (pointers.current.size === 1 && prevPoint && transform.k > 1) {
      setTransform((prev) => ({
        ...prev,
        x: prev.x + (event.clientX - prevPoint.x),
        y: prev.y + (event.clientY - prevPoint.y),
      }));
    }
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) {
      pinch.current = null;
    }
  }

  const northeastItems = NORTHEAST_CODES.filter((code) => {
    if (code === "DC") {
      return dcEnabled;
    }
    return usEnabled;
  });

  return (
    <div className="stack">
      <div
        className="map-wrap"
        ref={wrapRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <svg
          className="map-svg"
          viewBox="0 0 959 593"
          role="group"
          aria-label="United States map"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`,
            transformOrigin: "center center",
          }}
        >
          {parsed.separators.map((d) => (
            <path
              key={d.slice(0, 24)}
              d={d}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          ))}
          {parsed.paths.map((path) => {
            const inert = path.code === "DC" ? !dcEnabled : !usEnabled;
            const spotted = isSpotted(trip, path.code);
            const label = JURISDICTION_BY_CODE[path.code]?.name ?? path.code;
            const className = [
              "state",
              spotted ? "spotted" : "",
              inert ? "inert" : "",
              selectedCode === path.code ? "selected" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <g key={path.code}>
                <path
                  className={className}
                  d={path.d}
                  tabIndex={inert ? -1 : 0}
                  role="button"
                  aria-label={
                    inert
                      ? `${label}, not in this trip`
                      : spotted
                        ? `${label}, tagged`
                        : `${label}, UnTagged`
                  }
                  aria-disabled={inert}
                  onClick={() => activate(path.code)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      activate(path.code);
                    }
                  }}
                />
                {spotted && path.code !== "DC" ? (
                  <circle
                    className="map-marker"
                    cx={centroidX(path.d)}
                    cy={centroidY(path.d)}
                    r="3"
                    aria-hidden="true"
                  />
                ) : null}
              </g>
            );
          })}
          {parsed.dcCircle ? (
            <circle
              className={[
                "state",
                isSpotted(trip, "DC") ? "spotted" : "",
                dcEnabled ? "" : "inert",
                selectedCode === "DC" ? "selected" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              cx={parsed.dcCircle.cx}
              cy={parsed.dcCircle.cy}
              r="8"
              tabIndex={dcEnabled ? 0 : -1}
              role="button"
              aria-label={
                dcEnabled
                  ? isSpotted(trip, "DC")
                    ? "Washington, D.C., tagged"
                    : "Washington, D.C., UnTagged"
                  : "Washington, D.C., not in this trip"
              }
              aria-disabled={!dcEnabled}
              onClick={() => activate("DC")}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  activate("DC");
                }
              }}
            />
          ) : null}
        </svg>
        <button
          type="button"
          className="button ne-callout"
          onClick={() => setShowNortheast((value) => !value)}
        >
          Northeast
        </button>
      </div>
      <div className="row">
        <button
          type="button"
          className="button"
          onClick={() => setTransform({ x: 0, y: 0, k: 1 })}
        >
          Reset zoom
        </button>
        <p className="muted">Pinch or scroll to zoom. Alaska and Hawaii are inset.</p>
      </div>
      {showNortheast ? (
        <div className="card">
          <h3 className="screen-title">Northeast</h3>
          <div className="j-list" style={{ marginTop: 8 }}>
            {northeastItems.map((code) => {
              const item = JURISDICTION_BY_CODE[code];
              if (!item) {
                return null;
              }
              const spotted = isSpotted(trip, code);
              return (
                <button
                  key={code}
                  type="button"
                  className={`j-item ${spotted ? "spotted" : ""}`}
                  onClick={() => activate(code)}
                >
                  <span>
                    <strong>{item.name}</strong>
                    <span className="abbr"> {item.abbreviation}</span>
                  </span>
                  <span className="check" aria-hidden="true">
                    {spotted ? "✓" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function centroidX(d: string): number {
  const nums = numbers(d);
  if (nums.length < 2) {
    return 0;
  }
  let sum = 0;
  let count = 0;
  for (let i = 0; i < nums.length; i += 2) {
    sum += nums[i];
    count += 1;
  }
  return sum / count;
}

function centroidY(d: string): number {
  const nums = numbers(d);
  if (nums.length < 2) {
    return 0;
  }
  let sum = 0;
  let count = 0;
  for (let i = 1; i < nums.length; i += 2) {
    sum += nums[i];
    count += 1;
  }
  return sum / count;
}

function numbers(d: string): number[] {
  return (d.match(/-?\d*\.?\d+/g) ?? []).map(Number);
}
