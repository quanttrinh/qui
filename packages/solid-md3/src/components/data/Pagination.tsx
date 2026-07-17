import { Pagination as ArkPagination } from "@ark-ui/solid/pagination";
import ChevronLeft from "@iconify-solid/material-symbols/chevron-left";
import ChevronRight from "@iconify-solid/material-symbols/chevron-right";
import { type JSX, For } from "solid-js";

import { cn } from "../../cn";

export interface PaginationProps {
  count: number;
  pageSize: number;
  page: number;
  onPageChange: (page: number) => void;
}

export function Pagination(props: Readonly<PaginationProps>): JSX.Element {
  const totalPages = (): number => Math.max(1, Math.ceil(props.count / props.pageSize));

  return (
    <ArkPagination.Root
      count={props.count}
      pageSize={props.pageSize}
      page={props.page}
      siblingCount={1}
      boundaryCount={1}
      onPageChange={(details) => {
        props.onPageChange(details.page);
      }}
    >
      <div class="flex items-center gap-2">
        <ArkPagination.PrevTrigger
          class={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-38",
            props.page > 1 && "text-md3-on-surface-variant hover:bg-md3-surface-container-highest",
          )}
        >
          <ChevronLeft />
        </ArkPagination.PrevTrigger>

        <ArkPagination.Context>
          {(api) => (
            <div class="flex items-center gap-1">
              <For each={api().pages}>
                {(page, index) => {
                  if (page.type !== "page") {
                    return (
                      <ArkPagination.Ellipsis
                        index={index()}
                        class="flex h-10 w-10 items-center justify-center text-sm text-md3-on-surface-variant"
                      >
                        ...
                      </ArkPagination.Ellipsis>
                    );
                  }
                  return (
                    <ArkPagination.Item
                      type="page"
                      value={page.value}
                      class={cn(
                        "flex h-10 min-w-10 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors",
                        api().page === page.value
                          ? "bg-md3-primary-container text-md3-on-primary-container"
                          : "text-md3-on-surface-variant hover:bg-md3-surface-container-highest hover:text-md3-on-surface",
                      )}
                    >
                      {page.value}
                    </ArkPagination.Item>
                  );
                }}
              </For>
            </div>
          )}
        </ArkPagination.Context>

        <ArkPagination.NextTrigger
          class={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-38",
            props.page < totalPages() &&
              "text-md3-on-surface-variant hover:bg-md3-surface-container-highest",
          )}
        >
          <ChevronRight />
        </ArkPagination.NextTrigger>
      </div>
    </ArkPagination.Root>
  );
}
