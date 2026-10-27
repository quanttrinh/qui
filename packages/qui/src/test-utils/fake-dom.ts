/**
 * Test-only DOM fakes for the SSR and stylesheet helpers.
 *
 * These utilities model the small subset of `Document`, `ShadowRoot`, and
 * `Element` behaviour those helpers rely on. They perform no DOM access at
 * module load, so they are safe to import in the Node unit test environment.
 */

/** A minimal fake DOM node with children, attributes, and an optional shadow root. */
export class FakeNode {
  readonly tagName: string;
  readonly children: FakeNode[] = [];
  shadowRoot?: FakeNode;
  parent?: FakeNode;
  ownerDocument?: FakeDocument;
  private readonly attributes = new Map<string, string>();

  constructor(tagName: string) {
    this.tagName = tagName.toUpperCase();
  }

  public get firstChild(): FakeNode | undefined {
    return this.children[0];
  }

  public get nextSibling(): FakeNode | undefined {
    const { parent } = this;
    if (!parent) {
      return undefined;
    }

    return parent.children[parent.children.indexOf(this) + 1];
  }

  public append(...nodes: FakeNode[]): void {
    for (const node of nodes) {
      node.parent = this;
      this.children.push(node);
    }
  }

  public insertBefore(node: FakeNode, reference: FakeNode): void {
    const index = this.children.indexOf(reference);
    if (index === -1) {
      this.append(node);
      return;
    }
    this.children.splice(index, 0, node);
    node.parent = this;
  }

  public remove(): void {
    const { parent } = this;
    if (!parent) {
      return;
    }

    const index = parent.children.indexOf(this);
    if (index !== -1) {
      parent.children.splice(index, 1);
    }
    this.parent = undefined;
  }

  public querySelectorAll(selector: string): FakeNode[] {
    const matches: FakeNode[] = [];
    const bracket = selector.indexOf("[");
    const hasAttribute = bracket !== -1 && selector.endsWith("]");
    const tag = hasAttribute ? selector.slice(0, bracket) || undefined : undefined;
    const attribute = hasAttribute ? selector.slice(bracket + 1, -1) : undefined;
    const tagSelector = hasAttribute ? tag : selector;
    const wildcard = selector === "*" || (hasAttribute && tag === undefined);

    const visit = (nodes: FakeNode[]): void => {
      for (const node of nodes) {
        const matchesTag = wildcard || node.tagName.toLowerCase() === tagSelector;
        const matchesAttribute = attribute === undefined || node.hasAttribute(attribute);
        if (matchesTag && matchesAttribute) {
          matches.push(node);
        }
        visit(node.children);
      }
    };

    visit(this.children);
    return matches;
  }

  public querySelector(selector: string): FakeNode | null {
    // oxlint-disable-next-line unicorn/no-null -- Match the DOM querySelector contract.
    return this.querySelectorAll(selector)[0] ?? null;
  }

  public setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }

  public removeAttribute(name: string): void {
    this.attributes.delete(name);
  }

  public getAttribute(name: string): string | undefined {
    return this.attributes.get(name);
  }

  public hasAttribute(name: string): boolean {
    return this.attributes.has(name);
  }

  public attachShadow(): FakeNode {
    const root = new FakeNode("#shadow-root");
    root.ownerDocument = this.ownerDocument;
    this.shadowRoot = root;
    return root;
  }
}

/** A fake document that can create child nodes owned by itself. */
export type FakeDocument = FakeNode & {
  createElement: (tagName: string) => FakeNode;
};

/** Creates a fake document whose `createElement` records the owner document. */
export function createFakeDocument(): FakeDocument {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- FakeNode gains createElement below.
  const doc = new FakeNode("#document") as unknown as FakeDocument;
  doc.createElement = (tagName: string): FakeNode => {
    const element = new FakeNode(tagName);
    element.ownerDocument = doc;
    return element;
  };
  return doc;
}

/** Appends a fake host with an attached open shadow root to `doc`. */
export function createHost(
  doc: FakeDocument,
  tagName = "qui-card",
): { host: FakeNode; root: FakeNode } {
  const host = doc.createElement(tagName);
  const root = host.attachShadow();
  doc.append(host);
  return { host, root };
}

/** Returns the hrefs of the direct `link` children of `root`. */
export function linkHrefs(root: FakeNode): (string | undefined)[] {
  return root.children
    .filter((child) => child.tagName === "LINK")
    .map((child) => child.getAttribute("href"));
}
