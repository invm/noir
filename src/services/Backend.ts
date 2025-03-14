import { invoke } from '@tauri-apps/api/core';
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
  const [pageSize, setPageSize] = createSignal<number>(50);

  const getQueryResults = async (
    path: string,
    page = 0,
    page_size = pageSize()
  ): Promise<Row[]> => {
    const res = await invoke<string[]>('query_results', {
      params: { path, page, page_size },
    });
    return res.map((r) => JSON.parse(r));
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
