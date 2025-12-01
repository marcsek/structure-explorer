export const prepareWithSourceMeta = <P>(
  payload: P,
  meta: { source?: string } = {},
) => ({
  payload,
  meta,
});
