import Animation from "@iconify-solid/material-symbols/animation";
import ArrowDropDown from "@iconify-solid/material-symbols/arrow-drop-down";
import ArrowRight from "@iconify-solid/material-symbols/arrow-right";
import Bookmark from "@iconify-solid/material-symbols/bookmark";
import Campaign from "@iconify-solid/material-symbols/campaign";
import CheckBox from "@iconify-solid/material-symbols/check-box";
import ChevronRight from "@iconify-solid/material-symbols/chevron-right";
import Dashboard from "@iconify-solid/material-symbols/dashboard";
import Edit from "@iconify-solid/material-symbols/edit";
import ExpandMore from "@iconify-solid/material-symbols/expand-more";
import HorizontalRule from "@iconify-solid/material-symbols/horizontal-rule";
import Hourglass from "@iconify-solid/material-symbols/hourglass";
import Inbox from "@iconify-solid/material-symbols/inbox";
import Info from "@iconify-solid/material-symbols/info";
import LabelIcon from "@iconify-solid/material-symbols/label";
import LinkIcon from "@iconify-solid/material-symbols/link";
import List from "@iconify-solid/material-symbols/list";
import OpenInNew from "@iconify-solid/material-symbols/open-in-new";
import Palette from "@iconify-solid/material-symbols/palette";
import Person from "@iconify-solid/material-symbols/person";
import Pin from "@iconify-solid/material-symbols/pin";
import RadioButtonChecked from "@iconify-solid/material-symbols/radio-button-checked";
import Search from "@iconify-solid/material-symbols/search";
import SmartButton from "@iconify-solid/material-symbols/smart-button";
import Tab from "@iconify-solid/material-symbols/tab";
import TextFields from "@iconify-solid/material-symbols/text-fields";
import ToggleOn from "@iconify-solid/material-symbols/toggle-on";
import TrendingUp from "@iconify-solid/material-symbols/trending-up";
import ViewColumn from "@iconify-solid/material-symbols/view-column";
import { type SideNavEntry, AppBar, AppShell, LoadingSpinner, SideNav } from "@quanttrinh/solid-md3";
import { type JSX, Suspense, lazy } from "solid-js";

const DemoContent = lazy(() => import("./DemoContent"));

export default function App(): JSX.Element {
  const sectionItems: SideNavEntry[] = [
    {
      type: "item",
      href: "#color-palette",
      icon: <Palette class="text-xl!" />,
      label: "Color Palette",
    },
    {
      type: "item",
      href: "#typography",
      icon: <TextFields class="text-xl!" />,
      label: "Typography",
    },
    { type: "item", href: "#buttons", icon: <SmartButton class="text-xl!" />, label: "Buttons" },
    { type: "item", href: "#anchors", icon: <LinkIcon class="text-xl!" />, label: "Anchors" },
    {
      type: "item",
      href: "#button-group",
      icon: <ViewColumn class="text-xl!" />,
      label: "Button Group",
    },
    {
      type: "item",
      href: "#cards-blocks",
      icon: <Dashboard class="text-xl!" />,
      label: "Cards & Blocks",
    },
    { type: "item", href: "#divider", icon: <HorizontalRule class="text-xl!" />, label: "Divider" },
    { type: "item", href: "#accordion", icon: <ExpandMore class="text-xl!" />, label: "Accordion" },
    { type: "item", href: "#empty-state", icon: <Inbox class="text-xl!" />, label: "Empty State" },
    {
      type: "item",
      href: "#text-field",
      icon: <TextFields class="text-xl!" />,
      label: "Text Field",
    },
    { type: "item", href: "#field", icon: <Edit class="text-xl!" />, label: "Field (composable)" },
    { type: "item", href: "#select", icon: <ArrowDropDown class="text-xl!" />, label: "Select" },
    { type: "item", href: "#combobox", icon: <Search class="text-xl!" />, label: "Combobox" },
    {
      type: "item",
      href: "#tags-input",
      icon: <LabelIcon class="text-xl!" />,
      label: "Tags Input",
    },
    { type: "item", href: "#checkbox", icon: <CheckBox class="text-xl!" />, label: "Checkbox" },
    { type: "item", href: "#switch", icon: <ToggleOn class="text-xl!" />, label: "Switch" },
    {
      type: "item",
      href: "#radio-group",
      icon: <RadioButtonChecked class="text-xl!" />,
      label: "Radio Group",
    },
    { type: "item", href: "#number-input", icon: <Pin class="text-xl!" />, label: "Number Input" },
    { type: "item", href: "#pill", icon: <Bookmark class="text-xl!" />, label: "Pill" },
    { type: "item", href: "#progress", icon: <TrendingUp class="text-xl!" />, label: "Progress" },
    {
      type: "item",
      href: "#shimmer-data-block",
      icon: <Animation class="text-xl!" />,
      label: "Shimmer / Data Block",
    },
    { type: "item", href: "#banner", icon: <Campaign class="text-xl!" />, label: "Banner" },
    { type: "item", href: "#tooltip", icon: <Info class="text-xl!" />, label: "Tooltip" },
    { type: "item", href: "#modal", icon: <OpenInNew class="text-xl!" />, label: "Modal" },
    { type: "item", href: "#tabs", icon: <Tab class="text-xl!" />, label: "Tabs" },
    {
      type: "item",
      href: "#breadcrumb",
      icon: <ArrowRight class="text-xl!" />,
      label: "Breadcrumb",
    },
    { type: "item", href: "#avatar", icon: <Person class="text-xl!" />, label: "Avatar" },
    {
      type: "item",
      href: "#pagination",
      icon: <ChevronRight class="text-xl!" />,
      label: "Pagination",
    },
    {
      type: "item",
      href: "#loading-delayed-spinner",
      icon: <Hourglass class="text-xl!" />,
      label: "Loading & Spinner",
    },
    { type: "item", href: "#scrollarea", icon: <List class="text-xl!" />, label: "ScrollArea" },
  ];

  return (
    <AppShell
      sideNav={
        <SideNav defaultOpen class="h-full shrink-0 rounded-none border-0" items={sectionItems} />
      }
      appBar={
        <AppBar>
          <span class="text-md3-title-lg font-medium">solid-md3 Demo</span>
        </AppBar>
      }
    >
      <Suspense fallback={<LoadingSpinner />}>
        <DemoContent />
      </Suspense>
    </AppShell>
  );
}
