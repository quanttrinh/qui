import Add from "@iconify-solid/material-symbols/add";
import ArrowDropDown from "@iconify-solid/material-symbols/arrow-drop-down";
import CheckBox from "@iconify-solid/material-symbols/check-box";
import Dashboard from "@iconify-solid/material-symbols/dashboard";
import Edit from "@iconify-solid/material-symbols/edit";
import ExpandMore from "@iconify-solid/material-symbols/expand-more";
import OpenInNew from "@iconify-solid/material-symbols/open-in-new";
import Palette from "@iconify-solid/material-symbols/palette";
import Pin from "@iconify-solid/material-symbols/pin";
import RadioButtonChecked from "@iconify-solid/material-symbols/radio-button-checked";
import Search from "@iconify-solid/material-symbols/search";
import SmartButton from "@iconify-solid/material-symbols/smart-button";
import TextFields from "@iconify-solid/material-symbols/text-fields";
import ToggleOn from "@iconify-solid/material-symbols/toggle-on";
import ViewList from "@iconify-solid/material-symbols/view-list";
import Tab from "@iconify-solid/material-symbols/tab";

import {
  Accordion,
  Button,
  Card,
  Checkbox,
  Combobox,
  Dialog,
  Field,
  Input,
  RadioGroup,
  Select,
  Switch,
  Tabs,
  VirtualList,
  collection,
  createVirtualList,
  useFieldContext,
  useTheme,
  type SchemeVariant,
} from "@quanttrinh/solid-qui";
import { type JSX, For, createMemo, createSignal, onCleanup, onMount } from "solid-js";

import { css } from "../styled-system/css";

interface Fruit {
  value: string;
  name: string;
  note?: string;
  disabled?: boolean;
}

interface NavItem {
  id: string;
  label: string;
  icon: () => JSX.Element;
}

const fruits: Fruit[] = [
  { value: "apple", name: "Apple", note: "Crisp" },
  { value: "orange", name: "Orange", note: "Citrus" },
  { value: "mango", name: "Mango", note: "" },
  { value: "grape", name: "Grape", note: "", disabled: true },
];

const countries = Array.from({ length: 300 }, (_, index) => ({
  value: `country-${index}`,
  label: `Country ${String(index + 1).padStart(3, "0")}`,
}));

const plans = ["Starter", "Pro", "Enterprise"] as const;

const variants: SchemeVariant[] = [
  "tonalSpot",
  "vibrant",
  "expressive",
  "neutral",
  "fidelity",
  "content",
  "monochrome",
  "rainbow",
  "fruitSalad",
];

const navItems: NavItem[] = [
  { id: "theme", label: "Color Palette", icon: () => <Palette /> },
  { id: "button", label: "Buttons", icon: () => <SmartButton /> },
  { id: "card", label: "Cards & Blocks", icon: () => <Dashboard /> },
  { id: "accordion", label: "Accordion", icon: () => <ExpandMore /> },
  { id: "text-field", label: "Text Field", icon: () => <TextFields /> },
  { id: "number-input", label: "Number Input", icon: () => <Pin /> },
  { id: "select", label: "Select", icon: () => <ArrowDropDown /> },
  { id: "combobox", label: "Combobox", icon: () => <Search /> },
  { id: "switch", label: "Switch", icon: () => <ToggleOn /> },
  { id: "radio-group", label: "Radio Group", icon: () => <RadioButtonChecked /> },
  { id: "tabs", label: "Tabs", icon: () => <Tab /> },
  { id: "checkbox", label: "Checkbox", icon: () => <CheckBox /> },
  { id: "field", label: "Field (composable)", icon: () => <Edit /> },
  { id: "virtual-list", label: "Virtual List", icon: () => <ViewList /> },
  { id: "dialog", label: "Dialog", icon: () => <OpenInNew /> },
];

const styles = {
  shell: css({
    display: "flex",
    height: "100dvh",
    overflow: "hidden",
    backgroundColor: "surface",
    color: "onSurface",
  }),
  sidebar: css({
    display: { base: "none", md: "flex" },
    flexDirection: "column",
    flexShrink: 0,
    width: "60",
    height: "full",
    overflowY: "auto",
    borderInlineEndWidth: "1px",
    borderInlineEndColor: "outlineVariant",
    backgroundColor: "surface",
  }),
  brand: css({
    paddingX: "3",
    paddingY: "5",
    fontSize: "lg",
    fontWeight: "medium",
    color: "onSurface",
  }),
  nav: css({
    display: "flex",
    flexDirection: "column",
    gap: "1",
    paddingX: "3",
    paddingBottom: "4",
  }),
  navItem: css({
    display: "flex",
    alignItems: "center",
    gap: "3",
    paddingX: "3",
    paddingY: "2.5",
    rounded: "full",
    fontSize: "sm",
    fontWeight: "medium",
    color: "onSurfaceVariant",
    textDecoration: "none",
    whiteSpace: "nowrap",
    transition: "background-color 150ms, color 150ms",
    _hover: { backgroundColor: "surfaceContainerHigh", color: "onSurface" },
    "&[data-active]": { backgroundColor: "secondaryContainer", color: "onSecondaryContainer" },
  }),
  navIcon: css({ display: "flex", flexShrink: 0, "& svg": { width: "5", height: "5" } }),
  main: css({
    display: "flex",
    flexDirection: "column",
    flex: "1",
    minWidth: "0",
    height: "full",
  }),
  appBar: css({
    display: "flex",
    alignItems: "center",
    gap: "3",
    height: "16",
    flexShrink: 0,
    paddingX: "6",
    backgroundColor: "surface",
    borderBottomWidth: "1px",
    borderBottomColor: "outlineVariant",
  }),
  appBarTitle: css({ fontSize: "md", fontWeight: "medium", color: "onSurface" }),
  appBarHint: css({ fontSize: "sm", color: "onSurfaceVariant" }),
  content: css({
    flex: "1",
    minHeight: "0",
    overflowY: "auto",
    padding: "6",
    paddingBottom: "16",
  }),
  section: css({ marginBottom: "12", scrollMarginTop: "20" }),
  sectionTitle: css({ fontSize: "2xl", fontWeight: "regular", color: "onSurface" }),
  sectionBody: css({
    display: "flex",
    flexDirection: "column",
    gap: "4",
    marginTop: "4",
  }),
  themeControls: css({
    display: "flex",
    flexWrap: "wrap",
    alignItems: "flex-end",
    gap: "3",
  }),
  swatchRow: css({ display: "flex", gap: "1" }),
  swatch: css({
    width: "8",
    height: "8",
    rounded: "sm",
    borderWidth: "1px",
    borderColor: "outlineVariant",
  }),
  buttonRow: css({
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "3",
  }),
  cardGrid: css({
    display: "grid",
    gap: "4",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  }),
  planRow: css({ display: "flex", gap: "1" }),
  planOption: css({
    height: "9",
    paddingX: "3",
    fontSize: "sm",
    color: "onSurfaceVariant",
    backgroundColor: "surface",
    borderWidth: "1px",
    borderColor: "outlineVariant",
    rounded: "sm",
    cursor: "pointer",
    transition: "border-color 150ms, background-color 150ms",
    _hover: { borderColor: "outline" },
    _checked: {
      borderColor: "primary",
      color: "onPrimaryContainer",
      backgroundColor: "primaryContainer",
    },
    _disabled: { opacity: 0.38, cursor: "not-allowed" },
  }),
  virtualScroll: css({
    maxHeight: "60",
    overflowY: "auto",
    borderWidth: "1px",
    borderColor: "outlineVariant",
    rounded: "sm",
  }),
};

/** A titled, anchorable demo section — mirrors the original demo's `Section`. */
function Section(props: { id: string; title: string; children: JSX.Element }): JSX.Element {
  return (
    <section id={props.id} class={styles.section}>
      <h2 class={styles.sectionTitle}>{props.title}</h2>
      <div class={styles.sectionBody}>{props.children}</div>
    </section>
  );
}

/**
 * A custom control that opts into the surrounding `Field` via the exported
 * `useFieldContext` hook — it inherits the field's id, label association and state.
 */
function PlanPicker(): JSX.Element {
  const field = useFieldContext();
  const [plan, setPlan] = createSignal<string>("Starter");

  return (
    <div {...(field?.getInputProps() ?? {})} role="radiogroup" aria-label="Plan" class={styles.planRow}>
      <For each={plans}>
        {(option) => (
          <button
            type="button"
            role="radio"
            aria-checked={plan() === option}
            disabled={field?.disabled()}
            class={styles.planOption}
            onClick={() => setPlan(option)}
          >
            {option}
          </button>
        )}
      </For>
    </div>
  );
}

/** A standalone virtualized list built on the exported `createVirtualList` + `VirtualList`. */
function CountryList(): JSX.Element {
  const controller = createVirtualList(() => countries.length, { estimateSize: 36 });

  return (
    <div ref={controller.setScrollElement} class={styles.virtualScroll}>
      <VirtualList
        controller={controller}
        getItem={(index) => countries[index]}
        getItemProps={() => ({})}
        render={(item) => <span>{item.label}</span>}
      />
    </div>
  );
}

export default function App(): JSX.Element {
  const { theme, setTheme, colors } = useTheme();
  const [email, setEmail] = createSignal("");
  const [phone, setPhone] = createSignal("");
  const [taxId, setTaxId] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [quantity, setQuantity] = createSignal(0);
  const [fruit, setFruit] = createSignal("");
  const [invalid, setInvalid] = createSignal(false);
  const [country, setCountry] = createSignal("");
  const [comboboxCountry, setComboboxCountry] = createSignal("");
  const [comboboxQuery, setComboboxQuery] = createSignal("");
  const [tab, setTab] = createSignal("account");
  const [active, setActive] = createSignal("theme");

  const countriesCollection = createMemo(() => collection({ items: countries }));
  const filteredCountries = createMemo(() => {
    const query = comboboxQuery().trim().toLowerCase();
    if (!query) {
      return countriesCollection();
    }
    return countriesCollection().filter((itemString) =>
      itemString.toLowerCase().includes(query),
    );
  });

  // Highlight the nav entry for whichever section is currently in view.
  onMount(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) {
          setActive(visible.target.id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 },
    );
    for (const item of navItems) {
      const element = document.getElementById(item.id);
      if (element) {
        observer.observe(element);
      }
    }
    onCleanup(() => observer.disconnect());
  });

  return (
    <div class={styles.shell}>
      <aside class={styles.sidebar}>
        <div class={styles.brand}>solid-qui</div>
        <nav class={styles.nav}>
          <For each={navItems}>
            {(item) => (
              <a
                href={`#${item.id}`}
                class={styles.navItem}
                data-active={active() === item.id ? "" : undefined}
                onClick={() => setActive(item.id)}
              >
                <span class={styles.navIcon}>{item.icon()}</span>
                <span>{item.label}</span>
              </a>
            )}
          </For>
        </nav>
      </aside>

      <div class={styles.main}>
        <header class={styles.appBar}>
          <span class={styles.appBarTitle}>solid-qui Demo</span>
          <span class={styles.appBarHint}>Material Design 3 for SolidJS</span>
        </header>

        <main class={styles.content}>
          <Section id="theme" title="Color Palette">
            <p>
              Every color is derived at runtime from a seed by{" "}
              <code>@material/material-color-utilities</code>.
            </p>
            <div class={styles.themeControls}>
              <label>
                Seed
                <input
                  type="color"
                  value={theme().source}
                  onInput={(event) => setTheme({ source: event.currentTarget.value })}
                />
              </label>
              <label>
                Variant
                <select
                  value={theme().variant}
                  onChange={(event) =>
                    setTheme({ variant: event.currentTarget.value as SchemeVariant })
                  }
                >
                  <For each={variants}>
                    {(variant) => <option value={variant}>{variant}</option>}
                  </For>
                </select>
              </label>
              <label>
                Contrast {theme().contrast.toFixed(1)}
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step="0.1"
                  value={theme().contrast}
                  onInput={(event) => setTheme({ contrast: Number(event.currentTarget.value) })}
                />
              </label>
              <Switch
                checked={theme().dark}
                onCheckedChange={(details) => setTheme({ dark: details.checked })}
              >
                Dark scheme
              </Switch>
            </div>
            <div class={styles.swatchRow}>
              <For
                each={
                  [
                    "primary",
                    "primaryContainer",
                    "secondary",
                    "tertiary",
                    "error",
                    "surface",
                    "surfaceContainerHighest",
                    "outline",
                  ] as const
                }
              >
                {(role) => (
                  <div class={styles.swatch} style={{ "background-color": colors()[role] }} title={role} />
                )}
              </For>
            </div>
          </Section>

          <Section id="button" title="Buttons">
            <div class={styles.buttonRow}>
              <Button>Filled</Button>
              <Button variant="tonal">Tonal</Button>
              <Button variant="elevated">Elevated</Button>
              <Button variant="outlined">Outlined</Button>
              <Button variant="text">Text</Button>
            </div>
            <div class={styles.buttonRow}>
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
              <Button iconOnly aria-label="Add">
                <Add />
              </Button>
              <Button variant="tonal" iconOnly aria-label="Add">
                <Add />
              </Button>
              <Button variant="outlined" iconOnly aria-label="Add">
                <Add />
              </Button>
              <Button disabled>Disabled</Button>
            </div>
            <div class={styles.buttonRow}>
              <Button href="https://m3.material.io" target="_blank" rel="noreferrer">
                Link button
              </Button>
              <Button
                variant="outlined"
                href="https://m3.material.io"
                target="_blank"
                rel="noreferrer"
              >
                Outlined link
              </Button>
              <Button href="#button" disabled>
                Disabled link
              </Button>
            </div>
          </Section>

          <Section id="card" title="Cards & Blocks">
            <div class={styles.cardGrid}>
              <Card>
                <Card.Title>Elevated</Card.Title>
                <Card.Description>surfaceContainerLow with elevation.</Card.Description>
                <Card.Actions>
                  <Button variant="text">Dismiss</Button>
                  <Button>Open</Button>
                </Card.Actions>
              </Card>
              <Card variant="filled">
                <Card.Title>Filled</Card.Title>
                <Card.Description>surfaceContainerHighest, no border.</Card.Description>
              </Card>
              <Card variant="outlined">
                <Card.Title>Outlined</Card.Title>
                <Card.Description>surface with an outlineVariant border.</Card.Description>
              </Card>
            </div>
          </Section>

          <Section id="accordion" title="Accordion">
            <Accordion multiple defaultValue={["watercraft"]}>
              <Accordion.Item value="watercraft">
                <Accordion.ItemTrigger>Watercraft</Accordion.ItemTrigger>
                <Accordion.ItemContent>Boats and ships.</Accordion.ItemContent>
              </Accordion.Item>
              <Accordion.Item value="automobiles">
                <Accordion.ItemTrigger>Automobiles</Accordion.ItemTrigger>
                <Accordion.ItemContent>Cars and trucks.</Accordion.ItemContent>
              </Accordion.Item>
              <Accordion.Item value="aircraft">
                <Accordion.ItemTrigger>Aircraft</Accordion.ItemTrigger>
                <Accordion.ItemContent>Planes and helicopters.</Accordion.ItemContent>
              </Accordion.Item>
              <Accordion.Item value="disabled" disabled>
                <Accordion.ItemTrigger>Disabled item</Accordion.ItemTrigger>
                <Accordion.ItemContent>This item cannot be opened.</Accordion.ItemContent>
              </Accordion.Item>
            </Accordion>
          </Section>

          <Section id="text-field" title="Text Field">
            <Field required>
              <Field.Label>Email</Field.Label>
              <Input
                inputType="email"
                placeholder="you@example.com"
                value={email()}
                onInput={(event) => setEmail(event.currentTarget.value)}
              />
              <Field.HelperText>We never share your email.</Field.HelperText>
            </Field>

            <Field>
              <Field.Label>Phone</Field.Label>
              <Input
                prefix="+1"
                mask={{ pattern: "### ###-####" }}
                inputMode="numeric"
                placeholder="123 456-7890"
                onValueChange={(details) => setPhone(details.unmaskedValue)}
              />
              <Field.HelperText>Masked value: {phone() || "—"}.</Field.HelperText>
            </Field>

            <Field>
              <Field.Label>Tax ID (alphanumeric)</Field.Label>
              <Input
                mask={{ pattern: "aa-######-a" }}
                placeholder="AB-123456-C"
                onValueChange={(details) => setTaxId(details.value)}
              />
              <Field.HelperText>Letters and digits: {taxId() || "—"}.</Field.HelperText>
            </Field>

            <Field required invalid={invalid()}>
              <Field.Label>
                Password
                <Field.RequiredIndicator />
              </Field.Label>
              <Input
                inputType="password"
                placeholder="Enter a password"
                autocomplete="new-password"
                value={password()}
                onInput={(event) => setPassword(event.currentTarget.value)}
              />
              <Field.HelperText>Use at least 8 characters.</Field.HelperText>
              <Field.ErrorText>Password is required.</Field.ErrorText>
            </Field>

            <div class={styles.buttonRow}>
              <Button variant="text" onClick={() => setInvalid((value) => !value)}>
                Toggle invalid
              </Button>
              <span>Email: {email() || "—"}</span>
            </div>
          </Section>

          <Section id="number-input" title="Number Input">
            <Field invalid={invalid()}>
              <Field.Label>Quantity</Field.Label>
              <Input
                inputType="number"
                defaultValue={1}
                min={0}
                max={10}
                step={1}
                placeholder="0"
                onInput={(event) => setQuantity(Number(event.currentTarget.value))}
              />
              <Field.HelperText>Between 0 and 10.</Field.HelperText>
              <Field.ErrorText>Quantity is invalid.</Field.ErrorText>
            </Field>
            <p>Quantity: {quantity()}</p>
          </Section>

          <Section id="select" title="Select">
            <Field>
              <Field.Label>Country</Field.Label>
              <Select
                name="country"
                placeholder="Select a country"
                collection={countriesCollection()}
                onValueChange={(details) => setCountry(details.value[0] ?? "")}
              />
              <Field.HelperText>300 options, virtualized with TanStack Virtual.</Field.HelperText>
            </Field>
            <p>Country: {country() || "—"}</p>
          </Section>

          <Section id="combobox" title="Combobox">
            <Field>
              <Field.Label>Country (type to filter)</Field.Label>
              <Combobox
                name="combobox-country"
                placeholder="Type to filter…"
                collection={filteredCountries()}
                inputValue={comboboxQuery()}
                onInputValueChange={(details) => setComboboxQuery(details.inputValue)}
                onValueChange={(details) => setComboboxCountry(details.value[0] ?? "")}
              />
              <Field.HelperText>300 options, filtered and virtualized.</Field.HelperText>
            </Field>
            <p>Combobox: {comboboxCountry() || "—"}</p>
          </Section>

          <Section id="switch" title="Switch">
            <Field>
              <Switch name="notifications" value="enabled" defaultChecked>
                Notifications
              </Switch>
              <Field.HelperText>Toggle notifications.</Field.HelperText>
            </Field>
            <Switch
              checked={theme().dark}
              onCheckedChange={(details) => setTheme({ dark: details.checked })}
            >
              Dark mode
            </Switch>
            <p>Dark mode: {String(theme().dark)}</p>
          </Section>

          <Section id="radio-group" title="Radio Group">
            <Field invalid={invalid()}>
              <Field.Label>Favorite fruit</Field.Label>
              <RadioGroup
                name="fruit"
                defaultValue="apple"
                items={fruits}
                render={(fruit) => (
                  <span>
                    <span>{fruit.name}</span>
                    <span>{fruit.note}</span>
                  </span>
                )}
                onValueChange={(details) => setFruit(details.value ?? "")}
              />
              <Field.HelperText>Pick one.</Field.HelperText>
              <Field.ErrorText>This selection is invalid.</Field.ErrorText>
            </Field>
            <p>Fruit: {fruit() || "—"}</p>
          </Section>

          <Section id="tabs" title="Tabs">
            <Tabs value={tab()} onValueChange={(details) => setTab(details.value)}>
              <Tabs.List>
                <Tabs.Trigger value="account">
                  <Palette />
                  Account
                </Tabs.Trigger>
                <Tabs.Trigger value="password">
                  <ToggleOn />
                  Password
                </Tabs.Trigger>
                <Tabs.Trigger value="billing" disabled>
                  <SmartButton />
                  Billing
                </Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content value="account">
                <p>Make changes to your account here.</p>
              </Tabs.Content>
              <Tabs.Content value="password">
                <p>Change your password here.</p>
              </Tabs.Content>
              <Tabs.Content value="billing">
                <p>Billing is currently unavailable.</p>
              </Tabs.Content>
            </Tabs>
            <p>Tab: {tab()}</p>

            <Tabs variant="secondary" defaultValue="birds">
              <Tabs.List>
                <Tabs.Trigger value="birds">
                  <Search />
                  Birds
                </Tabs.Trigger>
                <Tabs.Trigger value="cats">
                  <CheckBox />
                  Cats
                </Tabs.Trigger>
                <Tabs.Trigger value="dogs">
                  <Add />
                  Dogs
                </Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content value="birds">
                <p>Birds are feathered, winged, bipedal, warm-blooded animals.</p>
              </Tabs.Content>
              <Tabs.Content value="cats">
                <p>Cats are small, carnivorous mammals that are often kept as pets.</p>
              </Tabs.Content>
              <Tabs.Content value="dogs">
                <p>Dogs are domesticated descendants of the gray wolf.</p>
              </Tabs.Content>
            </Tabs>
          </Section>

          <Section id="checkbox" title="Checkbox">
            <Field>
              <Checkbox name="newsletter" value="subscribed" defaultChecked>
                Subscribe to newsletter
              </Checkbox>
              <Field.HelperText>We send monthly.</Field.HelperText>
            </Field>
            <Checkbox defaultChecked="indeterminate">Indeterminate</Checkbox>
          </Section>

          <Section id="field" title="Field (composable)">
            <Field required>
              <Field.Label>Plan</Field.Label>
              <PlanPicker />
              <Field.HelperText>A custom control that opts into Field state via the hook.</Field.HelperText>
            </Field>
          </Section>

          <Section id="virtual-list" title="Virtual List">
            <CountryList />
            <p>{countries.length} rows rendered through the shared VirtualList.</p>
          </Section>

          <Section id="dialog" title="Dialog">
            <Dialog>
              <Dialog.Trigger>Open dialog</Dialog.Trigger>
              <Dialog.Content>
                <Dialog.Title>Reset settings?</Dialog.Title>
                <Dialog.Description>
                  This will reset your settings to their default values. You can't undo this
                  action.
                </Dialog.Description>
                <Dialog.Actions>
                  <Dialog.Close>Cancel</Dialog.Close>
                  <Button variant="text">Reset</Button>
                </Dialog.Actions>
              </Dialog.Content>
            </Dialog>
          </Section>
        </main>
      </div>
    </div>
  );
}
