import { TableStructureContentTabData } from "services/ConnectionTabs";
import { useAppSelector } from "services/Context";
import { createEffect, createSignal } from "solid-js";
import { invoke } from "@tauri-apps/api";

export const TableStructureTab = () => {
  const {
    connectionsService: { getActiveContentTab, getActiveConnection },
  } = useAppSelector();
  const [data, setData] = createSignal<Record<string, any>[]>([]);

  createEffect(async () => {
    // const tabledata = getActiveContentTab()
    //   .data as TableStructureContentTabData;
    // console.log({ tabledata });

    const activeConnection = getActiveConnection();
    try {
      const result = await invoke("get_table_structure", {
        connId: activeConnection.id,
        tableName: "app",
      });
      console.log({ result });
    } catch (error) {
      console.log({ error });
    }
    // if (tabledata.length) {
    //   setData(tabledata);
    // }
  });
  return <div>TableStructureTab</div>;
};
