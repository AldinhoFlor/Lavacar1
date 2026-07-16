"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";

export function Counter({
  value,
  format,
}: {
  value: number;
  format?: (n: number) => string;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(value);

  useEffect(() => {
    const controls = animate(ref.current, value, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    ref.current = value;
    return () => controls.stop();
  }, [value]);

  return <>{format ? format(display) : Math.round(display).toLocaleString("pt-BR")}</>;
}
