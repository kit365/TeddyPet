import {
  appendOwnerState_default,
  mergeSlotProps_default,
  resolveComponentProps_default
} from "./chunk-4VRNXOYL.js";
import {
  useForkRef
} from "./chunk-ULULFR2E.js";

// node_modules/@mui/utils/esm/useSlotProps/useSlotProps.js
function useSlotProps(parameters) {
  const {
    elementType,
    externalSlotProps,
    ownerState,
    skipResolvingSlotProps = false,
    ...other
  } = parameters;
  const resolvedComponentsProps = skipResolvingSlotProps ? {} : resolveComponentProps_default(externalSlotProps, ownerState);
  const {
    props: mergedProps,
    internalRef
  } = mergeSlotProps_default({
    ...other,
    externalSlotProps: resolvedComponentsProps
  });
  const ref = useForkRef(internalRef, resolvedComponentsProps?.ref, parameters.additionalProps?.ref);
  const props = appendOwnerState_default(elementType, {
    ...mergedProps,
    ref
  }, ownerState);
  return props;
}
var useSlotProps_default = useSlotProps;

export {
  useSlotProps_default
};
//# sourceMappingURL=chunk-ORSSQEHF.js.map
