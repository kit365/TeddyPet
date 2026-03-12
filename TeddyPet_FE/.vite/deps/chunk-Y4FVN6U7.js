import {
  require_react
} from "./chunk-LTZIYYLR.js";
import {
  __toESM
} from "./chunk-V4OQ3NZ2.js";

// node_modules/@mui/material/esm/useScrollTrigger/useScrollTrigger.js
var React = __toESM(require_react(), 1);
function defaultTrigger(store, options) {
  const {
    disableHysteresis = false,
    threshold = 100,
    target
  } = options;
  const previous = store.current;
  if (target) {
    store.current = target.pageYOffset !== void 0 ? target.pageYOffset : target.scrollTop;
  }
  if (!disableHysteresis && previous !== void 0) {
    if (store.current < previous) {
      return false;
    }
  }
  return store.current > threshold;
}
var defaultTarget = typeof window !== "undefined" ? window : null;
function useScrollTrigger(options = {}) {
  const {
    getTrigger = defaultTrigger,
    target = defaultTarget,
    ...other
  } = options;
  const store = React.useRef();
  const [trigger, setTrigger] = React.useState(() => getTrigger(store, other));
  React.useEffect(() => {
    if (target === null) {
      return setTrigger(false);
    }
    const handleScroll = () => {
      setTrigger(getTrigger(store, {
        target,
        ...other
      }));
    };
    handleScroll();
    target.addEventListener("scroll", handleScroll, {
      passive: true
    });
    return () => {
      target.removeEventListener("scroll", handleScroll, {
        passive: true
      });
    };
  }, [target, getTrigger, JSON.stringify(other)]);
  return trigger;
}

export {
  useScrollTrigger
};
//# sourceMappingURL=chunk-Y4FVN6U7.js.map
