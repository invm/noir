import { loader, MonacoEditor } from 'solid-monaco';
import * as monaco from 'monaco-editor';
import { onMount } from 'solid-js';
import { useColorMode } from '@kobalte/core/color-mode';

type EditorProps = {
  readOnly?: boolean;
  onMount?: (m: typeof monaco, e: monaco.editor.IStandaloneCodeEditor) => void;
  onChange?: (s: string) => void;
  value: string;
  schema?: Record<string, string[]>;
  language?: string;
};

const DEFAULT_SQL_KEYWORDS = [
  'SELECT',
  'FROM',
  'WHERE',
  'JOIN',
  'INNER',
  'OUTER',
  'LEFT',
  'RIGHT',
  'ON',
  'GROUP BY',
  'ORDER BY',
  'HAVING',
  'INSERT',
  'UPDATE',
  'DELETE',
  'VALUES',
  'CREATE',
  'DROP',
  'ALTER',
  'TABLE',
  'INDEX',
  'VIEW',
  'TRIGGER',
  'PROCEDURE',
  'FUNCTION',
  'DISTINCT',
  'AND',
  'OR',
  'NOT',
  'BETWEEN',
  'IN',
  'LIKE',
  'IS',
  'NULL',
  'EXISTS',
  'ALL',
  'ANY',
  'UNION',
  'INTERSECT',
  'EXCEPT',
  'AS',
  'WITH',
  'LIMIT',
  'OFFSET',
  'INNER JOIN',
  'FULL OUTER JOIN',
  'CROSS JOIN',
  'SET',
  'CONSTRAINT',
  'PRIMARY KEY',
  'FOREIGN KEY',
  'CHECK',
  'UNIQUE',
  'DEFAULT',
  'REFERENCES',
  'AUTO_INCREMENT',
];

interface Range {
  startLineNumber: number;
  endLineNumber: number;
  startColumn: number;
  endColumn: number;
}

const getEditorAutoCompleteSuggestion = (
  range: Range,
  schema: Record<string, string[]>
): monaco.languages.ProviderResult<monaco.languages.CompletionList> => {
  const suggestionsFromDefaultKeywords = DEFAULT_SQL_KEYWORDS.map(
    (kw: string) => ({
      label: `${kw.toUpperCase()}`,
      kind: monaco.languages.CompletionItemKind.Keyword,
      detail: 'Keyword',
      insertText: `${kw.toUpperCase()} `,
      range: range,
    })
  );

  const tableNameKeywords = Object.keys(schema)?.map((tableName: string) => ({
    label: tableName,
    kind: monaco.languages.CompletionItemKind.Interface,
    detail: 'Table',
    insertText: tableName,
    range: range,
  }));

  const columns = Object.values(schema)
    .flat()
    ?.map((col: string) => ({
      label: col, // TODO: add table in parens
      kind: monaco.languages.CompletionItemKind.Property,
      detail: 'Column',
      insertText: col,
      range: range,
    }));

  const suggestions = {
    suggestions: [
      ...suggestionsFromDefaultKeywords,
      ...tableNameKeywords,
      ...columns,
    ],
  };
  return suggestions;
};

export const Editor = (props: EditorProps) => {
  const { colorMode } = useColorMode();

  onMount(async () => {
    if (!props.schema) return;
    loader.init().then((monaco) => {
      const provider = monaco.languages.registerCompletionItemProvider('sql', {
        triggerCharacters: [' ', '.'], // Trigger autocomplete on space and dot

        provideCompletionItems: (model, position) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };
          return getEditorAutoCompleteSuggestion(range, props.schema!);
        },
      });

      return () => {
        provider.dispose();
      };
    });
  });

  return (
    <MonacoEditor
      options={{
        glyphMargin: false,
        tabSize: 2,
        lineNumbers: 'on',
        fontSize: 14,
        folding: true,
        theme: 'vs-' + colorMode(),
        language: props.language,
        wordWrap: 'on',
        readOnly: props.readOnly,
        automaticLayout: true,
      }}
      onMount={props.onMount}
      language={props.language}
      onChange={props.onChange}
      value={props.value}
    />
  );
};
