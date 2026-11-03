import "@quanttrinh/qui/types/solid";

export const button = <qui-button prop:variant="filled" prop:size="sm" />;

export const checkbox = (
  <qui-checkbox prop:checked on:checkedchange={(event) => event.detail.checked} />
);
