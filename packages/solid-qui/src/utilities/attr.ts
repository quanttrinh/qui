function dataAttr(value: boolean | undefined): "" | undefined {
  return value ? "" : undefined;
}

function ariaAttr(value: boolean | undefined): "true" | undefined {
  return value ? "true" : undefined;
}

export { dataAttr, ariaAttr };
