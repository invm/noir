import { invoke } from '@tauri-apps/api';
import {
  QueryMetadataResult,
  QueryTaskEnqueueResult,
  RawQueryResult,
  Row,
} from 'interfaces';
import { createSignal } from 'solid-js';
import { select } from 'sql-bricks';
import { getAnyCase } from 'utils/utils';

export const BackendService = () => {
  const [pageSize, setPageSize] = createSignal<number>(25);

  const getQueryResults = async (
    path: string,
    page = 0,
    page_size = pageSize()
  ) => {
    const res = await invoke<string>('query_results', {
      params: { path, page, page_size },
    });
    const rows = JSON.parse('[' + res + ']') as unknown as Row[];
    // left in case we want to pad the results with empty rows
    // if (rows.length > 0 && rows.length < page_size) {
    //   // pad the results with empty rows
    //   const empty_rows = Array(page_size - rows.length).fill({});
    //   rows.push(...empty_rows);
    // }
    return rows;
  };

  const getQueryMetadata = async (path: string) => {
    const res = await invoke<string>('get_query_metadata', { path });
    return JSON.parse(res) as unknown as QueryMetadataResult;
  };

  const selectAllFrom = async (
    table: string,
    connId: string,
    tabIdx: number
  ) => {
    let pk = await invoke<RawQueryResult>('get_primary_key', {
      connId,
      table,
    });
    if (!pk.length) {
      const columns = await invoke<RawQueryResult>('get_columns', {
        connId,
        table,
      });
      pk = [columns[0]];
    }
    const sql = select()
      .from(table)
      .orderBy(...pk.map((c) => getAnyCase(c, 'column_name')))
      .toString();
    const { result_sets } = await invoke<QueryTaskEnqueueResult>(
      'enqueue_query',
      {
        connId,
        sql,
        autoLimit: true,
        tabIdx,
        table,
      }
    );
    return result_sets;
  };

  const downloadJSON = async (source: string, destination: string) =>
    invoke<string>('download_json', { source, destination });

  const downloadCsv = async (source: string, destination: string) =>
    invoke<string>('download_csv', { source, destination });

  const cancelTask = (ids: string[]) =>
    invoke<void>('cancel_task_token', { ids });

  return {
    cancelTask,
    pageSize,
    setPageSize,
    getQueryResults,
    getQueryMetadata,
    downloadCsv,
    downloadJSON,
    selectAllFrom,
  };
};
