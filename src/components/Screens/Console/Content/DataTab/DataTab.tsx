import { useAppSelector } from 'services/Context';
import { Results } from '../QueryTab/Results';

const DataTab = () => {
  const {
    connections: { getContentData },
    app: { gridTheme, appStore },
  } = useAppSelector();
  return <Results editable={true} gridTheme={gridTheme()} table={getContentData('Data').table} editorTheme={appStore.editorTheme}/>;
};

export { DataTab };
