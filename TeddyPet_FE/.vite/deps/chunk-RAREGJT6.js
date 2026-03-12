import {
  require_prop_types
} from "./chunk-RZNGLFYQ.js";
import {
  require_react
} from "./chunk-LTZIYYLR.js";
import {
  __toESM
} from "./chunk-V4OQ3NZ2.js";

// node_modules/@mui/utils/esm/useOnMount/useOnMount.js
var React = __toESM(require_react(), 1);
var EMPTY = [];
function useOnMount(fn) {
  React.useEffect(fn, EMPTY);
}

// node_modules/@mui/utils/esm/refType/refType.js
var import_prop_types = __toESM(require_prop_types(), 1);
var refType = import_prop_types.default.oneOfType([import_prop_types.default.func, import_prop_types.default.object]);
var refType_default = refType;

// node_modules/@mui/utils/esm/useLazyRef/useLazyRef.js
var React2 = __toESM(require_react(), 1);
var UNINITIALIZED = {};
function useLazyRef(init, initArg) {
  const ref = React2.useRef(UNINITIALIZED);
  if (ref.current === UNINITIALIZED) {
    ref.current = init(initArg);
  }
  return ref;
}

// node_modules/@mui/utils/esm/useTimeout/useTimeout.js
var Timeout = class _Timeout {
  static create() {
    return new _Timeout();
  }
  currentId = null;
  /**
   * Executes `fn` after `delay`, clearing any previously scheduled call.
   */
  start(delay, fn) {
    this.clear();
    this.currentId = setTimeout(() => {
      this.currentId = null;
      fn();
    }, delay);
  }
  clear = () => {
    if (this.currentId !== null) {
      clearTimeout(this.currentId);
      this.currentId = null;
    }
  };
  disposeEffect = () => {
    return this.clear;
  };
};
function useTimeout() {
  const timeout = useLazyRef(Timeout.create).current;
  useOnMount(timeout.disposeEffect);
  return timeout;
}

export {
  refType_default,
  useLazyRef,
  useOnMount,
  Timeout,
  useTimeout
};
//# sourceMappingURL=chunk-RAREGJT6.js.map
