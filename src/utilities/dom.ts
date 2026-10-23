/** Resolve the document or shadow root that contains a Stencil host. */
export function getRootNode(host: HTMLElement): Document | ShadowRoot {
  const root = host.getRootNode();
  if (root instanceof Document || root instanceof ShadowRoot) {
    return root;
  }
  return host.ownerDocument;
}
