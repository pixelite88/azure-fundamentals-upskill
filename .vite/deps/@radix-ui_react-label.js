"use client";
import {
  createSlot,
  require_jsx_runtime
} from "./chunk-JIOFC7B5.js";
import {
  require_react_dom
} from "./chunk-GBXUV52E.js";
import {
  require_react
} from "./chunk-5ZAQIUQL.js";
import {
  __toESM
} from "./chunk-5WRI5ZAA.js";

// frontend/node_modules/@radix-ui/react-label/dist/index.mjs
var React2 = __toESM(require_react(), 1);

// frontend/node_modules/@radix-ui/react-primitive/dist/index.mjs
var React = __toESM(require_react(), 1);
var ReactDOM = __toESM(require_react_dom(), 1);
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
var NODES = [
  "a",
  "button",
  "div",
  "form",
  "h2",
  "h3",
  "img",
  "input",
  "label",
  "li",
  "nav",
  "ol",
  "p",
  "select",
  "span",
  "svg",
  "ul"
];
var Primitive = NODES.reduce((primitive, node) => {
  const Slot = createSlot(`Primitive.${node}`);
  const Node = React.forwardRef((props, forwardedRef) => {
    const { asChild, ...primitiveProps } = props;
    const Comp = asChild ? Slot : node;
    if (typeof window !== "undefined") {
      window[Symbol.for("radix-ui")] = true;
    }
    return (0, import_jsx_runtime.jsx)(Comp, { ...primitiveProps, ref: forwardedRef });
  });
  Node.displayName = `Primitive.${node}`;
  return { ...primitive, [node]: Node };
}, {});

// frontend/node_modules/@radix-ui/react-label/dist/index.mjs
var import_jsx_runtime2 = __toESM(require_jsx_runtime(), 1);
var NAME = "Label";
var Label = React2.forwardRef((props, forwardedRef) => {
  return (0, import_jsx_runtime2.jsx)(
    Primitive.label,
    {
      ...props,
      ref: forwardedRef,
      onMouseDown: (event) => {
        var _a;
        const target = event.target;
        if (target.closest("button, input, select, textarea")) return;
        (_a = props.onMouseDown) == null ? void 0 : _a.call(props, event);
        if (!event.defaultPrevented && event.detail > 1) event.preventDefault();
      }
    }
  );
});
Label.displayName = NAME;
var Root = Label;
export {
  Label,
  Root
};
//# sourceMappingURL=@radix-ui_react-label.js.map
