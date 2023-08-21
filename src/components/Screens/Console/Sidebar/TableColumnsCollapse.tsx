import { createSignal, JSXElement } from "solid-js";
import { useContextMenu, Menu, animation, Item } from "solid-contextmenu";
import { t } from "utils/i18n";
import { useAppSelector } from "services/Context";
import { newContentTab } from "services/ConnectionTabs";

export const TableColumnsCollapse = (props: {
  title: string;
  children: JSXElement;
}) => {
  const [open, setOpen] = createSignal(false);

  const {
    connectionsService: { contentStore, setContentStore, updateStore },
  } = useAppSelector();

  const menu_id = "sidebar-table-menu";

  const { show } = useContextMenu({ id: menu_id, props: { id: "" } });

  const openTableStructureTab = () => {
    setContentStore("tabs", [
      ...contentStore.tabs,
      newContentTab(props.title, "TableStructureTab"),
    ]);
    setContentStore("idx", contentStore.tabs.length - 1);
    updateStore();
  };

  return (
    <div
      class="w-full"
      onContextMenu={(e) => {
        show(e);
      }}
    >
      <Menu id={menu_id} animation={animation.fade} theme={"dark"}>
        <Item onClick={() => openTableStructureTab()}>
          {t("components.sidebar.show_table_structure")}
        </Item>
      </Menu>
      <div
        onClick={() => setOpen(!open())}
        class="collapse flex items-center text-sm text-base-content font-medium cursor-pointer rounded-none border-b-[1px] border-base-300"
      >
        <label class={`swap text-6xl ${open() ? "swap-active" : ""}`}>
          <svg
            class="w-2 h-2 swap-off"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 6 10"
          >
            <path
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="m1 9 4-4-4-4"
            />
          </svg>
          <svg
            class="w-2 h-2 swap-on"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 10 6"
          >
            <path
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="m1 1 4 4 4-4"
            />
          </svg>
        </label>
        <span class="ml-2">{props.title}</span>
      </div>
      {open() && props.children}
    </div>
  );
};
