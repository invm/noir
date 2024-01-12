import { invoke } from '@tauri-apps/api';
import { QueryMetadataResult, QueryTaskEnqueueResult, RawQueryResult, Row } from 'interfaces';
import { createSignal } from 'solid-js';
import { select } from 'sql-bricks';
import { getAnyCase } from 'utils/utils';

export const BackendService = () => {
  const [pageSize, setPageSize] = createSignal<number>(25);

  const getQueryResults = async (path: string, page = 0, page_size = pageSize()) => {
    const res = await invoke<string>('query_results', {
      params: { path, page, page_size },
    });
    const rows = JSON.parse('[' + res + ']') as unknown as Row[];
    if (rows.length > 0 && rows.length < page_size) {
      // pad the results with empty rows
      const empty_rows = Array(page_size - rows.length).fill({});
      rows.push(...empty_rows);
    }
    return rows;
  };

  const getQueryMetadata = async (path: string) => {
    const res = await invoke<string>('get_query_metadata', { path });
    return JSON.parse(res) as unknown as QueryMetadataResult;
  };

  const selectAllFrom = async (table: string, connId: string, tabIdx: number) => {
    const [pkey] = await invoke<RawQueryResult>('get_constraints', {
      connId,
      table,
    });
    const t = new RegExp(`\\"${table}\\"`, 'i');
    const sql = select().from(table).orderBy(getAnyCase(pkey, 'column_name')).toString().replace(t, table);
    // remove escape characters
    const { result_sets } = await invoke<QueryTaskEnqueueResult>('enqueue_query', {
      connId,
      sql,
      autoLimit: true,
      tabIdx,
      table,
    });
    return result_sets;
  };

  const downloadJSON = async (source: string, destination: string) =>
    invoke<string>('download_json', { source, destination });

  const downloadCsv = async (source: string, destination: string) =>
    invoke<string>('download_csv', { source, destination });

  return {
    pageSize,
    setPageSize,
    getQueryResults,
    getQueryMetadata,
    downloadCsv,
    downloadJSON,
    selectAllFrom,
  };
};
