import { TabulatorFull as Tabulator } from "tabulator-tables";
import { Alert } from "components/UI";
import { useAppSelector } from "services/Context";
import { createShortcut } from "@solid-primitives/keyboard";
import { ChevronLeft, ChevronRight } from "components/UI/Icons";
import { t } from "utils/i18n";

type PaginationProps = {
  table: Tabulator | null;
};

export const Pagination = (_props: PaginationProps) => {
  const {
    connections: {
      selectNextQuery,
      selectPrevQuery,
      queryIdx
    },
  } = useAppSelector();

  createShortcut(["Control", "Shift", "N"], selectNextQuery);
  createShortcut(["Control", "Shift", "P"], selectPrevQuery);

  return (
    <div class="container flex justify-between items-top p-1 my-1 gap-2 bg-base-200">
      <div class="flex gap-2">
        <div class="join">
          <button class="join-item btn btn-sm" onClick={selectPrevQuery}>
            <ChevronLeft />
          </button>
          <button class="join-item btn btn-sm btn-disabled !text-info">
            <span class="mt-1">
              {t("console.result_set")} {queryIdx() + 1}
            </span>
          </button>
          <button class="join-item btn btn-sm" onClick={selectNextQuery}>
            <ChevronRight />
          </button>
        </div>
        <div class="flex-1">
          <Alert color="info">
            Lorem ipsum dolor sit amet, qui minim labore adipisicing minim
          </Alert>
        </div>
      </div>
      <div class="join">
        <button class="join-item btn btn-sm">1</button>
        <button class="join-item btn btn-sm">2</button>
        <button class="join-item btn btn-sm btn-disabled">...</button>
        <button class="join-item btn btn-sm">99</button>
        <button class="join-item btn btn-sm">100</button>
      </div>
    </div>
  );
};
