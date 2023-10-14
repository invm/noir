import { invoke } from '@tauri-apps/api';
import { QueryMetadataResult, Row } from 'interfaces';
import { createSignal } from 'solid-js';

export const BackendService = () => {
  const [pageSize, setPageSize] = createSignal<number>(30);

  const getQueryResults = async (
    path: string,
    page = 0,
    page_size = pageSize()
  ) => {
    const res = await invoke<string>('query_results', {
      params: { path, page, page_size },
    });
    const rows = JSON.parse('[' + res + ']') as unknown as Row[];
    return rows;
  };

  const getQueryMetadata = async (path: string) => {
    const res = await invoke<string>('get_query_metadata', { path });
    return JSON.parse(res) as unknown as QueryMetadataResult;
  };

  return {
    pageSize,
    setPageSize,
    getQueryResults,
    getQueryMetadata,
  };
};
