"use client";
import { useState, useCallback, useEffect } from "react";
import { Delete } from "lucide-react";

const ACCENT = "#C8A97E";

export default function CalculatorApp() {
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [prevResult, setPrevResult] = useState<number | null>(null);
  const [newInput, setNewInput] = useState(true);

  const inputDigit = useCallback(
    (d: string) => {
      if (newInput) {
        setDisplay(d === "." ? "0." : d);
        setNewInput(false);
      } else {
        if (d === "." && display.includes(".")) return;
        setDisplay((v) => (v === "0" && d !== "." ? d : v + d));
      }
    },
    [display, newInput]
  );

  const clear = useCallback(() => {
    setDisplay("0");
    setExpression("");
    setPrevResult(null);
    setNewInput(true);
  }, []);

  const backspace = useCallback(() => {
    if (newInput) return;
    setDisplay((v) => (v.length <= 1 ? "0" : v.slice(0, -1)));
  }, [newInput]);

  const toggleSign = useCallback(() => {
    setDisplay((v) => (v.startsWith("-") ? v.slice(1) : v === "0" ? v : "-" + v));
  }, []);

  const percent = useCallback(() => {
    const n = parseFloat(display);
    if (!isNaN(n)) {
      setDisplay(String(n / 100));
      setNewInput(true);
    }
  }, [display]);

  const sqrt = useCallback(() => {
    const n = parseFloat(display);
    if (!isNaN(n) && n >= 0) {
      const result = Math.sqrt(n);
      setExpression(`sqrt(${display})`);
      setDisplay(String(result));
      setPrevResult(result);
      setNewInput(true);
    }
  }, [display]);

  const operate = useCallback(
    (op: string) => {
      const current = parseFloat(display);
      if (isNaN(current)) return;

      if (prevResult !== null && !newInput) {
        // Chain: evaluate previous
        const prev = prevResult;
        const opChar = expression.slice(-1);
        let result = prev;
        if (opChar === "+") result = prev + current;
        else if (opChar === "-") result = prev - current;
        else if (opChar === "x") result = prev * current;
        else if (opChar === "/") result = current !== 0 ? prev / current : NaN;
        setExpression(`${result} ${op}`);
        setDisplay(String(result));
        setPrevResult(result);
      } else {
        setExpression(`${current} ${op}`);
        setPrevResult(current);
      }
      setNewInput(true);
    },
    [display, expression, prevResult, newInput]
  );

  const equals = useCallback(() => {
    if (prevResult === null) return;
    const current = parseFloat(display);
    if (isNaN(current)) return;
    const opChar = expression.slice(-1);
    let result = prevResult;
    if (opChar === "+") result = prevResult + current;
    else if (opChar === "-") result = prevResult - current;
    else if (opChar === "x") result = prevResult * current;
    else if (opChar === "/") result = current !== 0 ? prevResult / current : NaN;

    setExpression(`${expression} ${display} =`);
    setDisplay(isNaN(result) ? "Error" : String(result));
    setPrevResult(null);
    setNewInput(true);
  }, [display, expression, prevResult]);

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") inputDigit(e.key);
      else if (e.key === ".") inputDigit(".");
      else if (e.key === "+") operate("+");
      else if (e.key === "-") operate("-");
      else if (e.key === "*") operate("x");
      else if (e.key === "/") { e.preventDefault(); operate("/"); }
      else if (e.key === "Enter" || e.key === "=") equals();
      else if (e.key === "Backspace") backspace();
      else if (e.key === "Escape") clear();
      else if (e.key === "%") percent();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [inputDigit, operate, equals, backspace, clear, percent]);

  const Btn = ({
    label,
    onClick,
    span = 1,
    variant = "number",
    children,
  }: {
    label?: string;
    onClick: () => void;
    span?: number;
    variant?: "number" | "operator" | "function";
    children?: React.ReactNode;
  }) => {
    const bg =
      variant === "operator"
        ? "rgba(200,169,126,0.2)"
        : variant === "function"
        ? "rgba(255,255,255,0.06)"
        : "rgba(255,255,255,0.04)";
    const hoverBg =
      variant === "operator"
        ? "rgba(200,169,126,0.35)"
        : "rgba(255,255,255,0.1)";
    const color =
      variant === "operator" ? ACCENT : "rgba(255,255,255,0.85)";

    return (
      <button
        onClick={onClick}
        className="rounded-xl text-[15px] font-medium transition-all active:scale-95 flex items-center justify-center"
        style={{
          gridColumn: span > 1 ? `span ${span}` : undefined,
          background: bg,
          color,
          height: 52,
          border: "1px solid rgba(255,255,255,0.04)",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
        onMouseLeave={(e) => (e.currentTarget.style.background = bg)}
      >
        {children ?? label}
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "#0A0A0C" }}>
      {/* Display */}
      <div className="flex-shrink-0 px-5 pt-4 pb-2">
        <div
          className="text-[10px] font-mono text-right h-4 truncate"
          style={{ color: "rgba(200,169,126,0.4)" }}
        >
          {expression}
        </div>
        <div
          className="text-right font-light truncate mt-1"
          style={{
            color: "rgba(255,255,255,0.9)",
            fontSize: display.length > 12 ? 24 : display.length > 8 ? 32 : 40,
            lineHeight: 1.2,
          }}
        >
          {display}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex-1 grid grid-cols-4 gap-2 p-4 pt-3">
        <Btn label="C" onClick={clear} variant="function" />
        <Btn label="+-" onClick={toggleSign} variant="function" />
        <Btn label="%" onClick={percent} variant="function" />
        <Btn label="/" onClick={() => operate("/")} variant="operator" />

        <Btn label="7" onClick={() => inputDigit("7")} />
        <Btn label="8" onClick={() => inputDigit("8")} />
        <Btn label="9" onClick={() => inputDigit("9")} />
        <Btn label="x" onClick={() => operate("x")} variant="operator" />

        <Btn label="4" onClick={() => inputDigit("4")} />
        <Btn label="5" onClick={() => inputDigit("5")} />
        <Btn label="6" onClick={() => inputDigit("6")} />
        <Btn label="-" onClick={() => operate("-")} variant="operator" />

        <Btn label="1" onClick={() => inputDigit("1")} />
        <Btn label="2" onClick={() => inputDigit("2")} />
        <Btn label="3" onClick={() => inputDigit("3")} />
        <Btn label="+" onClick={() => operate("+")} variant="operator" />

        <Btn label="sqrt" onClick={sqrt} variant="function" />
        <Btn label="0" onClick={() => inputDigit("0")} />
        <Btn label="." onClick={() => inputDigit(".")} />
        <Btn label="=" onClick={equals} variant="operator" />

        <Btn onClick={backspace} variant="function">
          <Delete size={16} />
        </Btn>
      </div>
    </div>
  );
}
